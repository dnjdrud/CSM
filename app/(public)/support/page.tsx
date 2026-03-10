import Link from "next/link";
import { getMinistries } from "@/lib/data/repository";

export const dynamic = "force-dynamic";

export default async function SupportPage() {
  const ministries = await getMinistries();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link
        href="/"
        className="text-sm text-theme-muted hover:text-theme-text rounded mb-8 inline-block transition-colors"
      >
        ← 돌아가기
      </Link>
      <h1 className="text-2xl font-semibold text-theme-text">사역 후원</h1>
      <p className="mt-3 text-sm text-theme-muted leading-relaxed">
        후원은 의도적이고 품위 있게 이루어집니다. 공개 목표나 금액 표시 없이,
        당신이 신뢰하는 사역으로 직접 전달됩니다.
      </p>

      <ul className="mt-10 space-y-4 list-none p-0" role="list">
        {ministries.length === 0 && (
          <li className="text-sm text-theme-muted text-center py-8">
            현재 등록된 사역이 없습니다.
          </li>
        )}
        {ministries.map((m) => (
          <li key={m.id}>
            <Link
              href={`/support/${m.id}`}
              className="block border border-theme-border rounded-xl p-5 hover:border-theme-primary/50 transition-colors"
            >
              <h2 className="font-semibold text-theme-text">{m.name}</h2>
              {m.location && (
                <p className="mt-0.5 text-xs text-theme-muted">{m.location}</p>
              )}
              <p className="mt-2 text-sm text-theme-muted leading-relaxed line-clamp-2">
                {m.description}
              </p>
              <span className="mt-3 inline-block text-xs font-medium text-theme-primary">
                후원하기 →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
