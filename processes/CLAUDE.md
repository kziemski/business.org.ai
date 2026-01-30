# Processes Content Guide

This folder contains hierarchical process documentation based on APQC PCF (Process Classification Framework).

## Template

All process files should follow the `[Process].mdx` template in this folder.

## Folder Structure

```
processes/
├── CLAUDE.md                    # This file
├── [Process].mdx                # Template for all process pages
├── 01-Strategy/                 # Category 1.0 - Vision and Strategy
│   ├── index.mdx
│   ├── VisionStrategy.mdx
│   ├── BusinessConcept.mdx
│   └── ...
├── 02-Products/                 # Category 2.0 - Product Development
│   ├── index.mdx
│   └── ...
├── 03-Sales/                    # Category 3.0 - Market and Sell
│   ├── index.mdx
│   └── ...
├── 04-Delivery/                 # Category 4.0 - Deliver Products
├── 05-Services/                 # Category 5.0 - Deliver Services
├── 06-CustomerService/          # Category 6.0 - Customer Service
├── 07-HR/                       # Category 7.0 - Human Capital
├── 08-IT/                       # Category 8.0 - IT Management
├── 09-Finance/                  # Category 9.0 - Financial Resources
├── 10-Assets/                   # Category 10.0 - Asset Management
├── 11-Risk/                     # Category 11.0 - Risk and Compliance
├── 12-External/                 # Category 12.0 - External Relationships
└── 13-Capabilities/             # Category 13.0 - Business Capabilities
```

## Naming Conventions

- **Folders**: Numbered prefix + concise name (e.g., `01-Strategy/`, `07-HR/`, `09-Finance/`)
- **Files**: Short, action-oriented PascalCase names (e.g., `VisionStrategy.mdx`, `MarketResearch.mdx`)
- **Hierarchy**: Match APQC dot-notation depth with folder depth

## Content Requirements

### Required Sections

1. **Overview** - Brief description of the process
2. **Process Hierarchy** - Mermaid diagram showing APQC hierarchy
3. **Key Statistics** - APQC code, hierarchy ID, level, category
4. **Process Flow** - Detailed flowchart with inputs/outputs
5. **GraphDL Semantic Structure** - verb.object.prep.prepObject breakdown
6. **Activities** - Sub-processes with sequence diagrams
7. **RACI Matrix** - Responsibility assignments
8. **Related Departments/Occupations** - Cross-references
9. **Industry Variations** - Industry-specific implementations

### Mermaid Diagrams

Always include:
- Process hierarchy (graph TD)
- Process flow (flowchart LR) with inputs/process/outputs
- Activity sequence diagram (sequenceDiagram)
- Related processes graph (graph LR)

### GraphDL Semantic Format

Processes use semantic dot-notation:
```
verb.Object.preposition.PrepObject

Examples:
- develop.Vision.and.Strategy
- assess.ExternalEnvironment
- identify.Competitors
- analyze.MarketTrends.for.Industry
```

### Cross-References

- Link occupations: `/occupations/{path}`
- Link departments: `/departments/{path}`
- Link industries: `/industries/{path}`
- Link related processes: relative paths `../` or `./`

## Data Sources

- **Primary**: `.data/Processes.tsv` - 5,619 records
- **Industry-Specific**: `.data/IndustryProcesses.tsv` - 63,326 records
- **Sub-Processes**: `.data/IndustrySubProcesses.tsv` - GraphDL decomposition
- **Concepts**: `.data/relationships/Process.Concepts.tsv`

## APQC Hierarchy Levels

| Level | Format | Example |
|-------|--------|---------|
| Category | X.0 | 1.0 - Develop Vision and Strategy |
| Group | X.Y | 1.1 - Define business concept |
| Process | X.Y.Z | 1.1.1 - Assess external environment |
| Activity | X.Y.Z.A | 1.1.1.1 - Identify competitors |
| Sub-Activity | X.Y.Z.A.B | 1.1.1.1.1 - (sparse) |

## 13 APQC Categories

| ID | Category |
|----|----------|
| 1.0 | Develop Vision and Strategy |
| 2.0 | Design and Develop Products and Services |
| 3.0 | Market and Sell Products and Services |
| 4.0 | Deliver Physical Products |
| 5.0 | Deliver Services |
| 6.0 | Manage Customer Service |
| 7.0 | Develop and Manage Human Capital |
| 8.0 | Manage Information Technology |
| 9.0 | Manage Financial Resources |
| 10.0 | Acquire, Construct, and Manage Assets |
| 11.0 | Manage Enterprise Risk, Compliance, Remediation, Resiliency |
| 12.0 | Manage External Relationships |
| 13.0 | Develop and Manage Business Capabilities |

## 19 Industry Variants

- cross-industry (universal)
- aerospace-and-defense
- airline
- automotive
- banking
- broadcasting
- city-government
- consumer-electronics
- consumer-products
- education
- healthcare-provider
- life-sciences
- petroleum-downstream
- petroleum-upstream
- property-and-casualty-insurance
- retail
- utilities
- (2 more)

## When Creating/Updating Content

1. Read the template `[Process].mdx` first
2. Pull data from `.data/Processes.tsv` for the specific APQC code
3. Pull industry variations from `.data/IndustryProcesses.tsv`
4. Decompose to GraphDL components (verb, object, prep, prepObject)
5. Generate mermaid diagrams based on actual process flow
6. Build RACI matrix from related occupations
7. Include industry-specific variations
8. Ensure all cross-references are valid paths
