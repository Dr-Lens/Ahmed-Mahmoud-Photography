import { mountAdminShell, showToast } from "./admin-shell.js";
import { api } from "../../js/api.js";
import { createEl, slugify, generateId, escapeHTML } from "../../js/utils.js";
import { renderLoader } from "../../components/loader.js";

const params = new URLSearchParams(location.search);
const weddingId = params.get("id");
let wedding = null; // existing wedding being edited, or null for "new"
let slugTouched = false;

async function init() {
  const shell = await mountAdminShell({ title: weddingId ? "Edit Story" : "New Story" });
  if (!shell) return;

  if (weddingId) {
    shell.content.appendChild(renderLoader());
    try {
      wedding = await api.getWeddingAdmin(weddingId);
    } catch (err) {
      shell.content.innerHTML = "";
      shell.content.appendChild(createEl("p", { class: "field-error" }, err.message || "Failed to load story."));
      return;
    }
    shell.content.innerHTML = "";
  }

  if (wedding) {
    shell.topbarActions.append(
      createEl(
        "a",
        { class: "btn btn--ghost btn--sm", href: `/admin/preview.html?id=${encodeURIComponent(wedding.id)}`, target: "_blank" },
        "Preview"
      )
    );
  }

  shell.content.appendChild(buildDetailsForm(shell));

  if (wedding) {
    shell.content.appendChild(buildSectionsPanel(shell));
  } else {
    shell.content.appendChild(
      createEl("p", { class: "field-hint" }, "Save the story details first, then add sections and photos.")
    );
  }
}

/* ---------------- Details form ---------------- */

function buildDetailsForm(shell) {
  const wrap = createEl("div", { style: "max-width:640px; margin-bottom:40px;" });
  const w = wedding || {};

  wrap.innerHTML = `
    <div class="field">
      <label for="coupleName">Couple Name</label>
      <input id="coupleName" value="${escapeHTML(w.coupleName || "")}" placeholder="Ahmed & Sara" />
    </div>
    <div class="field">
      <label for="eventType">Event Type</label>
      <select id="eventType">
        <option value="wedding" ${w.eventType === "wedding" || !w.eventType ? "selected" : ""}>Wedding</option>
        <option value="engagement" ${w.eventType === "engagement" ? "selected" : ""}>Engagement</option>
        <option value="portrait" ${w.eventType === "portrait" ? "selected" : ""}>Portrait</option>
      </select>
    </div>
    <div class="field">
      <label for="slug">URL Slug</label>
      <input id="slug" value="${escapeHTML(w.slug || "")}" placeholder="ahmed-and-sara" />
      <span class="field-hint">Used in the story URL, e.g. /weddings/ahmed-and-sara</span>
    </div>
    <div class="field">
      <label for="date">Date</label>
      <input id="date" type="date" value="${escapeHTML(w.date ? w.date.slice(0, 10) : "")}" />
    </div>
    <div class="field">
      <label for="location">Location</label>
      <input id="location" value="${escapeHTML(w.location || "")}" placeholder="Cairo, Egypt" />
    </div>
    <div class="field">
      <label for="description">Description</label>
      <textarea id="description" placeholder="A short editorial description of the story.">${escapeHTML(w.description || "")}</textarea>
    </div>
    <div class="field">
      <label for="coverImage">Cover Image URL</label>
      <input id="coverImage" value="${escapeHTML(w.coverImage || "")}" placeholder="https://i.ibb.co/..." />
      <span class="field-hint">Set automatically when you mark a photo as cover from Manage Photos, or paste one directly.</span>
    </div>
    <div class="field" style="flex-direction:row; align-items:center; gap:10px;">
      <input type="checkbox" id="featured" style="width:auto;" ${w.featured ? "checked" : ""} />
      <label for="featured" style="text-transform:none; letter-spacing:0; font-size: var(--fs-body-s);">Mark as featured on the homepage</label>
    </div>
    <div id="editor-error" class="field-error" style="display:none; margin-bottom:16px;"></div>
    <div style="display:flex; gap:10px; flex-wrap:wrap;">
      <button class="btn btn--ghost" id="save-draft">Save Draft</button>
      <button class="btn btn--primary" id="save-publish">${w.published ? "Save & Keep Published" : "Save & Publish"}</button>
      ${w.published ? '<button class="btn btn--ghost" id="unpublish">Unpublish</button>' : ""}
    </div>
  `;

  const coupleInput = wrap.querySelector("#coupleName");
  const slugInput = wrap.querySelector("#slug");
  slugInput.addEventListener("input", () => (slugTouched = true));
  coupleInput.addEventListener("input", () => {
    if (!slugTouched) slugInput.value = slugify(coupleInput.value);
  });

  wrap.querySelector("#save-draft").addEventListener("click", () => submit(wrap, false));
  wrap.querySelector("#save-publish").addEventListener("click", () => submit(wrap, true));
  const unpublishBtn = wrap.querySelector("#unpublish");
  if (unpublishBtn) {
    unpublishBtn.addEventListener("click", async () => {
      try {
        await api.setPublishState(wedding.id, false);
        wedding.published = false;
        showToast("Story unpublished.");
        init2(shell);
      } catch (err) {
        showToast(err.message || "Failed to unpublish.", "error");
      }
    });
  }

  return wrap;
}

function collectFormData(wrap) {
  return {
    coupleName: wrap.querySelector("#coupleName").value.trim(),
    eventType: wrap.querySelector("#eventType").value,
    slug: slugify(wrap.querySelector("#slug").value.trim()),
    date: wrap.querySelector("#date").value,
    location: wrap.querySelector("#location").value.trim(),
    description: wrap.querySelector("#description").value.trim(),
    coverImage: wrap.querySelector("#coverImage").value.trim(),
    featured: wrap.querySelector("#featured").checked,
  };
}

async function submit(wrap, publish) {
  const errorEl = wrap.querySelector("#editor-error");
  errorEl.style.display = "none";
  const data = collectFormData(wrap);

  if (!data.coupleName || !data.slug || !data.date) {
    errorEl.textContent = "Couple name, slug, and date are required.";
    errorEl.style.display = "block";
    return;
  }

  data.published = publish;

  try {
    if (wedding) {
      await api.updateWedding(wedding.id, data);
      Object.assign(wedding, data);
      showToast("Story saved.");
    } else {
      const created = await api.createWedding(data);
      showToast("Story created. Now add sections and photos.");
      location.href = `/admin/editor.html?id=${encodeURIComponent(created.id)}`;
    }
  } catch (err) {
    errorEl.textContent = err.message || "Failed to save. Please try again.";
    errorEl.style.display = "block";
  }
}

async function init2(shell) {
  // lightweight re-render after unpublish, without a full page reload
  shell.content.innerHTML = "";
  shell.content.appendChild(buildDetailsForm(shell));
  shell.content.appendChild(buildSectionsPanel(shell));
}

/* ---------------- Sections panel ---------------- */

function buildSectionsPanel(shell) {
  const wrap = createEl("div", {});
  wrap.appendChild(createEl("h2", { class: "type-display-s", style: "margin-bottom:16px;" }, "Sections"));

  const list = createEl("div", { id: "sections-list" });
  wrap.appendChild(list);
  renderSectionsList(list, shell);

  const addForm = createEl("div", { style: "margin-top:16px; max-width:480px;" });
  addForm.innerHTML = `
    <div class="field">
      <label for="new-section-title">New Section Title</label>
      <input id="new-section-title" placeholder="Preparation, Ceremony, Reception\u2026" />
    </div>
    <button class="btn btn--ghost btn--sm" id="add-section-btn">+ Add Section</button>
  `;
  addForm.querySelector("#add-section-btn").addEventListener("click", async () => {
    const input = addForm.querySelector("#new-section-title");
    const title = input.value.trim();
    if (!title) return;
    try {
      const section = await api.createSection(wedding.id, { title, order: (wedding.sections || []).length });
      wedding.sections = wedding.sections || [];
      wedding.sections.push({ ...section, photos: [] });
      input.value = "";
      renderSectionsList(list, shell);
      showToast("Section added.");
    } catch (err) {
      showToast(err.message || "Failed to add section.", "error");
    }
  });
  wrap.appendChild(addForm);

  return wrap;
}

function renderSectionsList(list, shell) {
  list.innerHTML = "";
  const sections = (wedding.sections || []).slice().sort((a, b) => a.order - b.order);

  if (!sections.length) {
    list.appendChild(createEl("p", { class: "field-hint" }, "No sections yet. Add one below."));
    return;
  }

  sections.forEach((section) => {
    const item = createEl("div", { class: "section-editor", draggable: "true", dataset: { id: section.id } });
    item.innerHTML = `
      <div class="section-editor__head">
        <span class="section-editor__handle" aria-hidden="true">\u2630</span>
        <span class="section-editor__title">${escapeHTML(section.title)}</span>
        <span class="type-label">${(section.photos || []).length} photos</span>
      </div>
      <div class="section-editor__body" style="display:flex; gap:8px; flex-wrap:wrap;">
        <a class="btn btn--sm btn--ghost" href="/admin/upload.html?weddingId=${encodeURIComponent(wedding.id)}&sectionId=${encodeURIComponent(section.id)}">Manage Photos</a>
        <button class="btn btn--sm btn--ghost" data-action="rename">Rename</button>
        <button class="btn btn--sm btn--danger" data-action="delete">Delete</button>
      </div>
    `;

    item.querySelector('[data-action="rename"]').addEventListener("click", async () => {
      const title = prompt("Section title", section.title);
      if (!title || title === section.title) return;
      try {
        await api.updateSection(section.id, { title });
        section.title = title;
        renderSectionsList(list, shell);
      } catch (err) {
        showToast(err.message || "Failed to rename.", "error");
      }
    });

    item.querySelector('[data-action="delete"]').addEventListener("click", async () => {
      if (!confirm(`Delete section "${section.title}" and all its photos?`)) return;
      try {
        await api.deleteSection(section.id);
        wedding.sections = wedding.sections.filter((s) => s.id !== section.id);
        renderSectionsList(list, shell);
        showToast("Section deleted.");
      } catch (err) {
        showToast(err.message || "Failed to delete.", "error");
      }
    });

    addDragHandlers(item, list, sections, shell);
    list.appendChild(item);
  });
}

function addDragHandlers(item, list, sections, shell) {
  item.addEventListener("dragstart", () => item.classList.add("dragging"));
  item.addEventListener("dragend", async () => {
    item.classList.remove("dragging");
    const orderedIds = Array.from(list.children).map((el) => el.dataset.id);
    wedding.sections.forEach((s) => (s.order = orderedIds.indexOf(s.id)));
    try {
      await api.reorderSections(wedding.id, orderedIds);
    } catch (err) {
      showToast(err.message || "Failed to save order.", "error");
    }
  });
  list.addEventListener("dragover", (e) => {
    e.preventDefault();
    const dragging = list.querySelector(".dragging");
    if (!dragging || dragging === item) return;
    const after = getDragAfterElement(list, e.clientY);
    if (after == null) list.appendChild(dragging);
    else list.insertBefore(dragging, after);
  });
}

function getDragAfterElement(container, y) {
  const els = [...container.querySelectorAll(".section-editor:not(.dragging)")];
  return els.reduce(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) return { offset, element: child };
      return closest;
    },
    { offset: Number.NEGATIVE_INFINITY }
  ).element;
}

init();
