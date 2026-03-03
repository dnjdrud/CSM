import { Skeleton } from "@/components/ui/Skeleton";
import { Card, CardContent } from "@/components/ui/Card";
import { AdminTableSkeleton } from "../_components/AdminTableSkeleton";

export default function AdminInvitesLoading() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <Skeleton className="h-8 w-24" />
      <Skeleton className="mt-2 h-4 w-96 max-w-full" />
      <Card className="mt-6">
        <CardContent>
          <Skeleton className="h-10 w-full max-w-md mb-3" />
          <Skeleton className="h-10 w-32 rounded-md" />
        </CardContent>
      </Card>
      <div className="mt-8">
        <Skeleton className="h-4 w-24 mb-2" />
        <Card>
          <CardContent>
            <AdminTableSkeleton
              rows={5}
              colLabels={["Code", "Status", "Uses", "Expires", "Note", "Created", "Used", "Actions"]}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
