import { listInvites } from "@/lib/data/inviteRepository";
import { CreateInviteForm } from "./_components/CreateInviteForm";
import { InvitesTableBody } from "./_components/InvitesTableBody";

export default async function AdminInvitesPage() {
  const invites = await listInvites();

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div>
        <h1 className="text-2xl font-serif font-normal text-gray-800 tracking-tight">Invites</h1>
        <p className="mt-1 text-sm text-gray-500">
          CSM is currently invite-only. Create, track, and revoke invites.
        </p>
      </div>

      <section className="mt-6">
        <CreateInviteForm />
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-medium text-gray-700">All invites</h2>
        {invites.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">No invites yet. Create one above.</p>
        ) : (
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 pr-4 font-medium text-gray-700">Code</th>
                  <th className="text-left py-2 pr-4 font-medium text-gray-700">Status</th>
                  <th className="text-left py-2 pr-4 font-medium text-gray-700">Uses</th>
                  <th className="text-left py-2 pr-4 font-medium text-gray-700">Expires</th>
                  <th className="text-left py-2 pr-4 font-medium text-gray-700">Note</th>
                  <th className="text-left py-2 pr-4 font-medium text-gray-700">Created</th>
                  <th className="text-left py-2 pr-4 font-medium text-gray-700">Used</th>
                  <th className="text-left py-2 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <InvitesTableBody invites={invites} />
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
