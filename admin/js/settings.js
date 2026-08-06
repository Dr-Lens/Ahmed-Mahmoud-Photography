import { mountAdminShell, showToast } from "./admin-shell.js";
import { deriveHash, currentUser } from "../../js/auth.js";
import { api } from "../../js/api.js";
import { createEl } from "../../js/utils.js";
import { CONFIG } from "../../js/config.js";

async function init() {
  const shell = await mountAdminShell({ title: "Settings" });
  if (!shell) return;

  shell.content.appendChild(buildAccountPanel());
  shell.content.appendChild(buildBrandPanel());
}

function buildAccountPanel() {
  const user = currentUser();
  const wrap = createEl("div", { style: "max-width:480px; margin-bottom:48px;" });
  wrap.innerHTML = `
    <h2 class="type-display-s" style="margin-bottom:16px;">Account</h2>
    <p class="field-hint" style="margin-bottom:20px;">Signed in as ${user?.email || "\u2014"}</p>
    <div class="field">
      <label for="current-password">Current Password</label>
      <input type="password" id="current-password" autocomplete="current-password" />
    </div>
    <div class="field">
      <label for="new-password">New Password</label>
      <input type="password" id="new-password" autocomplete="new-password" />
      <span class="field-hint">At least 10 characters. Hashed client-side with PBKDF2 before it ever reaches the server \u2014 the plain password is never stored.</span>
    </div>
    <div id="password-error" class="field-error" style="display:none; margin-bottom:16px;"></div>
    <button class="btn btn--primary" id="change-password-btn">Update Password</button>
  `;

  wrap.querySelector("#change-password-btn").addEventListener("click", async () => {
    const errorEl = wrap.querySelector("#password-error");
    errorEl.style.display = "none";
    const current = wrap.querySelector("#current-password").value;
    const next = wrap.querySelector("#new-password").value;

    if (next.length < 10) {
      errorEl.textContent = "New password must be at least 10 characters.";
      errorEl.style.display = "block";
      return;
    }

    try {
      const { hash, salt } = await deriveHash(next);
      await api.changePassword(current, hash, salt);
      showToast("Password updated.");
      wrap.querySelector("#current-password").value = "";
      wrap.querySelector("#new-password").value = "";
    } catch (err) {
      errorEl.textContent = err.message || "Failed to update password.";
      errorEl.style.display = "block";
    }
  });

  return wrap;
}

function buildBrandPanel() {
  const wrap = createEl("div", { style: "max-width:480px;" });
  wrap.innerHTML = `
    <h2 class="type-display-s" style="margin-bottom:16px;">Brand</h2>
    <p class="field-hint" style="margin-bottom:12px;">
      The brand name, logo, and phone number are fixed in the site configuration
      (<code>js/config.js</code>) and cannot be changed from this panel.
      To update them, edit the source and redeploy.
    </p>
    <div class="field"><label>Brand</label><input value="${CONFIG.BRAND.fullName}" disabled /></div>
    <div class="field"><label>Phone</label><input value="${CONFIG.BRAND.phoneLocal}" disabled /></div>
    <div class="field"><label>WhatsApp</label><input value="${CONFIG.BRAND.whatsappHref}" disabled /></div>
  `;
  return wrap;
}

init();
