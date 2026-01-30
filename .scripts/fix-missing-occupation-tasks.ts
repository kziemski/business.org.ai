import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join, resolve } from 'path'

const ROOT = resolve(import.meta.dirname, '..')
const OCCUPATIONS_DIR = join(ROOT, 'occupations')
const DATA_DIR = join(ROOT, '.data')

// Parse TSV file into array of objects
function parseTSV(filePath: string): Record<string, string>[] {
  const content = readFileSync(filePath, 'utf-8')
  const lines = content.trim().split('\n')
  const headers = lines[0].split('\t')
  return lines.slice(1).map(line => {
    const values = line.split('\t')
    const obj: Record<string, string> = {}
    headers.forEach((h, i) => obj[h] = values[i] || '')
    return obj
  })
}

// Recursively find all MDX files
function findMDXFiles(dir: string): string[] {
  const results: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) {
      results.push(...findMDXFiles(full))
    } else if (entry.endsWith('.mdx') && entry !== '[Occupation].mdx') {
      results.push(full)
    }
  }
  return results
}

// Build task lookup: onet code -> tasks
const relRows = parseTSV(join(DATA_DIR, 'relationships', 'Occupations.Tasks.tsv'))
const taskRows = parseTSV(join(DATA_DIR, 'Tasks.tsv'))

// Index tasks by their full ID (ns/id)
const taskById = new Map<string, Record<string, string>>()
for (const t of taskRows) {
  const key = `${t.ns}/${t.id}`
  taskById.set(key, t)
}

// Group relationships by onet code prefix (e.g. "11-1011.00")
const tasksByOnetCode = new Map<string, { taskId: string; taskType: string; task: Record<string, string> }[]>()
for (const rel of relRows) {
  // from is like "onet.org.ai/11-1011.00", to is like "tasks.org.ai/direct.OrganizationsFinancial.to.fund.Operations"
  const code = rel.from.replace('onet.org.ai/', '')
  const task = taskById.get(rel.to)
  if (!task) continue
  if (!tasksByOnetCode.has(code)) tasksByOnetCode.set(code, [])
  tasksByOnetCode.get(code)!.push({ taskId: rel.to, taskType: rel.taskType || 'Core', task })
}

// Find all placeholder MDX files
const allMDX = findMDXFiles(OCCUPATIONS_DIR)
const placeholderFiles = allMDX.filter(f => {
  const content = readFileSync(f, 'utf-8')
  return content.includes('Task data is being compiled')
})

console.log(`Found ${placeholderFiles.length} files with placeholder task data`)

let fixedCount = 0

for (const filePath of placeholderFiles) {
  const content = readFileSync(filePath, 'utf-8')

  // Extract SOC code from frontmatter
  const codeMatch = content.match(/^code:\s*"([^"]+)"/m)
  if (!codeMatch) {
    console.log(`  SKIP: No code found in ${filePath}`)
    continue
  }
  const socCode = codeMatch[1]
  const nameMatch = content.match(/^name:\s*"([^"]+)"/m)
  const occName = nameMatch ? nameMatch[1] : 'This occupation'
  const idMatch = content.match(/^id:\s*(\S+)/m)
  const occId = idMatch ? idMatch[1] : 'Occupation'

  // Look up tasks - try exact match first, then prefix match
  let tasks = tasksByOnetCode.get(socCode)
  if (!tasks) {
    // Try prefix match (e.g. "11-1011" matches "11-1011.00", "11-1011.03", etc.)
    const prefix = socCode.replace(/\.\d+$/, '')
    for (const [code, t] of tasksByOnetCode) {
      if (code.startsWith(prefix)) {
        tasks = t
        break
      }
    }
  }

  if (!tasks || tasks.length === 0) {
    console.log(`  SKIP: No tasks found for ${socCode} (${occName})`)
    continue
  }

  // Deduplicate tasks by task ID
  const seen = new Set<string>()
  const uniqueTasks = tasks.filter(t => {
    if (seen.has(t.taskId)) return false
    seen.add(t.taskId)
    return true
  })

  const taskCount = uniqueTasks.length

  // Group tasks by verb for mindmap
  const byVerb = new Map<string, Set<string>>()
  for (const { task } of uniqueTasks) {
    const verb = task.verb || 'other'
    if (!byVerb.has(verb)) byVerb.set(verb, new Set())
    const obj = task.object || task.prepObject || ''
    if (obj) byVerb.get(verb)!.add(obj)
  }

  // Build mindmap - capitalize verb, limit objects to top 8 per verb, limit verbs to top 10
  const sortedVerbs = [...byVerb.entries()]
    .sort((a, b) => b[1].size - a[1].size)
    .slice(0, 10)

  let mindmap = `\`\`\`mermaid\nmindmap\n    root(("${occId}"))\n`
  for (const [verb, objects] of sortedVerbs) {
    const capVerb = verb.charAt(0).toUpperCase() + verb.slice(1)
    mindmap += `        ${capVerb}\n`
    const objList = [...objects].slice(0, 8)
    for (const obj of objList) {
      // Add spaces before capitals for readability
      const readable = obj.replace(/([a-z])([A-Z])/g, '$1 $2')
      mindmap += `            ${readable}\n`
    }
  }
  mindmap += `\`\`\``

  // Build task list sections - top 3 verb groups with actions
  let taskSections = ''
  const topVerbs = sortedVerbs.slice(0, 3)
  for (const [verb, objects] of topVerbs) {
    const firstObj = [...objects][0]
    const readable = firstObj ? firstObj.replace(/([a-z])([A-Z])/g, '$1 $2') : ''
    taskSections += `\n### ${verb}.${firstObj || ''}\n\n`
    taskSections += `${occName} ${verb} ${readable.toLowerCase()} as part of their core responsibilities.\n\n`
    taskSections += `**Actions:**\n`

    // Find matching tasks for this verb
    const verbTasks = uniqueTasks.filter(t => t.task.verb === verb).slice(0, 4)
    for (const { task } of verbTasks) {
      const parts = [task.verb, task.object, task.preposition, task.prepObject].filter(Boolean).join('.')
      taskSections += `- \`${parts}\`\n`
    }
  }

  // Build replacement for Core Tasks section
  const newCoreTasksSection = `## Core Tasks\n\n${mindmap}\n${taskSections}`

  // Replace placeholder section
  const placeholderRegex = /## Core Tasks\n\nTask data is being compiled for this occupation\. See \[O\*NET [^\]]+\]\([^)]+\) for detailed task information\./
  let newContent = content.replace(placeholderRegex, newCoreTasksSection)

  // Update task count
  newContent = newContent.replace(/\| Task Count \| 0 \|/, `| Task Count | ${taskCount} |`)

  if (newContent !== content) {
    writeFileSync(filePath, newContent, 'utf-8')
    fixedCount++
    console.log(`  FIXED: ${socCode} ${occName} (${taskCount} tasks)`)
  }
}

console.log(`\nDone: Fixed ${fixedCount} of ${placeholderFiles.length} placeholder files`)
