import { Skeleton } from "@/components/ui/Skeleton";
import { Card, CardContent } from "@/components/ui/Card";
import { AdminTableSkeleton } from "../_components/AdminTableSkeleton";

export default function AdminUsersLoading() {
  return (
    <div className="">
      <Skeleton className="h-8 w-24" />
      <Skeleton className="mt-2 h-4 w-72 max-w-full" />
      <div className="mt-6 flex gap-2">
        <Skeleton className="h-10 w-64 rounded" />
        <Skeleton className="h-10 w-24 rounded-md" />
      </div>
      <Card className="mt-8">
        <CardContent>
          <AdminTableSkeleton rows={6} colLabels={["Name", "Role", "Status", "Actions"]} />
        </CardContent>
      </Card>
    </div>
  );
}
