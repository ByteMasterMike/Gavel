# Gavel — Figma file inventory

**File:** [Gavel (Figma)](https://www.figma.com/design/JpG7p0fjaQ0ZM8ss7ahmyP/Gavel?node-id=0-1)

| Field   | Value |
|--------|--------|
| `fileKey` | `JpG7p0fjaQ0ZM8ss7ahmyP` |
| Page (`nodeId`) | `0:1` (Page 1) |

## Top-level screens (pull targets)

Use these `nodeId` values with Figma MCP `get_design_context` / `get_metadata`.

| `nodeId` | Frame name |
|----------|------------|
| `37:2` | Trial Environment - The Gavel |
| `37:172` | Supreme 9 Hall - Leaderboard |
| `37:414` | Classroom Live Room Dashboard |
| `37:711` | The Gavel - Judicial Dashboard |
| `37:896` | Overturned Reveal Screen |

## What was fetched (session)

- **Metadata:** Full page tree under `0:1` (all frames, components, layer names/ids).
- **Design context:** All five frames above — React+Tailwind reference output, screenshots, and time-limited asset URLs from Figma MCP.

## Implementation notes

- Convert generated markup to this repo’s stack (**Next.js**, **Tailwind v4**, **shadcn-style components**). Do **not** add Tailwind solely because Figma output uses it — the project already uses Tailwind.
- **Asset URLs** from MCP responses expire in **~7 days**; re-run `get_design_context` when refreshing exports.
- **`get_variable_defs`** may require a selected layer in the Figma desktop app; file-level variables can be retried from Figma with a selection or via the Variables panel.
