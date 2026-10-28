// Compares the REST paths in src/tools.ts with the Visibly MCP client (api_client.py on GitHub).
// Fails when a plugin tool points to a path the MCP server no longer uses. Lists uncovered endpoints.
// Usage: npm run check:mcp   (optional: MCP_CLIENT_URL=<raw url> or a local file path)
import { readFile } from "node:fs/promises";

const source =
  process.env.MCP_CLIENT_URL ??
  "https://raw.githubusercontent.com/AntonioBlago/visiblyai-mcp-server/master/src/visiblyai_mcp/api_client.py";

const client = source.startsWith("http")
  ? await fetch(source).then((r) => {
      if (!r.ok) throw new Error(`Could not load ${source}: HTTP ${r.status}`);
      return r.text();
    })
  : await readFile(source, "utf8");

const mcpPaths = new Set([...client.matchAll(/_(?:post|get)\(\s*"([^"]+)"/g)].map((m) => m[1]));
const tools = await readFile(new URL("../src/tools.ts", import.meta.url), "utf8");
const pluginPaths = [...tools.matchAll(/path:\s*"([^"]+)"/g)].map((m) => m[1]);

if (mcpPaths.size === 0 || pluginPaths.length === 0) {
  console.error("No paths found; the parser no longer matches the source files.");
  process.exit(2);
}

const missing = pluginPaths.filter((p) => !mcpPaths.has(p));
const uncovered = [...mcpPaths].filter((p) => p.startsWith("/tools/") && !pluginPaths.includes(p)).sort();

console.log(`Plugin tools: ${pluginPaths.length}, MCP client endpoints: ${mcpPaths.size}`);
console.log(`Not exposed in the plugin (${uncovered.length}): ${uncovered.join(", ")}`);
if (missing.length) {
  console.error(`MISSING in the MCP client, update src/tools.ts: ${missing.join(", ")}`);
  process.exit(1);
}
console.log("OK: every plugin path exists in the MCP client.");
