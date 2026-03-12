/**
 * Role-based UX personalization config.
 *
 * Principle: "부드러운 개인화" — no hard restrictions, just preferred flows.
 * All users can access all features; this config only changes prompts and ordering.
 */

import type { UserRole } from "@/lib/domain/types";
import type { PostCategory } from "@/lib/domain/types";

export type RoleUXConfig = {
  /** 홈 피드 상단 CTA 문구 (글쓰기 버튼 위) */
  homeCta: string;
  /** 홈 피드 빈 상태 설명 */
  homeEmptyDescription: string;
  /** 작성 페이지에서 "추천" 배지를 붙일 카테고리 목록 */
  recommendedCategories: PostCategory[];
  /** 작성 페이지 상단 안내 문구 */
  writeHint: string;
};

const DEFAULT: RoleUXConfig = {
  homeCta: "오늘 나누고 싶은 이야기가 있나요?",
  homeEmptyDescription: "팔로우한 사람들의 글이 여기 표시됩니다.",
  recommendedCategories: ["GENERAL", "PRAYER", "CELL"],
  writeHint: "일상, 기도, 셀 나눔을 공유해보세요.",
};

const ROLE_UX: Partial<Record<UserRole, RoleUXConfig>> = {
  LAY: {
    homeCta: "오늘 나누고 싶은 이야기가 있나요?",
    homeEmptyDescription: "팔로우한 사람들의 글이 여기 표시됩니다. 기도 제목이나 셀 나눔을 공유해보세요.",
    recommendedCategories: ["GENERAL", "PRAYER", "CELL"],
    writeHint: "일상, 기도, 셀 나눔을 공유해보세요.",
  },
  MINISTRY_WORKER: {
    homeCta: "사역 소식과 컨텐츠를 나눠주세요.",
    homeEmptyDescription: "팔로우한 사람들의 사역 소식이 여기 표시됩니다.",
    recommendedCategories: ["CONTENT", "REQUEST", "MISSION"],
    writeHint: "사역 컨텐츠·협업 요청·선교 소식을 올려보세요.",
  },
  PASTOR: {
    homeCta: "말씀과 사역 소식을 나눠주세요.",
    homeEmptyDescription: "팔로우한 사람들의 소식이 여기 표시됩니다.",
    recommendedCategories: ["CONTENT", "GENERAL", "TESTIMONY"],
    writeHint: "설교·컨텐츠·간증을 공유해보세요.",
  },
  MISSIONARY: {
    homeCta: "선교 현장 소식을 전해주세요.",
    homeEmptyDescription: "팔로우한 선교사·사역자의 소식이 여기 표시됩니다.",
    recommendedCategories: ["MISSION", "PRAYER", "CONTENT"],
    writeHint: "선교 업데이트·기도 제목·컨텐츠를 나눠보세요.",
  },
  SEMINARIAN: {
    homeCta: "신앙의 여정을 나눠주세요.",
    homeEmptyDescription: "팔로우한 사람들의 글이 여기 표시됩니다.",
    recommendedCategories: ["GENERAL", "PRAYER", "TESTIMONY"],
    writeHint: "묵상·기도·간증을 기록해보세요.",
  },
};

export function getRoleUX(role: UserRole | undefined): RoleUXConfig {
  if (!role) return DEFAULT;
  return ROLE_UX[role] ?? DEFAULT;
}
