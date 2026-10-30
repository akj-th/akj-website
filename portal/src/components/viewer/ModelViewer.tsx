"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LayerInfo, Measurement, ModelInfo, ShadeMode, ViewName, ViewerScene } from "@/lib/viewer/scene";
import { formatLength } from "@/lib/viewer/format";

type Status = "idle" | "loading" | "ready" | "error";

const BIG_FILE = 300 * 1024 * 1024;

const VIEWS: [ViewName, string][] = [
  ["perspective", "투시"],
  ["top", "평면"],
  ["front", "정면"],
  ["right", "우측면"],
];

const SHADES: [ShadeMode, string][] = [
  ["layer", "레이어 색"],
  ["clay", "흰 모형"],
  ["material", "재질"],
];

const mb = (n: number) => (n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))}KB` : `${(n / 1024 / 1024).toFixed(1)}MB`);

const SKIP_NAME: Record<string, string> = {
  Annotation: "문자·치수",
  Hatch: "해치",
  Light: "조명",
  ClipPlane: "단면 평면",
  Detail: "상세 뷰",
};

function Seg<T extends string>({
  items,
  value,
  onChange,
}: {
  items: [T, string][];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex border border-ink" role="group">
      {items.map(([v, label]) => (
        <button
          key={v}
          type="button"
          aria-pressed={value === v}
          onClick={() => onChange(v)}
          className={`flex-1 px-2 py-1 text-xs ${value === v ? "bg-ink text-paper" : "hover:bg-[#ededeb]"}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export default function ModelViewer() {
  const viewport = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<ViewerScene | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [file, setFile] = useState<{ name: string; size: number } | null>(null);
  const [info, setInfo] = useState<ModelInfo | null>(null);
  const [layers, setLayers] = useState<LayerInfo[]>([]);
  const [hideEmpty, setHideEmpty] = useState(true);
  const [shade, setShade] = useState<ShadeMode>("layer");
  const [wire, setWire] = useState(false);
  const [parallel, setParallel] = useState(false);
  const [measuring, setMeasuring] = useState(false);
  const [measure, setMeasure] = useState<Measurement | null>(null);
  const [view, setView] = useState<ViewName>("perspective");
  const [dragOver, setDragOver] = useState(false);

  const openBuffer = useCallback(async (buf: ArrayBuffer, name: string) => {
    const s = sceneRef.current;
    if (!s) return;
    setStatus("loading");
    setError("");
    setFile({ name, size: buf.byteLength });
    try {
      const { info, layers } = await s.load(buf);
      setView("perspective");
      setInfo(info);
      setLayers(layers);
      setStatus("ready");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus("error");
    }
  }, []);

  const openFile = useCallback(
    async (f: File) => {
      if (!/\.3dm$/i.test(f.name)) {
        setError("3dm 파일만 열 수 있다. DWG 뷰어는 다음 단계에서 붙인다.");
        setStatus("error");
        return;
      }
      openBuffer(await f.arrayBuffer(), f.name);
    },
    [openBuffer],
  );

  // 장면 만들기 + ?src= 로 넘어온 파일 열기 (나중에 NAS 파일 목록에서 이 경로로 연다)
  useEffect(() => {
    let alive = true;
    (async () => {
      const { ViewerScene } = await import("@/lib/viewer/scene");
      if (!alive || !viewport.current) return;
      const s = new ViewerScene(viewport.current);
      s.onMeasure = setMeasure;
      sceneRef.current = s;
      const src = new URLSearchParams(window.location.search).get("src");
      if (src) {
        setStatus("loading");
        try {
          const res = await fetch(src);
          if (!res.ok) throw new Error(`파일을 받지 못했다 (${res.status})`);
          const name = decodeURIComponent(src.split("/").pop() || "model.3dm");
          await openBuffer(await res.arrayBuffer(), name);
        } catch (e) {
          setError(e instanceof Error ? e.message : String(e));
          setStatus("error");
        }
      }
    })();
    return () => {
      alive = false;
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, [openBuffer]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        sceneRef.current?.clearMeasure();
        setMeasuring(false);
        sceneRef.current?.setMeasuring(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toggleLayer = (l: LayerInfo) => {
    sceneRef.current?.setLayerVisible(l.index, !l.visible);
    setLayers((ls) => ls.map((x) => (x.index === l.index ? { ...x, visible: !x.visible } : x)));
  };

  const allLayers = (on: boolean) => {
    sceneRef.current?.setAllLayers(on);
    setLayers((ls) => ls.map((x) => ({ ...x, visible: on })));
  };

  // 비어 있는 레이어라도 하위에 객체가 있으면 남긴다
  const shownLayers = useMemo(() => {
    if (!hideEmpty) return layers;
    const used = new Set<string>();
    for (const l of layers) {
      if (!l.count) continue;
      const parts = l.path.split("::");
      for (let i = 1; i <= parts.length; i++) used.add(parts.slice(0, i).join("::"));
    }
    return layers.filter((l) => used.has(l.path));
  }, [layers, hideEmpty]);

  const ready = status === "ready";
  const big = file && file.size > BIG_FILE;

  return (
    <div className="flex h-[calc(100vh-11.5rem)] min-h-[520px] border border-line bg-paper">
      <aside className="flex w-72 shrink-0 flex-col border-r border-line text-sm">
        <section className="flex flex-col gap-2 border-b border-line p-3">
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="bg-ink px-3 py-2 text-paper hover:opacity-85"
          >
            3dm 파일 열기
          </button>
          <input
            ref={fileInput}
            type="file"
            accept=".3dm"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) openFile(f);
              e.target.value = "";
            }}
          />
          {file ? (
            <dl className="grid grid-cols-[4.5rem_1fr] gap-x-2 gap-y-0.5 text-xs">
              <dt className="text-mute">파일</dt>
              <dd className="truncate" title={file.name}>
                {file.name}
              </dd>
              <dt className="text-mute">크기</dt>
              <dd className="tabular-nums">{mb(file.size)}</dd>
              {info && (
                <>
                  <dt className="text-mute">단위</dt>
                  <dd>{info.units}</dd>
                  <dt className="text-mute">객체</dt>
                  <dd className="tabular-nums">
                    {info.objects.toLocaleString()} (형상 {info.meshes.toLocaleString()})
                  </dd>
                  <dt className="text-mute">형상 범위</dt>
                  <dd className="tabular-nums">{info.size.map((v) => formatLength(v)).join(" × ")}</dd>
                  {Object.keys(info.skipped).length > 0 && (
                    <>
                      <dt className="text-mute">표시 안 됨</dt>
                      <dd>
                        {Object.entries(info.skipped)
                          .map(([t, n]) => `${SKIP_NAME[t] ?? t} ${n.toLocaleString()}`)
                          .join(" · ")}
                      </dd>
                    </>
                  )}
                  {info.missingTextures > 0 && (
                    <>
                      <dt className="text-mute">재질 이미지</dt>
                      <dd>{info.missingTextures}개가 파일에 없음 (연결 이미지)</dd>
                    </>
                  )}
                </>
              )}
            </dl>
          ) : (
            <p className="text-xs text-mute">파일을 고르거나 화면에 끌어다 놓는다. 파일은 이 컴퓨터 브라우저 안에서만 열린다.</p>
          )}
          {big && <p className="text-xs">큰 파일이다. 브라우저 메모리가 모자랄 수 있다 — NAS 변환 보기는 다음 단계.</p>}
          {ready && info && info.objects > 0 && info.meshes === 0 && (
            <p className="text-xs">
              형상이 보이지 않으면 라이노에서 &lsquo;작게 저장&rsquo;한 파일일 수 있다. 렌더 메시를 포함해 다시 저장한다.
            </p>
          )}
        </section>

        <section className="flex flex-col gap-2 border-b border-line p-3">
          <span className="text-xs text-mute">표시</span>
          <Seg
            items={SHADES}
            value={shade}
            onChange={(v) => {
              setShade(v);
              sceneRef.current?.setShade(v);
            }}
          />
          <div className="flex gap-4 text-xs">
            <label className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={wire}
                onChange={(e) => {
                  setWire(e.target.checked);
                  sceneRef.current?.setWireframe(e.target.checked);
                }}
              />
              와이어프레임
            </label>
            <label className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={parallel}
                onChange={(e) => {
                  setParallel(e.target.checked);
                  sceneRef.current?.setProjection(e.target.checked ? "parallel" : "perspective");
                }}
              />
              평행 투영
            </label>
          </div>
        </section>

        <section className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-center justify-between gap-2 p-3 pb-2">
            <span className="text-xs text-mute">레이어 {layers.length ? `(${shownLayers.length})` : ""}</span>
            <div className="flex gap-2 text-xs">
              <button type="button" className="underline underline-offset-2" onClick={() => allLayers(true)} disabled={!ready}>
                모두 켜기
              </button>
              <button type="button" className="underline underline-offset-2" onClick={() => allLayers(false)} disabled={!ready}>
                모두 끄기
              </button>
            </div>
          </div>
          <label className="flex items-center gap-1.5 px-3 pb-2 text-xs">
            <input type="checkbox" checked={hideEmpty} onChange={(e) => setHideEmpty(e.target.checked)} />빈 레이어 숨기기
          </label>
          <ul className="min-h-0 flex-1 overflow-y-auto border-t border-rule">
            {shownLayers.map((l) => (
              <li key={l.index}>
                <label
                  className="flex cursor-pointer items-center gap-2 py-1 pr-3 hover:bg-[#f2f2f0]"
                  style={{ paddingLeft: `${12 + l.depth * 14}px` }}
                  title={l.path}
                >
                  <input type="checkbox" checked={l.visible} onChange={() => toggleLayer(l)} />
                  <span className="h-2.5 w-2.5 shrink-0 border border-ink/30" style={{ background: l.color }} />
                  <span className={`min-w-0 flex-1 truncate ${l.count ? "" : "text-stone"}`}>{l.name}</span>
                  <span className="text-xs text-stone tabular-nums">{l.count || ""}</span>
                </label>
              </li>
            ))}
          </ul>
        </section>
      </aside>

      <div
        className="relative min-w-0 flex-1"
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files?.[0];
          if (f) openFile(f);
        }}
      >
        <div ref={viewport} className="absolute inset-0" />

        <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-2">
          <div className="flex border border-ink bg-paper" role="group" aria-label="시점">
            {VIEWS.map(([v, label]) => (
              <button
                key={v}
                type="button"
                disabled={!ready}
                onClick={() => {
                  setView(v);
                  sceneRef.current?.fit(v);
                }}
                className={`px-2.5 py-1 text-xs disabled:opacity-40 ${ready && view === v ? "bg-ink text-paper" : "hover:bg-[#ededeb]"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            disabled={!ready}
            title="평면도 선처럼 멀리 떨어진 객체까지 모두 보이게 맞춘다"
            onClick={() => sceneRef.current?.fit(view, "all")}
            className="border border-ink bg-paper px-2.5 py-1 text-xs hover:bg-[#ededeb] disabled:opacity-40"
          >
            전체 범위
          </button>
          <button
            type="button"
            disabled={!ready}
            aria-pressed={measuring}
            onClick={() => {
              const on = !measuring;
              setMeasuring(on);
              sceneRef.current?.setMeasuring(on);
            }}
            className={`border border-ink px-2.5 py-1 text-xs disabled:opacity-40 ${measuring ? "bg-ink text-paper" : "bg-paper hover:bg-[#ededeb]"}`}
          >
            치수 재기
          </button>
          {measure && (
            <button
              type="button"
              onClick={() => sceneRef.current?.clearMeasure()}
              className="border border-ink bg-paper px-2.5 py-1 text-xs hover:bg-[#ededeb]"
            >
              치수 지우기
            </button>
          )}
        </div>

        {measuring && (
          <div className="absolute bottom-3 left-3 z-10 border border-ink bg-paper px-3 py-2 text-xs tabular-nums">
            {measure ? (
              <>
                <div className="text-sm font-semibold">
                  {formatLength(measure.distance)} {info?.units}
                </div>
                <div className="text-mute">
                  ΔX {formatLength(measure.dx)} · ΔY {formatLength(measure.dy)} · ΔZ {formatLength(measure.dz)}
                </div>
              </>
            ) : (
              <span>두 점을 찍는다. 꼭짓점 가까이 가면 붙는다. Esc로 끝.</span>
            )}
          </div>
        )}

        {status !== "ready" && (
          <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center p-6 text-center">
            {status === "idle" && <p className="text-mute">3dm 파일을 여기에 끌어다 놓는다</p>}
            {status === "loading" && <p>여는 중… 큰 파일은 시간이 걸린다</p>}
            {status === "error" && <p className="max-w-md">열지 못했다 — {error}</p>}
          </div>
        )}
        {dragOver && <div className="pointer-events-none absolute inset-2 z-20 border-2 border-dashed border-ink" />}
      </div>
    </div>
  );
}
