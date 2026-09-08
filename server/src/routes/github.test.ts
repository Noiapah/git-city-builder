import { test } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { createApp } from "../app.js";
test("HTTP endpoint validates requests before contacting GitHub", async (t) => {
  const server = createApp().listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.on("listening", resolve));
  t.after(
    () =>
      new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      ),
  );
  const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  for (const path of [
    "/api/github/-bad/contributions?year=2026",
    "/api/github/valid/contributions?year=no",
    "/api/github/valid/contributions?year=2007",
    "/api/github/valid/contributions?year=9999",
    "/api/github/valid/contributions?year=2026&year=2025",
  ]) {
    const response = await fetch(origin + path);
    assert.equal(response.status, 400);
    assert.equal(typeof (await response.json()).error, "string");
  }
  assert.equal((await fetch(`${origin}/api/health`)).status, 200);
  assert.equal((await fetch(`${origin}/api/missing`)).status, 404);
});
