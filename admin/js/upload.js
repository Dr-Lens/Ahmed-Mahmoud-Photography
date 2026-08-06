import { mountAdminShell, showToast } from "./admin-shell.js";
import { api } from "../../js/api.js";
import { createEl, generateId, validateImageFile, readImageDimensions, fileToBase64 } from "../../js/utils.js";

const params = new URLSearchParams(location.search);
const weddingId = params.get("weddingId");
const sectionId = params.get("sectionId");

let existingPhotos = [];
const queue = new Map(); // localId -> { file, status, progressEl, itemEl }

async function init() {
  const shell = await mountAdminShell({ title: "Upload Photos" });
  if (!shell) return;

  if (!weddingId || !sectionId) {
    shell.content.appendChild(createEl("p", { class: "field-error" }, "Missing wedding or section reference. Go back to the story editor."));
    return;
  }

  shell.content.appendChild(buildDropzone());
  const queueGrid = createEl("div", { class: "upload-grid", id: "queue-grid" });
  shell.content.appendChild(queueGrid);

  shell.content.appendChild(createEl("h2", { class: "type-display-s", style: "margin:40px 0 16px;" }, "Existing Photos"));
  const existingGrid = createEl("div", { class: "upload-grid", id: "existing-grid" });
  shell.content.appendChild(existingGrid);

  await loadExisting(existingGrid);
}

function buildDropzone() {
  const zone = createEl("div", { class: "dropzone", id: "dropzone" }, [
    createEl("p", { class: "lead" }, "Drag & drop photos here"),
    createEl("p", { class: "field-hint" }, "or click to browse \u2014 JPEG, PNG, or WebP, up to 12MB each"),
    createEl("input", { type: "file", id: "file-input", accept: "image/jpeg,image/png,image/webp", multiple: "" }),
  ]);

  zone.addEventListener("click", () => zone.querySelector("input").click());
  zone.querySelector("input").addEventListener("change", (e) => handleFiles(e.target.files));

  ["dragenter", "dragover"].forEach((evt) =>
    zone.addEventListener(evt, (e) => {
      e.preventDefault();
      zone.classList.add("is-dragover");
    })
  );
  ["dragleave", "drop"].forEach((evt) =>
    zone.addEventListener(evt, (e) => {
      e.preventDefault();
      zone.classList.remove("is-dragover");
    })
  );
  zone.addEventListener("drop", (e) => handleFiles(e.dataTransfer.files));

  return zone;
}

async function handleFiles(fileList) {
  const grid = document.getElementById("queue-grid");
  for (const file of Array.from(fileList)) {
    const localId = generateId("upload");
    const validation = validateImageFile(file);

    const item = createEl("div", { class: "upload-item", dataset: { id: localId } });
    const img = document.createElement("img");
    img.src = URL.createObjectURL(file);
    item.appendChild(img);

    const status = createEl("div", { class: "upload-item__status" });
    item.appendChild(status);

    const removeBtn = createEl(
      "button",
      { class: "upload-item__remove", "aria-label": "Remove", onClick: () => item.remove() },
      "\u2715"
    );
    item.appendChild(removeBtn);
    grid.appendChild(item);

    if (!validation.valid) {
      status.textContent = validation.reason;
      status.style.background = "rgba(182,97,79,0.75)";
      continue;
    }

    try {
      const dims = await readImageDimensions(file);
      if (dims.width < 400 || dims.height < 400) {
        status.textContent = "Image resolution is too low.";
        status.style.background = "rgba(182,97,79,0.75)";
        continue;
      }
    } catch {
      /* dimension check best-effort only */
    }

    queue.set(localId, { file, item, status });
    uploadOne(localId);
  }
}

async function uploadOne(localId) {
  const entry = queue.get(localId);
  if (!entry) return;
  const { file, item, status } = entry;

  const bar = createEl("div", { class: "progress-bar" }, [createEl("div", { class: "progress-bar__fill" })]);
  status.innerHTML = "";
  status.append("Uploading\u2026", bar);
  const fill = bar.querySelector(".progress-bar__fill");
  const fakeProgress = simulateProgress(fill);

  try {
    const base64 = await fileToBase64(file);
    const photo = await api.uploadPhoto(base64, {
      weddingId,
      sectionId,
      caption: "",
      order: existingPhotos.length + Array.from(queue.values()).indexOf(entry),
    });
    clearInterval(fakeProgress);
    fill.style.width = "100%";
    status.textContent = "Uploaded";
    status.style.background = "rgba(122,155,118,0.75)";
    existingPhotos.push(photo);
    setTimeout(() => {
      item.remove();
      renderExisting();
    }, 700);
  } catch (err) {
    clearInterval(fakeProgress);
    status.innerHTML = "";
    status.append(err.message || "Upload failed", createEl("button", { class: "btn btn--sm btn--ghost", onClick: () => uploadOne(localId) }, "Retry"));
    status.style.background = "rgba(182,97,79,0.75)";
  }
}

function simulateProgress(fillEl) {
  // ImgBB/Apps Script don't expose granular upload progress through fetch();
  // this gives the admin a sense of motion while the request is in flight.
  let pct = 0;
  return setInterval(() => {
    pct = Math.min(pct + Math.random() * 18, 92);
    fillEl.style.width = `${pct}%`;
  }, 260);
}

async function loadExisting(grid) {
  grid.innerHTML = "";
  grid.appendChild(createEl("p", { class: "field-hint" }, "Loading\u2026"));
  try {
    const wedding = await api.getWeddingAdmin(weddingId);
    const section = (wedding.sections || []).find((s) => s.id === sectionId);
    existingPhotos = (section && section.photos) || [];
    renderExisting();
  } catch (err) {
    grid.innerHTML = "";
    grid.appendChild(createEl("p", { class: "field-error" }, err.message || "Failed to load existing photos."));
  }
}

function renderExisting() {
  const grid = document.getElementById("existing-grid");
  grid.innerHTML = "";
  if (!existingPhotos.length) {
    grid.appendChild(createEl("p", { class: "field-hint" }, "No photos in this section yet."));
    return;
  }

  existingPhotos
    .slice()
    .sort((a, b) => a.order - b.order)
    .forEach((photo) => {
      const item = createEl("div", { class: "upload-item", draggable: "true", dataset: { id: photo.id } });
      const img = document.createElement("img");
      img.src = photo.thumbnailUrl || photo.imageUrl;
      img.alt = photo.caption || "";
      item.appendChild(img);

      const status = createEl("div", { class: "upload-item__status", style: "opacity:0; transition:opacity 150ms;" }, [
        createEl("button", { class: "btn btn--sm btn--ghost", onClick: () => setCover(photo) }, "Set Cover"),
        createEl("button", { class: "btn btn--sm btn--danger", onClick: () => removePhoto(photo, item) }, "Delete"),
      ]);
      item.appendChild(status);
      item.addEventListener("mouseenter", () => (status.style.opacity = "1"));
      item.addEventListener("mouseleave", () => (status.style.opacity = "0"));

      addPhotoDragHandlers(item, grid);
      grid.appendChild(item);
    });
}

function addPhotoDragHandlers(item, grid) {
  item.addEventListener("dragstart", () => item.classList.add("dragging"));
  item.addEventListener("dragend", async () => {
    item.classList.remove("dragging");
    const orderedIds = Array.from(grid.children).map((el) => el.dataset.id);
    try {
      await api.reorderPhotos(sectionId, orderedIds);
      existingPhotos.forEach((p) => (p.order = orderedIds.indexOf(p.id)));
    } catch (err) {
      showToast(err.message || "Failed to save order.", "error");
    }
  });
  grid.addEventListener("dragover", (e) => {
    e.preventDefault();
    const dragging = grid.querySelector(".dragging");
    if (!dragging || dragging === item) return;
    const after = getDragAfterElement(grid, e.clientX, e.clientY);
    if (after == null) grid.appendChild(dragging);
    else grid.insertBefore(dragging, after);
  });
}

function getDragAfterElement(container, x, y) {
  const els = [...container.querySelectorAll(".upload-item:not(.dragging)")];
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

async function setCover(photo) {
  try {
    await api.setCoverImage(weddingId, photo.imageUrl);
    showToast("Cover image updated.");
  } catch (err) {
    showToast(err.message || "Failed to set cover.", "error");
  }
}

async function removePhoto(photo, item) {
  if (!confirm("Delete this photo? This cannot be undone.")) return;
  try {
    await api.deletePhoto(photo.id);
    existingPhotos = existingPhotos.filter((p) => p.id !== photo.id);
    item.remove();
    showToast("Photo deleted.");
  } catch (err) {
    showToast(err.message || "Failed to delete.", "error");
  }
}

init();
