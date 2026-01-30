import { readFileSync, writeFileSync, statSync } from 'fs'
import { execSync } from 'child_process'
import { basename } from 'path'

// Find all MDX files under 2KB in 02-Products
const files = execSync(
  `find ${process.cwd()}/processes/02-Products -name "*.mdx" -size -2k`,
  { encoding: 'utf-8' }
).trim().split('\n').filter(Boolean)

console.log(`Found ${files.length} files to enrich`)

// Mapping from process context to relevant occupations, departments, and industry variations
function getOccupations(name: string, hierarchyId: string): { name: string; path: string; involvement: string }[] {
  const group = hierarchyId.split('.')[1] // 1=govern, 2=generate, 3=develop

  const baseOccupations: Record<string, { name: string; path: string; involvement: string }[]> = {
    '1': [
      { name: 'Product Manager', path: 'Management/ProductManagers', involvement: 'Leads portfolio governance and lifecycle management' },
      { name: 'Chief Technology Officer', path: 'Management/ChiefExecutives', involvement: 'Provides strategic oversight for product development' },
      { name: 'Quality Assurance Manager', path: 'Management/QualityControlSystems', involvement: 'Ensures compliance with quality standards' },
      { name: 'Regulatory Affairs Specialist', path: 'Legal/RegulatoryAffairs', involvement: 'Manages patent, copyright, and regulatory compliance' },
    ],
    '2': [
      { name: 'Product Manager', path: 'Management/ProductManagers', involvement: 'Drives new product/service ideation and definition' },
      { name: 'Market Research Analyst', path: 'BusinessAndFinancial/MarketResearchAnalysts', involvement: 'Provides market insights for product concepts' },
      { name: 'UX Designer', path: 'ArtsAndDesign/IndustrialDesigners', involvement: 'Translates requirements into user experience designs' },
      { name: 'Business Analyst', path: 'BusinessAndFinancial/ManagementAnalysts', involvement: 'Analyzes and documents product requirements' },
    ],
    '3': [
      { name: 'Product Designer', path: 'ArtsAndDesign/IndustrialDesigners', involvement: 'Designs and prototypes product solutions' },
      { name: 'Engineering Manager', path: 'Management/IndustrialProductionManagers', involvement: 'Oversees development and production readiness' },
      { name: 'Quality Engineer', path: 'Architecture/IndustrialEngineers', involvement: 'Validates quality and reliability of prototypes' },
      { name: 'Supply Chain Analyst', path: 'BusinessAndFinancial/LogisticsAnalysts', involvement: 'Evaluates production and delivery feasibility' },
      { name: 'Test Engineer', path: 'Computer/SoftwareQualityAssurance', involvement: 'Conducts product testing and validation' },
    ],
  }

  const occs = baseOccupations[group] || baseOccupations['1']
  // Return 3-5 most relevant
  return occs.slice(0, name.toLowerCase().includes('quality') || name.toLowerCase().includes('test') ? 5 : 4)
}

function getDepartments(hierarchyId: string): { name: string; path: string; role: string }[] {
  const group = hierarchyId.split('.')[1]
  const deptMap: Record<string, { name: string; path: string; role: string }[]> = {
    '1': [
      { name: 'Product Management', path: 'ProductManagement', role: 'Owns product portfolio strategy and governance' },
      { name: 'Quality Assurance', path: 'QualityAssurance', role: 'Maintains quality standards and compliance' },
      { name: 'Legal & Compliance', path: 'Legal', role: 'Manages intellectual property and regulatory requirements' },
    ],
    '2': [
      { name: 'Product Management', path: 'ProductManagement', role: 'Leads concept generation and requirements definition' },
      { name: 'Research & Development', path: 'ResearchAndDevelopment', role: 'Conducts discovery research and technology assessment' },
      { name: 'Marketing', path: 'Marketing', role: 'Provides market intelligence and customer insights' },
    ],
    '3': [
      { name: 'Engineering', path: 'Engineering', role: 'Designs, prototypes, and validates products' },
      { name: 'Operations', path: 'Operations', role: 'Prepares production and service delivery processes' },
      { name: 'Quality Assurance', path: 'QualityAssurance', role: 'Tests and validates product quality' },
    ],
  }
  return deptMap[group] || deptMap['1']
}

function getIndustryVariations(name: string, hierarchyId: string): { industry: string; description: string }[] {
  const lname = name.toLowerCase()

  if (lname.includes('regulat') || lname.includes('patent') || lname.includes('copyright') || lname.includes('compliance')) {
    return [
      { industry: 'Life Sciences', description: 'Regulatory requirements are extensive, involving FDA submissions, clinical trial documentation, and ongoing pharmacovigilance compliance throughout the product lifecycle.' },
      { industry: 'Aerospace & Defense', description: 'Subject to strict government regulations (FAA, ITAR), requiring detailed certification processes, export controls, and defense acquisition compliance.' },
      { industry: 'Banking & Financial Services', description: 'Must comply with financial regulations (SOX, Basel III, Dodd-Frank), requiring extensive documentation and audit trails for all product changes.' },
    ]
  }
  if (lname.includes('prototype') || lname.includes('design') || lname.includes('manufactur')) {
    return [
      { industry: 'Automotive', description: 'Prototyping involves physical and digital twins, with extensive crash testing, emissions compliance, and supplier integration for component validation.' },
      { industry: 'Consumer Electronics', description: 'Rapid prototyping cycles with emphasis on miniaturization, user interface testing, and compatibility across device ecosystems.' },
      { industry: 'Healthcare', description: 'Prototypes must meet biocompatibility standards, undergo clinical validation, and comply with medical device regulations before production.' },
    ]
  }
  if (lname.includes('market') || lname.includes('customer') || lname.includes('launch')) {
    return [
      { industry: 'Retail', description: 'Market testing focuses on consumer behavior analysis, seasonal demand patterns, and omnichannel launch readiness across physical and digital storefronts.' },
      { industry: 'Consumer Products', description: 'Extensive focus group testing, packaging evaluation, and shelf-placement strategy drive market introduction decisions.' },
      { industry: 'Technology', description: 'Beta programs, early adopter feedback loops, and agile launch iterations with continuous deployment characterize the market introduction approach.' },
    ]
  }
  if (lname.includes('cost') || lname.includes('budget') || lname.includes('financial')) {
    return [
      { industry: 'Manufacturing', description: 'Cost targets are tightly linked to bill of materials optimization, production line efficiency, and supply chain cost negotiations.' },
      { industry: 'Life Sciences', description: 'Cost planning must account for lengthy R&D cycles, clinical trial expenses, and post-market surveillance investments.' },
      { industry: 'Retail', description: 'Cost and quality targets are driven by competitive pricing pressures, seasonal inventory management, and private label margin requirements.' },
    ]
  }
  // Default
  return [
    { industry: 'Manufacturing', description: 'Emphasizes physical product specifications, tooling requirements, and lean production principles in process execution.' },
    { industry: 'Technology', description: 'Focuses on agile development methodologies, continuous integration, and rapid iteration cycles with digital-first delivery.' },
    { industry: 'Healthcare', description: 'Requires adherence to patient safety standards, clinical efficacy validation, and comprehensive regulatory documentation.' },
  ]
}

function getKPIs(name: string, hierarchyId: string): { metric: string; description: string; target: string }[] {
  const lname = name.toLowerCase()

  const kpis: { metric: string; description: string; target: string }[] = []

  if (lname.includes('quality') || lname.includes('test') || lname.includes('review')) {
    kpis.push(
      { metric: 'Defect Rate', description: 'Percentage of defects identified per review cycle', target: '< 2%' },
      { metric: 'Review Cycle Time', description: 'Average time to complete review process', target: '< 5 business days' },
      { metric: 'First Pass Yield', description: 'Percentage of items passing review on first attempt', target: '> 85%' },
    )
  } else if (lname.includes('cost') || lname.includes('budget') || lname.includes('financial')) {
    kpis.push(
      { metric: 'Budget Variance', description: 'Deviation from planned development budget', target: '< 10%' },
      { metric: 'Cost-to-Revenue Ratio', description: 'Development cost as percentage of projected revenue', target: '< 25%' },
      { metric: 'ROI Forecast Accuracy', description: 'Accuracy of financial projections vs. actuals', target: '> 90%' },
    )
  } else if (lname.includes('prototype') || lname.includes('design') || lname.includes('develop')) {
    kpis.push(
      { metric: 'Time to Prototype', description: 'Duration from concept approval to working prototype', target: '< 30 days' },
      { metric: 'Design Iteration Count', description: 'Number of design revisions before approval', target: '< 3 iterations' },
      { metric: 'Specification Compliance', description: 'Percentage of design specs met by prototype', target: '> 95%' },
    )
  } else if (lname.includes('launch') || lname.includes('market') || lname.includes('introduc')) {
    kpis.push(
      { metric: 'Time to Market', description: 'Duration from concept to market availability', target: 'Per product roadmap' },
      { metric: 'Launch Success Rate', description: 'Percentage of launches meeting revenue targets', target: '> 70%' },
      { metric: 'Customer Adoption Rate', description: 'New customer uptake within first quarter', target: '> 15%' },
    )
  } else if (lname.includes('regulat') || lname.includes('patent') || lname.includes('compliance')) {
    kpis.push(
      { metric: 'Compliance Rate', description: 'Percentage of regulatory requirements met', target: '100%' },
      { metric: 'Submission Cycle Time', description: 'Time from preparation to regulatory submission', target: '< 30 days' },
      { metric: 'Audit Finding Resolution', description: 'Time to resolve regulatory findings', target: '< 15 days' },
    )
  } else {
    kpis.push(
      { metric: 'Process Cycle Time', description: 'Average duration to complete this activity', target: '< 10 business days' },
      { metric: 'Completion Rate', description: 'Percentage of activities completed on schedule', target: '> 90%' },
      { metric: 'Stakeholder Satisfaction', description: 'Internal satisfaction score for process outputs', target: '> 4.0/5.0' },
    )
  }

  return kpis
}

function getRACIMatrix(name: string, hierarchyId: string): { activity: string; responsible: string; accountable: string; consulted: string; informed: string }[] {
  const group = hierarchyId.split('.')[1]
  const shortName = name.replace(/\s+/g, ' ').trim()

  if (group === '1') {
    return [
      { activity: 'Define scope and objectives', responsible: 'Product Manager', accountable: 'VP of Product', consulted: 'Engineering Lead', informed: 'Executive Team' },
      { activity: 'Execute and document', responsible: 'Product Analyst', accountable: 'Product Manager', consulted: 'Quality Assurance', informed: 'Stakeholders' },
      { activity: 'Review and approve', responsible: 'Quality Manager', accountable: 'VP of Product', consulted: 'Legal/Compliance', informed: 'Product Team' },
    ]
  } else if (group === '2') {
    return [
      { activity: 'Research and gather inputs', responsible: 'Market Research Analyst', accountable: 'Product Manager', consulted: 'Customer Success', informed: 'Executive Team' },
      { activity: 'Analyze and define requirements', responsible: 'Business Analyst', accountable: 'Product Manager', consulted: 'Engineering Lead', informed: 'Design Team' },
      { activity: 'Review and prioritize', responsible: 'Product Manager', accountable: 'VP of Product', consulted: 'Finance', informed: 'Development Team' },
    ]
  } else {
    return [
      { activity: 'Design and develop', responsible: 'Engineering Team', accountable: 'Engineering Manager', consulted: 'Product Manager', informed: 'Quality Assurance' },
      { activity: 'Test and validate', responsible: 'QA Engineer', accountable: 'Quality Manager', consulted: 'Product Designer', informed: 'Product Manager' },
      { activity: 'Approve and release', responsible: 'Engineering Manager', accountable: 'VP of Engineering', consulted: 'Operations', informed: 'All Stakeholders' },
    ]
  }
}

function getProcessFlowSteps(name: string): { inputs: string[]; steps: string[]; outputs: string[] } {
  const lname = name.toLowerCase()

  if (lname.includes('review') || lname.includes('assess') || lname.includes('evaluate')) {
    return {
      inputs: ['Performance Data', 'Quality Reports', 'Stakeholder Feedback'],
      steps: ['Gather Review Materials', 'Conduct Analysis', 'Identify Findings', 'Develop Recommendations'],
      outputs: ['Assessment Report', 'Action Items', 'Improvement Plan'],
    }
  }
  if (lname.includes('design') || lname.includes('develop') || lname.includes('build') || lname.includes('prototype')) {
    return {
      inputs: ['Requirements Spec', 'Design Standards', 'Resource Allocation'],
      steps: ['Plan Development', 'Create Design', 'Build Solution', 'Validate Output'],
      outputs: ['Design Artifacts', 'Validation Results', 'Documentation'],
    }
  }
  if (lname.includes('plan') || lname.includes('define') || lname.includes('identify') || lname.includes('determine')) {
    return {
      inputs: ['Strategic Objectives', 'Market Analysis', 'Current State Assessment'],
      steps: ['Analyze Requirements', 'Define Criteria', 'Develop Plan', 'Obtain Approval'],
      outputs: ['Approved Plan', 'Success Criteria', 'Resource Requirements'],
    }
  }
  if (lname.includes('manage') || lname.includes('maintain') || lname.includes('monitor')) {
    return {
      inputs: ['Current Records', 'Change Requests', 'Compliance Standards'],
      steps: ['Review Current State', 'Process Updates', 'Validate Changes', 'Update Records'],
      outputs: ['Updated Records', 'Compliance Report', 'Change Log'],
    }
  }
  if (lname.includes('gather') || lname.includes('collect') || lname.includes('conduct')) {
    return {
      inputs: ['Research Objectives', 'Data Sources', 'Methodology Guidelines'],
      steps: ['Define Scope', 'Collect Data', 'Analyze Findings', 'Document Results'],
      outputs: ['Research Findings', 'Analysis Report', 'Recommendations'],
    }
  }
  // Default
  return {
    inputs: ['Process Inputs', 'Requirements', 'Standards'],
    steps: ['Initiate Activity', 'Execute Process', 'Review Results', 'Finalize Output'],
    outputs: ['Process Outputs', 'Documentation', 'Status Report'],
  }
}

function generateDetailedOverview(name: string, existingOverview: string, hierarchyId: string): string {
  // Extract the existing short overview text, then expand it
  const lname = name.toLowerCase()

  let additional = ''

  if (lname.includes('quality') || lname.includes('test')) {
    additional = `This activity is critical to ensuring that products and services meet established quality benchmarks before advancing through subsequent development stages. It involves systematic evaluation against predefined criteria, cross-functional collaboration to address identified gaps, and documentation of findings to support continuous improvement. The process draws on both quantitative metrics and qualitative assessments from subject matter experts.`
  } else if (lname.includes('cost') || lname.includes('budget') || lname.includes('financial')) {
    additional = `This activity ensures financial discipline throughout the product development lifecycle by establishing clear cost parameters and monitoring adherence to budget targets. It requires close coordination between finance, product management, and engineering teams to balance investment levels with projected returns. Effective execution of this process helps organizations optimize resource allocation and maximize the commercial viability of new offerings.`
  } else if (lname.includes('regulat') || lname.includes('patent') || lname.includes('copyright') || lname.includes('compliance')) {
    additional = `This activity safeguards the organization's intellectual property and ensures adherence to all applicable regulatory frameworks. It involves systematic tracking of regulatory changes, coordination with legal counsel, and maintenance of comprehensive documentation for audit readiness. Failure to execute this process effectively can expose the organization to significant legal and financial risk.`
  } else if (lname.includes('prototype') || lname.includes('design') || lname.includes('build')) {
    additional = `This activity translates conceptual requirements into tangible design artifacts or working prototypes that can be evaluated by stakeholders. It involves iterative design cycles, cross-functional feedback integration, and progressive refinement to ensure alignment with both technical specifications and user expectations. The outputs of this process serve as the foundation for subsequent validation, testing, and production readiness activities.`
  } else if (lname.includes('market') || lname.includes('launch') || lname.includes('introduc')) {
    additional = `This activity bridges the gap between product development and commercial availability by validating market readiness and executing go-to-market strategies. It requires coordination across product, marketing, sales, and operations teams to ensure a successful introduction. Key considerations include competitive positioning, channel readiness, and customer communication planning.`
  } else if (lname.includes('gather') || lname.includes('identify') || lname.includes('formulate') || lname.includes('analyze')) {
    additional = `This activity establishes the analytical foundation for informed decision-making by systematically collecting and evaluating relevant data from multiple sources. It involves structured methodologies for information gathering, stakeholder consultation, and synthesis of findings into actionable insights. The quality of outputs from this process directly impacts the effectiveness of downstream development activities.`
  } else if (lname.includes('manage') || lname.includes('maintain')) {
    additional = `This activity ensures the ongoing accuracy, completeness, and accessibility of critical product and process data. It involves establishing governance protocols, implementing change control procedures, and conducting periodic reviews to maintain data integrity. Effective management of these records supports operational efficiency, regulatory compliance, and informed decision-making across the organization.`
  } else if (lname.includes('plan') || lname.includes('define') || lname.includes('specify') || lname.includes('prioritize')) {
    additional = `This activity provides strategic direction by establishing clear objectives, criteria, and timelines that guide subsequent execution activities. It requires input from multiple stakeholders to ensure alignment with organizational goals and resource constraints. The resulting plans and specifications serve as the authoritative reference for all downstream activities.`
  } else if (lname.includes('train') || lname.includes('employee')) {
    additional = `This activity builds organizational capability by ensuring that personnel possess the knowledge and skills required to execute their responsibilities effectively. It involves needs assessment, curriculum development, delivery through appropriate channels, and assessment of learning outcomes. Ongoing reinforcement and refresher training are essential to maintaining competency levels.`
  } else if (lname.includes('retire') || lname.includes('outdated')) {
    additional = `This activity manages the orderly phase-out of products and services that no longer meet organizational or market requirements. It involves impact assessment, stakeholder communication, migration planning for affected customers, and systematic decommissioning of associated resources. Proper execution minimizes disruption and preserves customer relationships during transitions.`
  } else if (lname.includes('request') || lname.includes('change')) {
    additional = `This activity provides a structured approach to managing modifications that impact product specifications, engineering designs, or production processes. It involves formal submission, impact assessment, approval workflows, and implementation tracking to ensure that changes are properly evaluated and executed without unintended consequences.`
  } else if (lname.includes('validate') || lname.includes('install') || lname.includes('monitor')) {
    additional = `This activity confirms that systems, processes, and outputs perform as intended under operational conditions. It involves systematic verification against acceptance criteria, documentation of test results, and resolution of any discrepancies identified during validation. Successful completion of this process provides the confidence needed to proceed to full-scale operation.`
  } else if (lname.includes('collaborate') || lname.includes('partner')) {
    additional = `This activity leverages external expertise and resources to enhance the organization's product development capabilities. It involves establishing clear collaboration frameworks, aligning objectives with partner organizations, and managing the exchange of information and intellectual property. Effective collaboration accelerates development timelines and introduces complementary perspectives.`
  } else {
    additional = `This activity contributes to the organization's product development objectives by executing defined processes within established quality and timeline parameters. It requires coordination across relevant functional teams and adherence to organizational standards. Outputs from this activity feed into downstream processes and contribute to overall product development success.`
  }

  return additional
}

for (const filePath of files) {
  const content = readFileSync(filePath, 'utf-8')

  // Parse frontmatter
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/)
  if (!fmMatch) {
    console.log(`Skipping ${filePath} - no frontmatter`)
    continue
  }

  const fm = fmMatch[1]
  const getName = (key: string) => {
    const m = fm.match(new RegExp(`${key}:\\s*"?([^"\\n]+)"?`))
    return m ? m[1].trim() : ''
  }

  const id = getName('id')
  const name = getName('name')
  const code = getName('code')
  const hierarchyId = getName('hierarchyId')
  const type = getName('type')
  const level = getName('level')
  const parent = getName('parent')

  if (!name || !hierarchyId) {
    console.log(`Skipping ${filePath} - missing name or hierarchyId`)
    continue
  }

  // Get enrichment data
  const occupations = getOccupations(name, hierarchyId)
  const departments = getDepartments(hierarchyId)
  const industryVars = getIndustryVariations(name, hierarchyId)
  const kpis = getKPIs(name, hierarchyId)
  const raci = getRACIMatrix(name, hierarchyId)
  const flow = getProcessFlowSteps(name)
  const additionalOverview = generateDetailedOverview(name, '', hierarchyId)

  // Find the "## Overview" section end and the existing overview text
  // We'll insert additional content after the existing overview paragraph

  // Strategy: find sections that already exist, and insert new sections before the final "---" source line

  // Check what sections already exist
  const hasProcessFlow = content.includes('## Process Flow')
  const hasRACIMatrix = content.includes('## RACI Matrix')
  const hasRelatedOccupations = content.includes('## Related Occupations')
  const hasRelatedDepartments = content.includes('## Related Departments')
  const hasIndustryVariations = content.includes('## Industry Variations')
  const hasKPIs = content.includes('## KPIs') || content.includes('## Metrics')

  // Build new sections
  let newSections = ''

  // Enhance overview - insert additional text after existing overview
  let enrichedContent = content

  // Find the overview section and add more detail
  const overviewMatch = enrichedContent.match(/(## Overview\n\n(?:Activity \d[\d.]+ is an activity within.*?\.\s*\n\n)?)([\s\S]*?)(## Process Hierarchy)/)
  if (overviewMatch) {
    const existingOverviewText = overviewMatch[2].trim()
    enrichedContent = enrichedContent.replace(
      overviewMatch[0],
      `${overviewMatch[1]}${existingOverviewText}\n\n${additionalOverview}\n\n${overviewMatch[3]}`
    )
  }

  // Build sections to insert before the source footer
  const sectionsToAdd: string[] = []

  if (!hasProcessFlow) {
    const inputNodes = flow.inputs.map((inp, i) => `        I${i}["${inp}"]`).join('\n')
    const stepNodes = flow.steps.map((s, i) => `        S${i}["${s}"]`).join('\n')
    const stepConns = flow.steps.map((_, i) => i > 0 ? `        S${i-1} --> S${i}` : '').filter(Boolean).join('\n')
    const outputNodes = flow.outputs.map((o, i) => `        O${i}["${o}"]`).join('\n')

    sectionsToAdd.push(`## Process Flow

\`\`\`mermaid
flowchart LR
    subgraph Inputs["Inputs"]
${inputNodes}
    end

    subgraph Process["${name}"]
${stepNodes}
${stepConns}
    end

    subgraph Outputs["Outputs"]
${outputNodes}
    end

    Inputs --> Process --> Outputs
\`\`\``)
  }

  if (!hasRACIMatrix) {
    const raciRows = raci.map(r => `| ${r.activity} | ${r.responsible} | ${r.accountable} | ${r.consulted} | ${r.informed} |`).join('\n')
    sectionsToAdd.push(`## RACI Matrix

| Activity | Responsible | Accountable | Consulted | Informed |
|----------|-------------|-------------|-----------|----------|
${raciRows}`)
  }

  if (!hasRelatedOccupations) {
    const occLines = occupations.map(o => `- [${o.name}](/occupations/${o.path}) - ${o.involvement}`).join('\n')
    sectionsToAdd.push(`## Related Occupations

${occLines}`)
  }

  if (!hasRelatedDepartments) {
    const deptLines = departments.map(d => `- [${d.name}](/departments/${d.path}) - ${d.role}`).join('\n')
    sectionsToAdd.push(`## Related Departments

${deptLines}`)
  }

  if (!hasIndustryVariations) {
    const indLines = industryVars.map(v => `### ${v.industry}\n\n${v.description}`).join('\n\n')
    sectionsToAdd.push(`## Industry Variations

${indLines}`)
  }

  if (!hasKPIs) {
    const kpiRows = kpis.map(k => `| ${k.metric} | ${k.description} | ${k.target} |`).join('\n')
    sectionsToAdd.push(`## KPIs & Metrics

| Metric | Description | Target |
|--------|-------------|--------|
${kpiRows}`)
  }

  if (sectionsToAdd.length > 0) {
    // Insert before the final "---" source line
    const sourceFooterMatch = enrichedContent.match(/\n---\n\n\*Source:/)
    if (sourceFooterMatch && sourceFooterMatch.index != null) {
      const insertPoint = sourceFooterMatch.index
      enrichedContent = enrichedContent.slice(0, insertPoint) + '\n' + sectionsToAdd.join('\n\n') + '\n' + enrichedContent.slice(insertPoint)
    } else {
      // Just append
      enrichedContent = enrichedContent.trimEnd() + '\n\n' + sectionsToAdd.join('\n\n') + '\n'
    }
  }

  writeFileSync(filePath, enrichedContent)
  const newSize = Buffer.byteLength(enrichedContent, 'utf-8')
  console.log(`Enriched: ${basename(filePath)} (${newSize} bytes)`)
}

console.log('Done!')
