import { Card, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

export default function AdminDashboardLoading() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="mt-2 h-4 w-80 max-w-full" />
      <div className="mt-8 grid gap-6 sm:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardContent>
              <Skeleton className="h-4 w-32" />
              <Skeleton className="mt-2 h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-8">
        <Skeleton className="h-10 w-40 rounded-md" />
      </div>
    </div>
  );
}
