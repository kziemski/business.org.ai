import { describe, it, expect, beforeAll } from 'vitest'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DATA_DIR = path.resolve(__dirname, '../.data')

// ============================================================================
// Utility Functions
// ============================================================================

interface TSVRow {
  [key: string]: string
}

function parseTSV(filePath: string): { headers: string[]; rows: TSVRow[] } {
  if (!fs.existsSync(filePath)) {
    return { headers: [], rows: [] }
  }

  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n').filter(line => line.trim())
  if (lines.length === 0) return { headers: [], rows: [] }

  const headers = lines[0].split('\t')
  const rows = lines.slice(1).map(line => {
    const values = line.split('\t')
    const row: TSVRow = {}
    headers.forEach((header, i) => {
      row[header] = values[i] || ''
    })
    return row
  })

  return { headers, rows }
}

function getAllTSVFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return []

  const files: string[] = []
  const items = fs.readdirSync(dir, { withFileTypes: true })

  for (const item of items) {
    const fullPath = path.join(dir, item.name)
    if (item.isDirectory()) {
      files.push(...getAllTSVFiles(fullPath))
    } else if (item.name.endsWith('.tsv')) {
      files.push(fullPath)
    }
  }

  return files
}

// ============================================================================
// Test Data Collection
// ============================================================================

let dataFiles: string[] = []

beforeAll(() => {
  dataFiles = getAllTSVFiles(DATA_DIR)
})

// ============================================================================
// Core Data Quality Tests
// ============================================================================

describe('Core Data Files', () => {
  it('should have data files in .data/', () => {
    expect(dataFiles.length).toBeGreaterThan(0)
  })

  it('core entity files should have ns, type, id, name headers', () => {
    // Only check core entity files, not mapping/junction tables
    const coreEntityFiles = [
      'Tasks.tsv',
      'Actions.tsv',
      'Events.tsv',
      'Concepts.tsv',
      'Occupations.tsv',
      'Processes.tsv',
      'Industries.tsv',
      'Products.tsv',
      'Services.tsv',
    ]
    const requiredHeaders = ['ns', 'type', 'id', 'name']

    for (const fileName of coreEntityFiles) {
      const file = path.join(DATA_DIR, fileName)
      if (!fs.existsSync(file)) continue

      const { headers } = parseTSV(file)
      if (headers.length === 0) continue

      for (const required of requiredHeaders) {
        expect(headers, `${fileName} missing '${required}' header`).toContain(required)
      }
    }
  })

  it('IDs should use PascalCase (start with uppercase) for non-GraphDL files', () => {
    // Note: Tasks.tsv and Actions.tsv use GraphDL format (verb.Object.prep.Object)
    // which starts with lowercase verb - this is intentional
    const coreFiles = [
      // 'Tasks.tsv',   - Uses GraphDL format (lowercase verb start)
      // 'Actions.tsv', - Uses GraphDL format (lowercase verb start)
      'Events.tsv',     // Uses Object.pastTense format (PascalCase Object)
      'Concepts.tsv',
      'Occupations.tsv',
    ]

    for (const fileName of coreFiles) {
      const file = path.join(DATA_DIR, fileName)
      if (!fs.existsSync(file)) continue

      const { rows } = parseTSV(file)

      // Check first 100 rows
      for (let i = 0; i < Math.min(rows.length, 100); i++) {
        const row = rows[i]
        if (row.id) {
          expect(
            /^[A-Z]/.test(row.id),
            `${fileName} row ${i + 1}: ID '${row.id}' should start with uppercase (PascalCase)`
          ).toBe(true)
        }
      }
    }
  })

  it('Tasks and Actions IDs should use GraphDL format (verb.Object)', () => {
    const graphdlFiles = ['Tasks.tsv', 'Actions.tsv']

    for (const fileName of graphdlFiles) {
      const file = path.join(DATA_DIR, fileName)
      if (!fs.existsSync(file)) continue

      const { rows } = parseTSV(file)

      // Check first 100 rows - IDs should contain at least one dot
      for (let i = 0; i < Math.min(rows.length, 100); i++) {
        const row = rows[i]
        if (row.id) {
          expect(
            row.id.includes('.'),
            `${fileName} row ${i + 1}: ID '${row.id}' should use GraphDL dot notation`
          ).toBe(true)
        }
      }
    }
  })

  it('namespaces should follow *.org.ai pattern', () => {
    const entityFiles = dataFiles.filter(f => !f.includes('/relationships/'))

    for (const file of entityFiles) {
      const { rows } = parseTSV(file)
      const relPath = path.relative(DATA_DIR, file)

      for (let i = 0; i < Math.min(rows.length, 50); i++) {
        const row = rows[i]
        if (row.ns) {
          expect(
            row.ns.endsWith('.org.ai'),
            `${relPath} row ${i + 1}: namespace '${row.ns}' should end with .org.ai`
          ).toBe(true)
        }
      }
    }
  })
})

// ============================================================================
// Relationship Files
// ============================================================================

describe('Relationship Files', () => {
  it('should have relationship files in .data/relationships/', () => {
    const relFiles = dataFiles.filter(f => f.includes('/relationships/'))
    expect(relFiles.length).toBeGreaterThan(0)
  })

  it('relationship files should have from, to, predicate headers', () => {
    const relFiles = dataFiles.filter(f => f.includes('/relationships/'))
    const requiredHeaders = ['from', 'to', 'predicate']

    for (const file of relFiles) {
      const { headers } = parseTSV(file)
      if (headers.length === 0) continue

      const relPath = path.relative(DATA_DIR, file)
      for (const required of requiredHeaders) {
        expect(headers, `${relPath} missing '${required}' header`).toContain(required)
      }
    }
  })
})

// ============================================================================
// GraphDL Semantic Data Quality
// ============================================================================

describe('GraphDL Semantic Quality', () => {
  it('Tasks should have verb and object columns', () => {
    const file = path.join(DATA_DIR, 'Tasks.tsv')
    if (!fs.existsSync(file)) return

    const { headers } = parseTSV(file)
    expect(headers).toContain('verb')
    expect(headers).toContain('object')
  })

  it('Events should have pastTense column with proper conjugation', () => {
    const file = path.join(DATA_DIR, 'Events.tsv')
    if (!fs.existsSync(file)) return

    const { headers, rows } = parseTSV(file)
    expect(headers).toContain('pastTense')

    // Check for malformed past tense forms
    const badPatterns = ['inged', 'confered', 'bringed', 'singed']
    for (let i = 0; i < Math.min(rows.length, 1000); i++) {
      const pastTense = rows[i].pastTense || ''
      for (const pattern of badPatterns) {
        expect(
          pastTense.includes(pattern),
          `Events.tsv row ${i + 1}: pastTense '${pastTense}' contains malformed pattern '${pattern}'`
        ).toBe(false)
      }
    }
  })

  it('Concepts should not have truncated IDs', () => {
    const file = path.join(DATA_DIR, 'Concepts.tsv')
    if (!fs.existsSync(file)) return

    const { rows } = parseTSV(file)

    for (let i = 0; i < rows.length; i++) {
      const id = rows[i].id || ''
      // Truncated IDs start with lowercase
      expect(
        /^[a-z]/.test(id),
        `Concepts.tsv row ${i + 1}: ID '${id}' appears truncated (starts with lowercase)`
      ).toBe(false)
    }
  })

  it('namespace should be concepts.org.ai (plural) not concept.org.ai', () => {
    const relFiles = dataFiles.filter(f => f.includes('/relationships/'))

    for (const file of relFiles) {
      const { rows } = parseTSV(file)
      const relPath = path.relative(DATA_DIR, file)

      for (let i = 0; i < rows.length; i++) {
        const from = rows[i].from || ''
        const to = rows[i].to || ''

        expect(
          from.includes('concept.org.ai'),
          `${relPath} row ${i + 1}: 'from' uses singular 'concept.org.ai' - should be 'concepts.org.ai'`
        ).toBe(false)

        expect(
          to.includes('concept.org.ai'),
          `${relPath} row ${i + 1}: 'to' uses singular 'concept.org.ai' - should be 'concepts.org.ai'`
        ).toBe(false)
      }
    }
  })
})

// ============================================================================
// Data Completeness
// ============================================================================

describe('Data Completeness', () => {
  it('should have core entity files', () => {
    const coreFiles = [
      'Tasks.tsv',
      'Actions.tsv',
      'Events.tsv',
      'Concepts.tsv',
      'Occupations.tsv',
      'Processes.tsv',
      'Industries.tsv',
    ]

    for (const fileName of coreFiles) {
      expect(
        fs.existsSync(path.join(DATA_DIR, fileName)),
        `Missing core file: ${fileName}`
      ).toBe(true)
    }
  })

  it('should have core relationship files', () => {
    const coreRelFiles = [
      'Tasks.Actions.tsv',
      'Actions.Events.tsv',
      'Tasks.Concepts.tsv',
      'Occupations.Tasks.tsv',
    ]

    for (const fileName of coreRelFiles) {
      expect(
        fs.existsSync(path.join(DATA_DIR, 'relationships', fileName)),
        `Missing relationship file: ${fileName}`
      ).toBe(true)
    }
  })

  it('Tasks and Actions should have equal row counts', () => {
    const tasksFile = path.join(DATA_DIR, 'Tasks.tsv')
    const actionsFile = path.join(DATA_DIR, 'Actions.tsv')

    if (!fs.existsSync(tasksFile) || !fs.existsSync(actionsFile)) return

    const { rows: tasksRows } = parseTSV(tasksFile)
    const { rows: actionsRows } = parseTSV(actionsFile)

    expect(tasksRows.length).toBe(actionsRows.length)
  })
})
