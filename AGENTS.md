# Notes for agents

This repository is the Paperclip connector for Visibly AI. It turns Visibly REST endpoints into read-only
Paperclip agent tools. Read this file before changing tools, the manifest or a release.

## How the pieces fit

- `src/tools.ts` is the single source of truth: one entry per tool with name, description, JSON schema and the
  REST path under `https://app.visibly-ai.com/api/v1/mcp`.
- `src/manifest.ts` declares those tools. Paperclip registers plugin tools **from the manifest**, so the tool
  list is static per release. New Visibly features never appear here automatically.
- `src/worker.ts` handles every tool the same way: resolve the API key secret, `POST` the cleaned parameters,
  map 401, 402, 403 and 429 to readable messages, truncate answers above 60,000 characters.
- The Visibly MCP server ([AntonioBlago/visiblyai-mcp-server](https://github.com/AntonioBlago/visiblyai-mcp-server))
  calls the same endpoints. Its `src/visiblyai_mcp/api_client.py` is the reference for paths and parameters.
  Cross-repository status lives in its `docs/PLUGIN_MCP_HANDOFF.md`.

## Staying in sync with the MCP server

The plugin and the MCP server share the backend, so data and behaviour of existing endpoints stay identical.
What does **not** sync by itself:

| Change in the MCP server or backend | What to do here |
| --- | --- |
| New endpoint worth exposing to Paperclip agents | Add an entry to `src/tools.ts`, a test case, a README row, then release |
| Path renamed or removed in `api_client.py` | `npm run check:mcp` fails; update the path and release |
| Parameter renamed or added | Update the schema in `src/tools.ts`; old names silently stop working |
| Credits or permissions changed | Update the tool description and the README credits column |

Run `npm run check:mcp` before every release. It loads `api_client.py` from GitHub and fails when a path in
`src/tools.ts` no longer exists there. It also lists endpoints the plugin does not cover yet.

## Rules

- Only read-only tools. Writing drafts, scoring content, social posts and memory stay in the MCP server, because
  they need the editor permissions and review flow there.
- Never put API keys, customer domains or real Search Console data into code, tests, fixtures or docs. Tests use
  `example.com` and mocked `fetch`. The live check in `.local/` is gitignored and reads the key from the environment.
- Write the brand as Visibly AI and the method as Neuro-SEO-System®.
- Keep the shared tool handler generic. A tool that needs special handling is a sign it belongs in the MCP server.

## Checks and release

```bash
npm run typecheck
npm test
npm run check:mcp
npm run build
```

1. Bump `version` in both `package.json` and `src/manifest.ts`.
2. Commit, tag `vX.Y.Z`, push, then `npm publish`. `prepublishOnly` runs typecheck, tests and build again.
3. Note the release with date, version and tool count in `docs/PLUGIN_MCP_HANDOFF.md` of the MCP server.
4. Running Paperclip instances update with `paperclipai plugin install paperclip-plugin-visibly-ai`.
