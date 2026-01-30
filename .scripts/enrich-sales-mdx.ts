import { readFileSync, writeFileSync, statSync } from 'fs'
import { execSync } from 'child_process'
import { basename, dirname } from 'path'

// Find all MDX files under 2KB in 03-Sales
const files = execSync(
  `find ${process.cwd()}/processes/03-Sales -name "*.mdx" -size -2k`,
  { encoding: 'utf-8' }
).trim().split('\n').filter(Boolean)

console.log(`Found ${files.length} files under 2KB to enrich`)

// Mapping of process areas to related occupations and departments
function getOccupationsForArea(hierarchyId: string): { name: string; category: string }[] {
  const prefix = hierarchyId.split('.')[1]
  const occupationMap: Record<string, { name: string; category: string }[]> = {
    '1': [
      { name: 'MarketResearchAnalysts', category: 'Business-and-Financial-Operations' },
      { name: 'MarketingManagers', category: 'Management' },
      { name: 'ManagementAnalysts', category: 'Business-and-Financial-Operations' },
      { name: 'SurveyResearchers', category: 'Life-Physical-and-Social-Science' },
      { name: 'StatisticalAssistants', category: 'Office-and-Administrative-Support' },
    ],
    '2': [
      { name: 'MarketingManagers', category: 'Management' },
      { name: 'AdvertisingAndPromotionsManagers', category: 'Management' },
      { name: 'MarketResearchAnalysts', category: 'Business-and-Financial-Operations' },
      { name: 'PublicRelationsSpecialists', category: 'Media-and-Communication' },
      { name: 'SalesManagers', category: 'Management' },
    ],
    '3': [
      { name: 'MarketingManagers', category: 'Management' },
      { name: 'AdvertisingAndPromotionsManagers', category: 'Management' },
      { name: 'PublicRelationsSpecialists', category: 'Media-and-Communication' },
      { name: 'MarketResearchAnalysts', category: 'Business-and-Financial-Operations' },
      { name: 'GraphicDesigners', category: 'Arts-Design-Entertainment-Sports-and-Media' },
    ],
    '4': [
      { name: 'SalesManagers', category: 'Management' },
      { name: 'MarketResearchAnalysts', category: 'Business-and-Financial-Operations' },
      { name: 'SalesRepresentativesWholesaleAndManufacturing', category: 'Sales-and-Related' },
      { name: 'FinancialAnalysts', category: 'Business-and-Financial-Operations' },
      { name: 'MarketingManagers', category: 'Management' },
    ],
    '5': [
      { name: 'SalesManagers', category: 'Management' },
      { name: 'SalesRepresentativesWholesaleAndManufacturing', category: 'Sales-and-Related' },
      { name: 'AccountManagers', category: 'Sales-and-Related' },
      { name: 'CustomerServiceRepresentatives', category: 'Office-and-Administrative-Support' },
      { name: 'BusinessDevelopmentManagers', category: 'Management' },
    ],
  }
  return occupationMap[prefix] || occupationMap['5']
}

function getDepartmentsForArea(hierarchyId: string): string[] {
  const prefix = hierarchyId.split('.')[1]
  const deptMap: Record<string, string[]> = {
    '1': ['Marketing', 'Sales', 'BusinessIntelligence'],
    '2': ['Marketing', 'ProductManagement', 'Sales'],
    '3': ['Marketing', 'Sales', 'ProductManagement'],
    '4': ['Sales', 'Finance', 'Marketing'],
    '5': ['Sales', 'AccountManagement', 'CustomerSuccess'],
  }
  return deptMap[prefix] || deptMap['5']
}

function getIndustryVariations(name: string, hierarchyId: string): { industry: string; description: string }[] {
  const prefix = hierarchyId.split('.')[1]
  const variationSets: Record<string, { industry: string; description: string }[]> = {
    '1': [
      { industry: 'Retail', description: `In retail, ${name.toLowerCase()} focuses on consumer behavior analytics, foot traffic patterns, and omnichannel shopping trends to inform market positioning.` },
      { industry: 'Banking', description: `In banking, ${name.toLowerCase()} emphasizes regulatory compliance considerations, risk profiling of market segments, and financial product demand analysis.` },
      { industry: 'Healthcare', description: `In healthcare, ${name.toLowerCase()} involves patient demographic analysis, payer mix evaluation, and compliance with healthcare marketing regulations.` },
    ],
    '2': [
      { industry: 'Consumer Products', description: `In consumer products, ${name.toLowerCase()} centers on brand positioning across multiple product lines, seasonal marketing calendars, and trade marketing strategies.` },
      { industry: 'Technology', description: `In technology, ${name.toLowerCase()} emphasizes digital-first strategies, developer community engagement, and product-led growth approaches.` },
      { industry: 'Life Sciences', description: `In life sciences, ${name.toLowerCase()} must comply with FDA advertising regulations, focus on HCP engagement, and navigate complex approval processes for promotional materials.` },
    ],
    '3': [
      { industry: 'Retail', description: `In retail, ${name.toLowerCase()} emphasizes seasonal promotions, visual merchandising, in-store experience design, and coordinated omnichannel campaigns.` },
      { industry: 'Automotive', description: `In automotive, ${name.toLowerCase()} focuses on dealer network coordination, regional marketing programs, and long purchase-cycle nurture strategies.` },
      { industry: 'Banking', description: `In banking, ${name.toLowerCase()} involves compliance-reviewed communications, branch-level marketing execution, and digital banking promotion strategies.` },
    ],
    '4': [
      { industry: 'Manufacturing', description: `In manufacturing, ${name.toLowerCase()} involves long sales cycles, technical selling approaches, distributor network management, and volume-based pricing models.` },
      { industry: 'Retail', description: `In retail, ${name.toLowerCase()} focuses on seasonal demand forecasting, store-level sales planning, and category management strategies.` },
      { industry: 'Technology', description: `In technology, ${name.toLowerCase()} emphasizes subscription-based revenue models, partner ecosystem development, and solution selling methodologies.` },
    ],
    '5': [
      { industry: 'Enterprise Software', description: `In enterprise software, ${name.toLowerCase()} involves complex multi-stakeholder deal cycles, proof-of-concept demonstrations, and contract negotiation with procurement teams.` },
      { industry: 'Consumer Products', description: `In consumer products, ${name.toLowerCase()} focuses on trade promotion management, retailer relationship development, and category captainship strategies.` },
      { industry: 'Professional Services', description: `In professional services, ${name.toLowerCase()} centers on relationship-based selling, proposal development for complex engagements, and thought leadership positioning.` },
    ],
  }
  return variationSets[prefix] || variationSets['5']
}

function getKPIs(hierarchyId: string): { metric: string; description: string; target: string }[] {
  const prefix = hierarchyId.split('.')[1]
  const kpiSets: Record<string, { metric: string; description: string; target: string }[]> = {
    '1': [
      { metric: 'Market Research Accuracy', description: 'Percentage of market predictions validated by actual outcomes', target: '>80%' },
      { metric: 'Customer Insight Generation Rate', description: 'Number of actionable insights generated per quarter', target: '10+ per quarter' },
      { metric: 'Competitive Intelligence Coverage', description: 'Percentage of key competitors actively monitored', target: '100%' },
      { metric: 'Time to Insight', description: 'Average time from data collection to actionable insight delivery', target: '<2 weeks' },
    ],
    '2': [
      { metric: 'Brand Awareness', description: 'Percentage of target market aware of brand and value proposition', target: '>60%' },
      { metric: 'Channel ROI', description: 'Return on investment across marketing channels', target: '>3:1' },
      { metric: 'Customer Acquisition Cost (CAC)', description: 'Average cost to acquire a new customer', target: 'Below industry benchmark' },
      { metric: 'Marketing Qualified Leads (MQLs)', description: 'Number of qualified leads generated by marketing', target: 'Quarter-over-quarter growth' },
    ],
    '3': [
      { metric: 'Campaign ROI', description: 'Return on investment for marketing campaigns and promotions', target: '>4:1' },
      { metric: 'Customer Lifetime Value (CLV)', description: 'Projected revenue from average customer relationship', target: '>3x CAC' },
      { metric: 'Promotion Effectiveness', description: 'Incremental revenue generated per promotional dollar spent', target: '>2:1' },
      { metric: 'Budget Utilization', description: 'Percentage of marketing budget effectively deployed', target: '>90%' },
    ],
    '4': [
      { metric: 'Sales Forecast Accuracy', description: 'Variance between forecasted and actual sales', target: '<10% variance' },
      { metric: 'Pipeline Coverage Ratio', description: 'Ratio of pipeline value to sales target', target: '>3:1' },
      { metric: 'Partner Revenue Contribution', description: 'Percentage of revenue generated through partners', target: '>25%' },
      { metric: 'Sales Budget Efficiency', description: 'Revenue generated per dollar of sales budget', target: '>5:1' },
    ],
    '5': [
      { metric: 'Win Rate', description: 'Percentage of qualified opportunities that result in closed deals', target: '>30%' },
      { metric: 'Average Deal Size', description: 'Average revenue per closed opportunity', target: 'Quarter-over-quarter growth' },
      { metric: 'Sales Cycle Length', description: 'Average time from lead to closed deal', target: 'Below industry average' },
      { metric: 'Customer Retention Rate', description: 'Percentage of customers retained year-over-year', target: '>90%' },
    ],
  }
  return kpiSets[prefix] || kpiSets['5']
}

function getProcessFlowSteps(name: string, verb: string, object: string): { step: string; label: string }[] {
  return [
    { step: 'A', label: 'Gather inputs and requirements' },
    { step: 'B', label: `Analyze current state` },
    { step: 'C', label: `${verb.charAt(0).toUpperCase() + verb.slice(1)} ${object.toLowerCase()}` },
    { step: 'D', label: 'Review and validate results' },
    { step: 'E', label: 'Communicate outcomes' },
    { step: 'F', label: 'Monitor and refine' },
  ]
}

function getRACIRoles(hierarchyId: string): { role: string; r: string; a: string; c: string; i: string }[] {
  const prefix = hierarchyId.split('.')[1]
  const raciSets: Record<string, { role: string; r: string; a: string; c: string; i: string }[]> = {
    '1': [
      { role: 'Market Research Analyst', r: 'R', a: '', c: '', i: '' },
      { role: 'Marketing Manager', r: '', a: 'A', c: '', i: '' },
      { role: 'Sales Manager', r: '', a: '', c: 'C', i: '' },
      { role: 'Product Manager', r: '', a: '', c: 'C', i: '' },
      { role: 'Executive Leadership', r: '', a: '', c: '', i: 'I' },
    ],
    '2': [
      { role: 'Marketing Manager', r: 'R', a: '', c: '', i: '' },
      { role: 'CMO / VP Marketing', r: '', a: 'A', c: '', i: '' },
      { role: 'Sales Manager', r: '', a: '', c: 'C', i: '' },
      { role: 'Product Manager', r: '', a: '', c: 'C', i: '' },
      { role: 'Finance Manager', r: '', a: '', c: '', i: 'I' },
    ],
    '3': [
      { role: 'Marketing Manager', r: 'R', a: '', c: '', i: '' },
      { role: 'CMO / VP Marketing', r: '', a: 'A', c: '', i: '' },
      { role: 'Brand Manager', r: '', a: '', c: 'C', i: '' },
      { role: 'Sales Manager', r: '', a: '', c: 'C', i: '' },
      { role: 'Executive Leadership', r: '', a: '', c: '', i: 'I' },
    ],
    '4': [
      { role: 'Sales Manager', r: 'R', a: '', c: '', i: '' },
      { role: 'VP Sales', r: '', a: 'A', c: '', i: '' },
      { role: 'Financial Analyst', r: '', a: '', c: 'C', i: '' },
      { role: 'Marketing Manager', r: '', a: '', c: 'C', i: '' },
      { role: 'Executive Leadership', r: '', a: '', c: '', i: 'I' },
    ],
    '5': [
      { role: 'Sales Representative', r: 'R', a: '', c: '', i: '' },
      { role: 'Sales Manager', r: '', a: 'A', c: '', i: '' },
      { role: 'Account Manager', r: '', a: '', c: 'C', i: '' },
      { role: 'Legal / Contracts', r: '', a: '', c: 'C', i: '' },
      { role: 'Executive Leadership', r: '', a: '', c: '', i: 'I' },
    ],
  }
  return raciSets[prefix] || raciSets['5']
}

function enrichFile(filePath: string) {
  const content = readFileSync(filePath, 'utf-8')

  // Parse frontmatter
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/)
  if (!fmMatch) return

  const fm: Record<string, string> = {}
  fmMatch[1].split('\n').forEach(line => {
    const m = line.match(/^(\w+):\s*"?([^"]*)"?$/)
    if (m) fm[m[1]] = m[2]
  })

  const name = fm.name || basename(filePath, '.mdx')
  const hierarchyId = fm.hierarchyId || ''
  const code = fm.code || ''
  const type = fm.type || 'Activity'
  const level = fm.level || '4'
  const parent = fm.parent || ''
  const id = fm.id || ''

  // Extract existing GraphDL line
  const graphdlMatch = content.match(/```\n([\w.]+)\n```/)
  const graphdl = graphdlMatch ? graphdlMatch[1] : ''

  // Parse verb/object from GraphDL or id
  const parts = graphdl.split('.')
  const verb = parts[0] || id.replace(/([A-Z])/g, ' $1').trim().split(' ')[0].toLowerCase()
  const objectParts = parts.slice(1)
  const objectName = objectParts.length > 0
    ? objectParts.join(' ').replace(/([A-Z])/g, ' $1').trim()
    : name

  // Extract the existing component table and related concepts
  const componentTableMatch = content.match(/\| Component \| Value \| Description \|\n\|[-|]+\|\n([\s\S]*?)(?=\n\n)/)
  const componentTable = componentTableMatch ? componentTableMatch[0] : ''

  const conceptsMatch = content.match(/## Related Concepts\n\n([\s\S]*?)(?=\n\n---|\n---|\n$)/)
  const concepts = conceptsMatch ? conceptsMatch[1].trim() : ''

  // Get hierarchy path from mermaid
  const mermaidMatch = content.match(/```mermaid\n([\s\S]*?)```/)
  const mermaid = mermaidMatch ? mermaidMatch[1].trim() : ''

  // Extract blockquote description
  const descMatch = content.match(/^> (.+)$/m)
  const shortDesc = descMatch ? descMatch[1] : `${name} within the sales process framework.`

  // Extract overview paragraph
  const overviewMatch = content.match(/## Overview\n\n[\s\S]*?\n\n([\s\S]*?)(?=\n\n## )/)
  const existingOverview = overviewMatch ? overviewMatch[1].trim() : ''
  const overviewText = existingOverview || shortDesc

  // Build enriched content
  const occupations = getOccupationsForArea(hierarchyId)
  const departments = getDepartmentsForArea(hierarchyId)
  const industries = getIndustryVariations(name, hierarchyId)
  const kpis = getKPIs(hierarchyId)
  const raci = getRACIRoles(hierarchyId)
  const flowSteps = getProcessFlowSteps(name, verb, objectName)

  // Build the graphdl section
  let graphdlSection = ''
  if (graphdl) {
    graphdlSection = `## GraphDL Semantic Structure

\`\`\`
${graphdl}
\`\`\`

${componentTable}
`
  }

  const enriched = `---
id: ${id}
name: "${name}"
code: "${code}"
hierarchyId: "${hierarchyId}"
type: ${type}
level: ${level}
status: complete
parent: "${parent}"
---

# ${name}

> ${shortDesc}

## Overview

${type} ${hierarchyId} is an activity within the Market and Sell Products and Services framework.

${overviewText}

This process is critical to effective sales and marketing execution. It ensures that activities are systematically planned, executed, and measured against organizational objectives. When performed effectively, this process drives revenue growth, enhances customer engagement, and strengthens competitive positioning in target markets.

## Process Hierarchy

\`\`\`mermaid
${mermaid}
\`\`\`

## Key Statistics

| Metric | Value |
|--------|-------|
| APQC Code | ${code} |
| Hierarchy ID | ${hierarchyId} |
| Level | ${type} |
| Parent | [${parent}](../) |
| Sub-Processes | 0 |

## Process Flow

\`\`\`mermaid
flowchart LR
    ${flowSteps.map(s => `${s.step}["${s.label}"]`).join('\n    ')}
    ${flowSteps.map((s, i) => i < flowSteps.length - 1 ? `${s.step} --> ${flowSteps[i + 1].step}` : '').filter(Boolean).join('\n    ')}
    style C fill:#e1f5fe
\`\`\`

${graphdlSection}

## RACI Matrix

| Role | Responsible | Accountable | Consulted | Informed |
|------|:-----------:|:-----------:|:---------:|:--------:|
${raci.map(r => `| ${r.role} | ${r.r} | ${r.a} | ${r.c} | ${r.i} |`).join('\n')}

## Related Occupations

${occupations.map(o => `- [${o.name.replace(/([A-Z])/g, ' $1').trim()}](/occupations/${o.category}/${o.name})`).join('\n')}

## Related Departments

${departments.map(d => `- [${d.replace(/([A-Z])/g, ' $1').trim()}](/departments/${d})`).join('\n')}

## Industry Variations

${industries.map(v => `### ${v.industry}\n\n${v.description}`).join('\n\n')}

## KPIs & Metrics

| Metric | Description | Target |
|--------|-------------|--------|
${kpis.map(k => `| ${k.metric} | ${k.description} | ${k.target} |`).join('\n')}

## Related Concepts

${concepts}

---

*Source: APQC PCF ${code} (${hierarchyId}) - APQC*
`

  writeFileSync(filePath, enriched)
  const newSize = statSync(filePath).size
  console.log(`  ✓ ${basename(filePath)} → ${newSize} bytes`)
}

// Process all files
let count = 0
for (const file of files) {
  try {
    enrichFile(file)
    count++
  } catch (e: any) {
    console.error(`  ✗ ${basename(file)}: ${e.message}`)
  }
}

console.log(`\nEnriched ${count}/${files.length} files`)
