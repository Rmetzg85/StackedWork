import type { MetadataRoute } from "next";
import { SITEMAP_PATHS, absoluteUrl } from "./lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return SITEMAP_PATHS.map((path) => ({
    url: absoluteUrl(path),
    changeFrequency: path === "/" || path === "/faq" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : path === "/login" || path === "/privacy" || path === "/terms" ? 0.3 : 0.8,
  }));
}
