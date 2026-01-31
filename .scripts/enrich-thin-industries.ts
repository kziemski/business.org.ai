/**
 * Enriches thin industry files (under 4KB) with:
 * 1. Expanded industry overview
 * 2. Market context table
 * 3. Key business processes
 * 4. Common occupations
 * 5. Regulations and standards
 * 6. Technology and tools
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const INDUSTRIES_DIR = path.join(__dirname, '../industries')
const MIN_SIZE = 4096 // 4KB threshold

// Industry sector configurations
const sectorConfigs: Record<string, {
  occupations: { name: string; path: string }[];
  regulations: string[];
  technology: string[];
  processes: string[];
  marketContext: string;
}> = {
  Agriculture: {
    occupations: [
      { name: 'Agricultural Managers', path: '/occupations/Management/FarmersRanchersAndOtherAgriculturalManagers' },
      { name: 'Agricultural Workers', path: '/occupations/Agriculture/AgriculturalWorkers' },
      { name: 'Agricultural Equipment Operators', path: '/occupations/Agriculture/AgriculturalEquipmentOperators' },
      { name: 'Agricultural Inspectors', path: '/occupations/Agriculture/AgriculturalInspectors' },
    ],
    regulations: [
      'USDA Food Safety and Inspection Service (FSIS)',
      'EPA Agricultural Regulations',
      'State Department of Agriculture requirements',
      'Food Safety Modernization Act (FSMA)',
      'Worker Protection Standard (WPS)',
    ],
    technology: [
      'Precision agriculture and GPS guidance',
      'Automated irrigation systems',
      'Farm management software',
      'Crop monitoring drones',
      'Livestock tracking systems',
    ],
    processes: [
      'Planting and cultivation',
      'Harvesting and processing',
      'Quality control and grading',
      'Storage and distribution',
      'Marketing and sales',
    ],
    marketContext: 'Agricultural production forms the foundation of the food supply chain, with increasing emphasis on sustainable practices, precision farming, and technology adoption.',
  },
  Mining: {
    occupations: [
      { name: 'Mining Engineers', path: '/occupations/Engineering/MiningAndGeologicalEngineers' },
      { name: 'Extraction Workers', path: '/occupations/Construction/ExtractionWorkers' },
      { name: 'Mining Machine Operators', path: '/occupations/Production/MiningMachineOperators' },
      { name: 'Geological Engineers', path: '/occupations/Engineering/MiningAndGeologicalEngineers' },
    ],
    regulations: [
      'Mine Safety and Health Administration (MSHA)',
      'Environmental Protection Agency (EPA)',
      'Bureau of Land Management (BLM)',
      'State mining regulations',
      'Clean Water Act requirements',
    ],
    technology: [
      'Autonomous mining equipment',
      'Real-time monitoring systems',
      'Geological modeling software',
      'Safety detection systems',
      'Environmental monitoring',
    ],
    processes: [
      'Exploration and surveying',
      'Extraction and processing',
      'Safety and compliance',
      'Environmental management',
      'Reclamation and closure',
    ],
    marketContext: 'The mining industry provides essential raw materials for manufacturing and construction, with growing focus on sustainable extraction and safety technology.',
  },
  Construction: {
    occupations: [
      { name: 'Construction Managers', path: '/occupations/Management/ConstructionManagers' },
      { name: 'Construction Laborers', path: '/occupations/Construction/ConstructionLaborers' },
      { name: 'Carpenters', path: '/occupations/Construction/Carpenters' },
      { name: 'Electricians', path: '/occupations/Construction/Electricians' },
    ],
    regulations: [
      'OSHA Construction Standards (29 CFR 1926)',
      'International Building Code (IBC)',
      'Local building permits and inspections',
      'EPA environmental regulations',
      'ADA accessibility requirements',
    ],
    technology: [
      'Building Information Modeling (BIM)',
      'Project management software',
      'Drones for site surveys',
      'Prefabrication and modular construction',
      'Safety monitoring systems',
    ],
    processes: [
      'Design and planning',
      'Site preparation',
      'Construction and assembly',
      'Quality inspection',
      'Project closeout',
    ],
    marketContext: 'Construction drives infrastructure development and economic growth, with increasing adoption of sustainable building practices and digital construction technologies.',
  },
  Manufacturing: {
    occupations: [
      { name: 'Industrial Production Managers', path: '/occupations/Management/IndustrialProductionManagers' },
      { name: 'Production Workers', path: '/occupations/Production/ProductionWorkers' },
      { name: 'Quality Control Inspectors', path: '/occupations/Production/QualityControlInspectors' },
      { name: 'Industrial Engineers', path: '/occupations/Engineering/IndustrialEngineers' },
    ],
    regulations: [
      'OSHA Manufacturing Standards',
      'EPA Environmental Regulations',
      'FDA regulations (where applicable)',
      'ISO quality standards',
      'Industry-specific certifications',
    ],
    technology: [
      'Industrial automation and robotics',
      'Enterprise Resource Planning (ERP)',
      'Quality management systems',
      'Predictive maintenance',
      'IoT and smart manufacturing',
    ],
    processes: [
      'Production planning',
      'Manufacturing operations',
      'Quality assurance',
      'Inventory management',
      'Distribution and logistics',
    ],
    marketContext: 'Manufacturing transforms raw materials into finished goods, with Industry 4.0 driving automation, digitalization, and smart factory implementations.',
  },
  Retail: {
    occupations: [
      { name: 'Retail Managers', path: '/occupations/Management/SalesManagers' },
      { name: 'Retail Salespersons', path: '/occupations/Sales/RetailSalespersons' },
      { name: 'Cashiers', path: '/occupations/Sales/Cashiers' },
      { name: 'Stock Clerks', path: '/occupations/Sales/StockClerksAndOrderFillers' },
    ],
    regulations: [
      'Consumer protection laws',
      'Payment Card Industry (PCI) compliance',
      'Labor and employment regulations',
      'Product safety standards',
      'State retail licensing',
    ],
    technology: [
      'Point-of-sale (POS) systems',
      'Inventory management software',
      'E-commerce platforms',
      'Customer relationship management (CRM)',
      'Mobile payment solutions',
    ],
    processes: [
      'Merchandising and display',
      'Sales and customer service',
      'Inventory management',
      'Loss prevention',
      'Omnichannel fulfillment',
    ],
    marketContext: 'Retail connects products to consumers through various channels, with omnichannel strategies and e-commerce reshaping traditional retail models.',
  },
  TransportationAndWarehousing: {
    occupations: [
      { name: 'Transportation Managers', path: '/occupations/Management/TransportationStorageAndDistributionManagers' },
      { name: 'Truck Drivers', path: '/occupations/Transportation/HeavyAndTractorTrailerTruckDrivers' },
      { name: 'Warehouse Workers', path: '/occupations/Transportation/LaborersAndFreightStockAndMaterialMovers' },
      { name: 'Logistics Coordinators', path: '/occupations/Business/Logisticians' },
    ],
    regulations: [
      'Department of Transportation (DOT)',
      'Federal Motor Carrier Safety Administration (FMCSA)',
      'Hazardous Materials Regulations (HMR)',
      'OSHA warehouse safety standards',
      'State transportation permits',
    ],
    technology: [
      'Fleet management systems',
      'Warehouse management systems (WMS)',
      'GPS tracking and telematics',
      'Automated material handling',
      'Transportation management systems (TMS)',
    ],
    processes: [
      'Route planning and optimization',
      'Freight handling',
      'Warehouse operations',
      'Last-mile delivery',
      'Fleet maintenance',
    ],
    marketContext: 'Transportation and warehousing enable the movement of goods through supply chains, with technology driving efficiency improvements and last-mile innovations.',
  },
  Wholesale: {
    occupations: [
      { name: 'Wholesale Sales Representatives', path: '/occupations/Sales/WholesaleAndManufacturingSalesRepresentatives' },
      { name: 'Purchasing Managers', path: '/occupations/Business/PurchasingManagers' },
      { name: 'Warehouse Managers', path: '/occupations/Management/TransportationStorageAndDistributionManagers' },
      { name: 'Order Clerks', path: '/occupations/Administrative/OrderClerks' },
    ],
    regulations: [
      'Trade and commerce regulations',
      'Industry-specific licensing',
      'Product safety standards',
      'Import/export compliance',
      'Contract and commercial law',
    ],
    technology: [
      'Enterprise Resource Planning (ERP)',
      'Electronic Data Interchange (EDI)',
      'Inventory management systems',
      'B2B e-commerce platforms',
      'Supply chain analytics',
    ],
    processes: [
      'Sourcing and procurement',
      'Inventory management',
      'Order fulfillment',
      'Sales and distribution',
      'Customer relationship management',
    ],
    marketContext: 'Wholesale trade bridges manufacturers and retailers, with digital transformation enabling more efficient B2B transactions and supply chain integration.',
  },
  Finance: {
    occupations: [
      { name: 'Financial Managers', path: '/occupations/Management/FinancialManagers' },
      { name: 'Financial Analysts', path: '/occupations/Business/FinancialAnalysts' },
      { name: 'Loan Officers', path: '/occupations/Business/LoanOfficers' },
      { name: 'Tellers', path: '/occupations/Administrative/Tellers' },
    ],
    regulations: [
      'Federal Reserve regulations',
      'SEC requirements',
      'FDIC insurance requirements',
      'Bank Secrecy Act (BSA)',
      'Dodd-Frank Act provisions',
    ],
    technology: [
      'Core banking systems',
      'Trading platforms',
      'Risk management systems',
      'Mobile banking applications',
      'Blockchain and digital assets',
    ],
    processes: [
      'Account management',
      'Lending and credit',
      'Investment management',
      'Risk and compliance',
      'Customer service',
    ],
    marketContext: 'Financial services facilitate capital flow and economic activity, with fintech innovation transforming traditional banking and investment models.',
  },
  Healthcare: {
    occupations: [
      { name: 'Healthcare Managers', path: '/occupations/Management/MedicalAndHealthServicesManagers' },
      { name: 'Registered Nurses', path: '/occupations/HealthcarePractitioners/RegisteredNurses' },
      { name: 'Physicians', path: '/occupations/HealthcarePractitioners/PhysiciansAndSurgeons' },
      { name: 'Medical Assistants', path: '/occupations/HealthcareSupport/MedicalAssistants' },
    ],
    regulations: [
      'HIPAA privacy and security rules',
      'CMS regulations',
      'Joint Commission accreditation',
      'State licensing requirements',
      'FDA medical device regulations',
    ],
    technology: [
      'Electronic Health Records (EHR)',
      'Telemedicine platforms',
      'Medical imaging systems',
      'Practice management software',
      'Patient portal systems',
    ],
    processes: [
      'Patient registration and intake',
      'Clinical care delivery',
      'Billing and revenue cycle',
      'Quality and compliance',
      'Care coordination',
    ],
    marketContext: 'Healthcare delivers essential medical services, with digital health, value-based care, and population health management transforming care delivery models.',
  },
  Information: {
    occupations: [
      { name: 'Computer Systems Managers', path: '/occupations/Management/ComputerAndInformationSystemsManagers' },
      { name: 'Software Developers', path: '/occupations/Technology/SoftwareDevelopers' },
      { name: 'Data Scientists', path: '/occupations/Technology/DataScientists' },
      { name: 'Network Administrators', path: '/occupations/Technology/NetworkAndComputerSystemsAdministrators' },
    ],
    regulations: [
      'FCC communications regulations',
      'Data privacy laws (CCPA, GDPR)',
      'Intellectual property protections',
      'Cybersecurity frameworks',
      'Net neutrality policies',
    ],
    technology: [
      'Cloud computing platforms',
      'Content management systems',
      'Broadcasting equipment',
      'Network infrastructure',
      'Streaming technologies',
    ],
    processes: [
      'Content creation and curation',
      'Technology development',
      'Network operations',
      'Customer acquisition',
      'Service delivery',
    ],
    marketContext: 'Information industries create and distribute content and technology services, with digital transformation and streaming reshaping media consumption.',
  },
}

// Get sector from path
function getSector(filePath: string): string {
  const parts = filePath.split('/')
  const industriesIdx = parts.indexOf('industries')
  if (industriesIdx >= 0 && parts.length > industriesIdx + 1) {
    return parts[industriesIdx + 1]
  }
  return 'Manufacturing' // default
}

// Get subsector name from path
function getSubsector(filePath: string): string {
  const parts = filePath.split('/')
  const industriesIdx = parts.indexOf('industries')
  if (industriesIdx >= 0 && parts.length > industriesIdx + 2) {
    return parts.slice(industriesIdx + 2, -1).join(' > ')
  }
  return ''
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

// Generate enrichment content
function generateEnrichment(sector: string, name: string, code: string): string {
  const config = sectorConfigs[sector] || sectorConfigs.Manufacturing

  const occupationsSection = config.occupations
    .map(o => `- [${o.name}](${o.path})`)
    .join('\n')

  const regulationsSection = config.regulations
    .map(r => `- ${r}`)
    .join('\n')

  const technologySection = config.technology
    .map(t => `- ${t}`)
    .join('\n')

  const processesSection = config.processes
    .map(p => `- ${p}`)
    .join('\n')

  return `

## Market Context

${config.marketContext}

| Aspect | Details |
|--------|---------|
| Industry Sector | ${sector} |
| NAICS/SIC Code | ${code} |
| Market Segment | ${name} |

## Key Business Processes

${processesSection}

## Common Occupations

${occupationsSection}

## Regulations and Standards

${regulationsSection}

## Technology and Tools

${technologySection}

## Industry Trends

- Digital transformation and automation adoption
- Sustainability and environmental compliance focus
- Workforce development and skills training
- Supply chain resilience and optimization
- Customer experience enhancement
`
}

// Process a single file
function processFile(filePath: string): boolean {
  const stats = fs.statSync(filePath)
  if (stats.size >= MIN_SIZE) {
    return false // Already large enough
  }

  const content = fs.readFileSync(filePath, 'utf-8')
  const { frontmatter, body } = parseFrontmatter(content)

  // Skip if already has Market Context or Industry Trends
  if (body.includes('## Market Context') || body.includes('## Industry Trends')) {
    return false
  }

  const sector = getSector(filePath)
  const name = frontmatter.name || path.basename(filePath, '.mdx')
  const code = frontmatter.code || frontmatter.naicsCode || 'N/A'

  // Generate enrichment
  const enrichment = generateEnrichment(sector, name, code)

  // Insert before the last GraphDL section or at the end
  let newBody = body
  const graphdlMatch = body.match(/\n## GraphDL Semantic Structure/)
  if (graphdlMatch && graphdlMatch.index) {
    newBody = body.slice(0, graphdlMatch.index) + enrichment + body.slice(graphdlMatch.index)
  } else {
    // Insert before source line or at end
    const sourceMatch = body.match(/\n---\n\n\*Source:/)
    if (sourceMatch && sourceMatch.index) {
      newBody = body.slice(0, sourceMatch.index) + enrichment + body.slice(sourceMatch.index)
    } else {
      newBody = body + enrichment
    }
  }

  // Rebuild file with frontmatter
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
    const entries = fs.readdirSync(currentDir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name)
      if (entry.isDirectory()) {
        // Skip SIC directories for now
        if (entry.name !== 'SIC') {
          walk(fullPath)
        }
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
  console.log('Finding thin industry files...')
  const files = findThinFiles(INDUSTRIES_DIR)
  console.log(`Found ${files.length} thin files`)

  let enriched = 0
  let skipped = 0

  for (const file of files) {
    try {
      if (processFile(file)) {
        enriched++
        if (enriched % 100 === 0) {
          console.log(`Enriched ${enriched} files...`)
        }
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
