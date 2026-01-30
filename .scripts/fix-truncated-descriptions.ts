import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

const ROOT = join(import.meta.dirname, '..')
const TSV_PATH = join(ROOT, '.data/Industries.tsv')
const INDUSTRIES_DIR = join(ROOT, 'industries')

// Parse Industries.tsv into a map of id -> first sentence of description
function buildDescriptionMap(): Map<string, string> {
  const raw = readFileSync(TSV_PATH, 'utf-8')
  const lines = raw.split('\n')
  const header = lines[0].split('\t')
  const idIdx = header.indexOf('id')
  const descIdx = header.indexOf('description')

  const map = new Map<string, string>()
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split('\t')
    if (!cols[idIdx] || !cols[descIdx]) continue
    const id = cols[idIdx]
    const desc = cols[descIdx].trim()
    if (desc) {
      // Extract first sentence
      const firstSentence = desc.match(/^(.+?\.)\s/)?.[1] || desc.split('.')[0] + '.'
      map.set(id, firstSentence)
    }
  }
  return map
}

// Recursively find all MDX files
function findMdxFiles(dir: string): string[] {
  const results: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) {
      results.push(...findMdxFiles(full))
    } else if (entry.endsWith('.mdx')) {
      results.push(full)
    }
  }
  return results
}

// Main
const descMap = buildDescriptionMap()
console.log(`Loaded ${descMap.size} industry descriptions from TSV`)

const mdxFiles = findMdxFiles(INDUSTRIES_DIR)
console.log(`Found ${mdxFiles.length} MDX files`)

let fixed = 0
let noMatch = 0

for (const file of mdxFiles) {
  const content = readFileSync(file, 'utf-8')

  // Check for truncated description line (short blockquote under 20 chars)
  if (!/^> .{1,19}$/m.test(content)) continue

  // Extract id from frontmatter
  const idMatch = content.match(/^id:\s*(.+)$/m)
  if (!idMatch) {
    console.warn(`No id in frontmatter: ${file}`)
    continue
  }
  const id = idMatch[1].trim()
  let fullDesc = descMap.get(id)

  // Fallback: case-insensitive lookup
  if (!fullDesc) {
    const idLower = id.toLowerCase()
    for (const [key, val] of descMap) {
      if (key.toLowerCase() === idLower) {
        fullDesc = val
        break
      }
    }
  }

  if (!fullDesc) {
    noMatch++
    console.warn(`No description found for id="${id}" in ${file}`)
    continue
  }

  // Replace the truncated line
  const updated = content.replace(/^> .{1,19}$/m, `> ${fullDesc}`)
  writeFileSync(file, updated, 'utf-8')
  fixed++
}

console.log(`\nFixed: ${fixed} files`)
if (noMatch > 0) console.log(`No match: ${noMatch} files`)
