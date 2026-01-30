import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join, relative, dirname, basename } from 'path'

const ROOT = join(import.meta.dirname, '..')

// Recursively find all .mdx files under a directory
function findMdxFiles(dir: string): string[] {
  const results: string[] = []
  try {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry)
      const stat = statSync(full)
      if (stat.isDirectory()) {
        results.push(...findMdxFiles(full))
      } else if (entry.endsWith('.mdx')) {
        results.push(full)
      }
    }
  } catch {}
  return results
}

// Extract frontmatter field from file content
function getFrontmatter(content: string): Record<string, string> {
  const m = content.match(/^---\n([\s\S]*?)\n---/)
  if (!m) return {}
  const fields: Record<string, string> = {}
  for (const line of m[1].split('\n')) {
    const match = line.match(/^(\w+):\s*"?([^"]*)"?\s*$/)
    if (match) fields[match[1]] = match[2]
  }
  return fields
}

type Index = Map<string, string> // key (id/name) -> correct path (relative to root, no leading slash, no .mdx)

function buildIndex(category: string): Index {
  const dir = join(ROOT, category)
  const files = findMdxFiles(dir)
  const index: Index = new Map()

  for (const file of files) {
    const relPath = relative(ROOT, file).replace(/\.mdx$/, '') // e.g. "occupations/Management/ChiefExecutives"
    const content = readFileSync(file, 'utf-8')
    const fm = getFrontmatter(content)

    // Index by id
    if (fm.id) {
      index.set(fm.id, relPath)
    }

    // Index by filename (without extension)
    const fileName = basename(file, '.mdx')
    if (fileName !== 'index') {
      index.set(fileName, relPath)
    }

    // Index by name (PascalCase-ified)
    if (fm.name) {
      const pascal = fm.name.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\b\w/g, c => c.toUpperCase()).replace(/\s+/g, '')
      if (pascal) index.set(pascal, relPath)
    }
  }

  return index
}

// Build indexes
console.log('Building indexes...')
const indexes: Record<string, Index> = {}
for (const cat of ['occupations', 'industries', 'processes', 'departments']) {
  indexes[cat] = buildIndex(cat)
  console.log(`  ${cat}: ${indexes[cat].size} entries`)
}

// Now scan ALL mdx files and fix links
const allMdx = findMdxFiles(ROOT)
console.log(`\nScanning ${allMdx.length} MDX files for broken links...`)

const linkPattern = /\[([^\]]*)\]\(\/(occupations|industries|processes|departments|concepts)\/([^)]+)\)/g

let totalFixed = 0
let totalUnresolved = 0
let filesModified = 0
const unresolved: { file: string; category: string; target: string }[] = []

for (const file of allMdx) {
  const content = readFileSync(file, 'utf-8')
  let modified = content

  modified = modified.replace(linkPattern, (match, displayText, category, target) => {
    // concepts: remove link, keep display text
    if (category === 'concepts') {
      totalFixed++
      return displayText
    }

    const index = indexes[category]
    if (!index) return match

    // target might be e.g. "ChiefExecutives" or "Agriculture"
    const key = target.replace(/\//g, '')
    const resolved = index.get(key) || index.get(target)

    if (resolved) {
      totalFixed++
      return `[${displayText}](/${resolved})`
    }

    // Unresolved
    totalUnresolved++
    unresolved.push({ file: relative(ROOT, file), category, target })
    return match
  })

  if (modified !== content) {
    writeFileSync(file, modified, 'utf-8')
    filesModified++
  }
}

console.log(`\n=== Results ===`)
console.log(`Files scanned:    ${allMdx.length}`)
console.log(`Files modified:   ${filesModified}`)
console.log(`Links fixed:      ${totalFixed}`)
console.log(`Links unresolved: ${totalUnresolved}`)

if (unresolved.length > 0) {
  console.log(`\nUnresolved links (first 50):`)
  for (const u of unresolved.slice(0, 50)) {
    console.log(`  ${u.file}: /${u.category}/${u.target}`)
  }
  if (unresolved.length > 50) {
    console.log(`  ... and ${unresolved.length - 50} more`)
  }
}
