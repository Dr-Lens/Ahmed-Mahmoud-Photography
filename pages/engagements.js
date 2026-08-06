import { renderListing } from "./listing.js";

export function render(container) {
  return renderListing(container, {
    eventType: "engagement",
    eyebrow: "Pre-Wedding Sessions",
    title: "Engagements",
    emptyBody: "Engagement sessions will appear here as they're published.",
  });
}
