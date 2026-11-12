import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main" className="mx-auto flex min-h-dvh w-full max-w-[36rem] flex-col px-4 py-8">
      <h1 className="mb-6 text-title font-bold">찾는 화면이 없어요</h1>
      <p>주소가 바뀌었거나 없는 화면이에요.</p>
      <div className="mt-auto pt-10">
        <Link href="/" className="btn btn-primary">
          처음 화면으로
        </Link>
      </div>
    </main>
  );
}
