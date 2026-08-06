import { renderListing } from "./listing.js";

export function render(container) {
  return renderListing(container, {
    eventType: "wedding",
    eyebrow: "Full Wedding Stories",
    title: "Weddings",
    emptyBody: "Ahmed's wedding stories will appear here as they're published.",
  });
}
