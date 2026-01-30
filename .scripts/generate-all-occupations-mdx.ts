/**
 * Generate MDX files for ALL occupations in .data/Occupations.tsv
 *
 * Reads occupation data and task relationships, then generates MDX files
 * in the hierarchical folder structure under occupations/.
 * Skips any files that already exist.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

// SOC code prefix -> folder name mapping (matching existing folder structure)
const CATEGORY_FOLDERS: Record<string, string> = {
  '11': 'Management',
  '13': 'Business',
  '15': 'Technology',
  '17': 'Architecture',
  '19': 'Science',
  '21': 'SocialServices',
  '23': 'Legal',
  '25': 'Education',
  '27': 'ArtsMedia',
  '29': 'HealthcarePractitioners',
  '31': 'HealthcareSupport',
  '33': 'PublicSafety',
  '35': 'FoodService',
  '37': 'Facilities',
  '39': 'PersonalService',
  '41': 'Sales',
  '43': 'Administrative',
  '45': 'Agriculture',
  '47': 'Construction',
  '49': 'Maintenance',
  '51': 'Production',
  '53': 'Transportation',
  '55': 'Military',
};

const CATEGORY_NAMES: Record<string, string> = {
  '11': 'Management Occupations',
  '13': 'Business and Financial Operations',
  '15': 'Computer and Mathematical',
  '17': 'Architecture and Engineering',
  '19': 'Life, Physical, and Social Science',
  '21': 'Community and Social Service',
  '23': 'Legal',
  '25': 'Educational Instruction and Library',
  '27': 'Arts, Design, Entertainment, Sports, Media',
  '29': 'Healthcare Practitioners and Technical',
  '31': 'Healthcare Support',
  '33': 'Protective Service',
  '35': 'Food Preparation and Serving',
  '37': 'Building and Grounds Cleaning',
  '39': 'Personal Care and Service',
  '41': 'Sales and Related',
  '43': 'Office and Administrative Support',
  '45': 'Farming, Fishing, and Forestry',
  '47': 'Construction and Extraction',
  '49': 'Installation, Maintenance, and Repair',
  '51': 'Production',
  '53': 'Transportation and Material Moving',
  '55': 'Military Specific',
};

interface Occupation {
  ns: string;
  type: string;
  id: string;
  name: string;
  description: string;
  code: string;
  shortName: string;
  sourceType: string;
  sourceCode: string;
  jobZone: string;
  category: string;
}

interface TaskMapping {
  from: string;      // onet.org.ai/XX-XXXX.XX
  to: string;        // tasks.org.ai/verb.Object...
  predicate: string;
  reverse: string;
  taskType: string;
}

function parseTSV<T>(filePath: string): T[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const headers = lines[0].split('\t');
  return lines.slice(1)
    .filter(line => line.trim())
    .map(line => {
      const values = line.split('\t');
      const obj: any = {};
      headers.forEach((header, i) => {
        obj[header.trim()] = (values[i] || '').trim();
      });
      return obj as T;
    });
}

function toPascalCase(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 0)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

/** Get the SOC "group" code: e.g. 11-1011.00 -> 11-1011, 11-1011.03 -> 11-1011 */
function getGroupCode(code: string): string {
  return code.split('.')[0];
}

/** Get category prefix: 11-1011.00 -> 11 */
function getCategoryPrefix(code: string): string {
  return code.split('-')[0];
}

/** Is this a base occupation (XX-XXXX.00)? */
function isBase(code: string): boolean {
  return code.endsWith('.00');
}

/** Is this a variant (XX-XXXX.XX where XX != 00)? */
function isVariant(code: string): boolean {
  const parts = code.split('.');
  return parts.length === 2 && parts[1] !== '00';
}

/**
 * Determine the file path for an occupation.
 * Base occupations with variants would ideally get folders, but existing structure
 * uses flat files. Follow the existing pattern: all files are flat .mdx in category folder.
 */
function getFilePath(occ: Occupation, hasVariants: boolean): string {
  const catPrefix = getCategoryPrefix(occ.code);
  const folder = CATEGORY_FOLDERS[catPrefix] || 'Other';
  const occDir = path.join(ROOT, 'occupations', folder);
  return path.join(occDir, `${occ.id}.mdx`);
}

/** Extract task name from tasks.org.ai URI */
function taskUriToName(uri: string): string {
  // tasks.org.ai/verb.Object.prep.PrepObject -> verb.Object.prep.PrepObject
  const parts = uri.split('/');
  return parts[parts.length - 1];
}

/** Group tasks by verb */
function groupTasksByVerb(tasks: string[]): Record<string, string[]> {
  const groups: Record<string, string[]> = {};
  for (const task of tasks) {
    const verb = task.split('.')[0];
    if (!verb) continue;
    if (!groups[verb]) groups[verb] = [];
    // Extract the object part (second segment)
    const parts = task.split('.');
    const obj = parts[1] || task;
    if (!groups[verb].includes(obj)) {
      groups[verb].push(obj);
    }
  }
  return groups;
}

/** Add spaces before capitals: PascalCase -> Pascal Case */
function humanize(s: string): string {
  return s.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/([A-Z])([A-Z][a-z])/g, '$1 $2');
}

function generateMDX(
  occ: Occupation,
  allOccs: Occupation[],
  taskMappings: Map<string, TaskMapping[]>,
): string {
  const catPrefix = getCategoryPrefix(occ.code);
  const categoryName = CATEGORY_NAMES[catPrefix] || 'Unknown';
  const categoryFolder = CATEGORY_FOLDERS[catPrefix] || 'Other';
  const groupCode = getGroupCode(occ.code);

  // Find variants (if this is a base) or siblings
  const baseCode = isVariant(occ.code) ? groupCode + '.00' : occ.code;
  const baseOcc = allOccs.find(o => o.code === baseCode);
  const variants = allOccs.filter(o => getGroupCode(o.code) === groupCode && o.code !== baseCode);

  // Get tasks for this occupation
  const onetKey = `onet.org.ai/${occ.code}`;
  const tasks = taskMappings.get(onetKey) || [];
  const taskNames = tasks.map(t => taskUriToName(t.to));
  const coreTasks = tasks.filter(t => t.taskType === 'Core');
  const coreTaskNames = coreTasks.map(t => taskUriToName(t.to));

  // Group tasks by verb for mindmap
  const taskGroups = groupTasksByVerb(coreTaskNames.length > 0 ? coreTaskNames : taskNames);
  const verbKeys = Object.keys(taskGroups).slice(0, 8); // limit for readability

  // Find related occupations in same category
  const sameCategory = allOccs
    .filter(o => getCategoryPrefix(o.code) === catPrefix && o.id !== occ.id)
    .slice(0, 4);

  let content = '';

  // Frontmatter
  content += `---
id: ${occ.id}
name: "${occ.name}"
code: "${occ.code}"
type: Occupation
status: complete
---

`;

  // Title and description
  content += `# ${occ.name}\n\n`;
  content += `> ${occ.description || occ.name}\n\n`;

  // Overview
  content += `## Overview\n\n`;
  const descSentences = (occ.description || '').split('. ').filter(s => s.length > 10);
  if (descSentences.length > 1) {
    content += `${occ.name} is a${isVariant(occ.code) ? ' specialized variant' : 'n occupation'} within the ${categoryName} category. `;
    content += `${descSentences[0]}. `;
    if (descSentences.length > 2) {
      content += `${descSentences[1]}.\n\n`;
    } else {
      content += '\n\n';
    }
  } else {
    content += `${occ.name} is classified under ${categoryName} (SOC ${catPrefix}). ${occ.description || ''}\n\n`;
  }

  // Classification Hierarchy
  content += `## Classification Hierarchy\n\n`;
  content += '```mermaid\ngraph TD\n';
  content += `    Cat${catPrefix}["${catPrefix} - ${categoryName}"] --> Group${groupCode.replace('-', '')}["${groupCode} ${baseOcc ? baseOcc.name : occ.name}"]\n`;

  if (isBase(occ.code)) {
    content += `    Group${groupCode.replace('-', '')} --> Current["${occ.code} ${occ.name}"]\n`;
    content += `    style Current fill:#e1f5fe\n`;
    for (const v of variants.slice(0, 5)) {
      const vid = `V${v.code.replace(/[.-]/g, '')}`;
      content += `    Group${groupCode.replace('-', '')} --> ${vid}["${v.code} ${v.name}"]\n`;
    }
  } else if (isVariant(occ.code)) {
    if (baseOcc) {
      content += `    Group${groupCode.replace('-', '')} --> Base["${baseOcc.code} ${baseOcc.name}"]\n`;
    }
    content += `    Group${groupCode.replace('-', '')} --> Current["${occ.code} ${occ.name}"]\n`;
    content += `    style Current fill:#e1f5fe\n`;
  } else {
    content += `    Group${groupCode.replace('-', '')} --> Current["${occ.code} ${occ.name}"]\n`;
    content += `    style Current fill:#e1f5fe\n`;
  }
  content += '```\n\n';

  // Key Statistics
  content += `## Key Statistics\n\n`;
  content += `| Metric | Value |\n`;
  content += `|--------|-------|\n`;
  content += `| SOC Code | ${occ.code} |\n`;
  if (occ.jobZone) {
    content += `| Job Zone | ${occ.jobZone} |\n`;
  }
  content += `| Category | [${categoryName}](/occupations/${categoryFolder}) |\n`;
  content += `| Task Count | ${taskNames.length} |\n`;
  content += `| Source | O*NET |\n\n`;

  // Core Tasks
  if (verbKeys.length > 0) {
    content += `## Core Tasks\n\n`;
    content += '```mermaid\nmindmap\n';
    content += `    root(("${occ.name.length > 30 ? occ.id : occ.name}"))\n`;
    for (const verb of verbKeys) {
      const capitalized = verb.charAt(0).toUpperCase() + verb.slice(1);
      content += `        ${capitalized}\n`;
      for (const obj of taskGroups[verb].slice(0, 5)) {
        content += `            ${humanize(obj)}\n`;
      }
    }
    content += '```\n\n';

    // Task details (top 3 verb groups)
    for (const verb of verbKeys.slice(0, 3)) {
      const capitalized = verb.charAt(0).toUpperCase() + verb.slice(1);
      const verbTasks = (coreTaskNames.length > 0 ? coreTaskNames : taskNames)
        .filter(t => t.startsWith(verb + '.'))
        .slice(0, 4);

      if (verbTasks.length > 0) {
        const firstObj = taskGroups[verb][0];
        content += `### ${verb}.${firstObj}\n\n`;
        content += `${occ.name} ${verb} ${humanize(firstObj).toLowerCase()} as part of their core responsibilities.\n\n`;
        content += `**Actions:**\n`;
        for (const t of verbTasks) {
          content += `- \`${t}\`\n`;
        }
        content += '\n';
      }
    }
  } else {
    content += `## Core Tasks\n\n`;
    content += `Task data is being compiled for this occupation. See [O*NET ${occ.code}](https://www.onetonline.org/link/summary/${occ.code}) for detailed task information.\n\n`;
  }

  // Skills & Competencies (generic based on category)
  content += `## Skills & Competencies\n\n`;
  content += `### Technical Skills\n`;
  content += getSkillsForCategory(catPrefix, 'technical');
  content += `\n### Soft Skills\n`;
  content += getSkillsForCategory(catPrefix, 'soft');
  content += '\n';

  // Related Occupations
  content += `## Related Occupations\n\n`;
  if (sameCategory.length > 0) {
    content += '```mermaid\ngraph LR\n';
    content += `    Current["${occ.name.length > 30 ? occ.id : occ.name}"]\n\n`;
    content += `    subgraph SameCategory["${categoryName}"]\n`;
    for (const rel of sameCategory) {
      const nid = rel.id.slice(0, 20);
      const label = rel.name.length > 35 ? rel.name.slice(0, 32) + '...' : rel.name;
      content += `        ${nid}["${label}"]\n`;
    }
    content += `    end\n\n`;
    content += `    Current --- SameCategory\n`;
    content += '```\n\n';
  }

  // Industries (generic)
  content += `## Industries\n\n`;
  content += `This occupation is found across multiple industries. See [Industries](/industries) for sector-specific employment data.\n\n`;

  // Career Progression
  content += `## Career Progression\n\n`;
  content += '```mermaid\ngraph BT\n';
  content += `    Entry["Entry Level"] --> Mid["Mid-Level"]\n`;
  content += `    Mid --> Senior["Senior Level"]\n`;
  content += `    Senior --> Executive["Executive / Director"]\n`;
  content += '```\n\n';

  // Source
  content += `---\n\n`;
  content += `*Source: O*NET ${occ.code} - ${occ.sourceType || 'ONETOccupation'}*\n`;

  return content;
}

function getSkillsForCategory(catPrefix: string, type: 'technical' | 'soft'): string {
  // Provide reasonable defaults based on category
  if (type === 'soft') {
    return `- **Communication** - Essential
- **Problem Solving** - Essential
- **Critical Thinking** - Important
- **Teamwork** - Important
- **Adaptability** - Important
`;
  }

  const techSkills: Record<string, string> = {
    '11': '- **Strategic Planning** - Advanced\n- **Financial Management** - Advanced\n- **Operations Management** - Advanced\n',
    '13': '- **Financial Analysis** - Advanced\n- **Data Analysis** - Advanced\n- **Regulatory Compliance** - Advanced\n',
    '15': '- **Programming** - Advanced\n- **Systems Analysis** - Advanced\n- **Database Management** - Advanced\n',
    '17': '- **Engineering Design** - Advanced\n- **CAD/CAM** - Advanced\n- **Technical Analysis** - Advanced\n',
    '19': '- **Research Methods** - Advanced\n- **Data Analysis** - Advanced\n- **Laboratory Techniques** - Advanced\n',
    '21': '- **Counseling** - Advanced\n- **Case Management** - Advanced\n- **Community Outreach** - Advanced\n',
    '23': '- **Legal Research** - Advanced\n- **Legal Writing** - Advanced\n- **Regulatory Knowledge** - Advanced\n',
    '25': '- **Curriculum Development** - Advanced\n- **Instructional Design** - Advanced\n- **Assessment** - Advanced\n',
    '27': '- **Creative Design** - Advanced\n- **Digital Media** - Advanced\n- **Content Creation** - Advanced\n',
    '29': '- **Clinical Skills** - Advanced\n- **Diagnostic Procedures** - Advanced\n- **Patient Care** - Advanced\n',
    '31': '- **Patient Care** - Advanced\n- **Medical Terminology** - Intermediate\n- **Health Records** - Intermediate\n',
    '33': '- **Law Enforcement** - Advanced\n- **Emergency Response** - Advanced\n- **Public Safety** - Advanced\n',
    '35': '- **Food Preparation** - Advanced\n- **Food Safety** - Advanced\n- **Customer Service** - Advanced\n',
    '37': '- **Facilities Maintenance** - Advanced\n- **Equipment Operation** - Advanced\n- **Safety Procedures** - Advanced\n',
    '39': '- **Customer Service** - Advanced\n- **Personal Care** - Advanced\n- **Service Delivery** - Advanced\n',
    '41': '- **Sales Techniques** - Advanced\n- **Customer Relations** - Advanced\n- **Product Knowledge** - Advanced\n',
    '43': '- **Office Management** - Advanced\n- **Data Entry** - Advanced\n- **Records Management** - Advanced\n',
    '45': '- **Agricultural Operations** - Advanced\n- **Equipment Operation** - Advanced\n- **Resource Management** - Advanced\n',
    '47': '- **Construction Methods** - Advanced\n- **Blueprint Reading** - Advanced\n- **Safety Compliance** - Advanced\n',
    '49': '- **Equipment Repair** - Advanced\n- **Diagnostic Testing** - Advanced\n- **Preventive Maintenance** - Advanced\n',
    '51': '- **Machine Operation** - Advanced\n- **Quality Control** - Advanced\n- **Production Processes** - Advanced\n',
    '53': '- **Vehicle Operation** - Advanced\n- **Logistics** - Advanced\n- **Safety Compliance** - Advanced\n',
    '55': '- **Military Operations** - Advanced\n- **Tactical Planning** - Advanced\n- **Leadership** - Advanced\n',
  };

  return techSkills[catPrefix] || '- **Domain Expertise** - Advanced\n- **Technical Proficiency** - Advanced\n- **Quality Standards** - Advanced\n';
}

// Main
async function main() {
  const occsPath = path.join(ROOT, '.data', 'Occupations.tsv');
  const tasksPath = path.join(ROOT, '.data', 'relationships', 'Occupations.Tasks.tsv');

  console.log('Parsing Occupations.tsv...');
  const occupations = parseTSV<Occupation>(occsPath);
  console.log(`Found ${occupations.length} occupations`);

  console.log('Parsing Occupations.Tasks.tsv...');
  let taskMappings = new Map<string, TaskMapping[]>();
  if (fs.existsSync(tasksPath)) {
    const allTasks = parseTSV<TaskMapping>(tasksPath);
    console.log(`Found ${allTasks.length} task mappings`);
    for (const t of allTasks) {
      const key = t.from;
      if (!taskMappings.has(key)) taskMappings.set(key, []);
      taskMappings.get(key)!.push(t);
    }
  } else {
    console.log('No Occupations.Tasks.tsv found, proceeding without tasks');
  }

  let created = 0;
  let skipped = 0;

  for (const occ of occupations) {
    const filePath = getFilePath(occ, false);

    if (fs.existsSync(filePath)) {
      skipped++;
      continue;
    }

    // Ensure directory exists
    const dir = path.dirname(filePath);
    fs.mkdirSync(dir, { recursive: true });

    const content = generateMDX(occ, occupations, taskMappings);
    fs.writeFileSync(filePath, content);
    created++;

    if (created % 100 === 0) {
      console.log(`  Created ${created} files...`);
    }
  }

  console.log(`\nDone!`);
  console.log(`  Created: ${created}`);
  console.log(`  Skipped (already exist): ${skipped}`);
  console.log(`  Total occupations: ${occupations.length}`);
}

main().catch(console.error);
