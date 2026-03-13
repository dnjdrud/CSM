import Link from "next/link";
import { listSignupRequestsAction } from "./actions";
import { SignupRequestsTable } from "./_components/SignupRequestsTable";
import type { SignupRequestStatus } from "@/lib/domain/types";

const TABS: { value: SignupRequestStatus | "ALL"; label: string }[] = [
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "COMPLETED", label: "Completed" },
  { value: "ALL", label: "All" },
];

type Props = { searchParams: Promise<{ status?: string }> };

export default async function AdminSignupRequestsPage({ searchParams }: Props) {
  const { status } = await searchParams;
  const activeStatus = (TABS.map((t) => t.value).includes(status as SignupRequestStatus) ? status : "PENDING") as SignupRequestStatus | "ALL";

  const { requests, error } = await listSignupRequestsAction(
    activeStatus === "ALL" ? undefined : activeStatus
  );

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div>
        <h1 className="text-2xl font-serif font-normal text-gray-800 tracking-tight">
          Signup requests
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Review and approve or reject access requests. Approved users receive an email to complete signup.
        </p>
      </div>

      {/* 상태 탭 */}
      <div className="mt-6 flex gap-1 border-b border-gray-200">
        {TABS.map(({ value, label }) => {
          const isActive = activeStatus === value;
          return (
            <Link
              key={value}
              href={`/admin/signup-requests?status=${value}`}
              className={`px-4 py-2 text-sm font-medium rounded-t border-b-2 -mb-px focus:outline-none ${
                isActive
                  ? "border-gray-800 text-gray-800"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>

      {error && (
        <p className="mt-4 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <section className="mt-6">
        {requests.length === 0 ? (
          <p className="text-sm text-gray-500">No requests found.</p>
        ) : (
          <div className="overflow-x-auto">
            <SignupRequestsTable requests={requests} readOnly={activeStatus !== "PENDING"} />
          </div>
        )}
      </section>
    </div>
  );
}
