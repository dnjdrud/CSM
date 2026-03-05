import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function CommunityPage() {
  // 커뮤니티는 이제 /feed 안의 통합 레이아웃에서 노출되므로,
  // 기존 /community 접근은 피드로 리다이렉트.
  redirect("/feed");
}
