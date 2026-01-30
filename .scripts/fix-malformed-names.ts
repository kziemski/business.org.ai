import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

const ROOT = join(import.meta.dirname, '..')
const INDUSTRIES_DIR = join(ROOT, 'industries')
const NAICS_INDUSTRIES = join(ROOT, '.standards', '.source', 'NAICS', 'NAICS.Industries.tsv')
const NAICS_DESCRIPTIONS = join(ROOT, '.standards', '.source', 'NAICS', 'NAICS.Descriptions.tsv')

// Load NAICS source data by code
const naicsNameByCode = new Map<string, string>()
for (const line of readFileSync(NAICS_INDUSTRIES, 'utf-8').split('\n').slice(1)) {
  const [, code, title] = line.split('\t')
  if (code && title) {
    // Strip trailing "T" marker used in NAICS structure files
    naicsNameByCode.set(code.trim(), title.replace(/T\s*$/, '').trim())
  }
}

const naicsDescByCode = new Map<string, string>()
for (const line of readFileSync(NAICS_DESCRIPTIONS, 'utf-8').split('\n').slice(1)) {
  const [code, , desc] = line.split('\t')
  if (code && desc) {
    naicsDescByCode.set(code.trim(), desc.trim())
  }
}

// Collect all MDX files
function collectMdx(dir: string): string[] {
  const results: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    try {
      const st = statSync(full)
      if (st.isDirectory()) results.push(...collectMdx(full))
      else if (entry.endsWith('.mdx')) results.push(full)
    } catch {}
  }
  return results
}

const files = collectMdx(INDUSTRIES_DIR)
let namesFixed = 0
let descsFixed = 0

for (const filePath of files) {
  let content = readFileSync(filePath, 'utf-8')
  let changed = false

  // Extract frontmatter
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/)
  if (!fmMatch) continue

  const fm = fmMatch[1]
  const codeMatch = fm.match(/^code:\s*"?([^"\n]+)"?$/m)
  const nameMatch = fm.match(/^name:\s*"(.+)"$/m)
  const code = codeMatch?.[1]?.trim()
  if (!code) continue

  // Fix malformed names ending with " ("
  if (nameMatch) {
    const currentName = nameMatch[1]
    if (currentName.endsWith(' (') || currentName.endsWith('(')) {
      const correctName = naicsNameByCode.get(code)
      if (correctName) {
        // Replace the malformed name everywhere in the file
        const escaped = currentName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        content = content.replace(new RegExp(escaped, 'g'), correctName)
        changed = true
        namesFixed++
      }
    }
  }

  // Fix truncated descriptions
  const truncDescRegex = /^> This U\.S?\.?\s*$/m
  if (truncDescRegex.test(content)) {
    const fullDesc = naicsDescByCode.get(code)
    if (fullDesc) {
      // Get first sentence (skip abbreviations like "U.S.")
      const match = fullDesc.match(/^(.+?[a-z\d]\.)(?:\s{2}|\s+[A-Z]|$)/)
      const firstSentence = match ? match[1] : fullDesc.substring(0, 200)
      if (firstSentence.length > 20) {
        content = content.replace(truncDescRegex, `> ${firstSentence}`)
        changed = true
        descsFixed++
      }
    }
  }

  if (changed) {
    writeFileSync(filePath, content)
  }
}

console.log(`Fixed ${namesFixed} malformed names`)
console.log(`Fixed ${descsFixed} truncated descriptions`)
console.log(`Total files scanned: ${files.length}`)
