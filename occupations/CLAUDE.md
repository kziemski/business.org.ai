# Occupations Content Guide

This folder contains hierarchical occupation documentation based on O*NET and SOC (Standard Occupational Classification).

## Template

All occupation files should follow the `[Occupation].mdx` template in this folder.

## Folder Structure

```
occupations/
├── CLAUDE.md                    # This file
├── [Occupation].mdx             # Template for all occupation pages
├── Management/                  # Category 11-xxxx
│   ├── index.mdx
│   ├── ChiefExecutives/
│   │   ├── index.mdx
│   │   ├── ChiefSustainabilityOfficers.mdx
│   │   └── ...
│   ├── GeneralAndOperationsManagers.mdx
│   └── ...
├── BusinessAndFinancial/        # Category 13-xxxx
│   ├── index.mdx
│   ├── Accountants.mdx
│   └── ...
├── ComputerAndMathematical/     # Category 15-xxxx
│   ├── index.mdx
│   ├── SoftwareDevelopers.mdx
│   └── ...
└── ...
```

## Naming Conventions

- **Folders**: PascalCase category names (e.g., `Management/`, `Healthcare/`)
- **Files**: PascalCase matching occupation name (e.g., `ChiefExecutives.mdx`)
- **Variants**: Nested under base occupation (e.g., `ChiefExecutives/ChiefSustainabilityOfficers.mdx`)

## Content Requirements

### Required Sections

1. **Overview** - Brief description of the occupation
2. **Classification Hierarchy** - Mermaid diagram showing SOC hierarchy
3. **Key Statistics** - SOC code, job zone, category, task count
4. **Core Tasks** - Mindmap of task groups with GraphDL notation
5. **Skills & Competencies** - Technical and soft skills
6. **Related Occupations** - Same category and cross-functional
7. **Industries** - Industries where this occupation is common
8. **Career Progression** - Career path diagram

### Mermaid Diagrams

Always include:
- Classification hierarchy (graph TD)
- Task mindmap (mindmap)
- Related occupations graph (graph LR)
- Career progression (graph BT)

### GraphDL Task Format

Tasks use semantic dot-notation:
```
verb.Object.preposition.PrepObject

Examples:
- direct.OrganizationsFinancial.to.fund.Operations
- manage.Budget.for.Department
- develop.Strategy.using.MarketData
```

### Cross-References

- Link industries: `/industries/{path}`
- Link processes: `/processes/{path}`
- Link departments: `/departments/{path}`
- Link related occupations: relative paths `../` or `./`

## Data Sources

- **Primary**: `.data/Occupations.tsv` - 1,015 records
- **Tasks**: `.data/OccupationTasks.tsv` - 85,195 task mappings
- **Concepts**: `.data/relationships/Occupations.Concepts.tsv`
- **Expansions**: `.data/OccupationExpansions.tsv` - 334 expansions

## SOC Hierarchy Levels

| Level | Format | Example |
|-------|--------|---------|
| Category | XX | 11 - Management |
| Group | XX-XXXX | 11-1011 Chief Executives |
| Base | XX-XXXX.00 | 11-1011.00 Chief Executives |
| Variant | XX-XXXX.XX | 11-1011.03 Chief Sustainability Officers |

## 23 Major Categories

| Code | Category |
|------|----------|
| 11 | Management |
| 13 | Business and Financial Operations |
| 15 | Computer and Mathematical |
| 17 | Architecture and Engineering |
| 19 | Life, Physical, and Social Science |
| 21 | Community and Social Service |
| 23 | Legal |
| 25 | Educational Instruction and Library |
| 27 | Arts, Design, Entertainment, Sports, Media |
| 29 | Healthcare Practitioners and Technical |
| 31 | Healthcare Support |
| 33 | Protective Service |
| 35 | Food Preparation and Serving |
| 37 | Building and Grounds Cleaning |
| 39 | Personal Care and Service |
| 41 | Sales and Related |
| 43 | Office and Administrative Support |
| 45 | Farming, Fishing, and Forestry |
| 47 | Construction and Extraction |
| 49 | Installation, Maintenance, and Repair |
| 51 | Production |
| 53 | Transportation and Material Moving |
| 55 | Military Specific |

## When Creating/Updating Content

1. Read the template `[Occupation].mdx` first
2. Pull data from `.data/Occupations.tsv` for the specific SOC code
3. Pull tasks from `.data/OccupationTasks.tsv`
4. Pull concepts from `.data/relationships/Occupations.Concepts.tsv`
5. Generate mermaid diagrams based on actual task data
6. Group tasks by verb category for the mindmap
7. Ensure all cross-references are valid paths
