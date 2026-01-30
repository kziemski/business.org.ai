import { readFileSync, writeFileSync } from 'fs'
import { execSync } from 'child_process'

const dirs = ['occupations', 'industries', 'processes']
const rootDir = new URL('..', import.meta.url).pathname

// Find all MDX files, excluding processes/industries/
const files: string[] = []
for (const dir of dirs) {
  const result = execSync(
    `find ${rootDir}${dir} -name '*.mdx' ${dir === 'processes' ? '-not -path "*/processes/industries/*"' : ''}`,
    { encoding: 'utf-8' }
  ).trim()
  if (result) files.push(...result.split('\n'))
}

console.log(`Scanning ${files.length} MDX files...`)

let fixedCount = 0

for (const file of files) {
  const content = readFileSync(file, 'utf-8')
  const lines = content.split('\n')
  let modified = false

  let inGraphDLSection = false
  let inCodeBlock = false
  let codeBlockLang = ''

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // Track section headers
    if (/^#{1,6}\s/.test(trimmed)) {
      if (/graphdl\s+semantic/i.test(trimmed)) {
        inGraphDLSection = true
      } else if (!inCodeBlock) {
        inGraphDLSection = false
      }
    }

    // Track code blocks
    if (trimmed.startsWith('```') && !inCodeBlock) {
      // Opening a code block
      codeBlockLang = trimmed.slice(3).trim()
      inCodeBlock = true

      // If we're in a GraphDL section and it's a bare ```, fix it
      if (inGraphDLSection && codeBlockLang === '') {
        lines[i] = line.replace('```', '```graphdl')
        modified = true
      }
    } else if (trimmed === '```' && inCodeBlock) {
      // Closing a code block
      inCodeBlock = false
      codeBlockLang = ''
    }
  }

  if (modified) {
    writeFileSync(file, lines.join('\n'))
    fixedCount++
  }
}

console.log(`Fixed ${fixedCount} of ${files.length} files.`)
