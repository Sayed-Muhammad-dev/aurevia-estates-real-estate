import { promisify } from "node:util";
import { execFile } from "node:child_process";
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
process.env.APP_DATA_DIR = await mkdtemp(
  path.join(tmpdir(), "fullstack-check-"),
);
delete process.env.DATABASE_URL;
delete process.env.VERCEL;
const { handle, bootstrap, config } = await import("./backend.mjs");
after(() => rm(process.env.APP_DATA_DIR, { recursive: true, force: true }));
const password = "Test-owner-password-9182";
const origin = "http://application.test";
let ownerCookie, memberCookie, ownerState;
async function request(
  route,
  data,
  cookie,
  method = data ? "POST" : "GET",
  headers = {},
) {
  const response = await handle(
    new Request(origin + "/api/app/" + route, {
      method,
      headers: {
        ...(data ? { "Content-Type": "application/json", Origin: origin } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
        ...headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    }),
  );
  const value = (response.headers.get("Content-Type") || "").includes("json")
    ? await response.json()
    : await response.text();
  return { response, value };
}
await test("Full-stack application boundaries and persistent workflows", async (t) => {
  await t.test("anonymous records are protected", async () =>
    assert.equal((await request("state")).response.status, 401),
  );
  await t.test("bootstrap owner and password validation", async () => {
    await bootstrap("owner@example.test", "Owner", password);
    assert.equal(
      (
        await request("login", {
          email: "owner@example.test",
          password: "wrong",
        })
      ).response.status,
      401,
    );
    const result = await request("login", {
      email: "owner@example.test",
      password,
    });
    assert.equal(result.response.status, 200);
    ownerCookie = result.response.headers.get("set-cookie").split(";")[0];
    assert.match(
      result.response.headers.get("set-cookie"),
      /HttpOnly; SameSite=Lax/,
    );
    ownerState = (await request("state", undefined, ownerCookie)).value;
    assert.equal(ownerState.user.role, "owner");
  });
  await t.test("cross-origin writes are rejected", async () =>
    assert.equal(
      (
        await request("logout", {}, ownerCookie, "POST", {
          Origin: "https://other.test",
        })
      ).response.status,
      403,
    ),
  );
  await t.test(
    "proxy host authority accepts same-origin HTTPS and sets Secure cookies",
    async () => {
      const response = await handle(
        new Request("http://localhost:3000/api/app/login", {
          method: "POST",
          headers: {
            Host: "site.example.test",
            "x-forwarded-proto": "https",
            Origin: "https://site.example.test",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: "owner@example.test", password }),
        }),
      );
      assert.equal(response.status, 200);
      assert.match(response.headers.get("set-cookie"), /; Secure/);
      const denied = await handle(
        new Request("http://localhost:3000/api/app/logout", {
          method: "POST",
          headers: {
            Host: "site.example.test",
            "x-forwarded-proto": "https",
            Origin: "https://attacker.example.test",
            "Content-Type": "application/json",
          },
          body: "{}",
        }),
      );
      assert.equal(denied.status, 403);
    },
  );
  await t.test("registration cannot grant a privileged role", async () => {
    const data = {
      name: "Member",
      email: "member@example.test",
      password: "Member-password-9182",
      role: "owner",
    };
    assert.equal((await request("register", data)).response.status, 201);
    const logged = await request("login", data);
    memberCookie = logged.response.headers.get("set-cookie").split(";")[0];
    assert.equal(logged.value.user.role, "member");
    assert.equal(
      (
        await request(
          "roles",
          { id: logged.value.user.id, role: "owner" },
          memberCookie,
        )
      ).response.status,
      403,
    );
  });
  await t.test(
    "invalid collection and malformed request are rejected",
    async () => {
      assert.equal(
        (await request("records/missing", { value: {} }, ownerCookie)).response
          .status,
        404,
      );
      const response = await handle(
        new Request(origin + "/api/app/login", {
          method: "POST",
          headers: { Origin: origin, "Content-Type": "application/json" },
          body: "{broken",
        }),
      );
      assert.equal(response.status, 400);
    },
  );
  const operational = Object.entries(ownerState.config.collections).find(
    ([k, d]) =>
      !d.cms &&
      !d.member &&
      !d.publicSubmit &&
      ownerState.collections[k].length,
  );
  if (operational)
    await t.test("members cannot mutate operational records", async () => {
      const [kind] = operational,
        row = ownerState.collections[kind][0];
      assert.equal(
        (
          await request(
            `records/${kind}/${row._id}`,
            { value: row, version: row._version },
            memberCookie,
            "PUT",
          )
        ).response.status,
        403,
      );
    });
  const cms = Object.entries(ownerState.config.collections).find(
    ([k, d]) => d.cms && ownerState.collections[k].length,
  );
  if (cms) {
    const [kind] = cms,
      row = ownerState.collections[kind][0],
      key = Object.entries(ownerState.config.collections[kind].fields).find(
        ([k, d]) =>
          d.type === "text" &&
          !d.options &&
          !["id", "ownerId", "slug"].includes(k),
      )[0],
      before = row[key],
      next = { ...row, [key]: before + " · reviewed update" };
    await t.test("draft edits do not leak into public content", async () => {
      assert.equal(
        (
          await request(
            `records/${kind}/${row._id}`,
            { value: next, version: row._version },
            ownerCookie,
            "PUT",
          )
        ).response.status,
        200,
      );
      const publicData = (await request("public")).value;
      assert.equal(publicData.collections[kind][0][key], before);
    });
    await t.test("stale review cannot publish a changed record", async () =>
      assert.equal(
        (
          await request(
            "publish",
            { records: [{ kind, id: row._id, version: row._version }] },
            ownerCookie,
          )
        ).response.status,
        409,
      ),
    );
    await t.test("reviewed publication updates public content", async () => {
      const draft = (
        await request("state", undefined, ownerCookie)
      ).value.collections[kind].find((x) => x._id === row._id);
      assert.equal(draft._changed, true);
      assert.equal(
        (
          await request(
            "publish",
            { records: [{ kind, id: row._id, version: draft._version }] },
            ownerCookie,
          )
        ).response.status,
        200,
      );
      const publicRows = (await request("public")).value.collections[kind];
      assert.equal(publicRows.find((x) => x.id === row.id)[key], next[key]);
    });
    await t.test("unpublishing removes public data", async () => {
      const current = (
        await request("state", undefined, ownerCookie)
      ).value.collections[kind].find((x) => x._id === row._id);
      assert.equal(
        (
          await request(
            "unpublish",
            { kind, id: row._id, version: current._version },
            ownerCookie,
          )
        ).response.status,
        200,
      );
      assert.equal(
        (await request("public")).value.collections[kind].some(
          (x) => x.id === row.id,
        ),
        false,
      );
    });
  }
  if (config.id === "aurevia") {
    await t.test(
      "date-based viewing requests prevent duplicate slots",
      async () => {
        const state = (await request("state", undefined, ownerCookie)).value,
          property = state.collections.properties.at(-1);
        const value = {
          property: property.title,
          name: "Visitor",
          email: "visit@example.test",
          phone: "+12025550123",
          date: "2099-10-15",
          time: "14:00",
          visitType: "In-person",
          message: "",
        };
        const results = await Promise.all([
          request("submit/tours", value),
          request("submit/tours", value),
        ]);
        assert.deepEqual(
          results.map((x) => x.response.status).sort(),
          [201, 409],
        );
        assert.equal(
          (await request("submit/tours", { ...value, date: "2020-01-01" }))
            .response.status,
          422,
        );
      },
    );
  }
  if (config.id === "aurelium") {
    await t.test("invoice amounts and references are validated", async () => {
      const row = ownerState.collections.invoices[0];
      assert.equal(
        (
          await request(
            "records/invoices",
            { value: { ...row, clientId: "unknown" } },
            ownerCookie,
          )
        ).response.status,
        422,
      );
      assert.equal(
        (
          await request(
            "records/invoices",
            { value: { ...row, lines: [{ ...row.lines[0], quantity: -1 }] } },
            ownerCookie,
          )
        ).response.status,
        422,
      );
    });
    await t.test("a manual payment cannot be applied twice", async () => {
      const current = (
        await request("state", undefined, ownerCookie)
      ).value.collections.invoices.find(
        (x) => !["paid", "void"].includes(x.status),
      );
      const payload = {
        kind: "invoices",
        id: current._id,
        version: current._version,
        status: "paid",
      };
      const results = await Promise.all([
        request("command", payload, ownerCookie),
        request("command", payload, ownerCookie),
      ]);
      assert.deepEqual(
        results.map((x) => x.response.status).sort(),
        [200, 409],
      );
    });
  }
  if (config.id === "aurora")
    await t.test("approval decisions cannot race or replay", async () => {
      const row = ownerState.collections.approvals.find(
          (x) => x.status === "pending",
        ),
        payload = {
          kind: "approvals",
          id: row._id,
          version: row._version,
          status: "approved",
        };
      const results = await Promise.all([
        request("command", payload, ownerCookie),
        request("command", { ...payload, status: "rejected" }, ownerCookie),
      ]);
      assert.deepEqual(
        results.map((x) => x.response.status).sort(),
        [200, 409],
      );
      const state = (await request("state", undefined, ownerCookie)).value;
      assert.equal(
        state.audit.some((x) => x.action.startsWith("Recorded")),
        true,
      );
    });
  if (config.id === "nucleus")
    await t.test(
      "knowledge retrieval excludes another account documents",
      async () => {
        await request(
          "records/documents",
          {
            value: {
              title: "Owner secret",
              text: "The launch password is confidential.",
            },
          },
          ownerCookie,
        );
        assert.equal(
          (
            await request(
              "records/documents",
              {
                value: {
                  title: "Member policy",
                  text: "Purchases above 500 dollars need approval.",
                },
              },
              memberCookie,
            )
          ).response.status,
          201,
        );
        const search = (
          await request(
            "query",
            { question: "What purchases need approval?" },
            memberCookie,
          )
        ).value;
        assert.equal(search.results.length, 1);
        assert.equal(search.results[0].title, "Member policy");
        assert.equal(
          (
            await request(
              "query",
              { question: "confidential launch" },
              memberCookie,
            )
          ).value.results.length,
          0,
        );
      },
    );
  await t.test("backups omit authentication secrets", async () => {
    const backup = await request("backup", undefined, ownerCookie);
    assert.equal(backup.response.status, 200);
    assert.equal("users" in backup.value, false);
    assert.equal("sessions" in backup.value, false);
    assert.equal(
      (await request("backup", undefined, memberCookie)).response.status,
      403,
    );
  });
  for (const [kind, definition] of Object.entries(config.collections)) {
    if (!definition.private) continue;
    await t.test(
      kind +
        " remain private even from other staff accounts and content backups",
      async () => {
        const value =
          kind === "documents"
            ? {
                title: "Private member note",
                text: "A private account document.",
              }
            : { propertyId: ownerState.collections.properties.at(-1).id };
        const created = await request(
          "records/" + kind,
          { value },
          memberCookie,
        );
        assert.equal(created.response.status, 201);
        const record = created.value.record;
        const visible = (await request("state", undefined, ownerCookie)).value
          .collections[kind];
        assert.equal(
          visible.some((row) => row._id === record._id),
          false,
        );
        assert.equal(
          (
            await request(
              `records/${kind}/${record._id}`,
              { value, version: record._version },
              ownerCookie,
              "PUT",
            )
          ).response.status,
          403,
        );
        const backup = (await request("backup", undefined, ownerCookie)).value;
        assert.equal(
          backup.collections[kind].some((row) => row.id === record._id),
          false,
        );
      },
    );
  }
  if (config.id === "aurelium")
    await t.test(
      "paid finance records cannot be edited back to unpaid",
      async () => {
        const row = (
          await request("state", undefined, ownerCookie)
        ).value.collections.invoices.find((row) => row.status === "paid");
        assert.equal(
          (
            await request(
              `records/invoices/${row._id}`,
              { value: { ...row, status: "draft" }, version: row._version },
              ownerCookie,
              "PUT",
            )
          ).response.status,
          409,
        );
      },
    );
  await t.test("export is actual CSV data", async () => {
    const kind = Object.keys(ownerState.config.collections)[0],
      result = await request("export/" + kind, undefined, ownerCookie);
    assert.equal(result.response.status, 200);
    assert.match(result.response.headers.get("content-type"), /text\/csv/);
    assert.ok(result.value.includes("\r\n"));
  });
  await t.test(
    "server state is durable and contains only hashed passwords and tokens",
    async () => {
      const state = JSON.parse(
        await readFile(
          path.join(process.env.APP_DATA_DIR, "state.json"),
          "utf8",
        ),
      );
      assert.ok(state.revision > 1);
      assert.equal(
        state.users.some((x) => x.password === password),
        false,
      );
      assert.ok(state.sessions.every((x) => !("token" in x)));
      assert.ok(state.audit.length > 0);
    },
  );
  await t.test("sign-out revokes the stored session", async () => {
    await request("logout", {}, memberCookie);
    assert.equal(
      (await request("state", undefined, memberCookie)).response.status,
      401,
    );
  });
});

await test("independent processes serialize durable commits without losing records", async () => {
  const execute = promisify(execFile);
  const moduleURL = new URL("./backend.mjs", import.meta.url).href;
  const child =
    "const {transaction}=await import(" +
    JSON.stringify(moduleURL) +
    "); await transaction(s=>{s.audit.push({id:process.argv[1],action:'Independent process test',at:new Date().toISOString()});});";
  await Promise.all(
    ["child-one", "child-two"].map((id) =>
      execute(process.execPath, ["--input-type=module", "-e", child, id], {
        env: process.env,
        cwd: process.cwd(),
      }),
    ),
  );
  const saved = JSON.parse(
    await readFile(path.join(process.env.APP_DATA_DIR, "state.json"), "utf8"),
  );
  assert.equal(
    saved.audit.filter((row) => row.action === "Independent process test")
      .length,
    2,
  );
});
