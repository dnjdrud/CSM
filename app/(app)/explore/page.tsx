import { redirect } from "next/navigation";

// /explore is no longer a primary surface.
// Canonical content discovery is at /contents and /search.
export default function ExplorePage() {
  redirect("/contents");
}
