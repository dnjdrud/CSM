import { Skeleton } from "@/components/ui/Skeleton";
import { Card, CardContent } from "@/components/ui/Card";
import { AdminTableSkeleton } from "../_components/AdminTableSkeleton";

export default function AdminAuditLoading() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <Skeleton className="h-8 w-28" />
      <Skeleton className="mt-2 h-4 w-64 max-w-full" />
      <Card className="mt-8">
        <CardContent>
          <AdminTableSkeleton rows={8} colLabels={["Time", "Actor", "Action", "Target"]} />
        </CardContent>
      </Card>
    </div>
  );
}
