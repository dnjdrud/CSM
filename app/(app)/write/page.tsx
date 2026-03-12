import { Suspense } from "react";
import { getCurrentUser } from "@/lib/data/repository";
import { getRoleUX } from "@/lib/config/roleUX";
import WritePageClient from "./_components/WritePageClient";

export const dynamic = "force-dynamic";

export default async function WritePage() {
  const currentUser = await getCurrentUser();
  const roleUX = getRoleUX(currentUser?.role);

  return (
    <Suspense>
      <WritePageClient
        recommendedCategories={roleUX.recommendedCategories}
        writeHint={roleUX.writeHint}
      />
    </Suspense>
  );
}
