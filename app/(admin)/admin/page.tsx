import { getDashboardStats } from "@/lib/data/adminRepository";
import { getAdminSignals } from "@/lib/observability/adminSignals";
import { Card, CardContent } from "@/components/ui/Card";
import { CreateDailyPrayerButton } from "./_components/CreateDailyPrayerButton";

export default async function AdminDashboardPage() {
  const [stats, signals] = await Promise.all([getDashboardStats(), getAdminSignals()]);

  return (
    <div>
      <h1 className="text-2xl font-serif font-normal text-theme-text tracking-tight">
        Dashboard
      </h1>
      <p className="mt-1 text-sm text-theme-muted">
        Overview of moderation and user activity.
      </p>

      <section className="mt-8">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-theme-subtle mb-3">전체 현황</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent>
              <p className="text-xs font-medium text-neutral-500">총 사용자</p>
              <p className="mt-1 text-2xl font-semibold text-theme-text">{stats.totalUsers.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-xs font-medium text-neutral-500">총 포스트</p>
              <p className="mt-1 text-2xl font-semibold text-theme-text">{stats.totalPosts.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-xs font-medium text-neutral-500">총 댓글</p>
              <p className="mt-1 text-2xl font-semibold text-theme-text">{stats.totalComments.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-theme-subtle mb-3">오늘 활동</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent>
              <p className="text-xs font-medium text-neutral-500">신규 가입</p>
              <p className="mt-1 text-2xl font-semibold text-theme-text">{stats.newUsersToday}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-xs font-medium text-neutral-500">새 포스트</p>
              <p className="mt-1 text-2xl font-semibold text-theme-text">{stats.newPostsToday}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-xs font-medium text-neutral-500">미처리 신고</p>
              <p className="mt-1 text-2xl font-semibold text-theme-text">{stats.openReportsToday}</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-theme-subtle mb-3">최근 7일</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent>
              <p className="text-xs font-medium text-neutral-500">활성 사용자</p>
              <p className="mt-1 text-2xl font-semibold text-theme-text">{stats.activeUsersLast7d}</p>
              <p className="mt-0.5 text-xs text-theme-subtle">포스트·댓글·반응 기준</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-xs font-medium text-neutral-500">오류 (today)</p>
              <p className="mt-1 text-2xl font-semibold text-theme-text">{signals.todayErrors}</p>
              <p className="mt-0.5 text-xs text-theme-subtle">Sentry 확인 필요</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-xs font-medium text-neutral-500">알림 실패 (today)</p>
              <p className="mt-1 text-2xl font-semibold text-theme-text">{signals.notifyFailuresToday}</p>
              <p className="mt-0.5 text-xs text-theme-subtle">Supabase Edge Function 로그</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <div className="mt-8">
        <CreateDailyPrayerButton />
      </div>
    </div>
  );
}
