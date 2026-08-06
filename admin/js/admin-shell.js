import { requireAuth, logout, currentUser, verifySessionRemote } from "../../js/auth.js";
import { qs, createEl } from "../../js/utils.js";

const NAV_ITEMS = [
  { href: "/admin/dashboard.html", label: "Dashboard" },
  { href: "/admin/weddings.html", label: "Weddings" },
  { href: "/admin/editor.html", label: "New Story" },
  { href: "/admin/settings.html", label: "Settings" },
];

/**
 * Mounts the admin sidebar shell into #admin-root, guards the route with
 * requireAuth(), and re-validates the session with the server in the
 * background (a locally-cached token is only a UX hint — Apps Script is
 * the real authority).
 */
export async function mountAdminShell({ title }) {
  if (!requireAuth()) return null;

  const root = qs("#admin-root");
  const path = location.pathname;

  root.innerHTML = `
    <div class="admin-shell">
      <aside class="admin-sidebar">
        <a href="/admin/dashboard.html" class="admin-sidebar__logo">
          <img src="/assets/brand/logo.png" alt="Ahmed Mahmoud Photography" />
        </a>
        <nav class="admin-nav">
          ${NAV_ITEMS.map(
            (item) =>
              `<a href="${item.href}" ${path === item.href ? 'aria-current="page"' : ""}>${item.label}</a>`
          ).join("")}
        </nav>
        <div class="admin-sidebar__foot">
          <div class="admin-user" id="admin-user-label"></div>
          <button class="btn btn--ghost btn--sm btn--block" id="admin-logout">Logout</button>
        </div>
      </aside>
      <main class="admin-main">
        <div class="admin-topbar">
          <h1>${title}</h1>
          <div id="admin-topbar-actions"></div>
        </div>
        <div id="admin-content"></div>
      </main>
    </div>
  `;

  const user = currentUser();
  qs("#admin-user-label").textContent = user?.email || "Signed in";
  qs("#admin-logout").addEventListener("click", async () => {
    await logout();
    location.href = "/admin/login.html";
  });

  verifySessionRemote().then((ok) => {
    if (!ok) location.replace("/admin/login.html?expired=1");
  });

  return {
    content: qs("#admin-content"),
    topbarActions: qs("#admin-topbar-actions"),
  };
}

export function showToast(message, variant = "success") {
  let stack = qs("#toast-stack");
  if (!stack) {
    stack = createEl("div", { class: "toast-stack", id: "toast-stack" });
    document.body.appendChild(stack);
  }
  const toast = createEl("div", { class: `toast toast--${variant}` }, message);
  stack.appendChild(toast);
  setTimeout(() => toast.remove(), 3600);
}
