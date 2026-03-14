"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateProfileAction } from "../../actions";
import { ROLE_DISPLAY, type UserRole, type User } from "@/lib/domain/types";
import { AvatarUpload } from "./AvatarUpload";

const ROLES: UserRole[] = ["LAY", "MINISTRY_WORKER", "PASTOR", "MISSIONARY", "SEMINARIAN"];

const DENOMINATIONS = [
  "장로교 (통합)",
  "장로교 (합동)",
  "장로교 (기타)",
  "감리교",
  "침례교",
  "성결교",
  "순복음 / 오순절",
  "구세군",
  "루터교",
  "기타",
];

type Props = { user: User };

export function ProfileEditForm({ user }: Props) {
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [username, setUsername] = useState(user.username ?? "");
  const [role, setRole] = useState<UserRole>(user.role === "ADMIN" ? "LAY" : user.role);
  const [denomination, setDenomination] = useState(user.denomination ?? "");
  const [faithYears, setFaithYears] = useState(user.faithYears != null ? String(user.faithYears) : "");
  const [church, setChurch] = useState(user.church ?? "");
  const [affiliation, setAffiliation] = useState(user.affiliation ?? "");
  const [bio, setBio] = useState(user.bio ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // router.refresh() 후 서버에서 새 user prop이 내려오면 form state를 재동기화한다.
  // user.id가 아닌 필드 조합을 key로 써야 저장 후 변경된 값이 반영된다.
  const syncKey = `${user.name}|${user.username ?? ""}|${user.bio ?? ""}|${user.church ?? ""}|${user.denomination ?? ""}|${user.faithYears ?? ""}|${user.affiliation ?? ""}`;
  useEffect(() => {
    setName(user.name);
    setUsername(user.username ?? "");
    setRole(user.role === "ADMIN" ? "LAY" : user.role);
    setDenomination(user.denomination ?? "");
    setFaithYears(user.faithYears != null ? String(user.faithYears) : "");
    setChurch(user.church ?? "");
    setAffiliation(user.affiliation ?? "");
    setBio(user.bio ?? "");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncKey]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("이름은 비워둘 수 없습니다."); return; }
    setPending(true);
    setError(null);
    setSaved(false);
    try {
      // Build payload carefully: only include optional fields if user originally had
      // a value (so they can clear it) OR if they typed something new. This prevents
      // accidentally clearing fields that weren't returned by the DB query fallback.
      type Payload = Parameters<typeof updateProfileAction>[0];
      // ADMIN 역할은 서버에서 보호되지만, 클라이언트에서도 payload에서 제외해 실수를 방지
      const payload: Payload = { name: name.trim() };
      if (user.role !== "ADMIN") payload.role = role;

      const usernameVal = username.trim() || null;
      if (user.username !== undefined || usernameVal !== null) payload.username = usernameVal;

      const bioVal = bio.trim() || null;
      if (user.bio !== undefined || bioVal !== null) payload.bio = bioVal;

      const affiliationVal = affiliation.trim() || null;
      if (user.affiliation !== undefined || affiliationVal !== null) payload.affiliation = affiliationVal;

      const churchVal = church.trim() || null;
      if (user.church !== undefined || churchVal !== null) payload.church = churchVal;

      const denominationVal = denomination.trim() || null;
      if (user.denomination !== undefined || denominationVal !== null) payload.denomination = denominationVal;

      const faithYearsVal = faithYears ? Number(faithYears) : null;
      if (user.faithYears !== undefined || faithYearsVal !== null) payload.faithYears = faithYearsVal;

      const result = await updateProfileAction(payload);
      if ("ok" in result && result.ok) {
        setSaved(true);
        router.refresh();
      } else if ("error" in result) {
        setError(result.error);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장에 실패했습니다.");
    } finally {
      setPending(false);
    }
  }

  const inputCls = "mt-1.5 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-gray-800 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Avatar */}
      <AvatarUpload currentAvatarUrl={user.avatarUrl} name={user.name} />

      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-800">
          이름
        </label>
        <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} required />
      </div>

      {/* Username */}
      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-800">
          사용자 이름 <span className="text-gray-500 font-normal">(선택)</span>
        </label>
        <div className="relative mt-1.5">
          <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 text-sm">@</span>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
            placeholder="handle"
            className="block w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-7 pr-3 text-gray-800 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
            autoComplete="username"
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">영문, 숫자, 밑줄(_)만 사용 가능합니다.</p>
      </div>

      {/* Role */}
      {user.role !== "ADMIN" && (
        <div>
          <label className="block text-sm font-medium text-gray-800">역할</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className={inputCls}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>{ROLE_DISPLAY[r]}</option>
            ))}
          </select>
        </div>
      )}

      {/* Denomination */}
      <div>
        <label htmlFor="denomination" className="block text-sm font-medium text-gray-800">
          교단 <span className="text-gray-500 font-normal">(선택)</span>
        </label>
        <select id="denomination" value={denomination} onChange={(e) => setDenomination(e.target.value)} className={inputCls}>
          <option value="">선택 안 함</option>
          {DENOMINATIONS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      {/* Faith years */}
      <div>
        <label htmlFor="faithYears" className="block text-sm font-medium text-gray-800">
          신앙 연수 <span className="text-gray-500 font-normal">(선택)</span>
        </label>
        <input
          id="faithYears"
          type="number"
          min={0}
          max={120}
          value={faithYears}
          onChange={(e) => setFaithYears(e.target.value)}
          placeholder="몇 년째 신앙생활 중인지 입력"
          className={inputCls}
        />
      </div>

      {/* Church */}
      <div>
        <label htmlFor="church" className="block text-sm font-medium text-gray-800">
          교회 <span className="text-gray-500 font-normal">(선택)</span>
        </label>
        <input id="church" type="text" value={church} onChange={(e) => setChurch(e.target.value)} placeholder="소속 교회 또는 사역지" className={inputCls} />
      </div>

      {/* Affiliation */}
      <div>
        <label htmlFor="affiliation" className="block text-sm font-medium text-gray-800">
          소속 기관 <span className="text-gray-500 font-normal">(선택)</span>
        </label>
        <input id="affiliation" type="text" value={affiliation} onChange={(e) => setAffiliation(e.target.value)} placeholder="선교단체 또는 네트워크" className={inputCls} />
      </div>

      {/* Bio */}
      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-gray-800">
          자기소개 <span className="text-gray-500 font-normal">(선택)</span>
        </label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={4}
          placeholder="간단한 소개를 적어주세요"
          className="mt-1.5 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 resize-y"
          maxLength={500}
        />
        <p className="mt-1 text-xs text-gray-400 text-right">{bio.length}/500</p>
      </div>

      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
      {saved && <p className="text-sm text-green-600">저장되었습니다.</p>}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-gray-800 px-5 py-2.5 text-sm font-medium text-gray-50 hover:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {pending ? "저장 중…" : "저장"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2"
        >
          취소
        </button>
      </div>
    </form>
  );
}
