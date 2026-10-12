const app = document.querySelector("#app"),
  dialog = document.querySelector("#editor"),
  panel = document.querySelector("#editor-content");
let state,
  section =
    new URLSearchParams(location.search).get("collection") || "overview",
  query = "",
  page = 0,
  register = false,
  selected = new Set(),
  busy = false;
const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const label = (value) =>
  value
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .replace(/^./, (c) => c.toUpperCase());
const pretty = (value) =>
  typeof value === "object"
    ? JSON.stringify(value, null, 2)
    : String(value ?? "—");
const money = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
let noticeTimer;
function notify(text) {
  const el = document.querySelector("#notice");
  el.textContent = text;
  el.style.display = "block";
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => (el.style.display = "none"), 5000);
}
async function api(route, data, method = data ? "POST" : "GET") {
  const response = await fetch("/api/app/" + route, {
    method,
    credentials: "same-origin",
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
  });
  const value = await response.json();
  if (!response.ok) throw new Error(value.error || "Request failed");
  return value;
}
async function load() {
  try {
    state = await api("state");
    document.documentElement.style.setProperty("--accent", state.config.accent);
    document.title = state.config.name + " · Workspace";
    render();
  } catch (error) {
    if (error.message === "Sign in to continue.") auth();
    else
      app.innerHTML = `<div class="auth"><div class="auth-inner"><h1>Workspace unavailable</h1><p>${esc(error.message)}</p><a class="btn" href="/">Return to website</a><button class="btn" id="retry">Retry</button></div></div>`;
    document.querySelector("#retry")?.addEventListener("click", load);
  }
}
function auth() {
  app.removeAttribute("aria-busy");
  app.innerHTML = `<main class="auth"><div class="auth-inner"><a class="eyebrow" href="/">← Return to website</a><h1>Your workspace.</h1><p>Content, operations and publishing in one place.</p><form id="auth"><div class="auth-tabs"><button class="btn ${!register ? "primary" : ""}" type="button" data-auth="login">Sign in</button><button class="btn ${register ? "primary" : ""}" type="button" data-auth="register">Create account</button></div>${register ? '<label class="field"><span>Your name</span><input name="name" required maxlength="120" autocomplete="name"></label>' : ""}<label class="field"><span>Email address</span><input name="email" type="email" required autocomplete="username" maxlength="180"></label><label class="field"><span>Password${register ? " · 12 characters minimum" : ""}</span><input name="password" type="password" required minlength="${register ? 12 : 1}" maxlength="200" autocomplete="${register ? "new-password" : "current-password"}"></label><p id="auth-error" class="error" role="alert"></p><button class="btn primary" type="submit">${register ? "Create account" : "Open workspace"} →</button><p class="help">${register ? "Accounts start with member access. The owner grants staff permissions." : "Your session uses a secure, HTTP-only cookie."}</p></form></div></main>`;
  document.querySelectorAll("[data-auth]").forEach(
    (button) =>
      (button.onclick = () => {
        register = button.dataset.auth === "register";
        auth();
      }),
  );
  document.querySelector("#auth").onsubmit = async (event) => {
    event.preventDefault();
    const form = event.target,
      button = form.querySelector("[type=submit]");
    button.disabled = true;
    try {
      const values = Object.fromEntries(new FormData(form));
      if (register) {
        await api("register", values);
        await api("login", values);
      } else await api("login", values);
      await load();
    } catch (error) {
      document.querySelector("#auth-error").textContent = error.message;
    } finally {
      button.disabled = false;
    }
  };
}
function collectionRows(key) {
  return state.collections[key] || [];
}
function changes() {
  return Object.entries(state.collections).flatMap(([kind, rows]) =>
    state.config.collections[kind]?.cms
      ? rows.filter((r) => r._changed).map((r) => ({ kind, ...r }))
      : [],
  );
}
function navigation() {
  return `<button class="nav-item ${section === "overview" ? "active" : ""}" data-section="overview">Overview <span>↗</span></button>${Object.entries(
    state.config.collections,
  )
    .map(
      ([key, def]) =>
        `<button class="nav-item ${section === key ? "active" : ""}" data-section="${esc(key)}">${esc(def.label)} <span class="count">${collectionRows(key).length}</span></button>`,
    )
    .join(
      "",
    )}${state.user.role === "owner" ? `<button class="nav-item ${section === "review" ? "active" : ""}" data-section="review">Review & publish <span class="count">${changes().length}</span></button><button class="nav-item ${section === "access" ? "active" : ""}" data-section="access">Access management</button>` : ""}${state.config.id === "nucleus" ? `<button class="nav-item ${section === "search" ? "active" : ""}" data-section="search">Search my knowledge</button>` : ""}`;
}
function render() {
  app.removeAttribute("aria-busy");
  if (
    !state.config.collections[section] &&
    !["overview", "review", "access", "search"].includes(section)
  )
    section = "overview";
  app.innerHTML = `<div class="shell"><aside class="sidebar"><a class="brand" href="/">${esc(state.config.name)}<small>Operations workspace</small></a><button class="btn mobile-menu" aria-expanded="false" aria-label="Toggle workspace navigation">☰</button><nav aria-label="Workspace">${navigation()}</nav><div class="actions"><a class="btn small" href="/">View website ↗</a></div></aside><main class="main" id="content"><header class="topbar"><div><strong>${esc(state.user.name)}</strong><br><small>${esc(label(state.user.role))} · ${esc(state.user.email)}</small></div><div class="actions"><button class="btn small" id="refresh">Refresh ↻</button>${state.user.role === "owner" ? '<a class="btn small" href="/api/app/backup" download>Content backup ↓</a>' : ""}<button class="btn small" id="logout">Sign out</button></div></header><div class="screen">${section === "overview" ? overview() : section === "review" ? review() : section === "access" ? access() : section === "search" ? searchView() : collectionView()}</div></main></div>`;
  document.querySelectorAll("[data-section]").forEach(
    (button) =>
      (button.onclick = () => {
        section = button.dataset.section;
        query = "";
        page = 0;
        selected.clear();
        render();
      }),
  );
  document.querySelector(".mobile-menu").onclick = (event) => {
    const sidebar = document.querySelector(".sidebar"),
      open = sidebar.classList.toggle("open");
    event.currentTarget.setAttribute("aria-expanded", String(open));
  };
  document.querySelector("#logout").onclick = () =>
    run(async () => {
      await api("logout", {});
      state = null;
      auth();
    });
  document.querySelector("#refresh").onclick = () => run(load);
  bindActions();
}
function overview() {
  const cms = changes().length,
    keys = Object.keys(state.config.collections),
    count = keys.reduce((n, k) => n + collectionRows(k).length, 0);
  const invoices = collectionRows("invoices"),
    deals = collectionRows("deals");
  return `<p class="eyebrow">${esc(state.config.name)} / Control centre</p><h1>Everything in view.</h1><p>Review your records, manage incoming requests and publish content when it is ready.</p><div class="sample">${esc(state.config.notice)}</div><div class="cards"><div class="card"><p class="eyebrow">Managed records</p><div class="value">${count}</div><p>Saved across ${keys.length} collections</p></div><div class="card"><p class="eyebrow">Waiting for review</p><div class="value">${cms}</div><p>CMS changes awaiting publication</p></div><div class="card"><p class="eyebrow">Incoming requests</p><div class="value">${["inquiries", "tours", "subscribers", "briefs"].reduce((n, k) => n + collectionRows(k).filter((x) => ["new", "requested"].includes(x.status)).length, 0)}</div><p>Ready for a follow-up</p></div>${invoices.length ? `<div class="card"><p class="eyebrow">Outstanding invoices</p><div class="value">${money(invoices.filter((x) => !["paid", "void"].includes(x.status)).reduce((sum, x) => sum + x.lines.reduce((n, line) => n + line.quantity * line.unitPrice, 0) * (1 + x.taxRate / 100), 0))}</div><p>Calculated from saved invoice lines</p></div>` : ""}${deals.length ? `<div class="card"><p class="eyebrow">Weighted open pipeline</p><div class="value">${money(deals.filter((x) => !["won", "lost"].includes(x.stage)).reduce((sum, x) => sum + (x.amount * x.probability) / 100, 0))}</div><p>Amount × probability for open deals</p></div>` : ""}</div><div class="split"><section class="card"><h2>Workspace collections</h2>${keys.map((k) => `<div class="activity"><button class="btn small" data-go="${esc(k)}">${esc(state.config.collections[k].label)} →</button><span class="badge">${collectionRows(k).length} records</span></div>`).join("")}</section><section class="card"><h2>Recent activity</h2>${
    state.audit
      .slice(0, 8)
      .map(
        (x) =>
          `<div class="activity"><time>${esc(new Date(x.at).toLocaleString())}</time><strong>${esc(x.action)}</strong><small>${esc(x.actor)} · ${esc(x.target)}</small></div>`,
      )
      .join("") || "<p>Your account has no recent activity.</p>"
  }</section></div>`;
}
function columns() {
  const def = state.config.collections[section];
  return Object.keys(def.fields)
    .filter(
      (k) =>
        !["id", "ownerId", "text", "description", "message", "brief"].includes(
          k,
        ) && !["array", "object"].includes(def.fields[k].type),
    )
    .slice(0, 5);
}
function collectionView() {
  const def = state.config.collections[section],
    writable =
      state.user.role !== "auditor" &&
      (state.user.role !== "member" || def.member),
    cols = columns();
  const all = collectionRows(section).filter((r) =>
      JSON.stringify(r).toLowerCase().includes(query.toLowerCase()),
    ),
    rows = all.slice(page * 12, page * 12 + 12);
  return `<div class="heading"><div><p class="eyebrow">Workspace / ${esc(def.label)}</p><h1>${esc(def.label)}</h1><p>${esc(def.description || "Manage records and review changes in detail.")}</p></div><div class="actions"><a class="btn" href="/api/app/export/${esc(section)}" download>Export CSV ↓</a>${writable ? '<button class="btn primary" id="add">Add record +</button>' : ""}</div></div><div class="toolbar"><input id="filter" type="search" value="${esc(query)}" placeholder="Search ${esc(def.label.toLowerCase())}" aria-label="Search records"><span class="badge">${all.length} ${all.length === 1 ? "record" : "records"}</span></div>${rows.length ? `<div class="table-wrap"><table><thead><tr>${cols.map((k) => `<th>${esc(label(k))}</th>`).join("")}${def.cms ? "<th>Publication</th>" : ""}<th>Actions</th></tr></thead><tbody>${rows.map((r) => `<tr>${cols.map((k) => `<td>${def.fields[k].type === "url" && /image/i.test(k) ? `<img class="thumb" src="${esc(r[k])}" alt="${esc(r.title || r.name || "Record image")}">` : esc(pretty(r[k]).slice(0, 120))}</td>`).join("")}${def.cms ? `<td><span class="badge">${r._changed ? "Unpublished changes" : r._published ? "Published" : "Draft"}</span></td>` : ""}<td><div class="actions"><button class="btn small" data-edit="${esc(r._id)}">${writable ? "Edit" : "View"}</button>${def.cms ? `<button class="btn small" data-review="${esc(r._id)}">Review</button>` : ""}${section === "approvals" && r.status === "pending" && writable ? `<button class="btn small" data-command="${esc(r._id)}" data-status="approved">Approve</button><button class="btn small danger" data-command="${esc(r._id)}" data-status="rejected">Reject</button>` : ""}${["invoices", "bills"].includes(section) && !["paid", "void"].includes(r.status) && writable ? `<button class="btn small" data-command="${esc(r._id)}" data-status="paid">Record payment</button>` : ""}</div></td></tr>`).join("")}</tbody></table></div><div class="pagination"><button class="btn small" id="prev" ${page === 0 ? "disabled" : ""}>← Previous</button><span>${page + 1} / ${Math.max(1, Math.ceil(all.length / 12))}</span><button class="btn small" id="next" ${(page + 1) * 12 >= all.length ? "disabled" : ""}>Next →</button></div>` : `<div class="card empty"><h2>${query ? "No matching records" : "Start with your first record"}</h2><p>${query ? "Change the search to see more results." : "Use the add button to create a record. Saved records will appear here."}</p></div>`}`;
}
function review() {
  const rows = changes();
  return `<div class="heading"><div><p class="eyebrow">Publishing / Review</p><h1>Ready when you are.</h1><p>Inspect the published version beside the saved draft before publishing.</p></div><button class="btn primary" id="publish-selected" ${!selected.size ? "disabled" : ""}>Publish selected (${selected.size})</button></div><div class="actions"><button class="btn" id="select-all">Select all</button><button class="btn" id="select-none">Clear selection</button></div>${rows.length ? `<div class="cards">${rows.map((r) => `<article class="card"><label class="actions"><input type="checkbox" data-select="${esc(r.kind + "/" + r._id)}" ${selected.has(r.kind + "/" + r._id) ? "checked" : ""}><span>${esc(state.config.collections[r.kind].label)}</span></label><h2>${esc(r.title || r.name || r.label || r._id)}</h2><span class="badge">${r._published ? "Replacement" : "New content"}</span><div class="actions" style="margin-top:20px"><button class="btn small" data-review="${esc(r._id)}" data-kind="${esc(r.kind)}">Compare before / after</button></div></article>`).join("")}</div>` : '<div class="card empty"><h2>Everything is up to date.</h2><p>Changes saved in CMS collections will appear here before publication.</p></div>'}`;
}
function access() {
  return `<p class="eyebrow">Owner / Permissions</p><h1>People & access.</h1><p>Roles are checked by the server. Changing access ends that account’s current sessions.</p><div class="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Update access</th></tr></thead><tbody>${state.users.map((u) => `<tr><td>${esc(u.name)}</td><td>${esc(u.email)}</td><td>${esc(u.role)}</td><td>${u.role === "owner" ? '<span class="badge">Protected owner</span>' : `<select data-role="${esc(u.id)}" aria-label="Role for ${esc(u.name)}">${["member", "editor", "finance", "auditor"].map((r) => `<option value="${r}" ${u.role === r ? "selected" : ""}>${label(r)}</option>`).join("")}</select>`}</td></tr>`).join("")}</tbody></table></div><div class="sample">Member: personal records only. Editor and finance: operational records and saved CMS drafts. Auditor: read-only records. Owner: publishing, backups and access management.</div>`;
}
function searchView() {
  return `<p class="eyebrow">Knowledge / Source retrieval</p><h1>Find it in your sources.</h1><p>Search the documents you added. Matching excerpts include their document and passage references.</p><form id="knowledge"><label class="field"><span>Your question</span><input name="question" required maxlength="2000" placeholder="What is the approval policy?"></label><button class="btn primary">Search sources →</button></form><div id="results" aria-live="polite"></div><div class="sample">This workspace uses source retrieval. It does not call an external language model or claim an AI-generated answer.</div>`;
}
async function run(fn) {
  if (busy) return;
  busy = true;
  try {
    await fn();
  } catch (error) {
    notify(error.message);
  } finally {
    busy = false;
  }
}
function bindActions() {
  document.querySelectorAll("[data-go]").forEach(
    (b) =>
      (b.onclick = () => {
        section = b.dataset.go;
        render();
      }),
  );
  document.querySelector("#add")?.addEventListener("click", () => edit());
  document
    .querySelectorAll("[data-edit]")
    .forEach(
      (b) =>
        (b.onclick = () =>
          edit(collectionRows(section).find((r) => r._id === b.dataset.edit))),
    );
  document
    .querySelectorAll("[data-review]")
    .forEach(
      (b) =>
        (b.onclick = () =>
          compare(b.dataset.kind || section, b.dataset.review)),
    );
  document.querySelectorAll("[data-command]").forEach(
    (b) =>
      (b.onclick = () =>
        run(async () => {
          const row = collectionRows(section).find(
            (r) => r._id === b.dataset.command,
          );
          if (
            !confirm(
              b.dataset.status === "paid"
                ? "Record a payment already received or sent? This records a manual payment; it does not move bank funds."
                : "Apply this approval decision?",
            )
          )
            return;
          await api("command", {
            kind: section,
            id: row._id,
            version: row._version,
            status: b.dataset.status,
          });
          await load();
          notify("Workflow saved to the audit log.");
        })),
  );
  document.querySelector("#filter")?.addEventListener("input", (event) => {
    query = event.target.value;
    page = 0;
    const start = event.target.selectionStart;
    render();
    const input = document.querySelector("#filter");
    input.focus();
    try {
      input.setSelectionRange(start, start);
    } catch {}
  });
  document.querySelector("#prev")?.addEventListener("click", () => {
    page--;
    render();
  });
  document.querySelector("#next")?.addEventListener("click", () => {
    page++;
    render();
  });
  document.querySelectorAll("[data-select]").forEach(
    (b) =>
      (b.onchange = () => {
        if (b.checked) selected.add(b.dataset.select);
        else selected.delete(b.dataset.select);
        const button = document.querySelector("#publish-selected");
        button.disabled = !selected.size;
        button.textContent = `Publish selected (${selected.size})`;
      }),
  );
  document.querySelector("#select-all")?.addEventListener("click", () => {
    selected = new Set(changes().map((r) => r.kind + "/" + r._id));
    render();
  });
  document.querySelector("#select-none")?.addEventListener("click", () => {
    selected.clear();
    render();
  });
  document.querySelector("#publish-selected")?.addEventListener("click", () =>
    run(async () => {
      const records = changes()
        .filter((r) => selected.has(r.kind + "/" + r._id))
        .map((r) => ({ kind: r.kind, id: r._id, version: r._version }));
      if (!confirm(`Publish ${records.length} reviewed record(s)?`)) return;
      await api("publish", { records });
      selected.clear();
      await load();
      notify("Selected content is now published.");
    }),
  );
  document.querySelectorAll("[data-role]").forEach(
    (select) =>
      (select.onchange = () =>
        run(async () => {
          await api("roles", { id: select.dataset.role, role: select.value });
          await load();
          notify("Access updated.");
        })),
  );
  document.querySelector("#knowledge")?.addEventListener("submit", (event) => {
    event.preventDefault();
    run(async () => {
      const result = await api("query", {
        question: event.target.question.value,
      });
      document.querySelector("#results").innerHTML =
        `<p>${esc(result.message)}</p>${result.results.map((r) => `<article class="search-result"><strong>${esc(r.title)}</strong><span class="badge">Passage ${r.passage}</span><blockquote>${esc(r.text)}</blockquote><small>Document reference: ${esc(r.documentId)}</small></article>`).join("")}`;
    });
  });
}
function empty(field) {
  if (field.type === "array") return [];
  if (field.type === "object")
    return Object.fromEntries(
      Object.entries(field.fields).map(([k, d]) => [k, empty(d)]),
    );
  if (field.type === "number") return field.min || 0;
  if (field.type === "boolean") return false;
  if (field.options) return field.options[0];
  return "";
}
function editorFields(fields, value, prefix = "") {
  return Object.entries(fields)
    .filter(([k]) => !["id", "ownerId"].includes(k))
    .map(([key, field]) => {
      const name = prefix + key,
        v = value?.[key] ?? empty(field),
        title = label(key);
      if (field.type === "object")
        return `<fieldset class="wide"><legend>${esc(title)}</legend><div class="form-grid">${editorFields(field.fields, v, name + ".")}</div></fieldset>`;
      if (field.type === "array" && field.fields)
        return `<fieldset class="wide" data-array="${esc(name)}"><legend>${esc(title)}</legend><div class="array-items">${v.map((x, i) => `<div class="list-item"><button class="btn small danger" type="button" data-remove>Remove</button><div class="form-grid">${editorFields(field.fields, x, name + "." + i + ".")}</div></div>`).join("")}</div><button class="btn small" type="button" data-add-array="${esc(name)}">Add ${esc(title.toLowerCase())} item +</button></fieldset>`;
      if (field.reference) {
        const options = collectionRows(field.reference);
        const key = field.referenceValue || "id";
        return `<label class="field"><span>${esc(title)}</span><select name="${esc(name)}" required><option value="">Choose ${esc(title.toLowerCase())}</option>${options.map((row) => `<option value="${esc(row[key])}" ${row[key] === v ? "selected" : ""}>${esc(row.name || row.title || row.number || row.id)}</option>`).join("")}</select></label>`;
      }
      const long =
        field.type === "array" ||
        [
          "text",
          "description",
          "body",
          "brief",
          "message",
          "notes",
          "blurb",
          "subline",
          "bio",
          "excerpt",
        ].includes(key);
      return `<label class="field ${long ? "wide" : ""}"><span>${esc(title)}${field.optional ? " (optional)" : ""}</span>${field.type === "boolean" ? `<input type="checkbox" name="${esc(name)}" ${v ? "checked" : ""}>` : field.options ? `<select name="${esc(name)}">${field.options.map((o) => `<option value="${esc(o)}" ${o === v ? "selected" : ""}>${esc(label(o))}</option>`).join("")}</select>` : long ? `<textarea name="${esc(name)}" ${!field.optional ? "required" : ""} maxlength="${field.maxLength || 20000}">${esc(field.type === "array" ? v.join("\n") : v)}</textarea>${field.type === "array" ? '<small class="help">One item or image URL per line.</small>' : ""}` : `<input name="${esc(name)}" type="${["number", "date", "email"].includes(field.type) ? field.type : "text"}" value="${esc(v)}" ${field.type === "number" ? `step="any" min="${field.min ?? 0}" ${field.max !== undefined ? `max="${field.max}"` : ""}` : ""} ${!field.optional ? "required" : ""}>`}</label>`;
    })
    .join("");
}
function collect(fields, form, prefix = "", previous = {}) {
  return Object.fromEntries(
    Object.entries(fields).map(([key, field]) => {
      const name = prefix + key;
      if (["id", "ownerId"].includes(key)) return [key, previous[key] || ""];
      if (field.type === "object")
        return [
          key,
          collect(field.fields, form, name + ".", previous[key] || {}),
        ];
      if (field.type === "array" && field.fields) {
        const group = form.querySelector(`[data-array="${CSS.escape(name)}"]`);
        return [
          key,
          [...group.querySelector(":scope > .array-items").children].map(
            (el, i) =>
              collect(
                field.fields,
                el,
                name + "." + i + ".",
                previous[key]?.[i] || {},
              ),
          ),
        ];
      }
      const el = form.querySelector(`[name="${CSS.escape(name)}"]`),
        raw = el?.value || "";
      return [
        key,
        field.type === "number"
          ? Number(raw)
          : field.type === "boolean"
            ? !!el?.checked
            : field.type === "array"
              ? raw
                  .split("\n")
                  .map((x) => x.trim())
                  .filter(Boolean)
              : raw,
      ];
    }),
  );
}
function edit(row) {
  const kind = section,
    def = state.config.collections[kind],
    writable =
      !(["invoices", "bills"].includes(kind) && row?.status === "paid") &&
      state.user.role !== "auditor" &&
      (state.user.role !== "member" || def.member);
  let value = row
    ? Object.fromEntries(Object.keys(def.fields).map((k) => [k, row[k]]))
    : Object.fromEntries(
        Object.entries(def.fields).map(([k, f]) => [k, empty(f)]),
      );
  const draw = () => {
    panel.innerHTML = `<div class="dialog-head"><div><p class="eyebrow">${esc(def.label)}</p><h2>${row ? "Edit record" : "New record"}</h2></div><button class="btn small" data-close type="button" aria-label="Close dialog">✕</button></div><form id="record-form"><div class="form-grid">${editorFields(def.fields, value)}</div><p class="error" id="record-error" role="alert"></p><div class="dialog-foot">${row && writable ? '<button type="button" class="btn danger" id="delete">Delete record</button>' : ""}<button type="button" class="btn" data-close>Close</button>${writable ? `<button class="btn primary" type="submit">${def.cms ? "Save draft" : "Save record"} →</button>` : ""}</div></form>`;
    panel
      .querySelectorAll("[data-close]")
      .forEach((b) => (b.onclick = () => dialog.close()));
    if (!writable)
      panel
        .querySelectorAll(
          "input,textarea,select,[data-add-array],[data-remove]",
        )
        .forEach((el) => (el.disabled = true));
    panel.querySelectorAll("[data-add-array]").forEach(
      (button) =>
        (button.onclick = () => {
          value = collect(def.fields, panel.querySelector("form"), "", value);
          let holder = value,
            f = def.fields;
          const parts = button.dataset.addArray.split(".");
          for (const p of parts.slice(0, -1)) {
            holder = holder[p];
            f = f[p].fields;
          }
          const last = parts.at(-1);
          holder[last].push(empty({ type: "object", fields: f[last].fields }));
          draw();
        }),
    );
    panel.querySelectorAll("[data-remove]").forEach(
      (button) =>
        (button.onclick = () => {
          value = collect(def.fields, panel.querySelector("form"), "", value);
          const group = button.closest("[data-array]"),
            i = [
              ...group.querySelector(":scope > .array-items").children,
            ].indexOf(button.closest(".list-item"));
          let holder = value;
          const parts = group.dataset.array.split(".");
          for (const p of parts.slice(0, -1)) holder = holder[p];
          holder[parts.at(-1)].splice(i, 1);
          draw();
        }),
    );
    panel.querySelector("#record-form").onsubmit = async (event) => {
      event.preventDefault();
      const submit = event.target.querySelector("[type=submit]");
      if (!writable) return;
      submit.disabled = true;
      try {
        const record = collect(def.fields, event.target, "", value);
        await api(
          `records/${kind}${row ? "/" + row._id : ""}`,
          { value: record, version: row?._version },
          row ? "PUT" : "POST",
        );
        dialog.close();
        await load();
        notify(
          def.cms ? "Draft saved. Review before publishing." : "Record saved.",
        );
      } catch (error) {
        panel.querySelector("#record-error").textContent = error.message;
      } finally {
        submit.disabled = false;
      }
    };
    panel.querySelector("#delete")?.addEventListener("click", () =>
      run(async () => {
        if (
          !confirm(
            "Delete this record? Referenced, published and financial records are protected.",
          )
        )
          return;
        await api(
          `records/${kind}/${row._id}`,
          { version: row._version },
          "DELETE",
        );
        dialog.close();
        await load();
        notify("Record deleted.");
      }),
    );
  };
  draw();
  dialog.showModal();
}
function compare(kind, id) {
  const row = collectionRows(kind).find((r) => r._id === id),
    fields = state.config.collections[kind].fields;
  function visualValue(field, key, value, title) {
    if (/image|avatar|photo/i.test(key) && field.type === "url")
      return `<img class="review-image" src="${esc(value)}" alt="${esc(title + " image")}">`;
    if (/image/i.test(key) && field.type === "array")
      return `<div class="review-gallery">${(value || []).map((src, index) => `<img class="review-image" src="${esc(src)}" alt="${esc(title + " image " + (index + 1))}" loading="lazy">`).join("")}</div>`;
    return esc(pretty(value));
  }
  function column(value, title) {
    return `<section class="card"><h3>${title}</h3>${
      value
        ? Object.keys(fields)
            .filter((k) => !["id", "ownerId"].includes(k))
            .map(
              (k) =>
                `<div class="review-value"><strong>${esc(label(k))}${pretty(value[k]) !== pretty(row._published?.[k]) ? " · changed" : ""}</strong>${visualValue(fields[k], k, value[k], title)}</div>`,
            )
            .join("")
        : "<p>No published version yet.</p>"
    }</section>`;
  }
  panel.innerHTML = `<div class="dialog-head"><h2>Before & after</h2><button class="btn small" data-close aria-label="Close comparison">✕</button></div><div class="review-grid">${column(row._published, "Published")}${column(row, "Saved draft")}</div><div class="dialog-foot"><button class="btn" data-close>Close</button>${state.user.role === "owner" ? `${row._published ? '<button class="btn danger" id="unpublish">Unpublish</button>' : ""}<button class="btn primary" id="publish">Publish this record →</button>` : ""}</div>`;
  panel
    .querySelectorAll("[data-close]")
    .forEach((b) => (b.onclick = () => dialog.close()));
  panel.querySelector("#publish")?.addEventListener("click", () =>
    run(async () => {
      await api("publish", { records: [{ kind, id, version: row._version }] });
      dialog.close();
      await load();
      notify("Content published.");
    }),
  );
  panel.querySelector("#unpublish")?.addEventListener("click", () =>
    run(async () => {
      if (!confirm("Remove this record from the public website?")) return;
      await api("unpublish", { kind, id, version: row._version });
      dialog.close();
      await load();
      notify("Content unpublished.");
    }),
  );
  dialog.showModal();
}
await load();
