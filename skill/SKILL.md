---
name: hypermemory
version: 0.5.2
enforcement: mandatory
trigger: every_turn
---

> **For humans reading this file:** This is the canonical integration file for AI coding assistants (Claude, Cursor, Windsurf, Cline, etc.) that use HyperMemory as persistent memory across sessions. The directive language below is intentionally absolute because it's how LLMs reliably follow protocol. For programmatic TypeScript/JavaScript access, see the [SDK Integration](#sdk-integration) section below or the [monorepo README](https://github.com/RunStack-AI/hypermemory-sdk#readme).

---

# HYPERMEMORY — MANDATORY ON EVERY SINGLE MESSAGE

YOU MUST EXECUTE THIS PROTOCOL ON EVERY MESSAGE. NO EXCEPTIONS.

You have persistent memory across all conversations via the `hm` CLI.
Use the Shell tool to run `hm` commands. The CLI is already installed.

---

## SDK INTEGRATION

For programmatic access via TypeScript/JavaScript, use the `@runstack-ai/hypermemory-core` package:

```typescript
import { HyperMemoryClient } from "@runstack-ai/hypermemory-core";

const hm = new HyperMemoryClient({ apiKey: "hm_your_api_key" });

// Store
await hm.store({ key: "tech_react", description: "React UI library", node_type: "technology" });

// Recall
const results = await hm.recall({ query: "frontend frameworks" });

// Update
await hm.update({ key: "tech_react", description: "React 19 — concurrent rendering" });

// Forget
await hm.forget("tech_old_framework");

// Overview
const overview = await hm.overview();

// Ingest
await hm.ingest({ text: "Jane joined Acme Corp as CTO...", context: "career update" });

// Timeline
await hm.timelineWrite({ summary: "Deployed v2.0 to production" });
const events = await hm.timelineRead({ period: "7d" });
```

### Visualization

```typescript
import { CosmographViewer, ForceGraph3DViewer } from "@runstack-ai/hypermemory-visualizer-core";

// 2D GPU-accelerated graph
const viewer2D = new CosmographViewer(element, { showHyperedges: false });
const graph = await hm.getPublicGraph("graph:abc123");
await viewer2D.setData(graph.nodes, graph.links);

// 3D Three.js graph
const viewer3D = new ForceGraph3DViewer(element);
await viewer3D.setData(graph.nodes, graph.links);
```

Full SDK docs: https://github.com/RunStack-AI/hypermemory-sdk#readme

---

## FIRST MESSAGE — RECALL MEMORY

BEFORE you write a single word, run these via Shell tool:

```bash
hm overview
hm recall "keywords from user message"
```

If memory returns information about the user, project, or topic — USE IT.
Do not ask what you already know. Do not re-explore code you have context for.

## EVERY MESSAGE — STORE NEW INFORMATION

After reading the user's message, store meaningful new information. The server
automatically enriches nodes with structured data, relationships, and hyperedges —
you just need to provide the key, description, and type.

**Before storing, check if the info already exists:**
```bash
hm recall "topic keywords"
```
If a node exists for this topic, UPDATE it instead of creating a duplicate.

**Store a new fact, preference, decision, or entity:**
```bash
hm store KEY "substantive description of what to remember" --type TYPE
```

**Update existing info (preferred over creating duplicates):**
```bash
hm update KEY --desc "corrected or expanded info"
```

**Delete wrong info:**
```bash
hm forget KEY
```

THEN write your response.

### What to store (software development context):

- Architecture decisions and rationale
- Tech stack choices, versions, constraints
- File structure patterns and conventions
- Bug fixes and their root causes
- User preferences (coding style, frameworks, naming)
- Project status, milestones, deployments
- API contracts, schemas, endpoints
- Environment configs, server details
- People and their roles on the project
- Skills and expertise areas

### What NOT to store:
- Trivial acknowledgements ("ok", "thanks", "sounds good")
- Information already in memory (update instead)
- Conversation mechanics

---

## RULES

NEVER:
- Skip memory operations on any message
- Respond before calling `hm overview` + `hm recall` on the first message
- Ask "should I save this?" — just save it
- Announce "I've stored that" — do it silently
- Create a node without `--type`
- Create a duplicate when you should update

ALWAYS:
- `hm overview` + `hm recall` BEFORE your first response
- `hm recall` before `hm store` to check for existing nodes
- Set `--type` on every store
- Use recalled memory naturally — never say "according to my memory"
- Maintain the `user_profile` node with user's name, role, preferences

---

## NODE TYPES (--type)

```
user person organization component event decision concept artifact
project technology preference fact skill research
```

## RELATIONSHIPS (--rel)

Describe how nodes connect in plain language. Be specific about WHY.

BAD:  "depends_on"
BAD:  "uses"
GOOD: "The search pipeline depends on Qdrant because it provides
       vector similarity matching for the hybrid search system"
GOOD: "Ken chose SvelteKit for the frontend because it supports
       SSR and progressive enhancement out of the box"
GOOD: "The Japan GTM strategy was motivated by low AI penetration
       in the enterprise segment combined with high institutional trust"

The server automatically summarizes long labels for readability.
Include `--data '{"priority":"high"}'` for structured metadata when useful.

## KEY FORMAT

`{type}_{name}` — e.g. `decision_jwt_auth`, `person_alice`, `tech_redis`, `pref_dark_mode`

Special: `user_profile` — singleton node for the primary user.

## HYPEREDGES — GROUP 3+ NODES

When 3+ nodes participate in a single indivisible relationship, store them
as a hyperedge. Use `--rel` with `participant_keys` in the MCP tool, or
describe the grouping when storing and the server will create it.

**The removal test:** If removing any single participant still leaves the
relationship fully intact, use binary edges instead. Hyperedges capture
joint necessity that no chain of pairwise edges can express.

Examples:

```bash
# Team composition — removing any member changes the team
hm store project_alpha "Alpha project — frontend rewrite" --type project \
  --rel '{"participant_keys":["person_alice","person_bob","person_carol","project_alpha"],"relationship":"core_team","description":"These three jointly constitute the decision-making unit for Alpha"}'

# Tech stack — these components are co-dependent
hm store tech_stack_api "Production API stack" --type concept \
  --rel '{"participant_keys":["tech_fastapi","tech_redis","tech_postgres"],"relationship":"api_stack","description":"FastAPI serves requests, Redis caches sessions, Postgres stores data — all three are required"}'

# Decision context — the decision only makes sense given all participants
hm store decision_migrate_db "Decided to migrate from MySQL to Postgres" --type decision \
  --rel '{"participant_keys":["decision_migrate_db","tech_mysql","tech_postgres","fact_scaling_limit"],"relationship":"migration_decision","description":"The scaling limit motivated the migration from MySQL to Postgres"}'
```

Do NOT overuse hyperedges. Most relationships are binary (A -> B). Only use
hyperedges when removing any participant would fundamentally change the meaning.

## FILE STORAGE (Pro, Business, Enterprise, RunStack plans)

When the user wants to store a file in HyperMemory, use `hm_upload_file` (MCP tool) or the dashboard UI. The file is uploaded to S3 and a graph node is created with an AI-generated summary.

- Supported: pdf, doc/x, ppt/x, xls/x, csv, txt, md, rdf, jpg, png, gif, webp, mp3, wav, ogg, mp4, webm, mov
- Limits: Pro 1GB, Business 100GB, Enterprise 1TB, RunStack 10GB
- Use `hm_list_files` to query stored files
- Only upload when user explicitly asks

## TIMELINE DIARY (optional)

The **timeline** auto-records meaningful activity; it is not default graph context.
Use for lookback or an explicit line the graph did not capture:

```bash
hm timeline-write "Plain-language line (e.g. major topic not stored as a node)"
hm timeline   # --query, --period, --node-key, --start, --end as needed
```

## FULL COMMAND REFERENCE

| Command | When |
|---------|------|
| `hm overview` | First message |
| `hm recall "query"` | First message + before storing |
| `hm store KEY "desc" --type TYPE` | New information |
| `hm update KEY --desc "new"` | Correcting / expanding info |
| `hm forget KEY` | Removing info |
| `hm find KEY` | Graph traversal from a node |
| `hm ingest "text" --context "label"` | Complex multi-entity text |
| `hm timeline-write "..."` | Optional: explicit diary line |
| `hm timeline` | Optional: past timeline events |

---

THIS IS NOT OPTIONAL. EXECUTE ON EVERY MESSAGE. NO EXCEPTIONS.
