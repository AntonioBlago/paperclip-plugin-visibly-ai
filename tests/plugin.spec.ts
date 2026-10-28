import { afterEach, describe, expect, it, vi } from "vitest";
import { createTestHarness } from "@paperclipai/plugin-sdk/testing";
import { pluginManifestV1Schema } from "@paperclipai/shared";
import manifest from "../src/manifest.js";
import plugin from "../src/worker.js";
import { TOOLS } from "../src/tools.js";

const secretRef = { type: "secret_ref", secretId: "00000000-0000-4000-8000-000000000001" };

async function setup(config: Record<string, unknown> = { apiKey: secretRef }) {
  const harness = createTestHarness({ manifest, config });
  await plugin.definition.setup(harness.ctx);
  return harness;
}

function mockFetch(status: number, body: unknown) {
  const fetchMock = vi.fn(async () => new Response(typeof body === "string" ? body : JSON.stringify(body), { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => vi.unstubAllGlobals());

describe("manifest", () => {
  it("passes the Paperclip manifest schema", () => {
    expect(() => pluginManifestV1Schema.parse(manifest)).not.toThrow();
  });

  it("declares every tool exactly once and without the internal path", () => {
    const names = manifest.tools!.map((t) => t.name);
    expect(new Set(names).size).toBe(TOOLS.length);
    expect(manifest.tools!.every((t) => !("path" in t))).toBe(true);
  });
});

describe("tools", () => {
  it("calls the Visibly endpoint with bearer auth and drops empty params", async () => {
    const harness = await setup();
    const fetchMock = mockFetch(200, { rows: [{ query: "seo agentur", clicks: 12 }] });

    const result = await harness.executeTool<{ content: string; data: unknown }>("visibly_search_console", {
      gsc_property: "sc-domain:example.com",
      country: "",
      days: 28,
    });

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://app.visibly-ai.com/api/v1/mcp/tools/query-search-console");
    expect((init.headers as Record<string, string>).Authorization).toMatch(/^Bearer resolved:/);
    expect(JSON.parse(String(init.body))).toEqual({ gsc_property: "sc-domain:example.com", days: 28 });
    expect(result.data).toEqual({ rows: [{ query: "seo agentur", clicks: 12 }] });
    expect(result.content).toContain("seo agentur");
  });

  it("maps 402 to a credits hint instead of throwing", async () => {
    const harness = await setup();
    mockFetch(402, { detail: "no credits" });
    const result = await harness.executeTool<{ error?: string }>("visibly_keywords", { domain: "example.com" });
    expect(result.error).toMatch(/credits/i);
  });

  it("returns a setup hint when no API key is configured", async () => {
    const harness = await setup({});
    const fetchMock = mockFetch(200, {});
    const result = await harness.executeTool<{ error?: string }>("visibly_list_projects", {});
    expect(result.error).toMatch(/not configured/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("truncates very large answers", async () => {
    const harness = await setup();
    mockFetch(200, "x".repeat(70_000));
    const result = await harness.executeTool<{ content: string }>("visibly_check_serp", { keyword: "seo" });
    expect(result.content.length).toBeLessThan(61_000);
    expect(result.content).toContain("truncated");
  });
});
