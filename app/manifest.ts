import type { MetadataRoute } from "next";

import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/constants";

/** Web app manifest: name, colours and icons used when the shop is added to a home screen. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — DNA Macrame`,
    short_name: "Knotted",
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    // Cream from app/globals.css (manifests need literal colour values).
    background_color: "#f8f5ef",
    theme_color: "#f8f5ef",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
