import { Skeleton } from "@/components/ui/Skeleton";
import { Card, CardContent } from "@/components/ui/Card";
import { AdminTableSkeleton } from "../_components/AdminTableSkeleton";

export default function AdminModerationLoading() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <Skeleton className="h-8 w-36" />
      <Skeleton className="mt-2 h-4 w-96 max-w-full" />
      <Card className="mt-8">
        <CardContent>
          <AdminTableSkeleton
            rows={5}
            colLabels={["Type", "Reason", "Reporter", "Target", "Date", "Actions"]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
