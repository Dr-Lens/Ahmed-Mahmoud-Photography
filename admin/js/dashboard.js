import { mountAdminShell, showToast } from "./admin-shell.js";
import { api } from "../../js/api.js";
import { createEl, formatDate } from "../../js/utils.js";
import { renderLoader } from "../../components/loader.js";

async function init() {
  const shell = await mountAdminShell({ title: "Dashboard" });
  if (!shell) return;

  shell.topbarActions.append(
    createEl("a", { class: "btn btn--primary btn--sm", href: "/admin/editor.html" }, "+ New Story")
  );

  shell.content.appendChild(renderLoader());

  let weddings = [];
  try {
    weddings = await api.listWeddingsAdmin();
  } catch (err) {
    shell.content.innerHTML = "";
    shell.content.appendChild(createEl("p", { class: "field-error" }, err.message || "Failed to load."));
    return;
  }

  shell.content.innerHTML = "";
  shell.content.appendChild(buildStats(weddings));
  shell.content.appendChild(buildRecent(weddings));
}

function buildStats(weddings) {
  const totalWeddings = weddings.filter((w) => w.eventType === "wedding").length;
  const totalEngagements = weddings.filter((w) => w.eventType === "engagement").length;
  const totalPhotos = weddings.reduce(
    (sum, w) => sum + (w.sections || []).reduce((s, sec) => s + (sec.photoCount || 0), 0),
    0
  );
  const published = weddings.filter((w) => w.published).length;
  const drafts = weddings.length - published;

  const stats = [
    { label: "Total Weddings", value: totalWeddings },
    { label: "Total Engagements", value: totalEngagements },
    { label: "Total Photos", value: totalPhotos },
    { label: "Published Stories", value: published },
    { label: "Draft Stories", value: drafts },
  ];

  const grid = createEl("div", { class: "stat-grid" });
  stats.forEach((s) =>
    grid.appendChild(
      createEl("div", { class: "stat-card" }, [
        createEl("div", { class: "stat-card__value" }, String(s.value)),
        createEl("div", { class: "stat-card__label" }, s.label),
      ])
    )
  );
  return grid;
}

function buildRecent(weddings) {
  const wrap = createEl("div", {});
  wrap.appendChild(createEl("h2", { class: "type-display-s", style: "margin-bottom:16px;" }, "Recent Stories"));

  if (!weddings.length) {
    wrap.appendChild(createEl("p", {}, "No stories yet. Create your first one to get started."));
    return wrap;
  }

  const table = createEl("table", { class: "admin-table" });
  table.innerHTML = `
    <thead><tr><th>Cover</th><th>Couple</th><th>Type</th><th>Date</th><th>Status</th><th></th></tr></thead>
  `;
  const tbody = document.createElement("tbody");
  weddings
    .slice()
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
    .slice(0, 8)
    .forEach((w) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${w.coverImage ? `<img class="admin-table__thumb" src="${w.coverImage}" alt="" />` : ""}</td>
        <td>${escapeHtml(w.coupleName)}</td>
        <td>${escapeHtml(w.eventType)}</td>
        <td>${formatDate(w.date)}</td>
        <td><span class="badge badge--${w.published ? "published" : "draft"}">${w.published ? "Published" : "Draft"}</span></td>
        <td class="admin-table__actions"><a class="btn btn--sm btn--ghost" href="/admin/editor.html?id=${encodeURIComponent(w.id)}">Edit</a></td>
      `;
      tbody.appendChild(tr);
    });
  table.appendChild(tbody);
  wrap.appendChild(table);
  return wrap;
}

function escapeHtml(s = "") {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

init();
