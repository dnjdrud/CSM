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

// 필수 표시 별표
function Req() {
  return <span className="text-theme-danger ml-0.5" aria-hidden>*</span>;
}

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

  // router.refresh() 후 서버에서 새 user prop이 내려오면 state 재동기화
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

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();

    // 클라이언트 필수 검증
    if (!name.trim()) { setError("이름은 비워둘 수 없습니다."); return; }
    if (!username.trim()) { setError("사용자 이름은 필수 입력사항입니다."); return; }
    if (username.trim().length < 2) { setError("사용자 이름은 2자 이상이어야 합니다."); return; }
    if (!denomination) { setError("교단을 선택해주세요."); return; }
    if (!church.trim()) { setError("교회명은 필수 입력사항입니다."); return; }

    setPending(true);
    setError(null);
    setSaved(false);
    try {
      type Payload = Parameters<typeof updateProfileAction>[0];
      const payload: Payload = { name: name.trim() };

      // 역할 — ADMIN은 변경 불가
      if (user.role !== "ADMIN") payload.role = role;

      // 필수 필드: 항상 payload에 포함 (기존 null 사용자도 즉시 저장)
      payload.username = username.trim();
      payload.denomination = denomination;
      payload.church = church.trim();

      // 선택 필드: 값이 있거나 기존에 있던 값인 경우에만 포함
      const bioVal = bio.trim() || null;
      if (user.bio !== undefined || bioVal !== null) payload.bio = bioVal;

      const affiliationVal = affiliation.trim() || null;
      if (user.affiliation !== undefined || affiliationVal !== null) payload.affiliation = affiliationVal;

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

  const inputCls = "mt-1.5 block w-full rounded-input border border-theme-border bg-theme-surface px-3 py-2.5 text-theme-text placeholder:text-theme-muted focus:border-theme-primary focus:outline-none focus:ring-1 focus:ring-theme-primary transition-colors";
  const inputReqCls = inputCls;

  // 프로필 미완성 여부 — 필수 항목 중 하나라도 없으면 안내 배너 표시
  const isIncomplete = !user.username || !user.denomination || !user.church;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* 필수 항목 미완성 안내 */}
      {isIncomplete && (
        <div className="rounded-xl border border-theme-warning/30 bg-theme-warning-bg px-4 py-3 text-sm text-theme-warning">
          <p className="font-medium mb-0.5">프로필 정보를 완성해주세요</p>
          <p className="text-theme-warning/80 text-[13px]">
            사용자 이름, 교단, 교회는 필수 입력 항목입니다.{" "}
            <span className="text-theme-danger">*</span> 표시 항목을 모두 입력해야 저장됩니다.
          </p>
        </div>
      )}

      {/* Avatar */}
      <AvatarUpload currentAvatarUrl={user.avatarUrl} name={user.name} />

      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-theme-text">
          이름<Req />
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputReqCls}
          required
        />
      </div>

      {/* Username — 필수 */}
      <div>
        <label htmlFor="username" className="block text-sm font-medium text-theme-text">
          사용자 이름<Req />
        </label>
        <div className="relative mt-1.5">
          <span className="absolute inset-y-0 left-3 flex items-center text-theme-muted text-sm">@</span>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
            placeholder="handle"
            minLength={2}
            maxLength={30}
            required
            className="block w-full rounded-input border border-theme-border bg-theme-surface py-2.5 pl-7 pr-3 text-theme-text placeholder:text-theme-muted focus:border-theme-primary focus:outline-none focus:ring-1 focus:ring-theme-primary transition-colors"
            autoComplete="username"
          />
        </div>
        <p className="mt-1 text-xs text-theme-muted">영문, 숫자, 밑줄(_) 2자 이상. 고유한 핸들로 사용됩니다.</p>
      </div>

      {/* Role */}
      {user.role !== "ADMIN" && (
        <div>
          <label className="block text-sm font-medium text-theme-text">역할</label>
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

      {/* Denomination — 필수 */}
      <div>
        <label htmlFor="denomination" className="block text-sm font-medium text-theme-text">
          교단<Req />
        </label>
        <select
          id="denomination"
          value={denomination}
          onChange={(e) => setDenomination(e.target.value)}
          required
          className={inputReqCls}
        >
          <option value="">교단을 선택해주세요</option>
          {DENOMINATIONS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      {/* Church — 필수 */}
      <div>
        <label htmlFor="church" className="block text-sm font-medium text-theme-text">
          교회<Req />
        </label>
        <input
          id="church"
          type="text"
          value={church}
          onChange={(e) => setChurch(e.target.value)}
          placeholder="소속 교회 또는 사역지"
          required
          className={inputReqCls}
        />
        <p className="mt-1 text-xs text-theme-muted">같은 교회 이름을 여러 사람이 사용할 수 있습니다.</p>
      </div>

      {/* Faith years — 선택 */}
      <div>
        <label htmlFor="faithYears" className="block text-sm font-medium text-theme-text">
          신앙 연수 <span className="text-theme-muted font-normal">(선택)</span>
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

      {/* Affiliation — 선택, 중복 허용 */}
      <div>
        <label htmlFor="affiliation" className="block text-sm font-medium text-theme-text">
          소속 기관 <span className="text-theme-muted font-normal">(선택)</span>
        </label>
        <input
          id="affiliation"
          type="text"
          value={affiliation}
          onChange={(e) => setAffiliation(e.target.value)}
          placeholder="선교단체 또는 네트워크"
          className={inputCls}
        />
        <p className="mt-1 text-xs text-theme-muted">같은 기관 이름을 여러 사람이 사용할 수 있습니다.</p>
      </div>

      {/* Bio — 선택 */}
      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-theme-text">
          자기소개 <span className="text-theme-muted font-normal">(선택)</span>
        </label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={4}
          placeholder="간단한 소개를 적어주세요"
          className="mt-1.5 block w-full rounded-input border border-theme-border bg-theme-surface px-3 py-2.5 text-sm text-theme-text placeholder:text-theme-muted focus:border-theme-primary focus:outline-none focus:ring-1 focus:ring-theme-primary resize-y transition-colors"
          maxLength={500}
        />
        <p className="mt-1 text-xs text-theme-muted text-right">{bio.length}/500</p>
      </div>

      {error && <p className="text-sm text-theme-danger" role="alert">{error}</p>}
      {saved && <p className="text-sm text-theme-success">저장되었습니다.</p>}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-button bg-theme-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-theme-primary-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {pending ? "저장 중…" : "저장"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-button border border-theme-border px-5 py-2.5 text-sm font-medium text-theme-muted hover:bg-theme-surface-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent focus-visible:ring-offset-2"
        >
          취소
        </button>
      </div>
    </form>
  );
}
