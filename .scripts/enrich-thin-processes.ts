/**
 * Enriches thin core process files (under 3KB) with:
 * 1. Expanded overview
 * 2. Child process listings (for index files)
 * 3. RACI matrix
 * 4. Metrics and KPIs
 * 5. Related departments and occupations
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PROCESSES_DIR = path.join(__dirname, '../processes')
const MIN_SIZE = 3072 // 3KB threshold

// APQC Category configurations
const categoryConfigs: Record<string, {
  overview: string;
  departments: string[];
  occupations: { name: string; path: string }[];
  metrics: string[];
}> = {
  '01': {
    overview: 'Strategy processes define the organization\'s vision, direction, and strategic initiatives to achieve business objectives.',
    departments: ['Executive', 'Strategy', 'Finance'],
    occupations: [
      { name: 'Chief Executives', path: '/occupations/Management/ChiefExecutives' },
      { name: 'Management Analysts', path: '/occupations/Business/ManagementAnalysts' },
      { name: 'General and Operations Managers', path: '/occupations/Management/GeneralAndOperationsManagers' },
    ],
    metrics: ['Strategic initiative completion rate', 'Revenue growth', 'Market share', 'Customer satisfaction'],
  },
  '02': {
    overview: 'Product development processes design, develop, and introduce new products and services to meet customer needs.',
    departments: ['Product', 'Research', 'Quality'],
    occupations: [
      { name: 'Product Managers', path: '/occupations/Management/ProductManagers' },
      { name: 'Industrial Engineers', path: '/occupations/Engineering/IndustrialEngineers' },
      { name: 'Quality Control Managers', path: '/occupations/Management/QualityControlManagers' },
    ],
    metrics: ['Time to market', 'Product success rate', 'R&D ROI', 'Patent filings'],
  },
  '03': {
    overview: 'Sales and marketing processes understand markets, develop marketing strategies, and manage sales activities.',
    departments: ['Sales', 'Marketing', 'Analytics'],
    occupations: [
      { name: 'Sales Managers', path: '/occupations/Management/SalesManagers' },
      { name: 'Marketing Managers', path: '/occupations/Management/MarketingManagers' },
      { name: 'Market Research Analysts', path: '/occupations/Business/MarketResearchAnalysts' },
    ],
    metrics: ['Revenue growth', 'Customer acquisition cost', 'Sales conversion rate', 'Marketing ROI'],
  },
  '04': {
    overview: 'Delivery processes manage the supply chain, procurement, production, and logistics to deliver physical products.',
    departments: ['Operations', 'Supply Chain', 'Logistics'],
    occupations: [
      { name: 'Supply Chain Managers', path: '/occupations/Business/Logisticians' },
      { name: 'Production Managers', path: '/occupations/Management/IndustrialProductionManagers' },
      { name: 'Logistics Coordinators', path: '/occupations/Business/Logisticians' },
    ],
    metrics: ['On-time delivery', 'Inventory turnover', 'Order accuracy', 'Supply chain cost'],
  },
  '05': {
    overview: 'Service delivery processes manage the delivery of services to customers, including planning, execution, and support.',
    departments: ['Operations', 'Service Delivery', 'Support'],
    occupations: [
      { name: 'Operations Managers', path: '/occupations/Management/GeneralAndOperationsManagers' },
      { name: 'Project Managers', path: '/occupations/Business/ProjectManagementSpecialists' },
      { name: 'Service Coordinators', path: '/occupations/Administrative/CustomerServiceRepresentatives' },
    ],
    metrics: ['Service level agreement compliance', 'Customer satisfaction', 'First-time resolution', 'Service cost'],
  },
  '06': {
    overview: 'Customer service processes manage customer inquiries, complaints, and support to ensure customer satisfaction.',
    departments: ['Customer Service', 'Support', 'Quality'],
    occupations: [
      { name: 'Customer Service Managers', path: '/occupations/Management/CustomerServiceManagers' },
      { name: 'Customer Service Representatives', path: '/occupations/Administrative/CustomerServiceRepresentatives' },
      { name: 'Quality Assurance Specialists', path: '/occupations/Production/QualityControlInspectors' },
    ],
    metrics: ['Customer satisfaction score', 'First contact resolution', 'Average handle time', 'Net promoter score'],
  },
  '07': {
    overview: 'Human resources processes recruit, develop, reward, and retain employees to build organizational capability.',
    departments: ['Human Resources', 'Talent', 'Compensation'],
    occupations: [
      { name: 'Human Resources Managers', path: '/occupations/Management/HumanResourcesManagers' },
      { name: 'HR Specialists', path: '/occupations/Business/HumanResourcesSpecialists' },
      { name: 'Training Managers', path: '/occupations/Management/TrainingAndDevelopmentManagers' },
    ],
    metrics: ['Employee engagement', 'Turnover rate', 'Time to fill', 'Training effectiveness'],
  },
  '08': {
    overview: 'Information technology processes manage IT strategy, services, solutions, and support to enable business operations.',
    departments: ['Technology', 'Security', 'Data Analytics'],
    occupations: [
      { name: 'IT Managers', path: '/occupations/Management/ComputerAndInformationSystemsManagers' },
      { name: 'Software Developers', path: '/occupations/Technology/SoftwareDevelopers' },
      { name: 'Systems Analysts', path: '/occupations/Technology/ComputerSystemsAnalysts' },
    ],
    metrics: ['System uptime', 'IT cost per employee', 'Project on-time delivery', 'Security incidents'],
  },
  '09': {
    overview: 'Finance processes manage financial planning, accounting, treasury, and controls to ensure financial health.',
    departments: ['Finance', 'Accounting', 'Treasury'],
    occupations: [
      { name: 'Financial Managers', path: '/occupations/Management/FinancialManagers' },
      { name: 'Accountants', path: '/occupations/Business/AccountantsAndAuditors' },
      { name: 'Financial Analysts', path: '/occupations/Business/FinancialAnalysts' },
    ],
    metrics: ['Days sales outstanding', 'Budget variance', 'Cash conversion cycle', 'Cost per transaction'],
  },
  '10': {
    overview: 'Asset management processes plan, acquire, maintain, and dispose of physical assets to support operations.',
    departments: ['Facilities', 'Operations', 'Procurement'],
    occupations: [
      { name: 'Facilities Managers', path: '/occupations/Management/FacilitiesManagers' },
      { name: 'Maintenance Workers', path: '/occupations/Installation/MaintenanceAndRepairWorkers' },
      { name: 'Purchasing Managers', path: '/occupations/Business/PurchasingManagers' },
    ],
    metrics: ['Asset utilization', 'Maintenance cost', 'Asset availability', 'Total cost of ownership'],
  },
  '11': {
    overview: 'Risk and compliance processes identify, assess, and manage enterprise risks and ensure regulatory compliance.',
    departments: ['Legal', 'Compliance', 'Risk Management'],
    occupations: [
      { name: 'Compliance Managers', path: '/occupations/Management/ComplianceManagers' },
      { name: 'Risk Analysts', path: '/occupations/Business/FinancialRiskSpecialists' },
      { name: 'Internal Auditors', path: '/occupations/Business/AccountantsAndAuditors' },
    ],
    metrics: ['Compliance rate', 'Risk incidents', 'Audit findings', 'Control effectiveness'],
  },
  '12': {
    overview: 'External relations processes manage relationships with investors, government, board, media, and other stakeholders.',
    departments: ['Legal', 'Corporate Affairs', 'Investor Relations'],
    occupations: [
      { name: 'Public Relations Managers', path: '/occupations/Management/PublicRelationsManagers' },
      { name: 'Lawyers', path: '/occupations/Legal/Lawyers' },
      { name: 'Investor Relations Specialists', path: '/occupations/Business/FinancialAnalysts' },
    ],
    metrics: ['Media coverage', 'Investor satisfaction', 'Regulatory relationships', 'Community engagement'],
  },
  '13': {
    overview: 'Business capabilities processes develop organizational capabilities in process management, quality, change, and knowledge.',
    departments: ['Operations', 'Quality', 'Strategy'],
    occupations: [
      { name: 'Business Analysts', path: '/occupations/Business/ManagementAnalysts' },
      { name: 'Quality Managers', path: '/occupations/Management/QualityControlManagers' },
      { name: 'Project Managers', path: '/occupations/Business/ProjectManagementSpecialists' },
    ],
    metrics: ['Process efficiency', 'Quality scores', 'Change success rate', 'Knowledge reuse'],
  },
}

// Parse frontmatter
function parseFrontmatter(content: string): { frontmatter: Record<string, any>; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) {
    return { frontmatter: {}, body: content }
  }

  const frontmatter: Record<string, any> = {}
  const lines = match[1].split('\n')
  for (const line of lines) {
    const colonIdx = line.indexOf(':')
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim()
      let value = line.slice(colonIdx + 1).trim()
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1)
      }
      frontmatter[key] = value
    }
  }

  return { frontmatter, body: match[2] }
}

// Get APQC category from hierarchy ID
function getCategory(hierarchyId: string): string {
  if (!hierarchyId) return '01'
  const first = hierarchyId.split('.')[0]
  return first.padStart(2, '0')
}

// Generate enrichment content
function generateEnrichment(category: string, name: string): string {
  const config = categoryConfigs[category] || categoryConfigs['01']

  const departmentsSection = config.departments
    .map(d => `- [${d}](/departments/${d})`)
    .join('\n')

  const occupationsSection = config.occupations
    .map(o => `- [${o.name}](${o.path})`)
    .join('\n')

  const metricsSection = config.metrics
    .map(m => `| ${m} | Measure of ${m.toLowerCase()} | Target varies by organization |`)
    .join('\n')

  return `

## Process Overview

${config.overview} This process focuses on ${name.toLowerCase()}, which is essential for organizational effectiveness and achieving business objectives.

## Key Metrics

| Metric | Description | Target |
|--------|-------------|--------|
${metricsSection}

## Related Departments

${departmentsSection}

## Related Occupations

${occupationsSection}

## RACI Matrix

| Activity | Responsible | Accountable | Consulted | Informed |
|----------|-------------|-------------|-----------|----------|
| Plan | Process Owner | Manager | Stakeholders | Team |
| Execute | Team | Process Owner | Manager | Stakeholders |
| Monitor | Analyst | Manager | Process Owner | Leadership |
| Improve | Process Owner | Manager | Team | Stakeholders |
`
}

// Process a single file
function processFile(filePath: string): boolean {
  // Skip template and industry process files
  if (filePath.includes('[Process]') || filePath.includes('processes/industries')) {
    return false
  }

  const stats = fs.statSync(filePath)
  if (stats.size >= MIN_SIZE) {
    return false
  }

  const content = fs.readFileSync(filePath, 'utf-8')
  const { frontmatter, body } = parseFrontmatter(content)

  // Skip if already has Process Overview or RACI Matrix
  if (body.includes('## Process Overview') || body.includes('## RACI Matrix')) {
    return false
  }

  const category = getCategory(frontmatter.hierarchyId || '')
  const name = frontmatter.name || path.basename(filePath, '.mdx')

  // Generate enrichment
  const enrichment = generateEnrichment(category, name)

  // Insert before GraphDL section or at end
  let newBody = body
  const graphdlMatch = body.match(/\n## GraphDL Semantic Structure/)
  if (graphdlMatch && graphdlMatch.index) {
    newBody = body.slice(0, graphdlMatch.index) + enrichment + body.slice(graphdlMatch.index)
  } else {
    const sourceMatch = body.match(/\n---\n\n\*Source:/)
    if (sourceMatch && sourceMatch.index) {
      newBody = body.slice(0, sourceMatch.index) + enrichment + body.slice(sourceMatch.index)
    } else {
      newBody = body + enrichment
    }
  }

  // Rebuild file
  const frontmatterStr = Object.entries(frontmatter)
    .map(([k, v]) => {
      if (typeof v === 'string' && (v.includes(':') || v.includes('"'))) {
        return `${k}: "${v}"`
      }
      return `${k}: ${v}`
    })
    .join('\n')

  const newContent = `---\n${frontmatterStr}\n---\n${newBody}`

  fs.writeFileSync(filePath, newContent)
  return true
}

// Find all thin MDX files
function findThinFiles(dir: string): string[] {
  const files: string[] = []

  function walk(currentDir: string) {
    // Skip industries folder
    if (currentDir.includes('processes/industries')) {
      return
    }

    const entries = fs.readdirSync(currentDir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name)
      if (entry.isDirectory()) {
        walk(fullPath)
      } else if (entry.name.endsWith('.mdx') && !entry.name.startsWith('[')) {
        const stats = fs.statSync(fullPath)
        if (stats.size < MIN_SIZE) {
          files.push(fullPath)
        }
      }
    }
  }

  walk(dir)
  return files
}

// Main
async function main() {
  console.log('Finding thin process files...')
  const files = findThinFiles(PROCESSES_DIR)
  console.log(`Found ${files.length} thin files`)

  let enriched = 0
  let skipped = 0

  for (const file of files) {
    try {
      if (processFile(file)) {
        enriched++
      } else {
        skipped++
      }
    } catch (err) {
      console.error(`Error processing ${file}:`, err)
    }
  }

  console.log(`\nComplete!`)
  console.log(`Enriched: ${enriched}`)
  console.log(`Skipped: ${skipped}`)
}

main().catch(console.error)
