import { mountAdminShell, showToast } from "./admin-shell.js";
import { api } from "../../js/api.js";
import { createEl, formatDate, escapeHTML } from "../../js/utils.js";
import { renderLoader, renderStatePanel } from "../../components/loader.js";

let allWeddings = [];
let filter = "all";

async function init() {
  const shell = await mountAdminShell({ title: "Manage Gallery" });
  if (!shell) return;

  shell.topbarActions.append(
    createEl("a", { class: "btn btn--primary btn--sm", href: "/admin/editor.html" }, "+ New Story")
  );

  shell.content.appendChild(buildFilters());
  const tableWrap = createEl("div", { id: "table-wrap" });
  shell.content.appendChild(tableWrap);
  tableWrap.appendChild(renderLoader());

  try {
    allWeddings = await api.listWeddingsAdmin();
  } catch (err) {
    tableWrap.innerHTML = "";
    tableWrap.appendChild(createEl("p", { class: "field-error" }, err.message || "Failed to load."));
    return;
  }
  renderTable(tableWrap);
}

function buildFilters() {
  const wrap = createEl("div", { style: "display:flex; gap:8px; margin-bottom:20px;" });
  [
    ["all", "All"],
    ["wedding", "Weddings"],
    ["engagement", "Engagements"],
    ["portrait", "Portraits"],
    ["draft", "Drafts"],
  ].forEach(([value, label]) => {
    const btn = createEl(
      "button",
      {
        class: "btn btn--sm btn--ghost",
        onClick: () => {
          filter = value;
          renderTable(document.getElementById("table-wrap"));
        },
      },
      label
    );
    wrap.appendChild(btn);
  });
  return wrap;
}

function renderTable(tableWrap) {
  let list = allWeddings;
  if (filter === "draft") list = list.filter((w) => !w.published);
  else if (filter !== "all") list = list.filter((w) => w.eventType === filter);

  tableWrap.innerHTML = "";
  if (!list.length) {
    tableWrap.appendChild(renderStatePanel({ title: "No stories yet.", body: "Try a different filter, or create a new story." }));
    return;
  }

  const table = createEl("table", { class: "admin-table" });
  table.innerHTML = `<thead><tr><th>Cover</th><th>Couple</th><th>Type</th><th>Date</th><th>Status</th><th>Featured</th><th></th></tr></thead>`;
  const tbody = document.createElement("tbody");

  list.forEach((w) => {
    const tr = document.createElement("tr");
    const thumb = createEl("td", {}, w.coverImage ? imgEl(w.coverImage) : "");
    const name = createEl("td", {}, escapeHTML(w.coupleName));
    const type = createEl("td", {}, escapeHTML(w.eventType));
    const date = createEl("td", {}, formatDate(w.date));
    const status = createEl("td", {}, [
      createEl("span", { class: `badge badge--${w.published ? "published" : "draft"}` }, w.published ? "Published" : "Draft"),
    ]);
    const featured = createEl(
      "td",
      {},
      w.featured ? createEl("span", { class: "badge badge--featured" }, "Featured") : ""
    );

    const actions = createEl("td", { class: "admin-table__actions" });
    actions.append(
      createEl("a", { class: "btn btn--sm btn--ghost", href: `/admin/editor.html?id=${encodeURIComponent(w.id)}` }, "Edit"),
      createEl(
        "button",
        {
          class: "btn btn--sm btn--ghost",
          onClick: async () => {
            try {
              await api.setPublishState(w.id, !w.published);
              w.published = !w.published;
              renderTable(tableWrap);
              showToast(w.published ? "Published." : "Unpublished.");
            } catch (err) {
              showToast(err.message || "Failed to update.", "error");
            }
          },
        },
        w.published ? "Unpublish" : "Publish"
      ),
      createEl(
        "button",
        {
          class: "btn btn--sm btn--danger",
          onClick: () => confirmDelete(w, tableWrap),
        },
        "Delete"
      )
    );

    tr.append(thumb, name, type, date, status, featured, actions);
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  tableWrap.appendChild(table);
}

function imgEl(src) {
  const img = document.createElement("img");
  img.className = "admin-table__thumb";
  img.src = src;
  img.alt = "";
  img.loading = "lazy";
  return img;
}

async function confirmDelete(w, tableWrap) {
  if (!confirm(`Delete "${w.coupleName}"? This cannot be undone.`)) return;
  try {
    await api.deleteWedding(w.id);
    allWeddings = allWeddings.filter((x) => x.id !== w.id);
    renderTable(tableWrap);
    showToast("Story deleted.");
  } catch (err) {
    showToast(err.message || "Failed to delete.", "error");
  }
}

init();
