/**
 * Generate MDX files for ALL processes in .data/Processes.tsv
 *
 * Reads the APQC Process Classification Framework data and generates
 * hierarchical MDX documentation for all ~5,620 processes.
 *
 * HIERARCHY LEVELS:
 *   Category (X.0)        -> folder: XX-CategoryName/index.mdx
 *   Group (X.Y)           -> folder: X.Y-GroupName/index.mdx
 *   Process (X.Y.Z)       -> folder: X.Y.Z-ProcessName/index.mdx
 *   Activity (X.Y.Z.A)    -> leaf file or folder with index.mdx if has children
 *   Sub-Activity (X.Y.Z.A.B) -> leaf file: SubActivityName.mdx
 *
 * Skips files that already exist.
 */

import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const DATA_DIR = join(__dirname, '../.data')
const PROCESSES_DIR = join(__dirname, '../processes')

// ── Data structures ──

interface ProcessRecord {
  ns: string
  type: string
  id: string
  name: string
  description: string
  code: string
  shortName: string
  sourceType: string
  level: string
}

interface ConceptRelation {
  from: string
  to: string
  predicate: string
  reverse: string
  context: string // hierarchy ID like "1.1.1"
}

interface HierarchyNode {
  hierarchyId: string
  process: ProcessRecord
  children: HierarchyNode[]
  concepts: string[]
}

// ── Category folder mapping ──

const CATEGORY_FOLDERS: Record<string, string> = {
  '1': '01-Strategy',
  '2': '02-Products',
  '3': '03-Sales',
  '4': '04-Delivery',
  '5': '05-Services',
  '6': '06-CustomerService',
  '7': '07-HR',
  '8': '08-IT',
  '9': '09-Finance',
  '10': '10-Assets',
  '11': '11-Risk',
  '12': '12-External',
  '13': '13-Capabilities',
}

const CATEGORY_NAMES: Record<string, string> = {
  '1': 'Develop Vision and Strategy',
  '2': 'Design and Develop Products and Services',
  '3': 'Market and Sell Products and Services',
  '4': 'Deliver Physical Products',
  '5': 'Deliver Services',
  '6': 'Manage Customer Service',
  '7': 'Develop and Manage Human Capital',
  '8': 'Manage Information Technology',
  '9': 'Manage Financial Resources',
  '10': 'Acquire, Construct, and Manage Assets',
  '11': 'Manage Enterprise Risk, Compliance, Remediation, Resiliency',
  '12': 'Manage External Relationships',
  '13': 'Develop and Manage Business Capabilities',
}

// ── Parsing ──

function readTSV<T>(filePath: string): T[] {
  const content = readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')
  const headers = lines[0].split('\t')
  return lines.slice(1)
    .filter(line => line.trim())
    .map(line => {
      const values = line.split('\t')
      const obj: any = {}
      headers.forEach((header, i) => {
        obj[header.trim()] = (values[i] || '').trim()
      })
      return obj as T
    })
}

// ── Build hierarchy ID mapping from Process.Concepts.tsv ──

function buildHierarchyMap(concepts: ConceptRelation[]): Map<string, string> {
  // Map from process ID (e.g. "DevelopVisionAndStrategy") to hierarchy ID (e.g. "1.0")
  const map = new Map<string, string>()
  for (const c of concepts) {
    const processId = c.from.replace('process.org.ai/', '')
    if (c.context && !map.has(processId)) {
      map.set(processId, c.context)
    }
  }
  return map
}

// ── Build complete hierarchy from sequential TSV ordering ──

function buildFullHierarchy(
  processes: ProcessRecord[],
  partialMap: Map<string, string>
): { nodeMap: Map<string, HierarchyNode>; roots: HierarchyNode[] } {
  // First, assign hierarchy IDs to ALL processes.
  // The TSV is ordered sequentially by APQC hierarchy.
  // We use the partial map from concepts as anchors, then infer the rest.

  const hierarchyToProcess = new Map<string, ProcessRecord>()
  const processToHierarchy = new Map<string, string>()

  // Seed from partial map
  for (const [procId, hId] of partialMap) {
    processToHierarchy.set(procId, hId)
  }

  // Track current position in hierarchy for inference
  let currentCategory = 0
  let currentGroup = 0
  let currentProcess = 0
  let currentActivity = 0
  let currentSubActivity = 0
  let lastDepth = 0

  // We'll track which category each process belongs to by scanning sequentially
  // and using known hierarchy IDs as anchors

  // First pass: identify all known hierarchy IDs and their positions
  const knownPositions: { index: number; hierarchyId: string; processId: string }[] = []
  for (let i = 0; i < processes.length; i++) {
    const hId = processToHierarchy.get(processes[i].id)
    if (hId) {
      knownPositions.push({ index: i, hierarchyId: hId, processId: processes[i].id })
    }
  }

  // Second pass: for processes without known IDs, infer from neighbors
  // Build a sequential assignment based on the ordering pattern
  const allHierarchyIds: string[] = new Array(processes.length).fill('')

  // Fill known positions
  for (const kp of knownPositions) {
    allHierarchyIds[kp.index] = kp.hierarchyId
  }

  // For unknown positions, interpolate based on the structure:
  // Between two known points, assign incrementally based on depth changes
  // Strategy: use known anchors and fill gaps

  // Actually, let's use a smarter approach: parse the hierarchy from the
  // sequential ordering by detecting category boundaries and level changes
  // from the process names and descriptions

  // The APQC structure is deeply nested. Let's reconstruct it:
  // 1. First process in TSV is category 1.0
  // 2. Processes are ordered depth-first

  // We can determine depth by looking at known anchors.
  // Between anchors, we assign sequential IDs at the appropriate depth.

  // Let's build from known anchors which cover most processes
  // For remaining ones, assign based on position relative to nearest anchors

  // Build anchor index
  const anchorAtIndex = new Map<number, string>()
  for (const kp of knownPositions) {
    anchorAtIndex.set(kp.index, kp.hierarchyId)
  }

  // State tracking for sequential assignment
  let counters: number[] = [0, 0, 0, 0, 0] // cat, group, process, activity, subactivity
  let prevHierarchyId = ''

  for (let i = 0; i < processes.length; i++) {
    const known = anchorAtIndex.get(i)
    if (known) {
      allHierarchyIds[i] = known
      prevHierarchyId = known
      // Update counters from known ID
      const parts = known.split('.').map(Number)
      for (let j = 0; j < parts.length; j++) {
        counters[j] = parts[j]
      }
      // Reset deeper counters
      for (let j = parts.length; j < 5; j++) {
        counters[j] = 0
      }
    } else if (prevHierarchyId) {
      // Infer: this process follows the previous one
      // We need to determine if it's a sibling, child, or uncle
      // Heuristic: look at the next known anchor to determine depth

      // Find next known anchor
      let nextAnchorIdx = -1
      let nextAnchorId = ''
      for (let j = i + 1; j < processes.length; j++) {
        if (anchorAtIndex.has(j)) {
          nextAnchorIdx = j
          nextAnchorId = anchorAtIndex.get(j)!
          break
        }
      }

      const prevParts = prevHierarchyId.split('.').map(Number)
      const prevDepth = prevParts.length

      if (nextAnchorId) {
        const nextParts = nextAnchorId.split('.').map(Number)
        const nextDepth = nextParts.length

        // How many unknown entries between prev and next?
        // If next is deeper, this is likely a child of prev
        // If next is same depth, this is likely a sibling
        // If next is shallower, we're ascending

        // Simple heuristic: assume child of previous if we haven't seen
        // the expected children count yet
        const gapSize = (nextAnchorIdx - i)

        if (nextDepth > prevDepth) {
          // Next anchor is deeper - this could be an intermediate level
          // Assign as child of prev
          const childDepth = prevDepth + 1
          const childParts = [...prevParts]
          childParts.push((counters[prevDepth] || 0) + 1)
          counters[prevDepth] = childParts[childParts.length - 1]
          for (let j = childDepth; j < 5; j++) counters[j] = 0
          counters[childDepth - 1] = childParts[childParts.length - 1]
          allHierarchyIds[i] = childParts.join('.')
          prevHierarchyId = allHierarchyIds[i]
        } else if (nextDepth === prevDepth) {
          // Same depth - sibling
          const sibParts = [...prevParts]
          sibParts[sibParts.length - 1]++
          allHierarchyIds[i] = sibParts.join('.')
          prevHierarchyId = allHierarchyIds[i]
          counters[prevDepth - 1] = sibParts[sibParts.length - 1]
        } else {
          // Ascending - could be finishing children, assign as next sibling of prev
          const sibParts = [...prevParts]
          sibParts[sibParts.length - 1]++
          allHierarchyIds[i] = sibParts.join('.')
          prevHierarchyId = allHierarchyIds[i]
          counters[prevDepth - 1] = sibParts[sibParts.length - 1]
        }
      } else {
        // No more anchors - assign as sibling
        const sibParts = prevHierarchyId.split('.').map(Number)
        sibParts[sibParts.length - 1]++
        allHierarchyIds[i] = sibParts.join('.')
        prevHierarchyId = allHierarchyIds[i]
      }
    }
  }

  // Now build the hierarchy tree
  const nodeMap = new Map<string, HierarchyNode>()
  const roots: HierarchyNode[] = []

  for (let i = 0; i < processes.length; i++) {
    const hId = allHierarchyIds[i]
    if (!hId) continue

    const node: HierarchyNode = {
      hierarchyId: hId,
      process: processes[i],
      children: [],
      concepts: [],
    }
    nodeMap.set(hId, node)

    // Find parent
    const parts = hId.split('.')
    if (parts.length === 1) {
      // Category level - these are roots
      roots.push(node)
    } else {
      const parentId = parts.slice(0, -1).join('.')
      // Special case: X.0 categories have parentId like just the number
      const parent = nodeMap.get(parentId)
      if (parent) {
        parent.children.push(node)
      } else {
        // Try category level (e.g., "1" for "1.0" parent of "1.1")
        // If this is X.Y, parent is X.0 mapped as category
        roots.push(node) // orphan - attach to root
      }
    }
  }

  return { nodeMap, roots }
}

// ── Utility functions ──

function getHierarchyLevel(hierarchyId: string): string {
  const depth = hierarchyId.split('.').length
  if (hierarchyId.endsWith('.0')) return 'Category'
  switch (depth) {
    case 1: return 'Category'
    case 2: return 'Group'
    case 3: return 'Process'
    case 4: return 'Activity'
    case 5: return 'Sub-Activity'
    default: return 'Sub-Activity'
  }
}

function getHierarchyType(hierarchyId: string): string {
  const level = getHierarchyLevel(hierarchyId)
  switch (level) {
    case 'Category': return 'ProcessCategory'
    case 'Group': return 'ProcessGroup'
    case 'Process': return 'Process'
    case 'Activity': return 'Activity'
    case 'Sub-Activity': return 'SubActivity'
    default: return 'Process'
  }
}

function toPascalCase(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 0)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')
}

function toShortName(name: string): string {
  // Create a concise folder-friendly name
  const words = name
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 0)

  // Remove common filler words for brevity
  const stopWords = new Set(['the', 'and', 'or', 'of', 'for', 'to', 'a', 'an', 'in', 'on', 'with', 'by', 'as'])

  const significant = words.filter(w => !stopWords.has(w.toLowerCase()))
  if (significant.length <= 3) {
    return significant.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')
  }
  // Take first 3-4 significant words
  return significant.slice(0, 4).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')
}

function extractGraphDL(name: string): { verb: string; object: string; preposition: string; prepObject: string } {
  // Parse process name into GraphDL components
  const words = name.split(/\s+/)
  if (words.length === 0) return { verb: '', object: '', preposition: '', prepObject: '' }

  const verb = words[0].toLowerCase()
  const preps = ['for', 'to', 'with', 'by', 'of', 'from', 'in', 'on', 'through', 'around', 'about', 'across', 'against', 'into']

  let prepIdx = -1
  for (let i = 1; i < words.length; i++) {
    if (preps.includes(words[i].toLowerCase())) {
      prepIdx = i
      break
    }
  }

  if (prepIdx > 1) {
    const object = words.slice(1, prepIdx).join(' ')
    const preposition = words[prepIdx].toLowerCase()
    const prepObject = words.slice(prepIdx + 1).join(' ')
    return { verb, object, preposition, prepObject }
  }

  // No preposition found
  const object = words.slice(1).join(' ')
  return { verb, object, preposition: '', prepObject: '' }
}

function getCategoryNumber(hierarchyId: string): string {
  return hierarchyId.split('.')[0]
}

function getCategoryFolder(hierarchyId: string): string {
  const catNum = getCategoryNumber(hierarchyId)
  return CATEGORY_FOLDERS[catNum] || `${catNum.padStart(2, '0')}-Other`
}

// ── Path generation ──

function getNodeFolderName(node: HierarchyNode): string {
  return `${node.hierarchyId}-${toShortName(node.process.name)}`
}

function getNodePath(node: HierarchyNode, nodeMap: Map<string, HierarchyNode>): string {
  const parts = node.hierarchyId.split('.')
  const catNum = parts[0]
  const catFolder = CATEGORY_FOLDERS[catNum] || `${catNum.padStart(2, '0')}-Other`

  let pathParts = [PROCESSES_DIR, catFolder]

  // Build path through hierarchy levels (skip category level, that's the catFolder)
  // For hierarchy "1.2.3.4":
  //   catFolder / 1.2-GroupName / 1.2.3-ProcessName / (leaf or folder)
  for (let depth = 2; depth <= parts.length; depth++) {
    const ancestorId = parts.slice(0, depth).join('.')
    const ancestor = nodeMap.get(ancestorId)
    if (ancestor && depth < parts.length) {
      pathParts.push(`${ancestorId}-${toShortName(ancestor.process.name)}`)
    }
  }

  return join(...pathParts)
}

// ── Content generation ──

function generateFrontmatter(node: HierarchyNode): string {
  const level = getHierarchyLevel(node.hierarchyId)
  const type = getHierarchyType(node.hierarchyId)
  const parentId = node.hierarchyId.split('.').slice(0, -1).join('.') || undefined
  const childIds = node.children.map(c => c.hierarchyId)

  let fm = `---
id: ${node.process.id}
name: "${node.process.name}"
code: "${node.process.code}"
hierarchyId: "${node.hierarchyId}"
type: ${type}
level: ${node.hierarchyId.split('.').length}
status: complete`

  if (parentId) {
    fm += `\nparent: "${parentId}"`
  }
  if (childIds.length > 0) {
    fm += `\nchildren: [${childIds.map(c => `"${c}"`).join(', ')}]`
  }

  fm += '\n---'
  return fm
}

function generateHierarchyDiagram(node: HierarchyNode, nodeMap: Map<string, HierarchyNode>): string {
  const parts = node.hierarchyId.split('.')
  const catNum = parts[0]
  const catName = CATEGORY_NAMES[catNum] || `Category ${catNum}`

  let diagram = '```mermaid\ngraph TD\n'
  diagram += `    C${catNum}["${catNum}.0 ${catName}"]\n`

  // Show ancestor chain
  let prevNodeId = `C${catNum}`
  for (let depth = 2; depth <= parts.length; depth++) {
    const ancestorHId = parts.slice(0, depth).join('.')
    const ancestor = nodeMap.get(ancestorHId)
    if (ancestor) {
      const nodeId = `N${ancestorHId.replace(/\./g, '_')}`
      const shortName = ancestor.process.name.length > 40
        ? ancestor.process.name.slice(0, 37) + '...'
        : ancestor.process.name
      diagram += `    ${prevNodeId} --> ${nodeId}["${ancestorHId} ${shortName}"]\n`
      prevNodeId = nodeId
    }
  }

  // Highlight current node
  const currentNodeId = `N${node.hierarchyId.replace(/\./g, '_')}`
  diagram += `    style ${currentNodeId} fill:#e1f5fe\n`

  // Show children (first 8)
  const shownChildren = node.children.slice(0, 8)
  for (const child of shownChildren) {
    const childNodeId = `N${child.hierarchyId.replace(/\./g, '_')}`
    const childShortName = child.process.name.length > 35
      ? child.process.name.slice(0, 32) + '...'
      : child.process.name
    diagram += `    ${currentNodeId} --> ${childNodeId}["${child.hierarchyId} ${childShortName}"]\n`
  }

  if (node.children.length > 8) {
    diagram += `    ${currentNodeId} --> more["... +${node.children.length - 8} more"]\n`
  }

  diagram += '```'
  return diagram
}

function generateGraphDLSection(node: HierarchyNode): string {
  const gdl = extractGraphDL(node.process.name)
  const dotNotation = [gdl.verb, toPascalCase(gdl.object)]
  if (gdl.preposition) dotNotation.push(gdl.preposition)
  if (gdl.prepObject) dotNotation.push(toPascalCase(gdl.prepObject))

  let section = `## GraphDL Semantic Structure\n\n`
  section += '```\n'
  section += dotNotation.join('.') + '\n'
  section += '```\n\n'
  section += `| Component | Value | Description |\n`
  section += `|-----------|-------|-------------|\n`
  section += `| Verb | \`${gdl.verb}\` | Primary action |\n`
  section += `| Object | \`${gdl.object}\` | Direct object |\n`
  if (gdl.preposition) {
    section += `| Preposition | \`${gdl.preposition}\` | Relationship |\n`
  }
  if (gdl.prepObject) {
    section += `| PrepObject | \`${gdl.prepObject}\` | Indirect object |\n`
  }
  return section
}

function generateProcessFlow(node: HierarchyNode): string {
  if (node.children.length === 0) return ''

  let flow = `## Process Flow\n\n\`\`\`mermaid\nflowchart LR\n`
  flow += `    subgraph Inputs["Inputs"]\n`
  flow += `        I1["Upstream Process Outputs"]\n`
  flow += `        I2["Organizational Data"]\n`
  flow += `    end\n\n`
  flow += `    subgraph Process["${node.process.name}"]\n`

  const steps = node.children.slice(0, 6)
  for (let i = 0; i < steps.length; i++) {
    const shortName = steps[i].process.name.length > 30
      ? steps[i].process.name.slice(0, 27) + '...'
      : steps[i].process.name
    flow += `        S${i + 1}["${shortName}"]\n`
  }
  flow += `    end\n\n`
  flow += `    subgraph Outputs["Outputs"]\n`
  flow += `        O1["Process Deliverables"]\n`
  flow += `        O2["Updated Records"]\n`
  flow += `    end\n\n`

  flow += `    Inputs --> Process --> Outputs\n`

  for (let i = 0; i < steps.length - 1; i++) {
    flow += `    S${i + 1} --> S${i + 2}\n`
  }

  flow += '```'
  return flow
}

function generateSubProcessesTable(node: HierarchyNode): string {
  if (node.children.length === 0) return ''

  let table = `## Sub-Processes\n\n`
  table += `| Process | Hierarchy ID | Description |\n`
  table += `|---------|-------------|-------------|\n`

  for (const child of node.children) {
    const shortDesc = child.process.description
      ? child.process.description.split('.')[0].slice(0, 100)
      : child.process.name
    const isLeaf = child.children.length === 0
    const linkPath = isLeaf
      ? `./${toPascalCase(child.process.name)}`
      : `./${child.hierarchyId}-${toShortName(child.process.name)}/`
    table += `| [${child.process.name}](${linkPath}) | ${child.hierarchyId} | ${shortDesc} |\n`
  }

  return table
}

function generateConceptsSection(node: HierarchyNode): string {
  if (node.concepts.length === 0) return ''

  let section = `## Related Concepts\n\n`
  for (const concept of node.concepts.slice(0, 10)) {
    const conceptId = concept.replace('concepts.org.ai/', '')
    section += `- [${conceptId}](/concepts/${conceptId})\n`
  }
  return section
}

function generateKeyStats(node: HierarchyNode): string {
  const level = getHierarchyLevel(node.hierarchyId)
  const parentId = node.hierarchyId.split('.').slice(0, -1).join('.')

  let stats = `## Key Statistics\n\n`
  stats += `| Metric | Value |\n`
  stats += `|--------|-------|\n`
  stats += `| APQC Code | ${node.process.code} |\n`
  stats += `| Hierarchy ID | ${node.hierarchyId} |\n`
  stats += `| Level | ${level} |\n`
  if (parentId) {
    stats += `| Parent | [${parentId}](../) |\n`
  }
  stats += `| Sub-Processes | ${node.children.length} |\n`
  return stats
}

function generateMDXContent(node: HierarchyNode, nodeMap: Map<string, HierarchyNode>): string {
  const level = getHierarchyLevel(node.hierarchyId)

  let content = generateFrontmatter(node) + '\n\n'
  content += `# ${node.process.name}\n\n`

  // Description blockquote
  if (node.process.description) {
    const firstSentence = node.process.description.split('.')[0] + '.'
    content += `> ${firstSentence}\n\n`
  }

  // Overview
  content += `## Overview\n\n`
  content += `${level} ${node.hierarchyId} is `
  if (level === 'Category') {
    content += `a top-level APQC process category that encompasses all activities related to ${node.process.name.toLowerCase()}. `
  } else if (level === 'Group') {
    content += `a process group within APQC Category ${getCategoryNumber(node.hierarchyId)}.0 (${CATEGORY_NAMES[getCategoryNumber(node.hierarchyId)] || ''}). `
  } else if (level === 'Process') {
    content += `a core process that defines the specific procedures for ${node.process.name.toLowerCase()}. `
  } else {
    content += `an activity within the ${CATEGORY_NAMES[getCategoryNumber(node.hierarchyId)] || ''} framework. `
  }

  if (node.process.description && node.process.description.length > 50) {
    content += `\n\n${node.process.description}\n\n`
  } else {
    content += '\n\n'
  }

  // Hierarchy diagram
  content += `## Process Hierarchy\n\n`
  content += generateHierarchyDiagram(node, nodeMap) + '\n\n'

  // Key statistics
  content += generateKeyStats(node) + '\n\n'

  // GraphDL
  content += generateGraphDLSection(node) + '\n\n'

  // Process flow (if has children)
  const flowSection = generateProcessFlow(node)
  if (flowSection) {
    content += flowSection + '\n\n'
  }

  // Sub-processes table
  const subTable = generateSubProcessesTable(node)
  if (subTable) {
    content += subTable + '\n\n'
  }

  // Related concepts
  const conceptsSection = generateConceptsSection(node)
  if (conceptsSection) {
    content += conceptsSection + '\n\n'
  }

  content += `---\n\n`
  content += `*Source: APQC PCF ${node.process.code} (${node.hierarchyId}) - ${node.process.sourceType || 'APQC'}*\n`

  return content
}

// ── File writing ──

let filesCreated = 0
let filesSkipped = 0

function writeNodeFiles(node: HierarchyNode, nodeMap: Map<string, HierarchyNode>, parentDir: string) {
  const isLeaf = node.children.length === 0
  const level = getHierarchyLevel(node.hierarchyId)

  if (isLeaf && level !== 'Category') {
    // Write as a leaf MDX file
    const fileName = `${toPascalCase(node.process.name)}.mdx`
    const filePath = join(parentDir, fileName)

    if (existsSync(filePath)) {
      filesSkipped++
    } else {
      mkdirSync(parentDir, { recursive: true })
      const content = generateMDXContent(node, nodeMap)
      writeFileSync(filePath, content)
      filesCreated++
      if (filesCreated % 100 === 0) {
        console.log(`  Created ${filesCreated} files...`)
      }
    }
  } else {
    // Write as a folder with index.mdx
    const folderName = level === 'Category'
      ? '' // Category folder is the parent dir itself
      : `${node.hierarchyId}-${toShortName(node.process.name)}`
    const folderPath = level === 'Category' ? parentDir : join(parentDir, folderName)
    const indexPath = join(folderPath, 'index.mdx')

    if (existsSync(indexPath)) {
      filesSkipped++
    } else {
      mkdirSync(folderPath, { recursive: true })
      const content = generateMDXContent(node, nodeMap)
      writeFileSync(indexPath, content)
      filesCreated++
      if (filesCreated % 100 === 0) {
        console.log(`  Created ${filesCreated} files...`)
      }
    }

    // Process children
    const childDir = level === 'Category' ? parentDir : folderPath
    for (const child of node.children) {
      writeNodeFiles(child, nodeMap, childDir)
    }
  }
}

// ── Main ──

async function main() {
  console.log('Reading Processes.tsv...')
  const processes = readTSV<ProcessRecord>(join(DATA_DIR, 'Processes.tsv'))
  console.log(`  Found ${processes.length} processes`)

  console.log('Reading Process.Concepts.tsv...')
  const concepts = readTSV<ConceptRelation>(join(DATA_DIR, 'relationships/Process.Concepts.tsv'))
  console.log(`  Found ${concepts.length} concept relationships`)

  // Build hierarchy ID mapping from concepts
  const hierarchyMap = buildHierarchyMap(concepts)
  console.log(`  Mapped ${hierarchyMap.size} processes to hierarchy IDs`)

  // Build concept lookup per process
  const conceptsByProcess = new Map<string, string[]>()
  for (const c of concepts) {
    const procId = c.from.replace('process.org.ai/', '')
    if (!conceptsByProcess.has(procId)) {
      conceptsByProcess.set(procId, [])
    }
    conceptsByProcess.get(procId)!.push(c.to)
  }

  // Build full hierarchy
  console.log('Building process hierarchy...')
  const { nodeMap, roots } = buildFullHierarchy(processes, hierarchyMap)
  console.log(`  Built ${nodeMap.size} hierarchy nodes, ${roots.length} root nodes`)

  // Attach concepts to nodes
  for (const [hId, node] of nodeMap) {
    const procConcepts = conceptsByProcess.get(node.process.id)
    if (procConcepts) {
      node.concepts = procConcepts
    }
  }

  // Group roots by category
  // The first root should be category 1, etc.
  // We need to identify category boundaries
  console.log('Generating MDX files...')

  // Process each root and its subtree
  for (const root of roots) {
    const catNum = getCategoryNumber(root.hierarchyId)
    const catFolder = CATEGORY_FOLDERS[catNum]
    if (!catFolder) {
      console.log(`  Warning: No folder mapping for category ${catNum}, skipping ${root.process.name}`)
      continue
    }

    const catDir = join(PROCESSES_DIR, catFolder)
    writeNodeFiles(root, nodeMap, catDir)
  }

  console.log(`\nDone!`)
  console.log(`  Files created: ${filesCreated}`)
  console.log(`  Files skipped (already exist): ${filesSkipped}`)
  console.log(`  Total hierarchy nodes: ${nodeMap.size}`)
}

main().catch(console.error)
