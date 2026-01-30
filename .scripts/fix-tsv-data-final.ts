/**
 * Final comprehensive fix script for all remaining TSV data issues
 *
 * Uses GraphDL verb conjugations for proper past-tense forms
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { getPastTense, getCanonicalVerb, VERB_INDEX } from '../graphdl/dist/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DATA_DIR = path.join(__dirname, '..', '.data')

// Build a map of incorrect past tenses to correct ones from GraphDL
// This catches common errors like "confered" -> "conferred", "estimatinged" -> "estimated"
const VERB_FIXES: Record<string, string> = {}

// Add known manual fixes that GraphDL might not catch
const MANUAL_VERB_FIXES: Record<string, string> = {
  // Common doubling errors
  'confered': 'conferred',
  'refered': 'referred',
  'occured': 'occurred',
  'transfered': 'transferred',
  'prefered': 'preferred',
  // Malformed -inged patterns (verb stem + "inged" instead of proper past tense)
  'coordinatinged': 'coordinated',
  'draftinged': 'drafted',
  'estimatinged': 'estimated',
  'interpretinged': 'interpreted',
  'judginged': 'judged',
  'organizinged': 'organized',
  'pipinged': 'piped',
  // Irregular verbs that might have wrong forms
  'bringed': 'brought',
  'singed': 'sang',  // Note: "singed" means "slightly burned" - but in this context it's likely meant to be "sang"
  'stringed': 'strung',
  'springed': 'sprang',
  'swinged': 'swung',
  'ringed': 'rang',
  'stinged': 'stung',
  'clinged': 'clung',
  'flinged': 'flung',
  'slunged': 'slung',
  'wrunged': 'wrung',
}

// Merge manual fixes
Object.assign(VERB_FIXES, MANUAL_VERB_FIXES)

/**
 * Get the correct past tense for a verb using GraphDL
 */
function getCorrectPastTense(verb: string): string | null {
  // First check if we can find the canonical form
  const canonical = getCanonicalVerb(verb)
  if (canonical) {
    const pastTense = getPastTense(canonical)
    if (pastTense) return pastTense
  }

  // Try direct lookup
  const directPastTense = getPastTense(verb)
  if (directPastTense) return directPastTense

  return null
}

// Garbage ID patterns to filter out
const GARBAGE_ID_PATTERNS = [
  /\.for\.IncludingF$/,
  /\.to\.IncludingF$/,
  /\.for\.IncludingF\b/,
  /\.to\.IncludingF\b/,
  /prepare\.Budgets\.for\.IncludingF/,
  /operate\.TelephoneSwitchboards\.to\.IncludingF/,
  /operate\.Systems\.to\.IncludingF/,
]

function readTSV(filePath: string): { headers: string[], rows: string[][] } {
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n').filter(line => line.trim())
  if (lines.length === 0) return { headers: [], rows: [] }
  const headers = lines[0].split('\t')
  const rows = lines.slice(1).map(line => line.split('\t'))
  return { headers, rows }
}

function writeTSV(filePath: string, headers: string[], rows: string[][]): void {
  const content = [headers.join('\t'), ...rows.map(row => row.join('\t'))].join('\n')
  fs.writeFileSync(filePath, content + '\n')
}

function isGarbageId(id: string): boolean {
  return GARBAGE_ID_PATTERNS.some(pattern => pattern.test(id))
}

function fixGrammarInText(text: string): string {
  if (!text) return text
  let result = text
  for (const [wrong, correct] of Object.entries(VERB_FIXES)) {
    // Fix as whole word or at word boundary
    result = result.replace(new RegExp(`\\b${wrong}\\b`, 'gi'), correct)
  }
  return result
}

function removeHttpsPrefix(url: string): string {
  if (!url) return url
  return url.replace(/^https:\/\//, '')
}

function cleanSourceTasks(sourceTasks: string): string {
  if (!sourceTasks) return sourceTasks
  const tasks = sourceTasks.split(',')
  const cleanTasks = tasks.filter(task => !isGarbageId(task.trim()))
  return cleanTasks.join(',')
}

/**
 * Check if a concept ID is truncated (starts with lowercase, indicating missing prefix)
 */
function isTruncatedConceptId(id: string): boolean {
  if (!id) return false
  // Truncated IDs start with lowercase letter
  return /^[a-z]/.test(id)
}

/**
 * Fix Concepts.tsv - remove truncated/garbage concepts
 */
function fixConceptsForTruncation(): number {
  console.log('Fixing Concepts.tsv for truncated IDs...')
  const filePath = path.join(DATA_DIR, 'Concepts.tsv')
  const { headers, rows } = readTSV(filePath)

  const idIdx = headers.indexOf('id')
  const originalCount = rows.length

  // Remove rows with truncated IDs (start with lowercase)
  const cleanRows = rows.filter(row => {
    const id = row[idIdx] || ''
    return !isTruncatedConceptId(id)
  })

  writeTSV(filePath, headers, cleanRows)
  return originalCount - cleanRows.length
}

// Fix Events.tsv - grammar in all text fields, with special handling for pastTense column
function fixEventsFile(): number {
  console.log('Fixing Events.tsv grammar...')
  const filePath = path.join(DATA_DIR, 'Events.tsv')
  const { headers, rows } = readTSV(filePath)

  const pastTenseIdx = headers.indexOf('pastTense')
  const verbIdx = headers.indexOf('verb')
  const idIdx = headers.indexOf('id')
  const nameIdx = headers.indexOf('name')
  const descriptionIdx = headers.indexOf('description')

  let fixed = 0
  for (const row of rows) {
    // Special handling for pastTense column - use GraphDL lookup
    if (pastTenseIdx >= 0 && verbIdx >= 0) {
      const currentPastTense = row[pastTenseIdx]
      const verb = row[verbIdx]

      // Try to get correct past tense from GraphDL
      const correctPastTense = getCorrectPastTense(verb)
      if (correctPastTense && correctPastTense !== currentPastTense) {
        const oldPastTense = row[pastTenseIdx]
        row[pastTenseIdx] = correctPastTense

        // Also fix the ID (Object.pastTense format)
        if (idIdx >= 0) {
          row[idIdx] = row[idIdx].replace(new RegExp(`\\.${oldPastTense}$`), `.${correctPastTense}`)
        }

        // Fix name (Object pastTense format)
        if (nameIdx >= 0) {
          row[nameIdx] = row[nameIdx].replace(new RegExp(`\\s${oldPastTense}$`), ` ${correctPastTense}`)
        }

        // Fix description
        if (descriptionIdx >= 0) {
          row[descriptionIdx] = row[descriptionIdx].replace(new RegExp(`\\b${oldPastTense}\\b`, 'g'), correctPastTense)
        }

        fixed++
        continue
      }
    }

    // Fall back to manual fixes for all text fields
    for (let i = 0; i < row.length; i++) {
      const original = row[i]
      const fixed_val = fixGrammarInText(original)
      if (fixed_val !== original) {
        row[i] = fixed_val
        fixed++
      }
    }
  }

  writeTSV(filePath, headers, rows)
  return fixed
}

// Fix Actions.Events.tsv - grammar and URL prefixes
function fixActionsEventsFile(): { grammar: number, urls: number, garbage: number } {
  console.log('Fixing Actions.Events.tsv...')
  const filePath = path.join(DATA_DIR, 'relationships', 'Actions.Events.tsv')
  const { headers, rows } = readTSV(filePath)

  const fromIdx = headers.indexOf('from')
  const toIdx = headers.indexOf('to')

  let grammarFixed = 0
  let urlsFixed = 0

  // First pass: fix grammar and URLs
  for (const row of rows) {
    // Fix URLs
    if (row[fromIdx]?.startsWith('https://')) {
      row[fromIdx] = removeHttpsPrefix(row[fromIdx])
      urlsFixed++
    }
    if (row[toIdx]?.startsWith('https://')) {
      row[toIdx] = removeHttpsPrefix(row[toIdx])
      urlsFixed++
    }

    // Fix grammar in all fields
    for (let i = 0; i < row.length; i++) {
      const original = row[i]
      const fixed = fixGrammarInText(original)
      if (fixed !== original) {
        row[i] = fixed
        grammarFixed++
      }
    }
  }

  // Second pass: remove garbage rows
  const originalCount = rows.length
  const cleanRows = rows.filter(row => {
    const from = row[fromIdx] || ''
    const to = row[toIdx] || ''
    return !isGarbageId(from) && !isGarbageId(to)
  })

  writeTSV(filePath, headers, cleanRows)
  return { grammar: grammarFixed, urls: urlsFixed, garbage: originalCount - cleanRows.length }
}

// Fix Tasks.Actions.tsv - URLs and garbage
function fixTasksActionsFile(): { urls: number, garbage: number } {
  console.log('Fixing Tasks.Actions.tsv...')
  const filePath = path.join(DATA_DIR, 'relationships', 'Tasks.Actions.tsv')
  const { headers, rows } = readTSV(filePath)

  const fromIdx = headers.indexOf('from')
  const toIdx = headers.indexOf('to')

  let urlsFixed = 0

  for (const row of rows) {
    if (row[fromIdx]?.startsWith('https://')) {
      row[fromIdx] = removeHttpsPrefix(row[fromIdx])
      urlsFixed++
    }
    if (row[toIdx]?.startsWith('https://')) {
      row[toIdx] = removeHttpsPrefix(row[toIdx])
      urlsFixed++
    }
  }

  const originalCount = rows.length
  const cleanRows = rows.filter(row => {
    const from = row[fromIdx] || ''
    const to = row[toIdx] || ''
    return !isGarbageId(from) && !isGarbageId(to)
  })

  writeTSV(filePath, headers, cleanRows)
  return { urls: urlsFixed, garbage: originalCount - cleanRows.length }
}

// Fix Tasks.tsv - remove garbage rows
function fixTasksFile(): number {
  console.log('Fixing Tasks.tsv...')
  const filePath = path.join(DATA_DIR, 'Tasks.tsv')
  const { headers, rows } = readTSV(filePath)

  const idIdx = headers.indexOf('id')
  const originalCount = rows.length
  const cleanRows = rows.filter(row => !isGarbageId(row[idIdx] || ''))

  writeTSV(filePath, headers, cleanRows)
  return originalCount - cleanRows.length
}

// Fix Actions.tsv - remove garbage rows
function fixActionsFile(): number {
  console.log('Fixing Actions.tsv...')
  const filePath = path.join(DATA_DIR, 'Actions.tsv')
  const { headers, rows } = readTSV(filePath)

  const idIdx = headers.indexOf('id')
  const originalCount = rows.length
  const cleanRows = rows.filter(row => !isGarbageId(row[idIdx] || ''))

  writeTSV(filePath, headers, cleanRows)
  return originalCount - cleanRows.length
}

// Fix OccupationTasks.tsv - remove garbage rows
function fixOccupationTasksFile(): number {
  console.log('Fixing OccupationTasks.tsv...')
  const filePath = path.join(DATA_DIR, 'OccupationTasks.tsv')
  const { headers, rows } = readTSV(filePath)

  const taskIdIdx = headers.indexOf('taskId')
  const idIdx = headers.indexOf('id')

  const originalCount = rows.length
  const cleanRows = rows.filter(row => {
    const taskId = row[taskIdIdx] || ''
    const id = row[idIdx] || ''
    return !isGarbageId(taskId) && !isGarbageId(id)
  })

  writeTSV(filePath, headers, cleanRows)
  return originalCount - cleanRows.length
}

// Fix Concepts.tsv sourceTasks column
function fixConceptsFile(): number {
  console.log('Fixing Concepts.tsv sourceTasks...')
  const filePath = path.join(DATA_DIR, 'Concepts.tsv')
  const { headers, rows } = readTSV(filePath)

  const sourceTasksIdx = headers.indexOf('sourceTasks')
  let fixed = 0

  for (const row of rows) {
    const original = row[sourceTasksIdx]
    const cleaned = cleanSourceTasks(original)
    if (cleaned !== original) {
      row[sourceTasksIdx] = cleaned
      fixed++
    }
  }

  writeTSV(filePath, headers, rows)
  return fixed
}

// Fix Tasks.Concepts.tsv
function fixTasksConceptsFile(): number {
  console.log('Fixing Tasks.Concepts.tsv...')
  const filePath = path.join(DATA_DIR, 'relationships', 'Tasks.Concepts.tsv')
  const { headers, rows } = readTSV(filePath)

  const fromIdx = headers.indexOf('from')
  const originalCount = rows.length
  const cleanRows = rows.filter(row => !isGarbageId(row[fromIdx] || ''))

  writeTSV(filePath, headers, cleanRows)
  return originalCount - cleanRows.length
}

// Fix Occupations.Tasks.tsv
function fixOccupationsTasksFile(): number {
  console.log('Fixing Occupations.Tasks.tsv...')
  const filePath = path.join(DATA_DIR, 'relationships', 'Occupations.Tasks.tsv')
  const { headers, rows } = readTSV(filePath)

  const toIdx = headers.indexOf('to')
  const originalCount = rows.length
  const cleanRows = rows.filter(row => !isGarbageId(row[toIdx] || ''))

  writeTSV(filePath, headers, cleanRows)
  return originalCount - cleanRows.length
}

// Fix namespace typos in relationship files (concept.org.ai → concepts.org.ai)
function fixNamespaceTypos(): number {
  console.log('Fixing namespace typos in relationship files...')
  let totalFixed = 0

  // List of relationship files that might have namespace typos
  const relationshipFiles = [
    'Process.Concepts.tsv',
    'Occupations.Concepts.tsv',
    'Tasks.Concepts.tsv',
  ]

  for (const fileName of relationshipFiles) {
    const filePath = path.join(DATA_DIR, 'relationships', fileName)
    if (!fs.existsSync(filePath)) continue

    const { headers, rows } = readTSV(filePath)
    let fileFixed = 0

    // Find columns that might contain namespace values
    const nsColumns = headers.filter(h =>
      h.toLowerCase().includes('ns') ||
      h.toLowerCase() === 'from' ||
      h.toLowerCase() === 'to' ||
      h.toLowerCase().includes('tons') ||
      h.toLowerCase().includes('fromns')
    )

    for (const row of rows) {
      for (let i = 0; i < row.length; i++) {
        if (row[i] && row[i].includes('concept.org.ai')) {
          row[i] = row[i].replace(/concept\.org\.ai/g, 'concepts.org.ai')
          fileFixed++
        }
      }
    }

    if (fileFixed > 0) {
      writeTSV(filePath, headers, rows)
      totalFixed += fileFixed
    }
  }

  // Also fix OccupationConcepts.tsv entity file if it exists
  const occConceptsPath = path.join(DATA_DIR, 'OccupationConcepts.tsv')
  if (fs.existsSync(occConceptsPath)) {
    const { headers, rows } = readTSV(occConceptsPath)
    let fileFixed = 0

    for (const row of rows) {
      for (let i = 0; i < row.length; i++) {
        if (row[i] && row[i].includes('concept.org.ai')) {
          row[i] = row[i].replace(/concept\.org\.ai/g, 'concepts.org.ai')
          fileFixed++
        }
      }
    }

    if (fileFixed > 0) {
      writeTSV(occConceptsPath, headers, rows)
      totalFixed += fileFixed
    }
  }

  return totalFixed
}

/**
 * Standardize relationship file schema to use consistent (from, to, predicate, reverse) format
 */
function standardizeRelationshipSchemas(): { converted: number; files: string[] } {
  console.log('Standardizing relationship file schemas...')
  const convertedFiles: string[] = []

  // Files that use the expanded schema (fromNs, fromType, fromId, toNs, toType, toId, ...)
  const filesToConvert = [
    'Occupations.Concepts.tsv',
    'Process.Concepts.tsv',
  ]

  for (const fileName of filesToConvert) {
    const filePath = path.join(DATA_DIR, 'relationships', fileName)
    if (!fs.existsSync(filePath)) continue

    const { headers, rows } = readTSV(filePath)

    // Check if this file uses the expanded schema
    if (!headers.includes('fromNs') || !headers.includes('toNs')) continue

    const fromNsIdx = headers.indexOf('fromNs')
    const fromTypeIdx = headers.indexOf('fromType')
    const fromIdIdx = headers.indexOf('fromId')
    const toNsIdx = headers.indexOf('toNs')
    const toTypeIdx = headers.indexOf('toType')
    const toIdIdx = headers.indexOf('toId')
    const relationshipTypeIdx = headers.indexOf('relationshipType')
    const contextIdx = headers.indexOf('context')

    // Build new rows with standardized schema
    const newRows: string[][] = []
    for (const row of rows) {
      const fromNs = row[fromNsIdx] || ''
      const fromId = row[fromIdIdx] || ''
      const toNs = row[toNsIdx] || ''
      const toId = row[toIdIdx] || ''
      const relationshipType = row[relationshipTypeIdx] || 'relatedTo'

      // Build from/to URLs
      const from = `${fromNs}/${fromId}`
      const to = `${toNs}/${toId}`

      // Map relationshipType to predicate/reverse
      let predicate = relationshipType
      let reverse = `${relationshipType}By`

      // Common relationship mappings
      if (relationshipType === 'relatedTo') {
        reverse = 'relatedFrom'
      } else if (relationshipType === 'develop') {
        predicate = 'develops'
        reverse = 'developedBy'
      } else if (relationshipType === 'manage') {
        predicate = 'manages'
        reverse = 'managedBy'
      }

      const newRow = [from, to, predicate, reverse]

      // Keep context as extra column if it exists
      if (contextIdx >= 0 && row[contextIdx]) {
        newRow.push(row[contextIdx])
      }

      newRows.push(newRow)
    }

    // Determine new headers
    const newHeaders = ['from', 'to', 'predicate', 'reverse']
    if (contextIdx >= 0) {
      newHeaders.push('context')
    }

    writeTSV(filePath, newHeaders, newRows)
    convertedFiles.push(fileName)
  }

  return { converted: convertedFiles.length, files: convertedFiles }
}

async function main() {
  console.log('=== Final TSV Data Quality Fix Script ===\n')

  // Fix grammar issues
  const eventsGrammar = fixEventsFile()
  console.log(`  Fixed ${eventsGrammar} grammar issues in Events.tsv`)

  const actionsEventsResult = fixActionsEventsFile()
  console.log(`  Fixed ${actionsEventsResult.grammar} grammar, ${actionsEventsResult.urls} URLs, removed ${actionsEventsResult.garbage} garbage in Actions.Events.tsv`)

  // Fix URL issues
  const tasksActionsResult = fixTasksActionsFile()
  console.log(`  Fixed ${tasksActionsResult.urls} URLs, removed ${tasksActionsResult.garbage} garbage in Tasks.Actions.tsv`)

  // Fix garbage in entity files
  let tasksRemoved = fixTasksFile()
  console.log(`  Removed ${tasksRemoved} garbage rows from Tasks.tsv`)

  let actionsRemoved = fixActionsFile()
  console.log(`  Removed ${actionsRemoved} garbage rows from Actions.tsv`)

  let occTasksRemoved = fixOccupationTasksFile()
  console.log(`  Removed ${occTasksRemoved} garbage rows from OccupationTasks.tsv`)

  let conceptsFixed = fixConceptsFile()
  console.log(`  Fixed ${conceptsFixed} sourceTasks in Concepts.tsv`)

  // Fix truncated concept IDs
  let truncatedConceptsRemoved = fixConceptsForTruncation()
  console.log(`  Removed ${truncatedConceptsRemoved} truncated concepts from Concepts.tsv`)

  // Fix garbage in relationship files
  let tasksConceptsRemoved = fixTasksConceptsFile()
  console.log(`  Removed ${tasksConceptsRemoved} garbage rows from Tasks.Concepts.tsv`)

  let occTasksRelRemoved = fixOccupationsTasksFile()
  console.log(`  Removed ${occTasksRelRemoved} garbage rows from Occupations.Tasks.tsv`)

  // Fix namespace typos
  let namespaceFixed = fixNamespaceTypos()
  console.log(`  Fixed ${namespaceFixed} namespace typos (concept.org.ai → concepts.org.ai)`)

  // Standardize relationship schemas
  let schemaResult = standardizeRelationshipSchemas()
  console.log(`  Standardized ${schemaResult.converted} relationship files: ${schemaResult.files.join(', ')}`)

  console.log('\n=== All fixes complete ===')
}

main().catch(console.error)
