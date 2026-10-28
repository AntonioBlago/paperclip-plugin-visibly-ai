import type { PluginToolDeclaration } from "@paperclipai/plugin-sdk";

/** A Paperclip agent tool backed by one Visibly AI REST endpoint (POST, JSON body = tool parameters). */
export interface VisiblyTool extends PluginToolDeclaration {
  path: string;
}

const str = (description: string, extra: Record<string, unknown> = {}) => ({ type: "string", description, ...extra });
const int = (description: string, def: number, max: number) => ({ type: "integer", description, default: def, minimum: 1, maximum: max });
const location = str("Target market as a country name, e.g. Germany, United States, Austria.", { default: "Germany" });
const language = str("Search language, e.g. German, English.", { default: "German" });
const credits = " Uses Visibly credits.";

// ponytail: read-only subset of the Visibly API; write tools (drafts, social posts) stay in the Visibly MCP server.
export const TOOLS: VisiblyTool[] = [
  {
    name: "visibly_list_projects",
    displayName: "Visibly: list projects",
    description: "Lists the Visibly AI projects of the connected account with domain, market and Google connections. Call this first to find the Search Console property of a client.",
    path: "/tools/list-projects",
    parametersSchema: { type: "object", properties: {} },
  },
  {
    name: "visibly_search_console",
    displayName: "Visibly: query Search Console",
    description: "Queries live Google Search Console data (clicks, impressions, CTR, position) of a connected property, grouped by query, page, country or device.",
    path: "/tools/query-search-console",
    parametersSchema: {
      type: "object",
      properties: {
        gsc_property: str("Search Console property, e.g. sc-domain:example.com or https://www.example.com/. Empty = project default."),
        dimension: str("Grouping dimension.", { enum: ["query", "page", "country", "device", "date"], default: "query" }),
        days: int("Look-back window in days.", 28, 480),
        limit: int("Maximum rows.", 100, 25000),
        country: str("Optional ISO-3166 alpha-3 country filter, e.g. deu."),
        device: str("Optional device filter.", { enum: ["", "desktop", "mobile", "tablet"] }),
      },
    },
  },
  {
    name: "visibly_keywords",
    displayName: "Visibly: ranking keywords",
    description: "Returns the organic keywords a domain ranks for, with position, search volume and URL." + credits,
    path: "/tools/keywords",
    parametersSchema: {
      type: "object",
      properties: { domain: str("Domain without protocol, e.g. example.com."), location, limit: int("Maximum keywords.", 1000, 10000) },
      required: ["domain"],
    },
  },
  {
    name: "visibly_traffic_snapshot",
    displayName: "Visibly: traffic snapshot",
    description: "Estimated organic traffic, keyword count and position distribution of a domain." + credits,
    path: "/tools/traffic-snapshot",
    parametersSchema: { type: "object", properties: { domain: str("Domain without protocol."), location }, required: ["domain"] },
  },
  {
    name: "visibly_competitors",
    displayName: "Visibly: organic competitors",
    description: "Finds the organic search competitors of a domain by keyword overlap." + credits,
    path: "/tools/competitors",
    parametersSchema: {
      type: "object",
      properties: { domain: str("Domain without protocol."), location, language, limit: int("Maximum competitors.", 10, 100) },
      required: ["domain"],
    },
  },
  {
    name: "visibly_backlinks",
    displayName: "Visibly: backlinks",
    description: "Backlink profile of a domain: linking pages, anchors and link attributes." + credits,
    path: "/tools/backlinks",
    parametersSchema: {
      type: "object",
      properties: { domain: str("Domain without protocol."), location, limit: int("Maximum backlinks.", 100, 1000) },
      required: ["domain"],
    },
  },
  {
    name: "visibly_check_serp",
    displayName: "Visibly: live SERP",
    description: "Live Google results for a keyword including SERP features, to see who ranks and which intent Google serves." + credits,
    path: "/tools/check-serp",
    parametersSchema: {
      type: "object",
      properties: { keyword: str("Search query."), location, language, depth: int("Number of results.", 10, 100) },
      required: ["keyword"],
    },
  },
  {
    name: "visibly_validate_keywords",
    displayName: "Visibly: keyword volumes",
    description: "Search volume, CPC and competition for a list of keywords, plus related keyword ideas." + credits,
    path: "/tools/validate-keywords",
    parametersSchema: {
      type: "object",
      properties: {
        keywords: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 1000, description: "Keywords to validate." },
        location,
        language,
        top_n: int("Number of related ideas.", 50, 500),
      },
      required: ["keywords"],
    },
  },
  {
    name: "visibly_onpage_analysis",
    displayName: "Visibly: on-page analysis",
    description: "On-page SEO analysis of one URL against a focus keyword: title, headings, content coverage, technical findings." + credits,
    path: "/tools/onpage-analysis",
    parametersSchema: {
      type: "object",
      properties: { url: str("Full URL including https://."), keyword: str("Focus keyword.") },
      required: ["url", "keyword"],
    },
  },
  {
    name: "visibly_query_fanout",
    displayName: "Visibly: AI query fan-out",
    description: "Shows the sub-queries AI search (Google AI Mode, ChatGPT) derives from a keyword and how well a URL covers them." + credits,
    path: "/tools/query-fanout",
    parametersSchema: {
      type: "object",
      properties: {
        url: str("Full URL to evaluate."),
        keyword: str("Main keyword."),
        language: str("Language code, e.g. en or de.", { default: "en" }),
        gsc_property: str("Optional Search Console property to include real queries."),
      },
      required: ["url", "keyword"],
    },
  },
  {
    name: "visibly_check_pagespeed",
    displayName: "Visibly: PageSpeed",
    description: "Core Web Vitals and Lighthouse performance of a URL.",
    path: "/tools/check-pagespeed",
    parametersSchema: {
      type: "object",
      properties: { url: str("Full URL."), strategy: str("Device strategy.", { enum: ["mobile", "desktop"], default: "mobile" }) },
      required: ["url"],
    },
  },
];

/** Manifest form of the tools (without the internal endpoint path). */
export const TOOL_DECLARATIONS: PluginToolDeclaration[] = TOOLS.map(({ path: _path, ...declaration }) => declaration);
