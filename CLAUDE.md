# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

business.org.ai is a unified business ontology that transforms multiple industry standards (O*NET, NAICS, APQC, GS1, etc.) into a semantic graph of business entities. The project uses GraphDL notation to parse natural language statements into semantic triples (Subject.verb.Object.preposition.PrepObject).

## Build & Development Commands

```bash
# Install dependencies
npm install

# Build everything (ingest standards + generate interfaces)
npm run build

# Build all including graph ingestion
npm run build:all

# Individual commands
npm run ingest:graph         # Ingest source data from .standards/
npm run ingest:standards     # Process standard definitions
npm run generate:data        # Generate TSV data files
npm run generate:interfaces  # Generate TypeScript interfaces from TSVs

# Run tests
npm test                     # Run all tests once
npm run test:watch          # Watch mode
```

## Project Architecture

### Data Flow

```
.standards/ (submodule)     →  .scripts/*.ts  →  .data/*.tsv
├── ONET/                      Transformation    ├── Actions.tsv
├── NAICS/                     scripts           ├── Tasks.tsv
├── APQC/                                        ├── Events.tsv
├── GS1/                                         ├── Occupations.tsv
└── ...                                          └── relationships/
```

### Key Directories

- `.data/` - Generated TSV files containing unified business entities
- `.data/relationships/` - Entity relationship files (e.g., Tasks.Actions.tsv)
- `.scripts/` - TypeScript transformation scripts
- `.standards/` - Git submodule with raw standard data sources
- `.tests/` - Vitest test files
- `graphdl/` - GraphDL semantic parser submodule

### Entity Types

| Entity | Namespace | Description |
|--------|-----------|-------------|
| Task | tasks.org.ai | Work tasks in GraphDL format (verb.Object.prep.PrepObject) |
| Action | actions.org.ai | Semantic actions extracted from tasks |
| Event | events.org.ai | Past-tense events derived from actions |
| Occupation | occupations.org.ai | Job roles from O*NET |
| Process | process.org.ai | Business processes from APQC |
| Concept | concepts.org.ai | Noun phrases extracted from tasks/processes |

### GraphDL Semantic Format

Tasks and Actions use GraphDL dot-notation:
```
verb.Object.preposition.PrepObject

Examples:
- direct.OrganizationsFinancialActivities.to.FundOperations
- manage.Budget.for.Department
- develop.Strategy.using.MarketData
```

### TSV Column Structure

Entity files follow this pattern:
```
ns  type  id  name  description  shortName  verb  object  preposition  prepObject  source  sourceType
```

Relationship files:
```
ns  from  to  predicate  reverse
```

### Key Scripts

- `generate-interfaces.ts` - Generates TypeScript types from TSV data
- `generate-data.ts` - Transforms standards into unified TSV format
- `ingest-sources.ts` - Imports raw data from .standards/
- `types.ts` - Abstract interface definitions (Entity, Relationship, AbstractTask, etc.)

## Testing

Tests are in `.tests/` and use Vitest:
```bash
npm test                              # Run all tests
npx vitest run .tests/data-quality   # Run specific test file
```

## Important Patterns

### ID Normalization
All IDs use PascalCase: `ActiveListening`, `ChiefExecutives`, `FinancialActivities`

### Namespace URLs
Each entity type maps to a canonical domain:
- `tasks.org.ai/direct.Budget.for.Operations`
- `actions.org.ai/manage.Projects`
- `events.org.ai/Budget.directed`

### Abstract Interface Hierarchy
```
Entity (base)
├── AbstractRole (Occupations, Jobs)
├── AbstractTask (Tasks with GraphDL components)
├── AbstractAction (Semantic actions)
├── AbstractEvent (Past-tense events)
├── AbstractProcess (APQC processes)
├── AbstractConcept (Extracted nouns)
└── HierarchicalEntity (Industries, Products)
```

## Hierarchical Content Structure

The project includes hierarchical MDX content for browsing business entities:

### Content Directories

| Directory | Source | Hierarchy Depth | Template |
|-----------|--------|-----------------|----------|
| `industries/` | NAICS | 6 levels (Sector→National) | `[Industry].mdx` |
| `occupations/` | O*NET/SOC | 4 levels (Category→Variant) | `[Occupation].mdx` |
| `departments/` | APQC + Common | 3 levels (Function→Team) | `[Department].mdx` |
| `processes/` | APQC PCF | 5 levels (Category→Activity) | `[Process].mdx` |

### Content Structure

Each directory contains:
- `CLAUDE.md` - Guidelines for generating/editing content
- `[Entity].mdx` - Template file defining the MDX structure
- Hierarchical folders with `index.mdx` files

### MDX Content Requirements

All content files should include:
- **Mermaid diagrams** for hierarchy, process flows, relationships
- **Key statistics** from source data (codes, levels, counts)
- **Cross-references** to related entities using relative paths
- **GraphDL notation** for tasks and actions where applicable

### Naming Conventions

- **Folders**: PascalCase without redundancy (`Manufacturing/Automotive/` not `Manufacturing/AutomotiveManufacturing/`)
- **Files**: PascalCase matching entity ID (`ChiefExecutives.mdx`)
- **Paths**: Use concise names that don't repeat parent context

### Generating Content

```bash
# Generate hierarchy stubs
npx tsx .scripts/generate-hierarchy.ts
```

Content is generated from `.data/` TSV files and should follow the templates in each directory's `[Entity].mdx` file.
