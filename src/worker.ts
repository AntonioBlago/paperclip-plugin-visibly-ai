import { definePlugin, runWorker, type PluginContext, type ToolResult } from "@paperclipai/plugin-sdk";
import { DEFAULT_API_URL } from "./manifest.js";
import { TOOLS, type VisiblyTool } from "./tools.js";

const MAX_CONTENT_CHARS = 60_000;

const ERRORS: Record<number, string> = {
  401: "Visibly rejected the API key. Check the key in the plugin settings (https://app.visibly-ai.com/settings).",
  402: "Not enough Visibly credits for this tool. Top up at https://app.visibly-ai.com/settings.",
  403: "The API key has no access to this project or tool.",
  429: "Visibly rate limit reached. Wait a minute and retry.",
};

/** Drops empty optional parameters so the API applies its own defaults. */
export function cleanParams(params: unknown): Record<string, unknown> {
  const input = params && typeof params === "object" ? (params as Record<string, unknown>) : {};
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== "" && value !== null && value !== undefined));
}

export async function callVisibly(ctx: PluginContext, tool: VisiblyTool, params: unknown, companyId?: string): Promise<ToolResult> {
  const config = await ctx.config.get(companyId);
  if (!config.apiKey) {
    return { error: "Visibly AI is not configured: add the API key in the plugin settings." };
  }
  // Resolved per call and never cached or logged (Paperclip secret contract).
  const apiKey = await ctx.secrets.resolve(config.apiKey as never, { companyId, configPath: "apiKey" });
  const base = String(config.apiUrl || DEFAULT_API_URL).replace(/\/+$/, "");

  let response: Response;
  try {
    response = await ctx.http.fetch(base + tool.path, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "User-Agent": "paperclip-plugin-visibly-ai" },
      body: JSON.stringify(cleanParams(params)),
    });
  } catch (err) {
    return { error: `Visibly AI is unreachable: ${(err as Error).message}` };
  }

  const text = await response.text();
  if (!response.ok) {
    return { error: ERRORS[response.status] ?? `Visibly AI returned HTTP ${response.status}: ${text.slice(0, 500)}` };
  }
  let data: unknown = text;
  try {
    data = JSON.parse(text);
  } catch {
    // plain-text answer, pass through
  }
  const content = typeof data === "string" ? data : JSON.stringify(data, null, 1);
  return {
    content: content.length > MAX_CONTENT_CHARS ? `${content.slice(0, MAX_CONTENT_CHARS)}\n… (truncated, narrow the query or lower the limit)` : content,
    data,
  };
}

const plugin = definePlugin({
  async setup(ctx) {
    for (const tool of TOOLS) {
      const { path: _path, ...declaration } = tool;
      ctx.tools.register(tool.name, declaration, (params, runCtx) => callVisibly(ctx, tool, params, runCtx?.companyId));
    }
    ctx.logger.info("Visibly AI tools registered", { count: TOOLS.length });
  },

  async onHealth() {
    return { status: "ok", message: `${TOOLS.length} Visibly AI tools registered` };
  },

  async onValidateConfig(config) {
    const errors: string[] = [];
    if (!config.apiKey) errors.push("API key is required.");
    if (config.apiUrl && !/^https:\/\//.test(String(config.apiUrl))) errors.push("API base URL must start with https://.");
    return { ok: errors.length === 0, errors };
  },
});

export default plugin;
runWorker(plugin, import.meta.url);
