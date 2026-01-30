import { readFileSync, writeFileSync, statSync } from 'fs'
import { execSync } from 'child_process'
import { basename, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Find all MDX files under 2KB in 01-Strategy
const files = execSync(
  `find ${__dirname}/../processes/01-Strategy -name "*.mdx" -size -2048c`,
  { encoding: 'utf-8' }
).trim().split('\n').filter(Boolean)

console.log(`Found ${files.length} files to enrich`)

// Process-specific knowledge base for generating relevant content
const processContextMap: Record<string, {
  overview: string
  inputs: string[]
  steps: string[]
  outputs: string[]
  occupations: [string, string][]
  departments: [string, string][]
  industries: [string, string, string][]
  kpis: [string, string, string][]
  raciRoles: [string, string, string, string, string][]
}> = {}

function inferContext(name: string, description: string, hierarchyId: string, verb: string, object: string) {
  const nameLower = name.toLowerCase()

  // Infer inputs, steps, outputs based on the verb and object
  const verbMap: Record<string, { inputs: string[], genericSteps: string[], outputs: string[] }> = {
    identify: {
      inputs: ['Market research data', 'Industry reports', 'Internal assessments'],
      genericSteps: ['Gather relevant data sources', 'Apply analytical frameworks', 'Document findings', 'Validate with stakeholders'],
      outputs: ['Identification report', 'Prioritized list', 'Recommendations document']
    },
    analyze: {
      inputs: ['Raw data sets', 'Historical records', 'Benchmark data'],
      genericSteps: ['Collect and organize data', 'Apply analytical methods', 'Interpret results', 'Synthesize findings'],
      outputs: ['Analysis report', 'Insights summary', 'Action recommendations']
    },
    evaluate: {
      inputs: ['Assessment criteria', 'Option proposals', 'Performance data'],
      genericSteps: ['Define evaluation criteria', 'Score each option', 'Compare alternatives', 'Select preferred option'],
      outputs: ['Evaluation matrix', 'Recommendation report', 'Decision brief']
    },
    develop: {
      inputs: ['Strategic objectives', 'Current state assessment', 'Best practices'],
      genericSteps: ['Define scope and objectives', 'Research best practices', 'Draft framework', 'Review and refine'],
      outputs: ['Strategy document', 'Implementation roadmap', 'Communication plan']
    },
    define: {
      inputs: ['Stakeholder input', 'Market analysis', 'Organizational context'],
      genericSteps: ['Gather stakeholder perspectives', 'Synthesize inputs', 'Draft definitions', 'Validate and approve'],
      outputs: ['Formal definition document', 'Alignment charter', 'Communication materials']
    },
    assess: {
      inputs: ['Current state documentation', 'Benchmark data', 'Stakeholder feedback'],
      genericSteps: ['Establish assessment framework', 'Collect evidence', 'Score against criteria', 'Report findings'],
      outputs: ['Assessment report', 'Gap analysis', 'Improvement recommendations']
    },
    create: {
      inputs: ['Requirements document', 'Design principles', 'Stakeholder needs'],
      genericSteps: ['Define requirements', 'Design initial draft', 'Review with stakeholders', 'Finalize deliverable'],
      outputs: ['Completed deliverable', 'Documentation', 'Stakeholder sign-off']
    },
    establish: {
      inputs: ['Organizational goals', 'Industry standards', 'Current capabilities'],
      genericSteps: ['Research standards and benchmarks', 'Define parameters', 'Gain approval', 'Communicate widely'],
      outputs: ['Established framework', 'Governance documentation', 'Baseline metrics']
    },
    communicate: {
      inputs: ['Strategy documents', 'Key messages', 'Audience analysis'],
      genericSteps: ['Identify target audiences', 'Craft messaging', 'Select communication channels', 'Execute and gather feedback'],
      outputs: ['Communication materials', 'Stakeholder feedback', 'Alignment confirmation']
    },
    formulate: {
      inputs: ['Strategic analysis', 'Market data', 'Internal capabilities assessment'],
      genericSteps: ['Synthesize strategic inputs', 'Generate strategic options', 'Evaluate feasibility', 'Document strategy'],
      outputs: ['Strategy document', 'Implementation plan', 'Success metrics']
    },
    conduct: {
      inputs: ['Scope definition', 'Data sources', 'Methodology framework'],
      genericSteps: ['Plan the engagement', 'Execute data collection', 'Analyze findings', 'Present results'],
      outputs: ['Findings report', 'Recommendations', 'Action items']
    },
    perform: {
      inputs: ['Process documentation', 'Required tools and data', 'Stakeholder availability'],
      genericSteps: ['Prepare materials', 'Execute activities', 'Document outcomes', 'Debrief participants'],
      outputs: ['Completed analysis', 'Activity report', 'Follow-up actions']
    },
    monitor: {
      inputs: ['Baseline metrics', 'Performance targets', 'Reporting dashboards'],
      genericSteps: ['Collect performance data', 'Compare against targets', 'Identify variances', 'Report and escalate'],
      outputs: ['Performance report', 'Variance analysis', 'Corrective actions']
    },
    select: {
      inputs: ['Evaluated options', 'Selection criteria', 'Stakeholder priorities'],
      genericSteps: ['Review evaluation results', 'Apply selection criteria', 'Reach consensus', 'Document selection'],
      outputs: ['Selected initiative', 'Rationale document', 'Implementation charter']
    },
    design: {
      inputs: ['Requirements', 'Constraints', 'Best practices'],
      genericSteps: ['Gather design requirements', 'Create design options', 'Evaluate options', 'Finalize design'],
      outputs: ['Design document', 'Implementation specifications', 'Approval sign-off']
    },
    review: {
      inputs: ['Deliverables for review', 'Evaluation criteria', 'Stakeholder feedback'],
      genericSteps: ['Prepare review materials', 'Conduct review sessions', 'Document feedback', 'Agree on next steps'],
      outputs: ['Review findings', 'Approved deliverables', 'Action items']
    },
    prioritize: {
      inputs: ['List of initiatives', 'Evaluation criteria', 'Resource constraints'],
      genericSteps: ['Define prioritization criteria', 'Score initiatives', 'Rank by priority', 'Allocate resources'],
      outputs: ['Prioritized list', 'Resource allocation plan', 'Stakeholder communication']
    },
    determine: {
      inputs: ['Analysis inputs', 'Decision criteria', 'Stakeholder requirements'],
      genericSteps: ['Gather necessary information', 'Apply decision framework', 'Validate findings', 'Document decision'],
      outputs: ['Decision document', 'Supporting rationale', 'Communication plan']
    },
    capture: {
      inputs: ['Source data', 'Collection methods', 'Stakeholder access'],
      genericSteps: ['Design capture methodology', 'Execute data collection', 'Organize and validate', 'Store and distribute'],
      outputs: ['Captured data repository', 'Summary report', 'Distribution list']
    },
    refine: {
      inputs: ['Draft documents', 'Feedback from reviews', 'Updated data'],
      genericSteps: ['Incorporate feedback', 'Update analysis', 'Validate changes', 'Produce refined version'],
      outputs: ['Refined document', 'Change log', 'Approval confirmation']
    },
    migrate: {
      inputs: ['Current state documentation', 'Target state design', 'Migration plan'],
      genericSteps: ['Finalize migration plan', 'Execute transition steps', 'Validate new state', 'Decommission old state'],
      outputs: ['Completed migration', 'Validation report', 'Lessons learned']
    },
    adopt: {
      inputs: ['Approved model or framework', 'Implementation guidelines', 'Training materials'],
      genericSteps: ['Prepare adoption plan', 'Train stakeholders', 'Execute rollout', 'Monitor adoption'],
      outputs: ['Adoption metrics', 'Feedback report', 'Improvement recommendations']
    },
    assemble: {
      inputs: ['Component documents', 'Data sources', 'Stakeholder inputs'],
      genericSteps: ['Identify required components', 'Gather materials', 'Integrate into cohesive whole', 'Review and validate'],
      outputs: ['Assembled document', 'Component index', 'Validation report']
    },
    secure: {
      inputs: ['Proposal document', 'Business case', 'Approval authority list'],
      genericSteps: ['Prepare submission materials', 'Present to approvers', 'Address questions', 'Obtain formal approval'],
      outputs: ['Approval document', 'Signed authorization', 'Next steps plan']
    },
    accept: {
      inputs: ['Incoming feedback', 'Review criteria', 'Processing guidelines'],
      genericSteps: ['Receive submissions', 'Validate completeness', 'Log and categorize', 'Route for processing'],
      outputs: ['Accepted feedback log', 'Processing queue', 'Acknowledgment notices']
    },
    update: {
      inputs: ['Current version', 'Change requests', 'New data'],
      genericSteps: ['Review change requests', 'Apply updates', 'Validate consistency', 'Publish updated version'],
      outputs: ['Updated document', 'Change log', 'Distribution notice']
    },
    set: {
      inputs: ['Strategic analysis', 'Organizational goals', 'Market context'],
      genericSteps: ['Define parameters', 'Validate with stakeholders', 'Formalize settings', 'Communicate decisions'],
      outputs: ['Formalized settings', 'Communication record', 'Monitoring plan']
    },
    align: {
      inputs: ['Strategy documents', 'Stakeholder positions', 'Alignment criteria'],
      genericSteps: ['Identify alignment gaps', 'Facilitate consensus', 'Document agreements', 'Communicate alignment'],
      outputs: ['Alignment document', 'Stakeholder commitments', 'Follow-up plan']
    },
    execute: {
      inputs: ['Project plan', 'Resources', 'Milestones'],
      genericSteps: ['Mobilize resources', 'Execute plan', 'Track progress', 'Report outcomes'],
      outputs: ['Completed deliverables', 'Progress report', 'Lessons learned']
    },
  }

  const defaultCtx = {
    inputs: ['Strategic context documents', 'Relevant data and analysis', 'Stakeholder requirements'],
    genericSteps: ['Define scope and approach', 'Gather and analyze information', 'Develop deliverables', 'Review and finalize'],
    outputs: ['Process deliverable', 'Documentation', 'Stakeholder communication']
  }

  const ctx = verbMap[verb] || defaultCtx

  // Infer occupations based on hierarchy
  const occupationSets: Record<string, [string, string][]> = {
    '1.1': [
      ['ChiefExecutives', 'Chief Executives'],
      ['MarketResearchAnalysts', 'Market Research Analysts'],
      ['ManagementAnalysts', 'Management Analysts'],
      ['BusinessIntelligenceAnalysts', 'Business Intelligence Analysts'],
      ['StrategicPlanners', 'Strategic Planners'],
    ],
    '1.2': [
      ['ChiefExecutives', 'Chief Executives'],
      ['GeneralAndOperationsManagers', 'General and Operations Managers'],
      ['ManagementAnalysts', 'Management Analysts'],
      ['IndustrialOrganizationalPsychologists', 'Industrial-Organizational Psychologists'],
      ['StrategicPlanners', 'Strategic Planners'],
    ],
    '1.3': [
      ['ChiefExecutives', 'Chief Executives'],
      ['ProjectManagementSpecialists', 'Project Management Specialists'],
      ['ManagementAnalysts', 'Management Analysts'],
      ['BusinessIntelligenceAnalysts', 'Business Intelligence Analysts'],
      ['StrategicPlanners', 'Strategic Planners'],
    ],
    '1.4': [
      ['ChiefExecutives', 'Chief Executives'],
      ['ManagementAnalysts', 'Management Analysts'],
      ['BusinessIntelligenceAnalysts', 'Business Intelligence Analysts'],
      ['FinancialManagers', 'Financial Managers'],
      ['StrategicPlanners', 'Strategic Planners'],
    ],
  }

  const prefix = hierarchyId.split('.').slice(0, 2).join('.')
  const occupations = occupationSets[prefix] || occupationSets['1.1']

  // Departments
  const departmentSets: Record<string, [string, string][]> = {
    '1.1': [['StrategyAndPlanning', 'Strategy & Planning'], ['MarketResearch', 'Market Research'], ['ExecutiveLeadership', 'Executive Leadership']],
    '1.2': [['StrategyAndPlanning', 'Strategy & Planning'], ['Operations', 'Operations'], ['ExecutiveLeadership', 'Executive Leadership']],
    '1.3': [['StrategyAndPlanning', 'Strategy & Planning'], ['ProjectManagementOffice', 'Project Management Office (PMO)'], ['ExecutiveLeadership', 'Executive Leadership']],
    '1.4': [['StrategyAndPlanning', 'Strategy & Planning'], ['BusinessArchitecture', 'Business Architecture'], ['ExecutiveLeadership', 'Executive Leadership']],
  }
  const departments = departmentSets[prefix] || departmentSets['1.1']

  // Industries
  const industries: [string, string, string][] = [
    ['Manufacturing', 'Emphasizes supply chain and operational efficiency metrics in strategic planning', 'manufacturing'],
    ['Financial Services', 'Focuses on regulatory compliance and risk management within strategy processes', 'banking'],
    ['Technology', 'Prioritizes innovation velocity and digital transformation in strategic initiatives', 'consumer-electronics'],
  ]

  // KPIs
  const kpiMap: Record<string, [string, string, string][]> = {
    identify: [
      ['Completeness Rate', 'Percentage of relevant items identified vs. total known', '> 85%'],
      ['Time to Identification', 'Average time from initiation to completion', '< 2 weeks'],
      ['Stakeholder Satisfaction', 'Satisfaction score from key stakeholders', '> 4.0/5.0'],
    ],
    analyze: [
      ['Analysis Accuracy', 'Percentage of findings validated by outcomes', '> 80%'],
      ['Insight Actionability', 'Percentage of insights leading to decisions', '> 70%'],
      ['Cycle Time', 'Time from data collection to insight delivery', '< 3 weeks'],
    ],
    evaluate: [
      ['Evaluation Thoroughness', 'Percentage of criteria assessed per option', '100%'],
      ['Decision Quality', 'Post-decision success rate', '> 75%'],
      ['Time to Decision', 'Average time from evaluation start to recommendation', '< 4 weeks'],
    ],
    develop: [
      ['Strategy Adoption Rate', 'Percentage of stakeholders aligned to strategy', '> 90%'],
      ['Time to Completion', 'Days from initiation to final approval', '< 30 days'],
      ['Quality Score', 'Peer review rating of deliverable', '> 4.0/5.0'],
    ],
    default: [
      ['Process Completion Rate', 'Percentage of process completed on schedule', '> 95%'],
      ['Stakeholder Satisfaction', 'Average satisfaction rating from involved parties', '> 4.0/5.0'],
      ['Output Quality Score', 'Quality assessment of process deliverables', '> 80%'],
    ],
  }
  const kpis = kpiMap[verb] || kpiMap['default']

  // RACI
  const raciMap: Record<string, [string, string, string, string, string][]> = {
    '1.1': [
      ['Gather data and intelligence', 'Market Research Analyst', 'Strategy Director', 'Business Unit Leaders', 'Executive Team'],
      ['Conduct analysis', 'Management Analyst', 'Strategy Director', 'Subject Matter Experts', 'Department Heads'],
      ['Document findings', 'Business Analyst', 'Strategy Director', 'Market Research Team', 'Stakeholders'],
      ['Present to leadership', 'Strategy Director', 'Chief Strategy Officer', 'Executive Sponsors', 'Board of Directors'],
    ],
    '1.2': [
      ['Define strategic framework', 'Strategy Director', 'Chief Executive Officer', 'Business Unit Leaders', 'All Employees'],
      ['Develop strategy components', 'Management Analyst', 'Strategy Director', 'Functional Leaders', 'Department Heads'],
      ['Review and validate', 'Strategy Director', 'Chief Executive Officer', 'External Advisors', 'Board of Directors'],
      ['Communicate and deploy', 'Communications Manager', 'Chief Executive Officer', 'Strategy Team', 'All Stakeholders'],
    ],
    '1.3': [
      ['Define initiative scope', 'Project Manager', 'Strategy Director', 'Business Unit Leaders', 'Stakeholders'],
      ['Plan and resource', 'Project Manager', 'Chief Operating Officer', 'Finance Team', 'Department Heads'],
      ['Execute activities', 'Initiative Lead', 'Project Manager', 'Cross-functional Teams', 'Executive Sponsors'],
      ['Monitor and report', 'Project Analyst', 'Project Manager', 'Strategy Team', 'Executive Team'],
    ],
    '1.4': [
      ['Gather model inputs', 'Business Architect', 'Strategy Director', 'Business Unit Leaders', 'Stakeholders'],
      ['Design and build model', 'Business Architect', 'Chief Strategy Officer', 'Subject Matter Experts', 'Department Heads'],
      ['Validate and approve', 'Strategy Director', 'Chief Executive Officer', 'External Advisors', 'Board of Directors'],
      ['Maintain and update', 'Business Analyst', 'Business Architect', 'Model Users', 'All Stakeholders'],
    ],
  }
  const raci = raciMap[prefix] || raciMap['1.1']

  return { inputs: ctx.inputs, steps: ctx.genericSteps, outputs: ctx.outputs, occupations, departments, industries, kpis, raci }
}

function enrichFile(filePath: string) {
  const content = readFileSync(filePath, 'utf-8')

  // Parse frontmatter
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/)
  if (!fmMatch) {
    console.log(`  Skipping ${filePath} - no frontmatter`)
    return
  }

  const fm: Record<string, string> = {}
  for (const line of fmMatch[1].split('\n')) {
    const m = line.match(/^(\w+):\s*"?([^"]*)"?$/)
    if (m) fm[m[1]] = m[2]
  }

  const { id, name, code, hierarchyId, type, level, parent } = fm
  if (!id || !name) return

  // Extract description from blockquote
  const descMatch = content.match(/^>\s*(.+)$/m)
  const description = descMatch ? descMatch[1] : name

  // Extract overview paragraph (after first overview heading)
  const overviewMatch = content.match(/## Overview\n\n([\s\S]*?)(?=\n##|\n---|\n$)/)
  const existingOverview = overviewMatch ? overviewMatch[1].trim() : ''

  // Extract mermaid diagram
  const mermaidMatch = content.match(/```mermaid\n([\s\S]*?)```/)
  const mermaidDiagram = mermaidMatch ? mermaidMatch[1].trim() : ''

  // Extract GraphDL
  const graphdlMatch = content.match(/## GraphDL Semantic Structure\n\n([\s\S]*?)(?=\n##|\n---|\n$)/)
  const graphdlSection = graphdlMatch ? graphdlMatch[1].trim() : ''

  // Extract related concepts
  const conceptsMatch = content.match(/## Related Concepts\n\n([\s\S]*?)(?=\n##|\n---|\n$)/)
  const conceptsSection = conceptsMatch ? conceptsMatch[1].trim() : ''

  // Infer verb from GraphDL or name
  const verbMatch = name.match(/^(\w+)\s/)
  const verb = verbMatch ? verbMatch[1].toLowerCase() : 'manage'
  const objectPart = name.replace(/^\w+\s+/, '')

  const ctx = inferContext(name, description, hierarchyId || '1.1', verb, objectPart)

  // Build the enriched content
  const parentPath = parent ? `[${parent}](../)` : 'N/A'
  const levelNum = level || '4'

  // Generate a more detailed overview
  const detailedOverview = `${existingOverview}

This process plays a critical role within the broader "Develop Vision and Strategy" capability area (APQC Category 1.0). By systematically executing this activity, organizations ensure that strategic decisions are grounded in thorough analysis and aligned with overall business objectives. The outputs of this process feed into downstream strategy development and execution activities, creating a foundation for informed decision-making across the enterprise.`

  const enriched = `---
id: ${id}
name: "${name}"
code: "${code}"
hierarchyId: "${hierarchyId}"
type: ${type}
level: ${levelNum}
status: complete
parent: "${parent}"
---

# ${name}

> ${description}

## Overview

${detailedOverview}

## Process Hierarchy

\`\`\`mermaid
${mermaidDiagram}
\`\`\`

## Key Statistics

| Metric | Value |
|--------|-------|
| APQC Code | ${code} |
| Hierarchy ID | ${hierarchyId} |
| Level | ${type} |
| Parent | ${parentPath} |
| Sub-Processes | 0 |
| Estimated Duration | 1-4 weeks |
| Complexity | Medium |

## GraphDL Semantic Structure

${graphdlSection}

## Process Flow

\`\`\`mermaid
flowchart LR
    I1["${ctx.inputs[0]}"] --> P1
    I2["${ctx.inputs[1]}"] --> P1
    I3["${ctx.inputs[2]}"] --> P1
    P1["${ctx.steps[0]}"] --> P2["${ctx.steps[1]}"]
    P2 --> P3["${ctx.steps[2]}"]
    P3 --> P4["${ctx.steps[3]}"]
    P4 --> O1["${ctx.outputs[0]}"]
    P4 --> O2["${ctx.outputs[1]}"]
    P4 --> O3["${ctx.outputs[2]}"]
    style P1 fill:#e1f5fe
    style P2 fill:#e1f5fe
    style P3 fill:#e1f5fe
    style P4 fill:#e1f5fe
\`\`\`

## RACI Matrix

| Activity | Responsible | Accountable | Consulted | Informed |
|----------|-------------|-------------|-----------|----------|
| ${ctx.raci[0].join(' | ')} |
| ${ctx.raci[1].join(' | ')} |
| ${ctx.raci[2].join(' | ')} |
| ${ctx.raci[3].join(' | ')} |

## Related Occupations

| Occupation | Role in Process |
|------------|----------------|
| [${ctx.occupations[0][1]}](/occupations/${ctx.occupations[0][0]}) | Primary strategic oversight and decision authority |
| [${ctx.occupations[1][1]}](/occupations/${ctx.occupations[1][0]}) | Executes analysis and produces deliverables |
| [${ctx.occupations[2][1]}](/occupations/${ctx.occupations[2][0]}) | Provides analytical frameworks and recommendations |
| [${ctx.occupations[3][1]}](/occupations/${ctx.occupations[3][0]}) | Supports data gathering and insight generation |
| [${ctx.occupations[4][1]}](/occupations/${ctx.occupations[4][0]}) | Coordinates strategic alignment and planning |

## Related Departments

| Department | Involvement |
|------------|-------------|
| [${ctx.departments[0][1]}](/departments/${ctx.departments[0][0]}) | Primary owner and executor of this process |
| [${ctx.departments[1][1]}](/departments/${ctx.departments[1][0]}) | Provides supporting data, resources, and coordination |
| [${ctx.departments[2][1]}](/departments/${ctx.departments[2][0]}) | Provides governance, approval, and strategic direction |

## Industry Variations

| Industry | Variation | Reference |
|----------|-----------|-----------|
| ${ctx.industries[0][0]} | ${ctx.industries[0][1]} | [${ctx.industries[0][2]}](/industries/${ctx.industries[0][2]}) |
| ${ctx.industries[1][0]} | ${ctx.industries[1][1]} | [${ctx.industries[1][2]}](/industries/${ctx.industries[1][2]}) |
| ${ctx.industries[2][0]} | ${ctx.industries[2][1]} | [${ctx.industries[2][2]}](/industries/${ctx.industries[2][2]}) |

## KPIs & Metrics

| KPI | Description | Target |
|-----|-------------|--------|
| ${ctx.kpis[0].join(' | ')} |
| ${ctx.kpis[1].join(' | ')} |
| ${ctx.kpis[2].join(' | ')} |

${conceptsSection ? `## Related Concepts\n\n${conceptsSection}\n\n` : ''}---

*Source: APQC PCF ${code} (${hierarchyId}) - APQC*
`

  writeFileSync(filePath, enriched)
  const newSize = statSync(filePath).size
  console.log(`  Enriched ${basename(filePath)} (${newSize} bytes)`)
}

for (const file of files) {
  try {
    enrichFile(file)
  } catch (e) {
    console.error(`  Error processing ${file}:`, e)
  }
}

console.log(`\nDone! Processed ${files.length} files.`)
