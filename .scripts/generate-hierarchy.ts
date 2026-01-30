import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const DATA_DIR = join(__dirname, '../.data')
const ROOT_DIR = join(__dirname, '..')

// Read TSV file
function readTSV(path: string): Record<string, string>[] {
  const content = readFileSync(path, 'utf-8')
  const lines = content.trim().split('\n')
  const headers = lines[0].split('\t')
  return lines.slice(1).map(line => {
    const values = line.split('\t')
    return headers.reduce((obj, header, i) => {
      obj[header] = values[i] || ''
      return obj
    }, {} as Record<string, string>)
  })
}

// Convert name to folder-safe format
function toFolderName(name: string): string {
  return name
    .replace(/[,\.\(\)\/\\:'"]/g, '')
    .replace(/\s+/g, '')
    .replace(/And/g, 'And')
    .replace(/^(The|A|An)\s+/i, '')
    .trim()
}

// Generate stub MDX content
function generateStub(entity: Record<string, string>, type: string): string {
  const name = entity.name || entity.id
  const description = entity.description || ''
  const code = entity.code || ''

  return `---
id: ${entity.id}
name: "${name}"
code: "${code}"
type: ${type}
status: stub
---

# ${name}

> ${description.slice(0, 200)}${description.length > 200 ? '...' : ''}

## Overview

*Content to be generated*

## Hierarchy

\`\`\`mermaid
graph TD
    TODO[To be generated]
\`\`\`

## Key Statistics

| Metric | Value |
|--------|-------|
| Code | ${code} |

## Related Entities

*To be generated*

---

*Source: ${entity.sourceType || type}*
`
}

// INDUSTRIES - Build hierarchy based on NAICS code structure
function generateIndustries() {
  const industries = readTSV(join(DATA_DIR, 'Industries.tsv'))
  const outDir = join(ROOT_DIR, 'industries')

  // Group by level and build hierarchy
  const sectors = industries.filter(i => i.level === '1')
  const subsectors = industries.filter(i => i.level === '2')
  const groups = industries.filter(i => i.level === '3')
  const detailed = industries.filter(i => parseInt(i.level) >= 4)

  // Create sector folders
  const sectorMap = new Map<string, { path: string; children: string[] }>()

  for (const sector of sectors.slice(0, 20)) { // Top 20 sectors
    const folderName = toFolderName(sector.name)
    const sectorPath = join(outDir, folderName)
    mkdirSync(sectorPath, { recursive: true })

    // Write index.mdx for sector
    writeFileSync(
      join(sectorPath, 'index.mdx'),
      generateStub(sector, 'Industry')
    )

    sectorMap.set(sector.code, { path: sectorPath, children: [] })
  }

  // Create subsector folders under sectors
  for (const subsector of subsectors.slice(0, 50)) {
    const sectorCode = subsector.code?.slice(0, 2) || ''
    const parentInfo = sectorMap.get(sectorCode)

    if (parentInfo) {
      const folderName = toFolderName(subsector.name)
      const subsectorPath = join(parentInfo.path, folderName)
      mkdirSync(subsectorPath, { recursive: true })

      writeFileSync(
        join(subsectorPath, 'index.mdx'),
        generateStub(subsector, 'Industry')
      )
    }
  }

  console.log(`Generated ${sectorMap.size} industry sectors`)
}

// OCCUPATIONS - Build hierarchy based on SOC code structure
function generateOccupations() {
  const occupations = readTSV(join(DATA_DIR, 'Occupations.tsv'))
  const outDir = join(ROOT_DIR, 'occupations')

  // Group by major category (first 2 digits of SOC code)
  const categories = new Map<string, Record<string, string>[]>()

  const categoryNames: Record<string, string> = {
    '11': 'Management',
    '13': 'BusinessAndFinancial',
    '15': 'ComputerAndMathematical',
    '17': 'ArchitectureAndEngineering',
    '19': 'LifePhysicalAndSocialScience',
    '21': 'CommunityAndSocialService',
    '23': 'Legal',
    '25': 'EducationTrainingAndLibrary',
    '27': 'ArtsDesignEntertainmentSportsMedia',
    '29': 'HealthcarePractitioners',
    '31': 'HealthcareSupport',
    '33': 'ProtectiveService',
    '35': 'FoodPreparationAndServing',
    '37': 'BuildingAndGroundsCleaning',
    '39': 'PersonalCareAndService',
    '41': 'SalesAndRelated',
    '43': 'OfficeAndAdministrativeSupport',
    '45': 'FarmingFishingAndForestry',
    '47': 'ConstructionAndExtraction',
    '49': 'InstallationMaintenanceAndRepair',
    '51': 'Production',
    '53': 'TransportationAndMaterialMoving',
    '55': 'MilitarySpecific'
  }

  for (const occ of occupations) {
    const catCode = occ.code?.split('-')[0] || ''
    if (!categories.has(catCode)) {
      categories.set(catCode, [])
    }
    categories.get(catCode)!.push(occ)
  }

  // Create category folders
  for (const [catCode, occs] of categories) {
    const catName = categoryNames[catCode] || `Category${catCode}`
    const catPath = join(outDir, catName)
    mkdirSync(catPath, { recursive: true })

    // Write category index
    writeFileSync(
      join(catPath, 'index.mdx'),
      `---
id: Category${catCode}
name: "${catName}"
code: "${catCode}"
type: OccupationCategory
status: stub
---

# ${catName.replace(/([A-Z])/g, ' $1').trim()}

*Category ${catCode} occupations*

## Occupations in this Category

${occs.slice(0, 10).map(o => `- [${o.name}](./${o.id}.mdx)`).join('\n')}

---
`
    )

    // Write individual occupation stubs (first 5 per category)
    for (const occ of occs.slice(0, 5)) {
      writeFileSync(
        join(catPath, `${occ.id}.mdx`),
        generateStub(occ, 'Occupation')
      )
    }
  }

  console.log(`Generated ${categories.size} occupation categories`)
}

// PROCESSES - Build hierarchy based on APQC structure
function generateProcesses() {
  const processes = readTSV(join(DATA_DIR, 'Processes.tsv'))
  const outDir = join(ROOT_DIR, 'processes')

  // Get top-level categories (level 1)
  const categories = processes.filter(p => p.level === '1')

  const categoryPrefixes: Record<string, string> = {
    '1': '01-VisionAndStrategy',
    '2': '02-ProductDevelopment',
    '3': '03-MarketAndSell',
    '4': '04-DeliverProducts',
    '5': '05-DeliverServices',
    '6': '06-ManageCustomerService',
    '7': '07-HumanCapital',
    '8': '08-ManageIT',
    '9': '09-FinancialResources',
    '10': '10-ManageAssets',
    '11': '11-RiskAndCompliance',
    '12': '12-ExternalRelationships',
    '13': '13-BusinessCapabilities'
  }

  // Group processes by their hierarchy prefix
  const processGroups = new Map<string, Record<string, string>[]>()

  for (const proc of processes) {
    // Extract the category number from the process
    const name = proc.name || ''
    const id = proc.id || ''

    // Try to determine category from code or id
    let catNum = '1'
    if (name.toLowerCase().includes('vision') || name.toLowerCase().includes('strategy')) catNum = '1'
    else if (name.toLowerCase().includes('design') || name.toLowerCase().includes('develop') && name.toLowerCase().includes('product')) catNum = '2'
    else if (name.toLowerCase().includes('market') || name.toLowerCase().includes('sell')) catNum = '3'
    else if (name.toLowerCase().includes('deliver') && name.toLowerCase().includes('product')) catNum = '4'
    else if (name.toLowerCase().includes('deliver') && name.toLowerCase().includes('service')) catNum = '5'
    else if (name.toLowerCase().includes('customer service')) catNum = '6'
    else if (name.toLowerCase().includes('human') || name.toLowerCase().includes('capital')) catNum = '7'
    else if (name.toLowerCase().includes('information') || name.toLowerCase().includes(' it ') || name.toLowerCase().includes('technology')) catNum = '8'
    else if (name.toLowerCase().includes('financial')) catNum = '9'
    else if (name.toLowerCase().includes('asset')) catNum = '10'
    else if (name.toLowerCase().includes('risk') || name.toLowerCase().includes('compliance')) catNum = '11'
    else if (name.toLowerCase().includes('external')) catNum = '12'
    else if (name.toLowerCase().includes('capabilit')) catNum = '13'

    if (!processGroups.has(catNum)) {
      processGroups.set(catNum, [])
    }
    processGroups.get(catNum)!.push(proc)
  }

  // Create category folders
  for (const [catNum, procs] of processGroups) {
    const catPath = join(outDir, categoryPrefixes[catNum] || `${catNum}-Other`)
    mkdirSync(catPath, { recursive: true })

    // Write category index
    const catName = categoryPrefixes[catNum]?.replace(/^\d+-/, '').replace(/([A-Z])/g, ' $1').trim() || `Category ${catNum}`
    writeFileSync(
      join(catPath, 'index.mdx'),
      `---
id: ProcessCategory${catNum}
name: "${catName}"
code: "${catNum}.0"
type: ProcessCategory
status: stub
---

# ${catName}

*APQC Category ${catNum}.0*

## Processes in this Category

${procs.slice(0, 10).map(p => `- [${p.name}](./${p.id}.mdx)`).join('\n')}

---
`
    )

    // Write individual process stubs (first 5 per category)
    for (const proc of procs.slice(0, 5)) {
      writeFileSync(
        join(catPath, `${proc.id}.mdx`),
        generateStub(proc, 'Process')
      )
    }
  }

  console.log(`Generated ${processGroups.size} process categories`)
}

// DEPARTMENTS - Build from APQC process groups and common functional areas
function generateDepartments() {
  const outDir = join(ROOT_DIR, 'departments')

  const departments = [
    { id: 'Executive', name: 'Executive', description: 'C-Suite and executive leadership functions' },
    { id: 'Strategy', name: 'Strategy', description: 'Strategic planning and business development' },
    { id: 'Operations', name: 'Operations', description: 'Operations and production management' },
    { id: 'Finance', name: 'Finance', description: 'Financial management and accounting' },
    { id: 'Sales', name: 'Sales', description: 'Sales and revenue generation' },
    { id: 'Marketing', name: 'Marketing', description: 'Marketing and brand management' },
    { id: 'HumanResources', name: 'Human Resources', description: 'HR and talent management' },
    { id: 'Technology', name: 'Technology', description: 'IT and technology services' },
    { id: 'Legal', name: 'Legal', description: 'Legal and compliance functions' },
    { id: 'CustomerService', name: 'Customer Service', description: 'Customer support and service' },
    { id: 'SupplyChain', name: 'Supply Chain', description: 'Supply chain and logistics' },
    { id: 'Research', name: 'Research & Development', description: 'R&D and innovation' }
  ]

  for (const dept of departments) {
    const deptPath = join(outDir, dept.id)
    mkdirSync(deptPath, { recursive: true })

    writeFileSync(
      join(deptPath, 'index.mdx'),
      `---
id: ${dept.id}
name: "${dept.name}"
type: Department
status: stub
---

# ${dept.name}

> ${dept.description}

## Overview

*Content to be generated*

## Structure

\`\`\`mermaid
graph TD
    ${dept.id}["${dept.name}"]
    TODO[Teams to be generated]
    ${dept.id} --> TODO
\`\`\`

## Key Roles

*To be generated*

## Core Processes

*To be generated*

## Cross-Functional Relationships

*To be generated*

---
`
    )
  }

  console.log(`Generated ${departments.length} departments`)
}

// Main
console.log('Generating hierarchical structure...')
generateIndustries()
generateOccupations()
generateProcesses()
generateDepartments()
console.log('Done!')
