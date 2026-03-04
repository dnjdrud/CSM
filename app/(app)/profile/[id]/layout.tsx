/**
 * Profile [id] segment layout. Ensures /profile/[id] is always dynamic and this segment is resolved.
 */
export const dynamic = "force-dynamic";

export default function ProfileIdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
