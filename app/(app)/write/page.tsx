import { Suspense } from "react";
import WritePageClient from "./_components/WritePageClient";

export default function WritePage() {
  return (
    <Suspense>
      <WritePageClient />
    </Suspense>
  );
}
