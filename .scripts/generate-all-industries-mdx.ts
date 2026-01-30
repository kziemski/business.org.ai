/**
 * Generate MDX files for ALL industries in Industries.tsv (all NAICS sectors).
 * Skips files that already exist (e.g., Manufacturing which has 815 files).
 *
 * Based on the pattern from generate-manufacturing-mdx.ts but generalized
 * to handle every NAICS sector.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface Industry {
  ns: string;
  type: string;
  id: string;
  name: string;
  description: string;
  code: string;
  shortName: string;
  sourceType: string;
  level: number;
}

// Parse TSV file
function parseTSV(filePath: string): Industry[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const headers = lines[0].split('\t');

  return lines.slice(1)
    .filter(line => line.trim())
    .map(line => {
      const values = line.split('\t');
      const obj: any = {};
      headers.forEach((header, i) => {
        obj[header] = values[i] || '';
      });
      return obj as Industry;
    });
}

// Determine NAICS level from code length
function getNAICSLevel(code: string): string {
  const len = code.replace(/[^0-9]/g, '').length;
  switch (len) {
    case 2: return 'Sector';
    case 3: return 'Subsector';
    case 4: return 'Industry Group';
    case 5: return 'Industry';
    case 6: return 'National Industry';
    default: return 'Unknown';
  }
}

// Convert name to PascalCase
function toPascalCase(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 0)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

// Get parent code
function getParentCode(code: string): string | null {
  if (code.length <= 2) return null;
  return code.slice(0, -1);
}

// Generate frontmatter
function generateFrontmatter(industry: Industry): string {
  return `---
id: ${toPascalCase(industry.name)}
name: "${industry.name}"
code: "${industry.code}"
type: Industry
level: ${getNAICSLevel(industry.code)}
status: complete
---`;
}

// Generate hierarchy mermaid diagram
function generateHierarchyDiagram(industry: Industry, allIndustries: Industry[], sectorName: string, sectorCode: string): string {
  const code = industry.code;

  let diagram = '```mermaid\ngraph TD\n';

  // Sector at top
  const sectorId = `S${sectorCode}`;
  diagram += `    ${sectorId}["${sectorCode}: ${sectorName}"]\n`;

  // Find ancestors
  const ancestors: Industry[] = [];
  let currentCode = code;

  while (currentCode.length > 2) {
    const parentCode = getParentCode(currentCode);
    if (!parentCode) break;
    if (parentCode.length <= 2) break;

    const parent = allIndustries.find(i => i.code === parentCode);
    if (parent) {
      ancestors.unshift(parent);
    }
    currentCode = parentCode;
  }

  // Add ancestor chain
  let prevId = sectorId;
  for (const ancestor of ancestors) {
    const nodeId = `N${ancestor.code}`;
    const shortName = ancestor.name.length > 40 ? ancestor.name.slice(0, 37) + '...' : ancestor.name;
    diagram += `    ${prevId} --> ${nodeId}["${ancestor.code}: ${shortName}"]\n`;
    prevId = nodeId;
  }

  // Add current industry (highlighted)
  const currentId = `N${code}`;
  const currentShortName = industry.name.length > 40 ? industry.name.slice(0, 37) + '...' : industry.name;
  diagram += `    ${prevId} --> ${currentId}["${code}: ${currentShortName}"]\n`;
  diagram += `    style ${currentId} fill:#f96,stroke:#333,stroke-width:2px\n`;

  // Add children (first few)
  const children = allIndustries.filter(i =>
    i.code.startsWith(code) &&
    i.code.length === code.length + 1
  ).slice(0, 5);

  for (const child of children) {
    const childId = `N${child.code}`;
    const childShortName = child.name.length > 35 ? child.name.slice(0, 32) + '...' : child.name;
    diagram += `    ${currentId} --> ${childId}["${child.code}: ${childShortName}"]\n`;
  }

  if (children.length === 5) {
    const totalChildren = allIndustries.filter(i =>
      i.code.startsWith(code) &&
      i.code.length === code.length + 1
    ).length;
    if (totalChildren > 5) {
      diagram += `    ${currentId} --> more["... +${totalChildren - 5} more"]\n`;
    }
  }

  diagram += '```';
  return diagram;
}

// Generate generic process flowchart
function generateProcessFlowchart(industry: Industry, sectorName: string): string {
  const name = industry.name.toLowerCase();
  const sector = sectorName.toLowerCase();

  let processes: { operating: string[], support: string[] };

  if (sector.includes('agriculture') || sector.includes('farming') || sector.includes('forestry')) {
    processes = {
      operating: ['Planning', 'Planting/Stocking', 'Growing/Raising', 'Harvesting', 'Processing'],
      support: ['Equipment Maintenance', 'Supply Management', 'Quality Control', 'Logistics']
    };
  } else if (sector.includes('mining') || sector.includes('oil') || sector.includes('quarry')) {
    processes = {
      operating: ['Exploration', 'Site Development', 'Extraction', 'Processing', 'Reclamation'],
      support: ['Safety Systems', 'Equipment Maintenance', 'Environmental Compliance', 'Logistics']
    };
  } else if (sector.includes('utilities')) {
    processes = {
      operating: ['Generation/Collection', 'Transmission', 'Distribution', 'Metering', 'Customer Service'],
      support: ['Infrastructure Maintenance', 'Safety Systems', 'Regulatory Compliance', 'IT Systems']
    };
  } else if (sector.includes('construction')) {
    processes = {
      operating: ['Design/Planning', 'Site Preparation', 'Construction', 'Inspection', 'Completion'],
      support: ['Project Management', 'Safety Systems', 'Procurement', 'Quality Assurance']
    };
  } else if (sector.includes('manufacturing')) {
    processes = {
      operating: ['Raw Material Prep', 'Production', 'Assembly', 'Quality Control', 'Packaging'],
      support: ['Equipment Maintenance', 'Inventory Mgmt', 'Safety Systems', 'Logistics']
    };
  } else if (sector.includes('wholesale') || sector.includes('retail')) {
    processes = {
      operating: ['Procurement', 'Warehousing', 'Merchandising', 'Sales', 'Distribution'],
      support: ['Inventory Mgmt', 'Marketing', 'Customer Service', 'IT Systems']
    };
  } else if (sector.includes('transportation') || sector.includes('warehousing')) {
    processes = {
      operating: ['Receiving', 'Routing/Planning', 'Transport/Storage', 'Delivery', 'Tracking'],
      support: ['Fleet Management', 'Safety Systems', 'Compliance', 'IT Systems']
    };
  } else if (sector.includes('information')) {
    processes = {
      operating: ['Content Creation', 'Production', 'Distribution', 'Customer Access', 'Support'],
      support: ['Technology Mgmt', 'Rights Management', 'Marketing', 'Analytics']
    };
  } else if (sector.includes('finance') || sector.includes('insurance')) {
    processes = {
      operating: ['Client Acquisition', 'Underwriting/Analysis', 'Processing', 'Service Delivery', 'Reporting'],
      support: ['Risk Management', 'Compliance', 'IT Security', 'Customer Relations']
    };
  } else if (sector.includes('real estate') || sector.includes('rental') || sector.includes('leasing')) {
    processes = {
      operating: ['Acquisition', 'Marketing', 'Leasing/Sales', 'Property Management', 'Maintenance'],
      support: ['Financial Management', 'Legal Compliance', 'Tenant Relations', 'Market Analysis']
    };
  } else if (sector.includes('professional') || sector.includes('scientific') || sector.includes('technical')) {
    processes = {
      operating: ['Client Engagement', 'Research/Analysis', 'Solution Development', 'Delivery', 'Review'],
      support: ['Knowledge Mgmt', 'Quality Assurance', 'Business Development', 'HR/Training']
    };
  } else if (sector.includes('management') || sector.includes('enterprise')) {
    processes = {
      operating: ['Strategic Planning', 'Resource Allocation', 'Performance Mgmt', 'Reporting', 'Optimization'],
      support: ['Finance', 'Legal', 'HR', 'IT']
    };
  } else if (sector.includes('administrative') || sector.includes('support') || sector.includes('waste')) {
    processes = {
      operating: ['Service Design', 'Resource Allocation', 'Service Delivery', 'Quality Check', 'Reporting'],
      support: ['Staff Management', 'Compliance', 'Client Relations', 'Technology']
    };
  } else if (sector.includes('education')) {
    processes = {
      operating: ['Curriculum Design', 'Enrollment', 'Instruction', 'Assessment', 'Certification'],
      support: ['Administration', 'Student Services', 'Facilities Mgmt', 'Technology']
    };
  } else if (sector.includes('health') || sector.includes('social')) {
    processes = {
      operating: ['Patient/Client Intake', 'Assessment', 'Treatment/Service', 'Follow-up', 'Discharge'],
      support: ['Compliance', 'Records Mgmt', 'Billing', 'Quality Assurance']
    };
  } else if (sector.includes('arts') || sector.includes('entertainment') || sector.includes('recreation')) {
    processes = {
      operating: ['Content/Event Planning', 'Production', 'Marketing', 'Delivery', 'Guest Services'],
      support: ['Venue/Facility Mgmt', 'Ticketing', 'Safety', 'Talent Management']
    };
  } else if (sector.includes('accommodation') || sector.includes('food service')) {
    processes = {
      operating: ['Reservation/Booking', 'Guest Check-in', 'Service Delivery', 'Quality Assurance', 'Check-out'],
      support: ['Housekeeping', 'Maintenance', 'Marketing', 'Revenue Mgmt']
    };
  } else if (sector.includes('public administration')) {
    processes = {
      operating: ['Policy Development', 'Program Design', 'Implementation', 'Monitoring', 'Evaluation'],
      support: ['Budget Mgmt', 'HR', 'Legal', 'IT/Records']
    };
  } else {
    processes = {
      operating: ['Planning', 'Resource Allocation', 'Operations', 'Quality Control', 'Delivery'],
      support: ['Administration', 'Compliance', 'Technology', 'Customer Service']
    };
  }

  let flowchart = '```mermaid\nflowchart LR\n    subgraph Operating["Operating Processes"]\n';
  processes.operating.forEach((p, i) => {
    flowchart += `        O${i + 1}["${p}"]\n`;
  });
  flowchart += '    end\n\n    subgraph Support["Support Processes"]\n';
  processes.support.forEach((p, i) => {
    flowchart += `        S${i + 1}["${p}"]\n`;
  });
  flowchart += '    end\n\n';

  for (let i = 0; i < processes.operating.length - 1; i++) {
    flowchart += `    O${i + 1} --> O${i + 2}\n`;
  }

  flowchart += `    S1 -.-> O2\n`;
  flowchart += `    S2 -.-> O3\n`;
  flowchart += '```';

  return flowchart;
}

// Generate value chain diagram
function generateValueChain(industry: Industry, sectorName: string): string {
  const sector = sectorName.toLowerCase();

  let inputs: string[], outputs: string[], customers: string[];

  if (sector.includes('agriculture') || sector.includes('farming')) {
    inputs = ['Seeds/Stock', 'Equipment', 'Fertilizers', 'Labor'];
    outputs = ['Crops', 'Livestock', 'Raw Materials'];
    customers = ['Processors', 'Distributors', 'Retailers', 'Export Markets'];
  } else if (sector.includes('mining') || sector.includes('oil')) {
    inputs = ['Equipment', 'Energy', 'Labor', 'Permits'];
    outputs = ['Minerals', 'Oil/Gas', 'Raw Materials'];
    customers = ['Refineries', 'Manufacturers', 'Utilities', 'Export Markets'];
  } else if (sector.includes('construction')) {
    inputs = ['Materials', 'Equipment', 'Labor', 'Plans'];
    outputs = ['Buildings', 'Infrastructure', 'Renovations'];
    customers = ['Property Owners', 'Government', 'Developers', 'Businesses'];
  } else if (sector.includes('manufacturing')) {
    inputs = ['Raw Materials', 'Components', 'Equipment'];
    outputs = ['Finished Products', 'Components', 'Assemblies'];
    customers = ['Industrial Buyers', 'Retailers', 'Distributors', 'End Users'];
  } else if (sector.includes('wholesale') || sector.includes('retail')) {
    inputs = ['Products', 'Inventory', 'Store/Warehouse'];
    outputs = ['Goods for Sale', 'Services', 'Delivery'];
    customers = ['Businesses', 'Consumers', 'Institutions', 'Government'];
  } else if (sector.includes('finance') || sector.includes('insurance')) {
    inputs = ['Capital', 'Data', 'Expertise', 'Technology'];
    outputs = ['Financial Products', 'Risk Coverage', 'Advisory'];
    customers = ['Individuals', 'Businesses', 'Institutions', 'Government'];
  } else if (sector.includes('health')) {
    inputs = ['Medical Supplies', 'Equipment', 'Professionals'];
    outputs = ['Patient Care', 'Diagnostics', 'Treatment'];
    customers = ['Patients', 'Insurers', 'Government', 'Employers'];
  } else if (sector.includes('information')) {
    inputs = ['Content', 'Technology', 'Talent'];
    outputs = ['Information Products', 'Software', 'Media'];
    customers = ['Businesses', 'Consumers', 'Government', 'Education'];
  } else {
    inputs = ['Resources', 'Expertise', 'Technology'];
    outputs = ['Products', 'Services', 'Solutions'];
    customers = ['Businesses', 'Consumers', 'Government', 'Institutions'];
  }

  return `\`\`\`mermaid
graph LR
    subgraph Inputs["Inputs"]
        ${inputs.map((inp, i) => `I${i + 1}["${inp}"]`).join('\n        ')}
    end

    subgraph Primary["Primary Activities"]
        A1["Inbound Logistics"]
        A2["Core Operations"]
        A3["Quality Assurance"]
        A4["Outbound/Delivery"]
    end

    subgraph Outputs["Products/Services"]
        ${outputs.map((out, i) => `O${i + 1}["${out}"]`).join('\n        ')}
    end

    subgraph Customers["Markets"]
        ${customers.map((cust, i) => `C${i + 1}["${cust}"]`).join('\n        ')}
    end

    Inputs --> Primary --> Outputs --> Customers
\`\`\``;
}

// Generate MDX content for an industry
function generateMDXContent(industry: Industry, allIndustries: Industry[], children: Industry[], sectorName: string, sectorCode: string): string {
  const level = getNAICSLevel(industry.code);
  const parent = allIndustries.find(i => i.code === getParentCode(industry.code));

  let content = generateFrontmatter(industry) + '\n\n';
  content += `# ${industry.name}\n\n`;

  // Description/overview
  const description = industry.description || `Establishments primarily engaged in ${industry.name.toLowerCase()}.`;
  const firstSentence = description.split('.').filter(s => s.trim().length > 0)[0];
  content += `> ${firstSentence}.\n\n`;

  content += `## Overview\n\n`;
  content += `${industry.name} represents ${level === 'National Industry' ? 'a specialized segment' : 'an important category'} within the ${sectorName} sector (NAICS ${sectorCode}). `;
  content += `This ${level.toLowerCase()} encompasses establishments primarily engaged in ${industry.name.toLowerCase()}.\n\n`;

  if (industry.description && industry.description.length > 100) {
    content += `${industry.description}\n\n`;
  }

  // Hierarchy diagram
  content += `## Industry Hierarchy\n\n`;
  content += generateHierarchyDiagram(industry, allIndustries, sectorName, sectorCode) + '\n\n';

  // Key statistics
  content += `## Key Statistics\n\n`;
  content += `| Metric | Value |\n`;
  content += `|--------|-------|\n`;
  content += `| NAICS Code | ${industry.code} |\n`;
  content += `| Level | ${level} |\n`;
  if (parent) {
    content += `| Parent | [${parent.name}](../) |\n`;
  }
  content += `| Child Industries | ${children.length} |\n\n`;

  // Sub-industries table (if has children)
  if (children.length > 0) {
    content += `## Sub-Industries\n\n`;
    content += `| Industry | Code | Description |\n`;
    content += `|----------|------|-------------|\n`;
    children.forEach(child => {
      const childPath = child.code.length === 6 ? toPascalCase(child.name) + '.mdx' : toPascalCase(child.name) + '/';
      const shortDesc = (child.description || child.name).split('.')[0].slice(0, 80);
      content += `| [${child.name}](./${childPath}) | ${child.code} | ${shortDesc} |\n`;
    });
    content += '\n';
  }

  // Core business processes
  content += `## Core Business Processes\n\n`;
  content += generateProcessFlowchart(industry, sectorName) + '\n\n';

  // Value chain
  content += `## Industry Value Chain\n\n`;
  content += generateValueChain(industry, sectorName) + '\n\n';

  content += `---\n\n`;
  content += `*Source: NAICS ${industry.code} - ${industry.name}*\n`;

  return content;
}

// Sector definitions: map 2-digit code prefixes to sector name and folder name
// NAICS sectors with their canonical names
const SECTOR_DEFINITIONS: Record<string, { name: string; folder: string; codes: string[] }> = {
  '11': { name: 'Agriculture, Forestry, Fishing and Hunting', folder: 'Agriculture', codes: ['11'] },
  '21': { name: 'Mining, Quarrying, and Oil and Gas Extraction', folder: 'Mining', codes: ['21'] },
  '22': { name: 'Utilities', folder: 'Utilities', codes: ['22'] },
  '23': { name: 'Construction', folder: 'Construction', codes: ['23'] },
  '31-33': { name: 'Manufacturing', folder: 'Manufacturing', codes: ['31', '32', '33'] },
  '42': { name: 'Wholesale Trade', folder: 'Wholesale', codes: ['42'] },
  '44-45': { name: 'Retail Trade', folder: 'Retail', codes: ['44', '45'] },
  '48-49': { name: 'Transportation and Warehousing', folder: 'TransportationAndWarehousing', codes: ['48', '49'] },
  '51': { name: 'Information', folder: 'Information', codes: ['51'] },
  '52': { name: 'Finance and Insurance', folder: 'Finance', codes: ['52'] },
  '53': { name: 'Real Estate and Rental and Leasing', folder: 'RealEstate', codes: ['53'] },
  '54': { name: 'Professional, Scientific, and Technical Services', folder: 'TechnicalServices', codes: ['54'] },
  '55': { name: 'Management of Companies and Enterprises', folder: 'Management', codes: ['55'] },
  '56': { name: 'Administrative and Support and Waste Management and Remediation Services', folder: 'Administrative', codes: ['56'] },
  '61': { name: 'Educational Services', folder: 'Education', codes: ['61'] },
  '62': { name: 'Health Care and Social Assistance', folder: 'Healthcare', codes: ['62'] },
  '71': { name: 'Arts, Entertainment, and Recreation', folder: 'Entertainment', codes: ['71'] },
  '72': { name: 'Accommodation and Food Services', folder: 'Accommodation', codes: ['72'] },
  '81': { name: 'Other Services (except Public Administration)', folder: 'OtherServices', codes: ['81'] },
  '92': { name: 'Public Administration', folder: 'PublicAdministration', codes: ['92'] },
};

// Map a code's first 2 digits to its sector key
function getSectorKey(code: string): string | null {
  const prefix = code.slice(0, 2);
  for (const [key, def] of Object.entries(SECTOR_DEFINITIONS)) {
    if (def.codes.includes(prefix)) return key;
  }
  return null;
}

// Build tree structure for a sector
interface IndustryNode {
  industry: Industry;
  children: IndustryNode[];
  path: string;
}

function buildSectorTree(sectorIndustries: Industry[], baseFolderName: string): IndustryNode[] {
  // Deduplicate by code - take the first (or longest name) entry per code
  const byCode = new Map<string, Industry>();
  for (const ind of sectorIndustries) {
    if (!byCode.has(ind.code) || ind.name.length > byCode.get(ind.code)!.name.length) {
      byCode.set(ind.code, ind);
    }
  }
  const deduped = Array.from(byCode.values());

  // Find subsectors (3-digit codes)
  const subsectors = deduped.filter(i => i.code.length === 3);

  function buildNode(industry: Industry, basePath: string): IndustryNode {
    const folderName = toPascalCase(industry.name);
    const nodePath = path.join(basePath, folderName);

    const children = deduped
      .filter(i => i.code.length === industry.code.length + 1 && i.code.startsWith(industry.code))
      .map(child => buildNode(child, nodePath));

    return { industry, children, path: nodePath };
  }

  return subsectors.map(sub => buildNode(sub, baseFolderName));
}

let filesCreated = 0;
let filesSkipped = 0;

function writeMDXFile(filePath: string, content: string) {
  if (fs.existsSync(filePath)) {
    filesSkipped++;
    return;
  }
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content);
  filesCreated++;
  if (filesCreated % 100 === 0) {
    console.log(`  Created ${filesCreated} files so far...`);
  }
}

function processNode(node: IndustryNode, allSectorIndustries: Industry[], baseDir: string, sectorName: string, sectorCode: string) {
  const fullPath = path.join(baseDir, node.path);
  const directChildren = node.children.map(c => c.industry);
  const content = generateMDXContent(node.industry, allSectorIndustries, directChildren, sectorName, sectorCode);

  if (node.industry.code.length === 6 || node.children.length === 0) {
    writeMDXFile(`${fullPath}.mdx`, content);
  } else {
    writeMDXFile(path.join(fullPath, 'index.mdx'), content);
    for (const child of node.children) {
      processNode(child, allSectorIndustries, baseDir, sectorName, sectorCode);
    }
  }
}

async function main() {
  const industriesPath = path.resolve(__dirname, '../.data/Industries.tsv');
  const outputDir = path.resolve(__dirname, '../industries');

  console.log('Parsing Industries.tsv...');
  const allIndustries = parseTSV(industriesPath);
  const naicsIndustries = allIndustries.filter(i => i.sourceType === 'NAICS');
  console.log(`Found ${naicsIndustries.length} NAICS industries total`);

  // Process each sector
  for (const [sectorKey, sectorDef] of Object.entries(SECTOR_DEFINITIONS)) {
    console.log(`\nProcessing sector: ${sectorDef.name} (${sectorKey})...`);

    const sectorIndustries = naicsIndustries.filter(ind =>
      sectorDef.codes.some(prefix => ind.code.startsWith(prefix))
    );

    if (sectorIndustries.length === 0) {
      console.log(`  No industries found, skipping.`);
      continue;
    }

    console.log(`  Found ${sectorIndustries.length} industries`);

    // Deduplicate
    const byCode = new Map<string, Industry>();
    for (const ind of sectorIndustries) {
      if (!byCode.has(ind.code) || ind.name.length > byCode.get(ind.code)!.name.length) {
        byCode.set(ind.code, ind);
      }
    }
    const deduped = Array.from(byCode.values());

    // Create sector-level index
    const subsectors = deduped.filter(i => i.code.length === 3);
    const sectorEntry: Industry = {
      ns: 'industries.org.ai',
      type: 'Industry',
      id: toPascalCase(sectorDef.name),
      name: sectorDef.name,
      description: `The ${sectorDef.name} sector encompasses a broad range of establishments classified under NAICS ${sectorKey}.`,
      code: sectorKey,
      shortName: sectorDef.folder.toLowerCase(),
      sourceType: 'NAICS',
      level: 1
    };

    // Use description from a matching 2-digit entry if available
    const sectorFromData = deduped.find(i => i.code.length === 2);
    if (sectorFromData && sectorFromData.description) {
      sectorEntry.description = sectorFromData.description;
    }

    const sectorContent = generateMDXContent(sectorEntry, deduped, subsectors, sectorDef.name, sectorKey);
    writeMDXFile(path.join(outputDir, sectorDef.folder, 'index.mdx'), sectorContent);

    // Build tree and process
    const tree = buildSectorTree(sectorIndustries, sectorDef.folder);
    for (const node of tree) {
      processNode(node, deduped, outputDir, sectorDef.name, sectorKey);
    }
  }

  console.log(`\n========================================`);
  console.log(`Done! Files created: ${filesCreated}`);
  console.log(`Files skipped (already exist): ${filesSkipped}`);
  console.log(`========================================`);
}

main().catch(console.error);
