import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex max-w-xl flex-col gap-3">
      <h1 className="text-3xl font-semibold tracking-tight">없는 화면</h1>
      <p className="text-mute">주소가 바뀌었거나 아직 만들지 않은 메뉴다.</p>
      <Link href="/" className="underline underline-offset-4">
        대시보드로
      </Link>
    </div>
  );
}
