import { getDashboardStats } from "@/lib/data/adminRepository";
import { getAdminSignals } from "@/lib/observability/adminSignals";
import { Card, CardContent } from "@/components/ui/Card";
import { CreateDailyPrayerButton } from "./_components/CreateDailyPrayerButton";

export default async function AdminDashboardPage() {
  const [stats, signals] = await Promise.all([getDashboardStats(), getAdminSignals()]);

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-serif font-normal text-gray-800 tracking-tight">
        Dashboard
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Overview of moderation and user activity.
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-3">
        <Card>
          <CardContent>
            <p className="text-sm font-medium text-neutral-500">Today errors</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{signals.todayErrors}</p>
            <p className="mt-0.5 text-xs text-gray-500">Check Sentry for details</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm font-medium text-neutral-500">Notify failures (today)</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{signals.notifyFailuresToday}</p>
            <p className="mt-0.5 text-xs text-gray-500">Edge function logs in Supabase</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm font-medium text-neutral-500">Open reports (today)</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{stats.openReportsToday}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm font-medium text-neutral-500">New users (today)</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{stats.newUsersToday}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm font-medium text-neutral-500">Active users (last 7 days)</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{stats.activeUsersLast7d}</p>
          </CardContent>
        </Card>
      </div>

      <p className="mt-4 text-xs text-gray-500">
        Error and notify counts are placeholders until wired to Sentry and Edge Function logs.
      </p>

      <div className="mt-8">
        <CreateDailyPrayerButton />
      </div>
    </div>
  );
}
