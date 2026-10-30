// 3DM 뷰어의 three.js 장면. React 밖에서 장면·카메라·치수를 다루고,
// 화면(ModelViewer)은 이 클래스의 메서드만 부른다.
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Rhino3dmLoader } from "three/examples/jsm/loaders/3DMLoader.js";
import { formatLength } from "./format";

// 라이노는 Z가 위다. 카메라·컨트롤을 만들기 전에 바꿔야 한다.
THREE.Object3D.DEFAULT_UP.set(0, 0, 1);

export type ViewName = "perspective" | "top" | "front" | "right";
export type ShadeMode = "layer" | "clay" | "material";

export interface LayerInfo {
  index: number;
  name: string;
  path: string;
  depth: number;
  color: string;
  /** 사용자가 켠 상태. 상위 레이어가 꺼져 있으면 실제로는 안 보인다 */
  visible: boolean;
  /** 이 레이어에 바로 속한 객체 수 */
  count: number;
}

export interface ModelInfo {
  units: string;
  objects: number;
  meshes: number;
  byType: Record<string, number>;
  size: [number, number, number];
  /** 웹에서 표시하지 못한 객체 — 형식별 개수 (문자·해치·치수 등) */
  skipped: Record<string, number>;
  /** 파일에 포함되지 않은 재질 이미지 수 — '재질' 표시에서 색만 나온다 */
  missingTextures: number;
}

export interface Measurement {
  distance: number;
  dx: number;
  dy: number;
  dz: number;
}

interface RhinoColor {
  r: number;
  g: number;
  b: number;
}

interface RhinoLayer {
  name: string;
  fullPath?: string;
  visible: boolean;
  color?: RhinoColor;
}

interface RhinoAttributes {
  layerIndex?: number;
  drawColor?: RhinoColor;
}

const BG = 0xf2f2f0;
const INK = 0x000000;
const SNAP_PX = 12;

const hex = (c?: RhinoColor) =>
  c ? `#${[c.r, c.g, c.b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}` : "#000000";

const attrsOf = (o: THREE.Object3D) => o.userData?.attributes as RhinoAttributes | undefined;

/** 자신과 모든 상위 객체가 보일 때만 보이는 것으로 친다 (레이캐스트는 visible 을 보지 않는다) */
function shown(o: THREE.Object3D | null): boolean {
  for (let p = o; p; p = p.parent) if (!p.visible) return false;
  return true;
}

export class ViewerScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private persp: THREE.PerspectiveCamera;
  private ortho: THREE.OrthographicCamera;
  private camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
  private controls: OrbitControls;
  private loader: Rhino3dmLoader;
  private resizeObs: ResizeObserver;

  private model: THREE.Object3D | null = null;
  private layers: LayerInfo[] = [];
  private shade: ShadeMode = "layer";
  private wire = false;
  private radius = 1;

  // 치수
  private measuring = false;
  private picks: THREE.Vector3[] = [];
  private marks = new THREE.Group();
  private hover: THREE.Points;
  private label: HTMLDivElement;
  private raycaster = new THREE.Raycaster();
  private downAt: { x: number; y: number } | null = null;

  onMeasure?: (m: Measurement | null) => void;

  constructor(private el: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(BG);
    this.renderer.domElement.style.display = "block";
    el.appendChild(this.renderer.domElement);

    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8a86, 2.2));
    const sun = new THREE.DirectionalLight(0xffffff, 1.6);
    sun.position.set(-1, -2, 3);
    this.scene.add(sun);
    this.scene.add(this.marks);

    this.persp = new THREE.PerspectiveCamera(40, 1, 0.1, 1e7);
    this.ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.001, 1e7);
    this.camera = this.persp;
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.addEventListener("change", () => this.render());

    this.hover = new THREE.Points(
      new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0], 3)),
      new THREE.PointsMaterial({ color: INK, size: 9, sizeAttenuation: false, depthTest: false }),
    );
    this.hover.renderOrder = 10;
    this.hover.visible = false;
    this.scene.add(this.hover);

    this.label = document.createElement("div");
    this.label.className =
      "pointer-events-none absolute z-10 hidden -translate-x-1/2 -translate-y-full bg-ink px-2 py-1 text-xs text-paper tabular-nums";
    el.appendChild(this.label);

    this.loader = new Rhino3dmLoader();
    this.loader.setLibraryPath("/rhino3dm/");

    const c = this.renderer.domElement;
    c.addEventListener("pointerdown", this.onDown);
    c.addEventListener("pointerup", this.onUp);
    c.addEventListener("pointermove", this.onMove);

    this.resizeObs = new ResizeObserver(() => this.resize());
    this.resizeObs.observe(el);
    this.resize();
  }

  dispose() {
    this.resizeObs.disconnect();
    this.controls.dispose();
    this.clearModel();
    this.renderer.dispose();
    this.renderer.domElement.remove();
    this.label.remove();
  }

  // ── 불러오기 ──────────────────────────────────────────

  async load(buffer: ArrayBuffer): Promise<{ info: ModelInfo; layers: LayerInfo[] }> {
    const obj = await this.loader.parseAsync(buffer);
    this.clearModel();
    this.model = obj;
    this.scene.add(obj);

    const raw = (obj.userData.layers ?? []) as RhinoLayer[];
    const counts = new Array(raw.length).fill(0);
    const byType: Record<string, number> = {};
    let objects = 0;
    let meshes = 0;
    obj.traverse((o) => {
      const a = attrsOf(o);
      if (!a || o === obj) return;
      objects++;
      const t = (o.userData.objectType as string) ?? o.type;
      byType[t] = (byType[t] ?? 0) + 1;
      if (typeof a.layerIndex === "number" && a.layerIndex >= 0) counts[a.layerIndex]++;
      if (o instanceof THREE.Mesh) {
        meshes++;
        o.userData.fileMaterial = o.material;
      }
    });

    this.layers = raw.map((l, i) => {
      const path = l.fullPath || l.name;
      return {
        index: i,
        name: l.name,
        path,
        depth: path.split("::").length - 1,
        color: hex(l.color),
        visible: l.visible !== false,
        count: counts[i],
      };
    });

    this.applyShade();
    this.applyLayers();
    this.clearMeasure();

    const box = this.visibleBox("model") ?? new THREE.Box3();
    const size = box.isEmpty() ? new THREE.Vector3() : box.getSize(new THREE.Vector3());
    const unitName = (obj.userData.settings?.modelUnitSystem?.name as string | undefined) ?? "";
    // 로더 경고 중 '변환 못 한 객체'만 센다. 같은 객체가 "no associated mesh" 경고를 한 번 더 내므로 그건 빼고,
    // 파일에 안 들어 있는 재질 이미지는 객체가 아니라 따로 센다.
    const skipped: Record<string, number> = {};
    let missingTextures = 0;
    for (const w of (obj.userData.warnings ?? []) as { message?: string }[]) {
      const m = w.message ?? "";
      const t = /(?:not implemented|No conversion exists) for (?:ObjectType_)?(\w+)/.exec(m)?.[1];
      if (t) skipped[t] = (skipped[t] ?? 0) + 1;
      else if (/texture not embedded/i.test(m)) missingTextures++;
    }
    const info: ModelInfo = {
      units: unitName.replace(/^UnitSystem_/, "") || "알 수 없음",
      objects,
      meshes,
      byType,
      size: [size.x, size.y, size.z],
      skipped,
      missingTextures,
    };

    this.fit("perspective");
    return { info, layers: this.layers.map((l) => ({ ...l })) };
  }

  private clearModel() {
    if (!this.model) return;
    this.scene.remove(this.model);
    this.model.traverse((o) => {
      if (o instanceof THREE.Mesh || o instanceof THREE.Line || o instanceof THREE.Points) {
        o.geometry.dispose();
        const own = o.userData.shadeMaterial as THREE.Material | undefined;
        own?.dispose();
      }
    });
    this.model = null;
  }

  // ── 레이어 ──────────────────────────────────────────

  setLayerVisible(index: number, on: boolean) {
    const l = this.layers[index];
    if (!l) return;
    l.visible = on;
    this.applyLayers();
  }

  setAllLayers(on: boolean) {
    this.layers.forEach((l) => (l.visible = on));
    this.applyLayers();
  }

  /** 상위 레이어까지 모두 켜져 있어야 보인다 (라이노와 같다) */
  private effectiveLayers(): boolean[] {
    const byPath = new Map(this.layers.map((l) => [l.path, l]));
    return this.layers.map((l) => {
      const parts = l.path.split("::");
      for (let i = 1; i <= parts.length; i++) {
        const p = byPath.get(parts.slice(0, i).join("::"));
        if (p && !p.visible) return false;
      }
      return true;
    });
  }

  private applyLayers() {
    if (!this.model) return;
    const eff = this.effectiveLayers();
    this.model.traverse((o) => {
      const li = attrsOf(o)?.layerIndex;
      if (o !== this.model && typeof li === "number" && li >= 0) o.visible = eff[li] ?? true;
    });
    this.render();
  }

  // ── 표시 ──────────────────────────────────────────

  setShade(mode: ShadeMode) {
    this.shade = mode;
    this.applyShade();
  }

  setWireframe(on: boolean) {
    this.wire = on;
    this.applyShade();
  }

  /**
   * layer: 라이노 음영 모드처럼 객체 표시색
   * clay: 흰 모형
   * material: 파일에 저장된 렌더 재질 (재질이 없는 객체는 흰 모형)
   */
  private applyShade() {
    if (!this.model) return;
    this.model.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return;
      const fileMat = o.userData.fileMaterial as THREE.Material;
      const isDefault = fileMat?.name === THREE.Loader.DEFAULT_MATERIAL_NAME;
      let mat: THREE.Material;
      if (this.shade === "material" && !isDefault) {
        mat = fileMat;
      } else {
        let own = o.userData.shadeMaterial as THREE.MeshStandardMaterial | undefined;
        if (!own) {
          own = new THREE.MeshStandardMaterial({ roughness: 0.9, metalness: 0, side: THREE.DoubleSide });
          o.userData.shadeMaterial = own;
        }
        const dc = attrsOf(o)?.drawColor;
        own.color.set(this.shade === "layer" && dc ? hex(dc) : "#ffffff");
        mat = own;
      }
      if ("wireframe" in mat) (mat as THREE.MeshStandardMaterial).wireframe = this.wire;
      o.material = mat;
    });
    this.render();
  }

  // ── 카메라 ──────────────────────────────────────────

  setProjection(kind: "perspective" | "parallel") {
    const next = kind === "perspective" ? this.persp : this.ortho;
    if (next === this.camera) return;
    next.position.copy(this.camera.position);
    next.quaternion.copy(this.camera.quaternion);
    this.camera = next;
    this.controls.object = next;
    this.fitCurrent();
  }

  /**
   * scope "model": 3D 형상(메시)만 기준으로 맞춘다. 실무 파일은 평면도 선을 멀리 따로 두는 일이 많아서
   *               전체로 맞추면 모델이 점처럼 작아진다.
   * scope "all": 선까지 보이는 것 전부
   */
  fit(view: ViewName, scope: "model" | "all" = "model") {
    const box = this.visibleBox(scope);
    if (!box) return;
    const center = box.getCenter(new THREE.Vector3());
    this.radius = Math.max(box.getBoundingSphere(new THREE.Sphere()).radius, 1e-3);
    const r = this.radius;
    // 평면은 Y 방향으로 아주 조금 비켜서 내려다본다 — 정확히 위에서 보면 화면 방향이 정해지지 않는다
    const dirs: Record<ViewName, THREE.Vector3> = {
      perspective: new THREE.Vector3(-1, -1.3, 0.9),
      top: new THREE.Vector3(0, -1e-4, 1),
      front: new THREE.Vector3(0, -1, 0),
      right: new THREE.Vector3(1, 0, 0),
    };
    const dir = dirs[view].normalize();
    const dist =
      this.camera === this.persp ? (r / Math.sin(THREE.MathUtils.degToRad(this.persp.fov / 2))) * 1.05 : r * 4;
    this.controls.target.copy(center);
    this.camera.position.copy(center).addScaledVector(dir, dist);
    this.persp.near = r / 500;
    this.persp.far = r * 200;
    this.ortho.near = 0.001;
    this.ortho.far = r * 200;
    this.ortho.zoom = 1;
    this.updateFrustum();
    this.controls.update();
    this.render();
  }

  private fitCurrent() {
    const box = this.visibleBox("model");
    if (!box) return;
    const dir = this.camera.position.clone().sub(this.controls.target).normalize();
    const center = box.getCenter(new THREE.Vector3());
    const r = this.radius;
    const dist =
      this.camera === this.persp ? (r / Math.sin(THREE.MathUtils.degToRad(this.persp.fov / 2))) * 1.05 : r * 4;
    this.controls.target.copy(center);
    this.camera.position.copy(center).addScaledVector(dir, dist);
    this.ortho.zoom = 1;
    this.updateFrustum();
    this.controls.update();
    this.render();
  }

  private visibleBox(scope: "model" | "all"): THREE.Box3 | null {
    if (!this.model) return null;
    const collect = (meshOnly: boolean) => {
      const box = new THREE.Box3();
      this.model!.traverse((o) => {
        const geo = meshOnly ? o instanceof THREE.Mesh : o instanceof THREE.Mesh || o instanceof THREE.Line || o instanceof THREE.Points;
        if (geo && shown(o)) box.expandByObject(o);
      });
      return box;
    };
    // 메시가 하나도 안 보이면 선 기준으로 물러난다
    let box = scope === "model" ? collect(true) : collect(false);
    if (box.isEmpty()) box = collect(false);
    return box.isEmpty() ? null : box;
  }

  private updateFrustum() {
    const w = Math.max(this.el.clientWidth, 1);
    const h = Math.max(this.el.clientHeight, 1);
    this.persp.aspect = w / h;
    this.persp.updateProjectionMatrix();
    const half = this.radius * 1.05;
    const aspect = w / h;
    this.ortho.left = -half * aspect;
    this.ortho.right = half * aspect;
    this.ortho.top = half;
    this.ortho.bottom = -half;
    this.ortho.updateProjectionMatrix();
  }

  private resize() {
    const w = Math.max(this.el.clientWidth, 1);
    const h = Math.max(this.el.clientHeight, 1);
    this.renderer.setSize(w, h, false);
    this.renderer.domElement.style.width = "100%";
    this.renderer.domElement.style.height = "100%";
    this.updateFrustum();
    this.render();
  }

  render() {
    this.renderer.render(this.scene, this.camera);
    this.placeLabel();
  }

  // ── 치수 재기 ──────────────────────────────────────────

  setMeasuring(on: boolean) {
    this.measuring = on;
    this.renderer.domElement.style.cursor = on ? "crosshair" : "";
    if (!on) {
      this.hover.visible = false;
      this.render();
    }
  }

  clearMeasure() {
    this.picks = [];
    this.marks.clear();
    this.label.classList.add("hidden");
    this.onMeasure?.(null);
    this.render();
  }

  private onDown = (e: PointerEvent) => {
    this.downAt = { x: e.clientX, y: e.clientY };
  };

  private onUp = (e: PointerEvent) => {
    if (!this.measuring || !this.downAt || e.button !== 0) return;
    // 끌어서 돌린 것은 클릭으로 치지 않는다
    const moved = Math.hypot(e.clientX - this.downAt.x, e.clientY - this.downAt.y);
    this.downAt = null;
    if (moved > 4) return;
    const p = this.pick(e);
    if (!p) return;
    if (this.picks.length >= 2) {
      this.picks = [];
      this.marks.clear();
    }
    this.picks.push(p);
    this.drawMarks();
  };

  private onMove = (e: PointerEvent) => {
    if (!this.measuring || e.buttons) return;
    const p = this.pick(e);
    this.hover.visible = !!p;
    if (p) this.hover.position.copy(p);
    this.render();
  };

  /** 화면 좌표 → 모델 위의 점. 가까운 꼭짓점(12px 안)이 있으면 그 점으로 붙인다 */
  private pick(e: PointerEvent): THREE.Vector3 | null {
    if (!this.model) return null;
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(ndc, this.camera);
    this.raycaster.params.Line = { threshold: this.radius / 300 };
    this.raycaster.params.Points = { threshold: this.radius / 300 };
    const hit = this.raycaster
      .intersectObject(this.model, true)
      .find((h) => shown(h.object) && !(h.object instanceof THREE.Sprite));
    if (!hit) return null;

    const candidates: THREE.Vector3[] = [];
    const pos = (hit.object as THREE.Mesh).geometry?.getAttribute("position") as THREE.BufferAttribute | undefined;
    if (pos) {
      const idx = hit.face ? [hit.face.a, hit.face.b, hit.face.c] : hit.index != null ? [hit.index, hit.index + 1] : [];
      for (const i of idx) {
        if (i < pos.count) candidates.push(new THREE.Vector3().fromBufferAttribute(pos, i).applyMatrix4(hit.object.matrixWorld));
      }
    }
    const toPx = (v: THREE.Vector3) => {
      const s = v.clone().project(this.camera);
      return new THREE.Vector2(((s.x + 1) / 2) * rect.width, ((1 - s.y) / 2) * rect.height);
    };
    const mouse = new THREE.Vector2(e.clientX - rect.left, e.clientY - rect.top);
    let best: THREE.Vector3 | null = null;
    let bestD = SNAP_PX;
    for (const c of candidates) {
      const d = toPx(c).distanceTo(mouse);
      if (d < bestD) {
        bestD = d;
        best = c;
      }
    }
    return best ?? hit.point.clone();
  }

  private drawMarks() {
    this.marks.clear();
    const pts = new THREE.Points(
      new THREE.BufferGeometry().setFromPoints(this.picks),
      new THREE.PointsMaterial({ color: INK, size: 9, sizeAttenuation: false, depthTest: false }),
    );
    pts.renderOrder = 10;
    this.marks.add(pts);
    if (this.picks.length === 2) {
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(this.picks),
        new THREE.LineBasicMaterial({ color: INK, depthTest: false }),
      );
      line.renderOrder = 10;
      this.marks.add(line);
      const [a, b] = this.picks;
      this.onMeasure?.({
        distance: a.distanceTo(b),
        dx: Math.abs(b.x - a.x),
        dy: Math.abs(b.y - a.y),
        dz: Math.abs(b.z - a.z),
      });
    } else {
      this.onMeasure?.(null);
    }
    this.render();
  }

  private placeLabel() {
    if (this.picks.length !== 2) {
      this.label.classList.add("hidden");
      return;
    }
    const [a, b] = this.picks;
    const mid = a.clone().add(b).multiplyScalar(0.5).project(this.camera);
    const w = this.el.clientWidth;
    const h = this.el.clientHeight;
    this.label.style.left = `${((mid.x + 1) / 2) * w}px`;
    this.label.style.top = `${((1 - mid.y) / 2) * h - 8}px`;
    this.label.textContent = formatLength(a.distanceTo(b));
    this.label.classList.remove("hidden");
  }
}
