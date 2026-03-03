/**
 * Skeleton for admin table rows. Used in admin users, moderation, audit loading states.
 */
import { Skeleton } from "@/components/ui/Skeleton";

type Props = {
  rows?: number;
  cols?: number;
};

export function AdminTableRowSkeleton({ rows = 5, cols = 4 }: Props) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-b border-gray-100">
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="py-3 pr-4">
              <Skeleton className="h-4 w-full max-w-[120px]" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function AdminTableSkeleton({
  rows = 5,
  colLabels = ["Col 1", "Col 2", "Col 3", "Col 4"],
}: {
  rows?: number;
  colLabels?: string[];
}) {
  return (
    <div className="mt-8 overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-gray-200">
            {colLabels.map((label, i) => (
              <th key={i} className="text-left py-2 pr-4 font-medium text-gray-700">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <AdminTableRowSkeleton rows={rows} cols={colLabels.length} />
        </tbody>
      </table>
    </div>
  );
}
