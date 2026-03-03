import { listSignupRequestsAction } from "./actions";
import { SignupRequestsTable } from "./_components/SignupRequestsTable";

export default async function AdminSignupRequestsPage() {
  const { requests, error } = await listSignupRequestsAction("PENDING");

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

      {error && (
        <p className="mt-4 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <section className="mt-8">
        <h2 className="text-sm font-medium text-gray-700">Pending requests</h2>
        {requests.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">No pending requests.</p>
        ) : (
          <div className="mt-2 overflow-x-auto">
            <SignupRequestsTable requests={requests} />
          </div>
        )}
      </section>
    </div>
  );
}
