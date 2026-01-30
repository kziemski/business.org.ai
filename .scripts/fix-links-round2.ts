import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from 'fs'
import { join, basename, relative } from 'path'

const root = process.cwd()

// Recursively find all MDX files
function findMdx(dir: string): string[] {
  const results: string[] = []
  if (!existsSync(dir)) return results
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) results.push(...findMdx(full))
    else if (entry.name.endsWith('.mdx') && !entry.name.startsWith('[')) results.push(full)
  }
  return results
}

// Build indexes: name → relative path from root (without .mdx)
function buildIndex(dir: string): Map<string, string> {
  const index = new Map<string, string>()
  for (const file of findMdx(join(root, dir))) {
    const rel = relative(root, file).replace(/\.mdx$/, '').replace(/\/index$/, '')
    const name = basename(file, '.mdx')
    if (name === 'index') {
      // Use the directory name
      const dirName = basename(join(file, '..'))
      index.set(dirName, '/' + rel)
    } else {
      index.set(name, '/' + rel)
    }
  }
  return index
}

console.log('Building indexes...')
const occupationIndex = buildIndex('occupations')
const industryIndex = buildIndex('industries')
const processIndex = buildIndex('processes')
const departmentIndex = buildIndex('departments')

// Build sets of existing top-level dirs
const existingDepartments = new Set(
  readdirSync(join(root, 'departments'), { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
)
const existingIndustries = new Set(
  readdirSync(join(root, 'industries'), { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
)

console.log(`Occupation index: ${occupationIndex.size} entries`)
console.log(`Industry index: ${industryIndex.size} entries`)
console.log(`Process index: ${processIndex.size} entries`)
console.log(`Department index: ${departmentIndex.size} entries`)
console.log(`Existing departments: ${[...existingDepartments].join(', ')}`)

// Department mappings
const deptMap: Record<string, string> = {
  Manufacturing: 'Operations',
  Engineering: 'Technology',
  Logistics: 'SupplyChain',
  Maintenance: 'Operations',
  Chemistry: 'Research',
  EarlyChildhood: 'Operations',
  Education: 'HR',
  Podiatry: 'Operations',
  FootAnkleSurgery: 'Operations',
  WoundCare: 'Operations',
  IT: 'Technology',
  PMO: 'Operations',
  Facilities: 'Operations',
  ERM: 'Operations',
  InternalAudit: 'Finance',
  LD: 'HR',
  RD: 'Research',
  QA: 'Quality',
  CS: 'Support',
  CX: 'Support',
}

// Industry mappings
const industryMap: Record<string, string> = {
  Government: 'PublicAdministration',
  ProfessionalServices: 'Scientific',
  FinanceInsurance: 'Finance',
  Automotive: 'Manufacturing',
  Trucking: 'TransportationAndWarehousing',
}

// Military department names
const militaryPatterns = ['Army', 'Navy', 'AirForce', 'Marines', 'CoastGuard', 'SpaceForce', 'NationalGuard', 'Combat', 'Infantry', 'Artillery']

const stats = { filesScanned: 0, occupationFixed: 0, departmentFixed: 0, industryFixed: 0, processFixed: 0, departmentRemoved: 0, industryRemoved: 0, unresolved: [] as string[] }

// Find ALL mdx files
const allMdx = [
  ...findMdx(join(root, 'occupations')),
  ...findMdx(join(root, 'industries')),
  ...findMdx(join(root, 'processes')),
  ...findMdx(join(root, 'departments')),
]

for (const file of allMdx) {
  stats.filesScanned++
  let content = readFileSync(file, 'utf-8')
  let modified = false
  const relFile = relative(root, file)

  // a) Occupation links without category: ](/occupations/Name)
  content = content.replace(/\]\(\/occupations\/([A-Z][A-Za-z0-9]*)\)/g, (match, name) => {
    const resolved = occupationIndex.get(name)
    if (resolved) {
      stats.occupationFixed++
      modified = true
      return `](${resolved})`
    }
    stats.unresolved.push(`${relFile}: occupation ${name}`)
    return match
  })

  // b) Department links: ](/departments/Name)
  content = content.replace(/\[([^\]]*)\]\(\/departments\/([A-Z][A-Za-z0-9]*)\)/g, (match, text, name) => {
    // Check if department exists
    if (existingDepartments.has(name) || departmentIndex.has(name)) {
      return match // valid link
    }
    // Try mapping
    let mapped = deptMap[name]
    if (!mapped && militaryPatterns.some(p => name.includes(p))) mapped = 'Operations'
    if (mapped && existingDepartments.has(mapped)) {
      stats.departmentFixed++
      modified = true
      return `[${text}](/departments/${mapped})`
    }
    // Remove link, keep text
    stats.departmentRemoved++
    modified = true
    return text
  })

  // c) Industry links: ](/industries/Name)
  content = content.replace(/\[([^\]]*)\]\(\/industries\/([A-Z][A-Za-z0-9]*)\)/g, (match, text, name) => {
    // Check if industry path exists (either as dir or in index)
    if (existingIndustries.has(name) || industryIndex.has(name)) {
      return match // valid
    }
    // Check if it's a subpath that exists
    const resolved = industryIndex.get(name)
    if (resolved) {
      stats.industryFixed++
      modified = true
      return `[${text}](${resolved})`
    }
    // Try mapping
    const mapped = industryMap[name]
    if (mapped && (existingIndustries.has(mapped) || industryIndex.has(mapped))) {
      stats.industryFixed++
      modified = true
      return `[${text}](/industries/${mapped})`
    }
    // Remove link, keep text
    stats.industryRemoved++
    modified = true
    return text
  })

  // d) Process links without numbered prefix: ](/processes/Name)
  content = content.replace(/\[([^\]]*)\]\(\/processes\/([A-Z][A-Za-z0-9]*)\)/g, (match, text, name) => {
    const resolved = processIndex.get(name)
    if (resolved) {
      stats.processFixed++
      modified = true
      return `[${text}](${resolved})`
    }
    stats.unresolved.push(`${relFile}: process ${name}`)
    return match
  })

  if (modified) {
    writeFileSync(file, content)
  }
}

console.log('\n=== Report ===')
console.log(`Files scanned: ${stats.filesScanned}`)
console.log(`Occupation links fixed: ${stats.occupationFixed}`)
console.log(`Department links fixed (remapped): ${stats.departmentFixed}`)
console.log(`Department links removed: ${stats.departmentRemoved}`)
console.log(`Industry links fixed: ${stats.industryFixed}`)
console.log(`Industry links removed: ${stats.industryRemoved}`)
console.log(`Process links fixed: ${stats.processFixed}`)
console.log(`\nUnresolved links: ${stats.unresolved.length}`)
if (stats.unresolved.length > 0) {
  for (const u of stats.unresolved.slice(0, 50)) console.log(`  ${u}`)
  if (stats.unresolved.length > 50) console.log(`  ... and ${stats.unresolved.length - 50} more`)
}
