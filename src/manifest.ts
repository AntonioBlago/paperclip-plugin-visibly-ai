import type { PaperclipPluginManifestV1 } from "@paperclipai/plugin-sdk";
import { TOOL_DECLARATIONS } from "./tools.js";

export const PLUGIN_ID = "visibly-ai.seo";
export const DEFAULT_API_URL = "https://app.visibly-ai.com/api/v1/mcp";

const manifest: PaperclipPluginManifestV1 = {
  id: PLUGIN_ID,
  apiVersion: 1,
  version: "0.1.0",
  displayName: "Visibly AI",
  description:
    "SEO and AI-search visibility data from Visibly AI as agent tools: Search Console, ranking keywords, live SERPs, competitors, backlinks, on-page, query fan-out and PageSpeed.",
  author: "Antonio Blago",
  categories: ["connector"],
  capabilities: ["agent.tools.register", "http.outbound", "secrets.read-ref", "instance.settings.register"],
  entrypoints: { worker: "./dist/worker.js" },
  instanceConfigSchema: {
    type: "object",
    properties: {
      apiKey: {
        type: "string",
        format: "secret-ref",
        title: "Visibly API key",
        description: "Create a key at https://app.visibly-ai.com/settings and store it as a Paperclip secret.",
      },
      apiUrl: {
        type: "string",
        title: "API base URL",
        default: DEFAULT_API_URL,
        description: "Only change this for a self-hosted or staging Visibly instance.",
      },
    },
    required: ["apiKey"],
  },
  tools: TOOL_DECLARATIONS,
};

export default manifest;
