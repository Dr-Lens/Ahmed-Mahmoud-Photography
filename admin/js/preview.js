import "../../components/navbar.js";
import "../../components/footer.js";
import "../../components/lightbox.js";
import { requireAuth } from "../../js/auth.js";
import { api } from "../../js/api.js";
import { renderWeddingContent } from "../../pages/wedding.js";
import { renderLoader, renderStatePanel } from "../../components/loader.js";

async function init() {
  if (!requireAuth()) return;

  const id = new URLSearchParams(location.search).get("id");
  const app = document.getElementById("app");
  const publishBtn = document.getElementById("publish-btn");
  const backLink = document.getElementById("back-to-editor");

  if (!id) {
    app.appendChild(renderStatePanel({ title: "No story selected.", actionLabel: "Back to Editor", actionHref: "/admin/weddings.html" }));
    return;
  }

  backLink.href = `/admin/editor.html?id=${encodeURIComponent(id)}`;
  app.appendChild(renderLoader());

  let wedding;
  try {
    wedding = await api.getWeddingAdmin(id);
  } catch (err) {
    app.innerHTML = "";
    app.appendChild(renderStatePanel({ title: "Could not load story.", body: err.message }));
    return;
  }

  app.innerHTML = "";
  renderWeddingContent(app, wedding);

  publishBtn.textContent = wedding.published ? "Unpublish" : "Publish";
  publishBtn.addEventListener("click", async () => {
    try {
      await api.setPublishState(wedding.id, !wedding.published);
      wedding.published = !wedding.published;
      publishBtn.textContent = wedding.published ? "Unpublish" : "Publish";
    } catch (err) {
      alert(err.message || "Failed to update publish state.");
    }
  });
}

init();
