import {
  randomUUID,
  randomBytes,
  scryptSync,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import {
  mkdir,
  readFile,
  writeFile,
  rename,
  unlink,
  open,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const sourceRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const root = await readFile(path.join(process.cwd(), "server/config.json"))
  .then(() => process.cwd())
  .catch(() => sourceRoot);
const config = JSON.parse(
  await readFile(path.join(root, "server/config.json"), "utf8"),
);
const seed = JSON.parse(
  await readFile(path.join(root, "server/seed.json"), "utf8"),
);
const directory = process.env.APP_DATA_DIR || path.join(root, ".app-data");
const filename = path.join(directory, "state.json");
const hash = (value) => createHash("sha256").update(value).digest("hex");
const safeUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
});
const fail = (status, message) => {
  throw Object.assign(new Error(message), { status });
};
const collections = Object.keys(config.collections);
const fresh = () => ({
  revision: 0,
  users: [],
  sessions: [],
  audit: [],
  collections: Object.fromEntries(
    collections.map((k) => [
      k,
      (seed[k] || []).map((value, i) => {
        const id = value.id || `${k}-${i + 1}`,
          content = { ...value, id };
        return {
          id,
          version: 1,
          draft: content,
          published: config.collections[k].cms ? content : null,
          updatedAt: new Date().toISOString(),
        };
      }),
    ]),
  ),
});
let sqlPromise;
async function sqlClient() {
  return (sqlPromise ??= import("@neondatabase/serverless").then(({ neon }) =>
    neon(process.env.DATABASE_URL),
  ));
}
async function read() {
  if (process.env.DATABASE_URL) {
    const sql = await sqlClient();
    const rows =
      await sql`SELECT payload FROM application_state WHERE application_key=${config.id}`;
    return rows[0]?.payload || fresh();
  }
  if (process.env.VERCEL)
    fail(
      503,
      "Persistent storage is not configured. Provision the database before enabling this application.",
    );
  try {
    return JSON.parse(await readFile(filename, "utf8"));
  } catch (e) {
    if (e.code === "ENOENT") return fresh();
    throw e;
  }
}
let queue = Promise.resolve();
export async function transaction(fn) {
  if (process.env.DATABASE_URL) {
    const sql = await sqlClient();
    for (let attempt = 0; attempt < 12; attempt++) {
      const state = await read(),
        before = state.revision;
      const result = fn(state);
      state.revision++;
      const inserted =
        before === 0
          ? await sql`INSERT INTO application_state(application_key,payload,revision) VALUES(${config.id},${JSON.stringify(state)}::jsonb,${state.revision}) ON CONFLICT DO NOTHING RETURNING revision`
          : [];
      if (inserted.length) return result;
      const rows =
        await sql`UPDATE application_state SET payload=${JSON.stringify(state)}::jsonb,revision=${state.revision} WHERE application_key=${config.id} AND revision=${before} RETURNING revision`;
      if (rows.length) return result;
    }
    fail(409, "Another change is in progress. Reload and retry.");
  }
  if (process.env.VERCEL) fail(503, "Persistent storage is not configured.");
  let release;
  const previous = queue;
  queue = new Promise((resolve) => {
    release = resolve;
  });
  await previous;
  let lock;
  try {
    await mkdir(directory, { recursive: true });
    const deadline = Date.now() + 10000;
    while (!lock) {
      try {
        lock = await open(filename + ".lock", "wx", 0o600);
        await lock.writeFile(String(process.pid));
      } catch (e) {
        if (e.code !== "EEXIST") throw e;
        try {
          const pid = Number(await readFile(filename + ".lock", "utf8"));
          if (pid) {
            try {
              process.kill(pid, 0);
            } catch (err) {
              if (err.code === "ESRCH") {
                await unlink(filename + ".lock");
                continue;
              }
            }
          }
        } catch {}
        if (Date.now() > deadline) fail(503, "Storage is busy. Retry shortly.");
        await new Promise((resolve) => setTimeout(resolve, 25));
      }
    }
    const state = await read();
    const result = fn(state);
    if (result instanceof Promise)
      throw new Error("Transactions must be synchronous");
    state.revision++;
    const temporary = filename + "." + randomUUID() + ".tmp";
    const fd = await open(temporary, "wx", 0o600);
    try {
      await fd.writeFile(JSON.stringify(state));
      await fd.sync();
    } finally {
      await fd.close();
    }
    await rename(temporary, filename);
    return result;
  } finally {
    try {
      if (lock) {
        await lock.close();
        await unlink(filename + ".lock");
      }
    } finally {
      release();
    }
  }
}
function passwordHash(password) {
  const salt = randomBytes(16).toString("hex");
  return salt + ":" + scryptSync(password, salt, 64).toString("hex");
}
function passwordValid(password, stored) {
  const [salt, digest] = stored.split(":");
  const wanted = Buffer.from(digest, "hex"),
    actual = scryptSync(password, salt, 64);
  return wanted.length === actual.length && timingSafeEqual(wanted, actual);
}
export async function bootstrap(email, name, password) {
  if (password.length < 12)
    fail(400, "Use a password with at least 12 characters.");
  return transaction((s) => {
    if (s.users.some((u) => u.role === "owner"))
      fail(409, "An owner already exists.");
    const user = {
      id: randomUUID(),
      email: email.toLowerCase(),
      name,
      role: "owner",
      password: passwordHash(password),
    };
    s.users.push(user);
    return safeUser(user);
  });
}
const cookieName = "app_session_" + config.id.replace(/-/g, "_");
function token(request) {
  return (request.headers.get("cookie") || "")
    .split(";")
    .map((x) => x.trim())
    .find((x) => x.startsWith(cookieName + "="))
    ?.slice(cookieName.length + 1);
}
function actor(request, state) {
  const value = token(request);
  if (!value) return null;
  const session = state.sessions.find(
    (x) => x.hash === hash(value) && x.expires > Date.now(),
  );
  return state.users.find((u) => u.id === session?.userId) || null;
}
function requireActor(request, state) {
  const user = actor(request, state);
  if (!user) fail(401, "Sign in to continue.");
  return user;
}
function staff(user) {
  return ["owner", "editor", "finance"].includes(user.role);
}
function owner(user) {
  if (user.role !== "owner") fail(403, "Owner access is required.");
}
function audit(state, user, action, target) {
  state.audit.unshift({
    id: randomUUID(),
    at: new Date().toISOString(),
    actor: user?.name || "Website visitor",
    action,
    target,
  });
  state.audit = state.audit.slice(0, 10000);
}
const limits = new Map();
function throttle(request, group, max) {
  const key =
    (request.headers.get("x-forwarded-for") || "local").split(",")[0] +
    "|" +
    group;
  const now = Date.now(),
    entry = limits.get(key) || { start: now, count: 0 };
  if (now - entry.start > 60000) {
    entry.start = now;
    entry.count = 0;
  }
  if (++entry.count > max)
    fail(429, "Too many requests. Wait a minute and retry.");
  limits.set(key, entry);
  if (limits.size > 10000)
    for (const [k, v] of limits) if (now - v.start > 60000) limits.delete(k);
}
async function body(request) {
  const length = Number(request.headers.get("content-length") || 0);
  if (length > 300000) fail(413, "The request is too large.");
  const text = await request.text();
  if (text.length > 300000) fail(413, "The request is too large.");
  try {
    return JSON.parse(text);
  } catch {
    fail(400, "Send valid JSON.");
  }
}
function publicOrigin(request) {
  // Next's internal URL may use localhost behind a proxy. Host is the browser's
  // request authority; browsers cannot override it when sending credentials.
  const url = new URL(request.url);
  const protocol =
    request.headers.get("x-forwarded-proto")?.split(",")[0].trim() === "https"
      ? "https:"
      : url.protocol;
  return new URL(`${protocol}//${request.headers.get("host") || url.host}`)
    .origin;
}
function csrf(request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== publicOrigin(request))
    fail(403, "Submit this request from the application website.");
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    fail(415, "Use application/json.");
}
function validate(value, fields, prefix = "") {
  if (!value || typeof value !== "object" || Array.isArray(value))
    fail(422, "Invalid record.");
  const result = {};
  for (const [key, field] of Object.entries(fields)) {
    const input = value[key],
      label = prefix + key;
    if (input === undefined) {
      if (field.optional) continue;
      fail(422, `${label} is required.`);
    }
    if (field.type === "object") {
      result[key] = validate(input, field.fields, label + ".");
      continue;
    }
    if (field.type === "array") {
      if (!Array.isArray(input) || input.length > 100)
        fail(422, `${label} must be a list of at most 100 items.`);
      result[key] = input.map((x) =>
        field.fields
          ? validate(x, field.fields, label + ".")
          : String(x).slice(0, 5000),
      );
      continue;
    }
    if (field.type === "number") {
      if (
        typeof input !== "number" ||
        !Number.isFinite(input) ||
        (field.min !== undefined && input < field.min) ||
        (field.max !== undefined && input > field.max)
      )
        fail(422, `${label} is outside its allowed range.`);
      result[key] = input;
      continue;
    }
    if (field.type === "boolean") {
      if (typeof input !== "boolean")
        fail(422, `${label} must be true or false.`);
      result[key] = input;
      continue;
    }
    if (
      typeof input !== "string" ||
      input.length > (field.maxLength || 20000) ||
      (!field.optional && !input.trim())
    )
      fail(422, `${label} is required or too long.`);
    if (field.options && !field.options.includes(input))
      fail(422, `${label} has an invalid option.`);
    if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input))
      fail(422, "Enter a valid email.");
    if (
      field.type === "date" &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(input) ||
        !Number.isFinite(Date.parse(input)) ||
        new Date(input).toISOString().slice(0, 10) !== input)
    )
      fail(422, `${label} must be a valid date.`);
    if (
      field.type === "url" &&
      input &&
      !/^https?:\/\//.test(input) &&
      !/^\.?\/(?!\/)/.test(input)
    )
      fail(422, `${label} must be an https URL or local image path.`);
    result[key] = input.trim();
  }
  return result;
}
function domain(state, kind, value, id) {
  const rows = (k) => (state.collections[k] || []).map((x) => x.draft);
  const exists = (k, v) =>
    (state.collections[k] || []).some((x) => x.id === v || x.draft.id === v);
  for (const [key, field] of Object.entries(config.collections[kind].fields)) {
    if (
      field.reference &&
      !rows(field.reference).some(
        (row) =>
          (field.referenceValue ? row[field.referenceValue] : row.id) ===
          value[key],
      )
    )
      fail(422, `Choose an existing ${key.replace(/Id$/, "")} record.`);
  }
  if (["invoices", "bills"].includes(kind) && value.dueOn < value.issuedOn)
    fail(422, "The due date cannot precede the issue date.");
  if (
    kind === "invoices" &&
    (!exists("clients", value.clientId) ||
      !value.lines?.length ||
      value.lines.some((x) => x.quantity <= 0 || x.unitPrice < 0))
  )
    fail(422, "Choose an existing client and valid invoice lines.");
  if (
    kind === "transactions" &&
    (!exists("accounts", value.accountId) || value.amount <= 0)
  )
    fail(422, "Choose an existing account and a positive amount.");
  if (
    kind === "bills" &&
    (!exists("vendors", value.vendorId) || !exists("accounts", value.accountId))
  )
    fail(422, "Choose an existing vendor and account.");
  if (kind === "deals" && value.probability > 100)
    fail(422, "Probability cannot exceed 100%.");
  if (["properties", "agents"].includes(kind)) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.slug))
      fail(422, "Use a lowercase URL slug with hyphens.");
    if (rows(kind).some((x) => x.slug === value.slug && x.id !== id))
      fail(409, "This URL slug is already used.");
  }
  if (
    kind === "properties" &&
    (!value.images?.length ||
      value.images.some((x) => !/^https?:\/\//.test(x) && !/^\/(?!\/)/.test(x)))
  )
    fail(422, "Add at least one valid property image URL.");
  if (kind === "favorites" && !exists("properties", value.propertyId))
    fail(422, "Choose an existing property.");
  if (
    kind === "favorites" &&
    rows(kind).some(
      (x) =>
        x.id !== id &&
        x.ownerId === value.ownerId &&
        x.propertyId === value.propertyId,
    )
  )
    fail(409, "This home is already saved.");
  if (kind === "tours") {
    const property = state.collections.properties
      .map((x) => x.published)
      .filter(Boolean)
      .find((x) => x.title === value.property || x.id === value.property);
    if (!property) fail(422, "Choose an available published property.");
    const previous = rows(kind).find((x) => x.id === id);
    const scheduleChanged =
      !previous ||
      previous.date !== value.date ||
      previous.time !== value.time ||
      previous.property !== value.property;
    const when = Date.parse(value.date + "T" + value.time + ":00Z");
    if (!Number.isFinite(when) || (scheduleChanged && when < Date.now()))
      fail(422, "Choose a future viewing date and time (UTC).");
    if (
      value.status !== "cancelled" &&
      rows(kind).some(
        (x) =>
          x.id !== id &&
          x.property === value.property &&
          x.date === value.date &&
          x.time === value.time &&
          x.status !== "cancelled",
      )
    )
      fail(
        409,
        "This property viewing slot is already reserved. Choose another time.",
      );
  }
}
function expose(row, definition, user) {
  if (definition.cms)
    return {
      ...row.draft,
      _id: row.id,
      _version: row.version,
      _published: row.published,
      _changed: JSON.stringify(row.draft) !== JSON.stringify(row.published),
    };
  return { ...row.draft, _id: row.id, _version: row.version };
}
function canRead(def, user, row) {
  if (def.private) return row.draft.ownerId === user.id;
  return (
    staff(user) ||
    user.role === "auditor" ||
    (def.member && row.draft.ownerId === user.id)
  );
}
function canWrite(def, user, row) {
  if (def.private) return !row || row.draft.ownerId === user.id;
  return (
    staff(user) ||
    (def.member && row?.draft.ownerId === user.id) ||
    (!row && def.member)
  );
}
function view(state, user) {
  return {
    revision: state.revision,
    user: safeUser(user),
    config: {
      ...config,
      collections: Object.fromEntries(
        Object.entries(config.collections).filter(
          ([, d]) => staff(user) || user.role === "auditor" || d.member,
        ),
      ),
    },
    collections: Object.fromEntries(
      Object.entries(state.collections).map(([k, rows]) => [
        k,
        rows
          .filter((r) => canRead(config.collections[k], user, r))
          .map((r) => expose(r, config.collections[k], user)),
      ]),
    ),
    audit: staff(user) || user.role === "auditor" ? state.audit : [],
    users: user.role === "owner" ? state.users.map(safeUser) : [],
  };
}
function csv(rows) {
  const keys = [...new Set(rows.flatMap(Object.keys))].filter(
    (k) => !k.startsWith("_"),
  );
  const quote = (v) =>
    '"' +
    String(typeof v === "object" ? JSON.stringify(v) : (v ?? ""))
      .replace(/^[=+@-]/, "'$&")
      .replaceAll('"', '""') +
    '"';
  return [
    keys.map(quote).join(","),
    ...rows.map((r) => keys.map((k) => quote(r[k])).join(",")),
  ].join("\r\n");
}
function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...headers,
    },
  });
}
export async function handle(request) {
  try {
    const url = new URL(request.url),
      route = url.pathname.replace(/^\/api\/app\/?/, "").replace(/\/$/, "");
    const method = request.method;
    if (!["GET", "HEAD", "POST", "PUT", "DELETE"].includes(method))
      fail(405, "Unsupported method.");
    if (!["GET", "HEAD"].includes(method)) csrf(request);
    if (route === "health")
      return json({
        application: config.id,
        storage: process.env.DATABASE_URL ? "postgresql" : "local durable file",
        ready: !(process.env.VERCEL && !process.env.DATABASE_URL),
      });
    if (route === "public" && method === "GET") {
      const state = await read();
      return json({
        revision: state.revision,
        collections: Object.fromEntries(
          Object.entries(state.collections)
            .filter(([k]) => config.collections[k].cms)
            .map(([k, rows]) => [
              k,
              rows.filter((x) => x.published).map((x) => x.published),
            ]),
        ),
      });
    }
    if (route === "login" && method === "POST") {
      throttle(request, "login", 12);
      const data = await body(request);
      if (
        typeof data.email !== "string" ||
        typeof data.password !== "string" ||
        data.password.length > 200
      )
        fail(400, "Enter an email and password.");
      const raw = randomBytes(32).toString("hex");
      const user = await transaction((s) => {
        const u = s.users.find(
          (u) => u.email === data.email.trim().toLowerCase(),
        );
        if (!u || !passwordValid(data.password, u.password))
          fail(401, "Email or password was not recognised.");
        s.sessions = s.sessions.filter((x) => x.expires > Date.now());
        s.sessions.push({
          hash: hash(raw),
          userId: u.id,
          expires: Date.now() + 43200000,
        });
        audit(s, u, "Signed in", "Session");
        return safeUser(u);
      });
      return json({ user }, 200, {
        "Set-Cookie": `${cookieName}=${raw}; HttpOnly; SameSite=Lax; Path=/; Max-Age=43200${publicOrigin(request).startsWith("https:") ? "; Secure" : ""}`,
      });
    }
    if (route === "register" && method === "POST") {
      throttle(request, "register", 6);
      const data = await body(request);
      if (
        typeof data.email !== "string" ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) ||
        typeof data.name !== "string" ||
        !data.name.trim() ||
        data.name.length > 120 ||
        typeof data.password !== "string" ||
        data.password.length < 12 ||
        data.password.length > 200
      )
        fail(
          422,
          "Enter your name, email and a password of at least 12 characters.",
        );
      const result = await transaction((s) => {
        const email = data.email.trim().toLowerCase();
        if (s.users.some((u) => u.email === email))
          fail(409, "This email is already registered.");
        const u = {
          id: randomUUID(),
          name: data.name.trim(),
          email,
          role: "member",
          password: passwordHash(data.password),
        };
        s.users.push(u);
        audit(s, u, "Account created", "Account");
        return safeUser(u);
      });
      return json({ user: result }, 201);
    }
    if (route.startsWith("submit/") && method === "POST") {
      throttle(request, "submit", 10);
      const kind = route.slice(7),
        def = config.collections[kind];
      if (!def?.publicSubmit) fail(404, "Submission is unavailable.");
      const data = await body(request);
      const result = await transaction((s) => {
        const value = validate(data, def.fields);
        value.id = randomUUID();
        value.status = def.initialStatus || "new";
        if (def.member) value.ownerId = actor(request, s)?.id || "visitor";
        domain(s, kind, value);
        s.collections[kind].unshift({
          id: value.id,
          version: 1,
          draft: value,
          published: null,
          updatedAt: new Date().toISOString(),
        });
        audit(s, null, "Website submission", kind);
        return { id: value.id, status: value.status };
      });
      return json(result, 201);
    }
    if (route === "session" && method === "GET") {
      const s = await read(),
        u = actor(request, s);
      return json({ user: u ? safeUser(u) : null });
    }
    if (route === "logout" && method === "POST") {
      await transaction((s) => {
        const t = token(request);
        if (t) s.sessions = s.sessions.filter((x) => x.hash !== hash(t));
      });
      return json({ ok: true }, 200, {
        "Set-Cookie": `${cookieName}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`,
      });
    }
    if (route === "state" && method === "GET") {
      const s = await read(),
        u = requireActor(request, s);
      return json(view(s, u));
    }
    if (route === "query" && method === "POST") {
      const data = await body(request);
      if (
        typeof data.question !== "string" ||
        data.question.length > 2000 ||
        !data.question.trim()
      )
        fail(422, "Enter a question.");
      const s = await read(),
        u = requireActor(request, s);
      if (config.id !== "nucleus")
        fail(404, "Knowledge search is unavailable.");
      const terms = [
        ...new Set(data.question.toLowerCase().match(/[a-z0-9]{3,}/g) || []),
      ].filter(
        (x) => !["the", "and", "what", "how", "does", "are", "for"].includes(x),
      );
      const results = s.collections.documents
        .filter((r) => r.draft.ownerId === u.id)
        .flatMap((r) =>
          r.draft.text.split(/\n\s*\n/).map((text, index) => ({
            title: r.draft.title,
            documentId: r.id,
            passage: index + 1,
            text: text.slice(0, 2500),
            score: terms.filter((t) => text.toLowerCase().includes(t)).length,
          })),
        )
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
      return json({
        mode: "source retrieval",
        question: data.question,
        results,
        message: results.length
          ? "Matching passages from your documents. These are source excerpts, not generated AI answers."
          : "No matching source found. Try a more specific question.",
      });
    }
    if (route === "roles" && method === "POST") {
      const data = await body(request);
      await transaction((s) => {
        const u = requireActor(request, s);
        owner(u);
        const target = s.users.find((x) => x.id === data.id);
        if (
          !target ||
          target.role === "owner" ||
          !["member", "editor", "finance", "auditor"].includes(data.role)
        )
          fail(422, "Choose an existing non-owner account and valid role.");
        target.role = data.role;
        s.sessions = s.sessions.filter((x) => x.userId !== target.id);
        audit(s, u, "Role updated", target.email);
      });
      return json({ ok: true });
    }
    if (route === "publish" && method === "POST") {
      const data = await body(request);
      await transaction((s) => {
        const u = requireActor(request, s);
        owner(u);
        if (
          !Array.isArray(data.records) ||
          !data.records.length ||
          data.records.length > 500
        )
          fail(422, "Select records to publish.");
        const pending = data.records.map((x) => {
          const def = config.collections[x.kind];
          const row = s.collections[x.kind]?.find((r) => r.id === x.id);
          if (!def?.cms || !row) fail(404, "Content record not found.");
          if (row.version !== x.version)
            fail(409, "Content changed since you reviewed it. Reload first.");
          return row;
        });
        pending.forEach((row) => {
          row.published = structuredClone(row.draft);
          row.version++;
          row.updatedAt = new Date().toISOString();
        });
        audit(
          s,
          u,
          "Published reviewed content",
          String(pending.length) + " records",
        );
      });
      return json({ ok: true });
    }
    if (route === "backup" && method === "GET") {
      const s = await read(),
        u = requireActor(request, s);
      owner(u);
      return json(
        {
          application: config.id,
          at: new Date().toISOString(),
          collections: Object.fromEntries(
            Object.entries(s.collections).map(([kind, rows]) => [
              kind,
              rows.filter((row) => canRead(config.collections[kind], u, row)),
            ]),
          ),
          audit: s.audit,
        },
        200,
        {
          "Content-Disposition": `attachment; filename="${config.id}-content-backup.json"`,
        },
      );
    }
    if (route.startsWith("export/") && method === "GET") {
      const kind = route.slice(7),
        def = config.collections[kind];
      if (!def) fail(404, "Collection not found.");
      const s = await read(),
        u = requireActor(request, s);
      const rows = s.collections[kind]
        .filter((r) => canRead(def, u, r))
        .map((r) => r.draft);
      return new Response(csv(rows), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${config.id}-${kind}.csv"`,
          "Cache-Control": "no-store",
        },
      });
    }
    if (route === "command" && method === "POST") {
      const data = await body(request);
      await transaction((s) => {
        const u = requireActor(request, s);
        if (!staff(u)) fail(403, "Finance access is required.");
        const kind = data.kind,
          row = s.collections[kind]?.find((r) => r.id === data.id);
        if (!row || row.version !== data.version)
          fail(409, "Reload this record before applying a change.");
        if (
          kind === "approvals" &&
          ["approved", "rejected"].includes(data.status)
        ) {
          if (row.draft.status !== "pending")
            fail(409, "This request has already been decided.");
          if (row.draft.requester === u.name)
            fail(403, "You cannot approve your own request.");
          row.draft.status = data.status;
          row.draft.chain = row.draft.chain.map((x) =>
            x.state === "waiting"
              ? {
                  ...x,
                  state: data.status === "approved" ? "signed" : "blocked",
                  name: u.name,
                }
              : x,
          );
        } else if (
          ["invoices", "bills"].includes(kind) &&
          data.status === "paid"
        ) {
          if (row.draft.status === "paid" || row.draft.status === "void")
            fail(409, "This record cannot be marked paid.");
          row.draft.status = "paid";
          row.draft.paidOn = new Date().toISOString().slice(0, 10);
        } else fail(422, "Unsupported workflow action.");
        row.version++;
        row.updatedAt = new Date().toISOString();
        audit(s, u, "Recorded " + data.status, kind + "/" + row.id);
      });
      return json({ ok: true });
    }
    const [resource, kind, id] = route.split("/");
    if (resource === "records" && config.collections[kind]) {
      const def = config.collections[kind];
      if (method === "POST" || method === "PUT") {
        const data = await body(request);
        const result = await transaction((s) => {
          const u = requireActor(request, s),
            row = id ? s.collections[kind].find((r) => r.id === id) : null;
          if (id && !row) fail(404, "Record not found.");
          if (!canWrite(def, u, row))
            fail(403, "This account cannot edit that record.");
          if (row && row.version !== data.version)
            fail(
              409,
              "Another editor changed this record. Reload before saving.",
            );
          if (
            row &&
            ["invoices", "bills"].includes(kind) &&
            row.draft.status === "paid"
          )
            fail(
              409,
              "Paid records are retained unchanged. Create a separate correction record.",
            );
          if (!row && def.singleton && s.collections[kind].length)
            fail(
              409,
              "Edit the existing settings record instead of creating another.",
            );
          const value = validate(data.value, def.fields);
          value.id = row?.draft.id || randomUUID();
          if (value.lines)
            value.lines = value.lines.map((x) => ({
              ...x,
              id: x.id || randomUUID(),
            }));
          if (def.member) value.ownerId = row?.draft.ownerId || u.id;
          if (kind === "approvals") {
            value.status = row?.draft.status || "pending";
            value.requester = row?.draft.requester || u.name;
          }
          if (kind === "tours" && !staff(u)) {
            if (value.status !== "cancelled")
              value.status = row?.draft.status || "requested";
          }
          if (
            ["invoices", "bills"].includes(kind) &&
            value.status === "paid" &&
            row?.draft.status !== "paid"
          )
            fail(422, "Record payments using the payment action.");
          domain(s, kind, value, row?.id);
          const saved = {
            id: row?.id || value.id,
            version: (row?.version || 0) + 1,
            draft: value,
            published: row?.published || null,
            updatedAt: new Date().toISOString(),
          };
          if (row) Object.assign(row, saved);
          else s.collections[kind].unshift(saved);
          audit(
            s,
            u,
            row ? "Record updated" : "Record created",
            kind + "/" + saved.id,
          );
          return expose(saved, def, u);
        });
        return json({ record: result }, id ? 200 : 201);
      }
      if (method === "DELETE") {
        const data = await body(request);
        await transaction((s) => {
          const u = requireActor(request, s),
            row = s.collections[kind].find((r) => r.id === id);
          if (!row) fail(404, "Record not found.");
          if (!canWrite(def, u, row))
            fail(403, "This account cannot delete that record.");
          if (row.version !== data.version)
            fail(409, "Reload before deleting.");
          if (row.published)
            fail(
              409,
              "Published CMS records must be unpublished before deletion.",
            );
          if (["invoices", "bills", "transactions", "approvals"].includes(kind))
            fail(
              409,
              "Financial records are retained. Use status workflows instead of deleting.",
            );
          if (
            Object.values(s.collections).some((rows) =>
              rows.some((r) =>
                Object.entries(r.draft).some(
                  ([k, v]) => k.endsWith("Id") && v === row.draft.id,
                ),
              ),
            )
          )
            fail(
              409,
              "This record is referenced elsewhere and cannot be deleted.",
            );
          s.collections[kind] = s.collections[kind].filter((r) => r.id !== id);
          audit(s, u, "Record deleted", kind + "/" + id);
        });
        return json({ ok: true });
      }
    }
    if (route === "unpublish" && method === "POST") {
      const data = await body(request);
      await transaction((s) => {
        const u = requireActor(request, s);
        owner(u);
        const row = s.collections[data.kind]?.find((r) => r.id === data.id);
        if (!config.collections[data.kind]?.cms || !row)
          fail(404, "Content not found.");
        if (config.collections[data.kind].singleton)
          fail(
            409,
            "Keep the required site identity published. Publish a reviewed replacement instead.",
          );
        if (row.version !== data.version)
          fail(409, "Reload before unpublishing.");
        row.published = null;
        row.version++;
        audit(s, u, "Content unpublished", data.kind + "/" + data.id);
      });
      return json({ ok: true });
    }
    fail(404, "Endpoint not found.");
  } catch (error) {
    if (!error.status)
      console.error(
        `[${config.id}] Request failed: ${error.code || error.name}`,
      );
    return json(
      {
        error: error.status
          ? error.message
          : "The server could not complete this request. Check storage configuration and retry.",
      },
      error.status || 503,
    );
  }
}
export { config };
