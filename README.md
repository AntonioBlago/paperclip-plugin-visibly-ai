# Visibly AI connector for Paperclip

Give your [Paperclip](https://github.com/paperclipai/paperclip) agents live SEO and AI-search data from
[Visibly AI](https://www.visibly-ai.com): Google Search Console, ranking keywords, live SERPs, competitors,
backlinks, on-page analysis, AI query fan-out and PageSpeed.

Agents call the tools like any other Paperclip plugin tool. Paperclip stores your Visibly API key as a secret.
The plugin resolves the key on each call and never logs or caches it.

## Tools

| Tool | What the agent gets | Credits |
| --- | --- | --- |
| `visibly_list_projects` | Your Visibly projects with domain, market and Google connections | no |
| `visibly_search_console` | Live Search Console rows by query, page, country, device or date | no |
| `visibly_keywords` | Organic keywords of a domain with position, volume and URL | yes |
| `visibly_traffic_snapshot` | Estimated organic traffic and position distribution | yes |
| `visibly_competitors` | Organic competitors by keyword overlap | yes |
| `visibly_backlinks` | Backlink profile with anchors and attributes | yes |
| `visibly_check_serp` | Live Google results and SERP features for a keyword | yes |
| `visibly_validate_keywords` | Search volume, CPC, competition and related ideas | yes |
| `visibly_onpage_analysis` | On-page audit of a URL against a focus keyword | yes |
| `visibly_query_fanout` | Sub-queries AI search derives from a keyword and how well a URL covers them | yes |
| `visibly_check_pagespeed` | Core Web Vitals and Lighthouse performance | no |

All tools are read-only. Writing drafts, scoring content or scheduling social posts stays in the
[Visibly MCP server](https://github.com/AntonioBlago/visiblyai-mcp-server).

## Install

Requirements: Paperclip 2026.1023.0 or newer, Node 24.11 or newer, a Visibly account.

```bash
paperclipai plugin install paperclip-plugin-visibly-ai
```

From source:

```bash
git clone https://github.com/AntonioBlago/paperclip-plugin-visibly-ai.git
cd paperclip-plugin-visibly-ai
npm install
npm run build
paperclipai plugin install "$(pwd)"
```

## Configure

1. Create an API key in [Visibly settings](https://app.visibly-ai.com/settings).
2. In Paperclip, open **Settings, Secrets** and store the key as a secret.
3. Open **Settings, Plugins, Visibly AI** and pick that secret for **Visibly API key**.
4. Ask an agent to run `visibly_list_projects`. A list of your projects confirms the connection.

Search Console and Analytics tools need the Google connection of the matching Visibly project.
Tools marked with credits use your Visibly balance. A missing balance returns a clear message to the agent.

## Example routine

A weekly routine assigned to an SEO agent:

> For every client project, call `visibly_search_console` for the last 7 days and the 7 days before.
> Report changes above 20 percent, the five biggest losing pages and keywords on positions 8 to 20.
> Open a sub-issue for each real problem.

## Development

```bash
npm install
npm run typecheck
npm test
npm run build
```

Tests run against the official Paperclip test harness with a mocked Visibly API. They make no network calls.

## About

Built by [Antonio Blago](https://www.antonioblago.com), creator of Visibly AI and the Neuro-SEO System®.
Issues and pull requests are welcome.

License: MIT
