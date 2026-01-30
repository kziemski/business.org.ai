# Industries Content Guide

This folder contains hierarchical industry documentation based on NAICS (North American Industry Classification System).

## Template

All industry files should follow the `[Industry].mdx` template in this folder.

## Folder Structure

```
industries/
├── CLAUDE.md                    # This file
├── [Industry].mdx               # Template for all industry pages
├── Agriculture/                 # Sector 11
│   ├── index.mdx
│   ├── CropProduction/
│   │   ├── index.mdx
│   │   ├── OilseedAndGrainFarming/
│   │   │   ├── index.mdx
│   │   │   ├── SoybeanFarming.mdx
│   │   │   └── CornFarming.mdx
│   │   └── ...
│   └── ...
├── Manufacturing/               # Sectors 31-33
│   ├── index.mdx
│   ├── FoodManufacturing/
│   ├── ChemicalManufacturing/
│   ├── ComputerAndElectronics/
│   └── ...
└── ...
```

## Naming Conventions

- **Folders**: PascalCase, concise names without repeating parent (e.g., `Manufacturing/Automotive/` not `Manufacturing/AutomotiveManufacturing/`)
- **Files**: PascalCase matching the industry name (e.g., `SoybeanFarming.mdx`)
- **index.mdx**: Required for each folder, contains the parent industry overview

## Content Requirements

### Required Sections

1. **Overview** - Brief description of the industry
2. **Industry Hierarchy** - Mermaid diagram showing NAICS hierarchy position
3. **Key Statistics** - NAICS code, level, parent/child relationships
4. **Related Occupations** - Link to relevant occupations with task counts
5. **Core Business Processes** - Mermaid flowchart of primary/support processes
6. **Sub-Industries** - Table of child industries (if applicable)

### Mermaid Diagrams

Always include:
- Hierarchy diagram (graph TD)
- Process flowchart (flowchart LR)
- Value chain diagram (graph LR)

### Cross-References

- Link occupations: `/occupations/{path}`
- Link processes: `/processes/{path}`
- Link departments: `/departments/{path}`
- Link parent/sibling industries: relative paths `../` or `./`

## Data Sources

- **Primary**: `.data/Industries.tsv` - 2,770 records
- **Relationships**: `.data/IndustryProcesses.tsv` - industry-process mappings
- **Crosswalks**: `.standards/.crosswalks/Industry.Occupation.tsv`

## NAICS Hierarchy Levels

| Level | Digits | Example |
|-------|--------|---------|
| Sector | 2 | 31-33 Manufacturing |
| Subsector | 3 | 336 Transportation Equipment |
| Industry Group | 4 | 3361 Motor Vehicle |
| Industry | 5 | 33611 Auto Manufacturing |
| National Industry | 6 | 336111 Automobile Manufacturing |

## When Creating/Updating Content

1. Read the template `[Industry].mdx` first
2. Pull data from `.data/Industries.tsv` for the specific NAICS code
3. Pull related processes from `.data/IndustryProcesses.tsv`
4. Pull related occupations from `.standards/.crosswalks/Industry.Occupation.tsv`
5. Generate mermaid diagrams based on actual data
6. Ensure all cross-references are valid paths
