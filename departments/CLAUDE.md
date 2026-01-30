# Departments Content Guide

This folder contains hierarchical department/functional area documentation based on APQC Process Groups and organizational structures.

## Template

All department files should follow the `[Department].mdx` template in this folder.

## Folder Structure

```
departments/
├── CLAUDE.md                    # This file
├── [Department].mdx             # Template for all department pages
├── Executive/                   # C-Suite and Strategy
│   ├── index.mdx
│   ├── OfficeOfTheCEO.mdx
│   ├── Strategy.mdx
│   └── ...
├── Operations/                  # Operations Functions
│   ├── index.mdx
│   ├── SupplyChain.mdx
│   ├── Manufacturing.mdx
│   ├── QualityControl.mdx
│   └── ...
├── Finance/                     # Finance & Accounting
│   ├── index.mdx
│   ├── Accounting.mdx
│   ├── Treasury.mdx
│   ├── Billing.mdx
│   └── ...
├── Sales/                       # Sales & Marketing
│   ├── index.mdx
│   ├── Marketing.mdx
│   └── ...
├── Support/                     # Customer Support
│   ├── index.mdx
│   └── ...
├── HR/                          # HR Functions
│   ├── index.mdx
│   ├── Recruiting.mdx
│   ├── Training.mdx
│   └── ...
├── Technology/                  # IT & Systems
│   ├── index.mdx
│   ├── Infrastructure.mdx
│   ├── Applications.mdx
│   └── ...
└── Legal/                       # Legal & Compliance
    ├── index.mdx
    ├── Compliance.mdx
    └── RiskManagement.mdx
```

## Naming Conventions

- **Folders**: PascalCase functional area names (e.g., `Finance/`, `Operations/`)
- **Files**: PascalCase department names (e.g., `Accounting.mdx`, `SupplyChain.mdx`)
- **Avoid redundancy**: Use `Finance/Treasury.mdx` not `Finance/FinanceTreasury.mdx`

## Content Requirements

### Required Sections

1. **Overview** - Brief description of the department's function
2. **Department Structure** - Mermaid org chart showing teams/units
3. **Key Statistics** - Function code, parent, process group, headcount
4. **Core Responsibilities** - Mindmap of responsibility areas
5. **Key Roles** - Table of occupations in this department
6. **Processes Owned** - Primary and support processes
7. **Cross-Functional Relationships** - Upstream/downstream dependencies

### Mermaid Diagrams

Always include:
- Department structure (graph TD)
- Responsibility mindmap (mindmap)
- Process ownership flowchart (flowchart TB)
- Cross-functional relationships (graph LR)

### Cross-References

- Link occupations: `/occupations/{path}`
- Link processes: `/processes/{path}`
- Link industries: `/industries/{path}`
- Link related departments: relative paths `../` or `./`

## Data Sources

- **Process Groups**: `.data/Processes.tsv` (type=ProcessGroup, ~293 records)
- **Concepts**: `.data/Concepts.tsv` (department-related concepts)
- **Occupations**: `.data/Occupations.tsv` (department heads, staff roles)
- **Processes**: `.data/Processes.tsv` (owned processes)

## Department Categories

Based on APQC Process Classification Framework:

| Category | Departments |
|----------|-------------|
| Strategic | Strategy, Business Development, M&A |
| Operations | Manufacturing, Supply Chain, Logistics, Quality |
| Commercial | Sales, Marketing, Customer Service, Pricing |
| Finance | Accounting, Treasury, FP&A, Tax, Billing |
| HR | Recruiting, Training, Compensation, Benefits |
| Technology | IT, Infrastructure, Applications, Security |
| Legal | Legal, Compliance, Risk, Audit |
| Support | Facilities, Procurement, Administration |

## Industry Variations

Some departments vary significantly by industry:

| Industry | Specialized Departments |
|----------|------------------------|
| Healthcare | Clinical Operations, Nursing, Pharmacy |
| Manufacturing | Production, Engineering, R&D |
| Retail | Merchandising, Store Operations |
| Banking | Lending, Trading, Wealth Management |
| Government | Public Affairs, Policy, Constituent Services |

## When Creating/Updating Content

1. Read the template `[Department].mdx` first
2. Identify the APQC process group(s) this department owns
3. Pull related occupations that typically work in this department
4. Map cross-functional dependencies (inputs/outputs)
5. Generate mermaid diagrams based on actual data
6. Include industry-specific variations where relevant
7. Ensure all cross-references are valid paths
