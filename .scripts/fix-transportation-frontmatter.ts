import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

const BASE = 'industries/TransportationAndWarehousing'

function findMdx(dir: string): string[] {
  const results: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) results.push(...findMdx(full))
    else if (full.endsWith('.mdx')) results.push(full)
  }
  return results
}

const allFiles = findMdx(BASE)
const targetFiles = allFiles.filter(f => {
  const content = readFileSync(f, 'utf-8')
  return content.includes('naicsCode') && content.includes('$type')
})

console.log(`Found ${targetFiles.length} files with inconsistent frontmatter:\n`)

const levelMap: Record<string, string> = {
  sector: 'Sector',
  subsector: 'Subsector',
  industryGroup: 'Industry Group',
  industry: 'Industry',
  nationalIndustry: 'National Industry',
}

function toPascalCase(str: string): string {
  return str.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\b\w/g, c => c.toUpperCase()).replace(/\s+/g, '')
}

for (const file of targetFiles) {
  const raw = readFileSync(file, 'utf-8')
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) {
    console.log(`  SKIP (no frontmatter): ${file}`)
    continue
  }

  const frontmatterStr = match[1]
  const body = match[2]

  // Parse YAML fields manually
  const lines = frontmatterStr.split('\n')
  const fields: Record<string, string> = {}
  let regulatoryAgencies: string[] = []
  let inRegAgencies = false

  for (const line of lines) {
    if (inRegAgencies) {
      if (line.startsWith('  - ')) {
        regulatoryAgencies.push(line.replace('  - ', '').trim())
        continue
      } else {
        inRegAgencies = false
      }
    }
    if (line.startsWith('regulatoryAgencies:')) {
      inRegAgencies = true
      continue
    }
    const kv = line.match(/^(\w[\w$]*)\s*:\s*(.*)$/)
    if (kv) {
      fields[kv[1]] = kv[2].replace(/^["']|["']$/g, '').trim()
    }
  }

  const title = fields['title'] || ''
  const naicsCode = fields['naicsCode'] || ''
  const naicsLevel = fields['naicsLevel'] || ''
  const id = toPascalCase(title)
  const level = levelMap[naicsLevel] || naicsLevel

  // Build new frontmatter
  const newFrontmatter = [
    `id: ${id}`,
    `name: "${title}"`,
    `code: "${naicsCode}"`,
    `type: Industry`,
    `level: ${level}`,
    `status: complete`,
  ].join('\n')

  // Check if regulatory agencies info needs to be added to body
  let newBody = body
  if (regulatoryAgencies.length > 0 && !body.includes('Regulatory')) {
    // Add regulatory agencies section before the first ## section or at end
    const agencyList = regulatoryAgencies.map(a => `- ${a}`).join('\n')
    const section = `\n## Regulatory Agencies\n\n${agencyList}\n`
    const firstH2 = newBody.indexOf('\n## ')
    if (firstH2 > 0) {
      newBody = newBody.slice(0, firstH2) + section + newBody.slice(firstH2)
    } else {
      newBody = newBody + section
    }
  }

  const result = `---\n${newFrontmatter}\n---\n${newBody}`
  writeFileSync(file, result, 'utf-8')
  console.log(`  FIXED: ${file}`)
  console.log(`         id: ${id}, code: ${naicsCode}, level: ${level}`)
}

console.log(`\nDone. Fixed ${targetFiles.length} files.`)
