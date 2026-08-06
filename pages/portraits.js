import { renderListing } from "./listing.js";

export function render(container) {
  return renderListing(container, {
    eventType: "portrait",
    eyebrow: "Editorial Sittings",
    title: "Portraits",
    emptyBody: "Portrait sessions will appear here as they're published.",
  });
}
