import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cellah",
    short_name: "Cellah",
    description: "A minimal space for contemplation and connection.",
    start_url: "/home",
    display: "standalone",
    background_color: "#FAFAFA",
    theme_color: "#D4A84B",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
