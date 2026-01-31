/**
 * Enrich Industry Process Content
 *
 * This script enriches lightweight industry process files (~1KB) with:
 * - More detailed Overview paragraphs
 * - Industry-Specific Considerations section (3-4 bullet points)
 * - Key Metrics section (2-3 industry-relevant KPIs)
 *
 * Target: files should grow from ~1KB to ~2KB
 */

import * as fs from 'fs'
import * as path from 'path'

const INDUSTRIES_DIR = path.join(process.cwd(), 'processes/industries')

// First 4 industries alphabetically
const TARGET_INDUSTRIES = [
  'aerospace-and-defense',
  'airline',
  'automotive',
  'banking'
]

// Industry-specific context for generating relevant content
const INDUSTRY_CONTEXT: Record<string, {
  displayName: string
  characteristics: string[]
  typicalMetrics: string[]
  regulatoryContext: string
  operationalFocus: string
}> = {
  'aerospace-and-defense': {
    displayName: 'Aerospace and Defense',
    characteristics: [
      'Strict regulatory compliance (FAA, ITAR, DFARS)',
      'Long product lifecycles (20-30 years)',
      'Complex supply chains with security requirements',
      'Government contracting and classified programs'
    ],
    typicalMetrics: [
      'First Pass Yield (FPY)',
      'On-Time Delivery (OTD)',
      'Cost Performance Index (CPI)',
      'Schedule Performance Index (SPI)',
      'Quality Escape Rate'
    ],
    regulatoryContext: 'FAA, ITAR, DFARS, AS9100',
    operationalFocus: 'precision manufacturing, safety-critical systems, and defense program management'
  },
  'airline': {
    displayName: 'Airline',
    characteristics: [
      'Real-time operations and schedule optimization',
      'Safety-critical maintenance and compliance',
      'High customer service expectations',
      'Fuel cost management and sustainability initiatives'
    ],
    typicalMetrics: [
      'On-Time Performance (OTP)',
      'Load Factor',
      'Revenue per Available Seat Mile (RASM)',
      'Cost per Available Seat Mile (CASM)',
      'Customer Satisfaction Score (CSAT)'
    ],
    regulatoryContext: 'FAA, TSA, DOT, IATA',
    operationalFocus: 'flight operations, passenger experience, and maintenance turnaround'
  },
  'automotive': {
    displayName: 'Automotive',
    characteristics: [
      'Just-in-time manufacturing and lean principles',
      'Complex global supply chains',
      'Rapid technology transition (EV, autonomous)',
      'Stringent quality and safety standards'
    ],
    typicalMetrics: [
      'Parts Per Million Defects (PPM)',
      'Overall Equipment Effectiveness (OEE)',
      'Inventory Turns',
      'Warranty Cost per Unit',
      'Time to Market'
    ],
    regulatoryContext: 'NHTSA, EPA, IATF 16949',
    operationalFocus: 'production efficiency, supply chain coordination, and quality management'
  },
  'banking': {
    displayName: 'Banking',
    characteristics: [
      'Strict regulatory compliance and reporting',
      'Digital transformation and fintech competition',
      'Risk management and fraud prevention',
      'Customer data security and privacy'
    ],
    typicalMetrics: [
      'Net Interest Margin (NIM)',
      'Cost-to-Income Ratio',
      'Non-Performing Loan Ratio',
      'Customer Acquisition Cost (CAC)',
      'Digital Adoption Rate'
    ],
    regulatoryContext: 'FDIC, OCC, Basel III, Dodd-Frank, PCI-DSS',
    operationalFocus: 'risk management, compliance, and digital customer experience'
  }
}

interface ProcessFrontmatter {
  id: string
  name: string
  code: string
  industry: string
  type: string
  status: string
  canonicalProcessId: string
  pcfId: string
  subject: string
}

function parseFrontmatter(content: string): { frontmatter: ProcessFrontmatter | null, body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) {
    return { frontmatter: null, body: content }
  }

  const frontmatterStr = match[1]
  const body = match[2]

  const frontmatter: Record<string, string> = {}
  for (const line of frontmatterStr.split('\n')) {
    const colonIdx = line.indexOf(':')
    if (colonIdx > 0) {
      const key = line.substring(0, colonIdx).trim()
      let value = line.substring(colonIdx + 1).trim()
      // Remove quotes
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1)
      }
      frontmatter[key] = value
    }
  }

  return {
    frontmatter: frontmatter as unknown as ProcessFrontmatter,
    body
  }
}

function generateEnhancedOverview(
  processName: string,
  existingOverview: string,
  industry: string,
  subject: string
): string {
  const ctx = INDUSTRY_CONTEXT[industry]
  if (!ctx) return existingOverview

  // If existing overview is just the process name repeated, generate a better one
  const isMinimal = existingOverview.trim().toLowerCase() === processName.toLowerCase() ||
                    existingOverview.length < 50

  if (isMinimal) {
    return `This process enables ${subject} to ${processName.toLowerCase()} within the ${ctx.displayName} industry. ` +
           `Given the industry's focus on ${ctx.operationalFocus}, this process must be executed with attention to ` +
           `${ctx.regulatoryContext} compliance requirements. Effective implementation ensures operational excellence ` +
           `and supports the organization's strategic objectives in a competitive marketplace.`
  }

  // Enhance existing overview
  return `${existingOverview} Within the ${ctx.displayName} industry, this process takes on particular importance ` +
         `due to the sector's emphasis on ${ctx.operationalFocus}. Organizations must ensure alignment with ` +
         `${ctx.regulatoryContext} standards while optimizing for efficiency and effectiveness.`
}

function generateIndustryConsiderations(
  processName: string,
  industry: string,
  apqcCode: string
): string[] {
  const ctx = INDUSTRY_CONTEXT[industry]
  if (!ctx) return []

  const category = apqcCode.split('.')[0]
  const categoryContext = getCategoryContext(category, industry)

  // Generate 3-4 industry-specific considerations
  const considerations: string[] = []

  // First consideration: regulatory
  considerations.push(
    `Compliance with ${ctx.regulatoryContext} requirements must be integrated into every step of this process`
  )

  // Second consideration: industry characteristic
  considerations.push(ctx.characteristics[Math.floor(Math.random() * ctx.characteristics.length)] +
    ' directly impacts how this process is designed and executed')

  // Third consideration: category-specific
  considerations.push(categoryContext)

  // Fourth consideration: competitive/operational
  if (ctx.characteristics.length > 1) {
    const idx = (parseInt(apqcCode.replace(/\./g, '')) || 0) % ctx.characteristics.length
    considerations.push(
      `${ctx.displayName} organizations must balance ${ctx.characteristics[idx].toLowerCase()} with operational efficiency`
    )
  }

  return considerations.slice(0, 4)
}

function getCategoryContext(category: string, industry: string): string {
  const ctx = INDUSTRY_CONTEXT[industry]
  const categoryMap: Record<string, string> = {
    '1': `Strategic planning in ${ctx.displayName} requires long-term vision aligned with industry trends and regulatory evolution`,
    '2': `Product and service development must account for ${ctx.operationalFocus} requirements`,
    '3': `Sales and marketing activities are shaped by ${ctx.displayName} industry buying cycles and relationship-driven procurement`,
    '4': `Delivery operations require coordination with specialized ${ctx.displayName} supply chain partners`,
    '5': `Service delivery standards in ${ctx.displayName} are driven by customer expectations and regulatory mandates`,
    '6': `Customer service excellence is critical in ${ctx.displayName} given high-value relationships and complex product/service offerings`,
    '7': `Human capital management must address specialized skill requirements and talent competition in ${ctx.displayName}`,
    '8': `IT management must support mission-critical systems while enabling digital transformation in ${ctx.displayName}`,
    '9': `Financial management requires industry-specific accounting treatments and regulatory reporting for ${ctx.displayName}`,
    '10': `Asset management in ${ctx.displayName} involves high-value, long-lifecycle equipment requiring rigorous maintenance`,
    '11': `Risk and compliance management is paramount in ${ctx.displayName} given regulatory scrutiny and operational risks`,
    '12': `External relationships in ${ctx.displayName} often involve long-term partnerships and complex contractual arrangements`,
    '13': `Business capability development must keep pace with rapid technological change in ${ctx.displayName}`
  }
  return categoryMap[category] || `This process category has unique requirements in the ${ctx.displayName} context`
}

function generateKeyMetrics(
  processName: string,
  industry: string,
  apqcCode: string
): { name: string, description: string }[] {
  const ctx = INDUSTRY_CONTEXT[industry]
  if (!ctx) return []

  const metrics: { name: string, description: string }[] = []

  // Select 2-3 relevant metrics from the industry's typical metrics
  const numMetrics = 2 + (parseInt(apqcCode.replace(/\./g, '')) % 2) // 2 or 3 metrics
  const startIdx = (parseInt(apqcCode.replace(/\./g, '')) || 0) % ctx.typicalMetrics.length

  for (let i = 0; i < numMetrics && i < ctx.typicalMetrics.length; i++) {
    const metricIdx = (startIdx + i) % ctx.typicalMetrics.length
    const metricName = ctx.typicalMetrics[metricIdx]
    metrics.push({
      name: metricName,
      description: generateMetricDescription(metricName, processName, industry)
    })
  }

  return metrics
}

function generateMetricDescription(metricName: string, processName: string, industry: string): string {
  const descriptions: Record<string, string> = {
    'First Pass Yield (FPY)': 'Percentage of units passing quality inspection on first attempt, critical for process efficiency',
    'On-Time Delivery (OTD)': 'Percentage of deliverables completed within committed timeframes',
    'Cost Performance Index (CPI)': 'Ratio of earned value to actual cost, indicating budget efficiency',
    'Schedule Performance Index (SPI)': 'Ratio of earned value to planned value, indicating schedule adherence',
    'Quality Escape Rate': 'Number of defects discovered after process completion per total units',
    'On-Time Performance (OTP)': 'Percentage of scheduled activities completed as planned',
    'Load Factor': 'Capacity utilization rate measuring resource efficiency',
    'Revenue per Available Seat Mile (RASM)': 'Revenue efficiency metric for capacity management',
    'Cost per Available Seat Mile (CASM)': 'Cost efficiency metric for operational optimization',
    'Customer Satisfaction Score (CSAT)': 'Direct measure of customer satisfaction with process outcomes',
    'Parts Per Million Defects (PPM)': 'Quality metric measuring defect rate per million opportunities',
    'Overall Equipment Effectiveness (OEE)': 'Composite metric of availability, performance, and quality',
    'Inventory Turns': 'Rate at which inventory is cycled, indicating supply chain efficiency',
    'Warranty Cost per Unit': 'Average warranty-related costs indicating quality and reliability',
    'Time to Market': 'Duration from concept to delivery, measuring process speed',
    'Net Interest Margin (NIM)': 'Profitability metric measuring spread between interest earned and paid',
    'Cost-to-Income Ratio': 'Efficiency metric comparing operating costs to operating income',
    'Non-Performing Loan Ratio': 'Risk metric indicating portfolio quality',
    'Customer Acquisition Cost (CAC)': 'Average cost to acquire a new customer relationship',
    'Digital Adoption Rate': 'Percentage of customers using digital channels'
  }

  return descriptions[metricName] || `Key performance indicator for measuring ${processName.toLowerCase()} effectiveness`
}

function enrichProcessFile(filePath: string): boolean {
  const content = fs.readFileSync(filePath, 'utf-8')
  const { frontmatter, body } = parseFrontmatter(content)

  if (!frontmatter) {
    console.log(`  Skipping (no frontmatter): ${path.basename(filePath)}`)
    return false
  }

  // Check if already enriched (has Industry-Specific Considerations section)
  if (body.includes('## Industry-Specific Considerations') || body.includes('## Key Metrics')) {
    console.log(`  Already enriched: ${path.basename(filePath)}`)
    return false
  }

  const industry = frontmatter.industry
  const processName = frontmatter.name
  const subject = frontmatter.subject
  const apqcCode = frontmatter.code

  // Find and enhance the Overview section
  let newBody = body

  // Extract current overview
  const overviewMatch = body.match(/## Overview\n\n([\s\S]*?)(?=\n## |$)/)
  if (overviewMatch) {
    const currentOverview = overviewMatch[1].trim()
    const enhancedOverview = generateEnhancedOverview(processName, currentOverview, industry, subject)
    newBody = newBody.replace(
      /## Overview\n\n[\s\S]*?(?=\n## |$)/,
      `## Overview\n\n${enhancedOverview}\n\n`
    )
  }

  // Generate new sections
  const considerations = generateIndustryConsiderations(processName, industry, apqcCode)
  const metrics = generateKeyMetrics(processName, industry, apqcCode)

  // Find insertion point (before ## Related Occupations or at end)
  const insertionPoint = newBody.indexOf('## Related Occupations')

  let newSections = ''

  // Add Industry-Specific Considerations
  if (considerations.length > 0) {
    newSections += '## Industry-Specific Considerations\n\n'
    for (const consideration of considerations) {
      newSections += `- ${consideration}\n`
    }
    newSections += '\n'
  }

  // Add Key Metrics
  if (metrics.length > 0) {
    newSections += '## Key Metrics\n\n'
    for (const metric of metrics) {
      newSections += `- **${metric.name}**: ${metric.description}\n`
    }
    newSections += '\n'
  }

  if (insertionPoint > 0) {
    newBody = newBody.slice(0, insertionPoint) + newSections + newBody.slice(insertionPoint)
  } else {
    newBody = newBody.trimEnd() + '\n\n' + newSections
  }

  // Reconstruct file
  const frontmatterStr = Object.entries(frontmatter)
    .map(([key, value]) => {
      if (typeof value === 'string' && (value.includes(' ') || value.includes(':'))) {
        return `${key}: "${value}"`
      }
      return `${key}: ${value}`
    })
    .join('\n')

  const newContent = `---\n${frontmatterStr}\n---\n${newBody}`

  fs.writeFileSync(filePath, newContent)
  return true
}

async function main() {
  console.log('Industry Process Content Enrichment')
  console.log('===================================\n')

  const results: Record<string, { enriched: number, skipped: number, total: number }> = {}

  for (const industry of TARGET_INDUSTRIES) {
    const industryDir = path.join(INDUSTRIES_DIR, industry)

    if (!fs.existsSync(industryDir)) {
      console.log(`Industry directory not found: ${industryDir}`)
      continue
    }

    console.log(`\nProcessing: ${industry}`)
    console.log('-'.repeat(40))

    const files = fs.readdirSync(industryDir)
      .filter(f => f.endsWith('.mdx') && f !== 'index.mdx')

    let enriched = 0
    let skipped = 0

    for (const file of files) {
      const filePath = path.join(industryDir, file)
      try {
        if (enrichProcessFile(filePath)) {
          enriched++
        } else {
          skipped++
        }
      } catch (error) {
        console.log(`  Error processing ${file}: ${error}`)
        skipped++
      }
    }

    results[industry] = { enriched, skipped, total: files.length }
    console.log(`  Enriched: ${enriched}`)
    console.log(`  Skipped: ${skipped}`)
    console.log(`  Total: ${files.length}`)
  }

  console.log('\n\nSummary')
  console.log('=======')
  for (const [industry, stats] of Object.entries(results)) {
    console.log(`${industry}: ${stats.enriched} enriched, ${stats.skipped} skipped (${stats.total} total)`)
  }

  const totalEnriched = Object.values(results).reduce((sum, r) => sum + r.enriched, 0)
  const totalFiles = Object.values(results).reduce((sum, r) => sum + r.total, 0)
  console.log(`\nTotal: ${totalEnriched} files enriched out of ${totalFiles}`)
}

main().catch(console.error)
