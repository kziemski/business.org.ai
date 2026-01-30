/**
 * Generate MDX files for industries in Industries.tsv that don't yet have MDX files.
 *
 * The original generate-all-industries-mdx.ts missed ~1,400+ industries because:
 * 1. It deduplicates by NAICS code, dropping alternate-name entries (e.g., code 1111
 *    has both "Oilseed" and "GrainFarming" but only one was kept)
 * 2. SIC-sourced industries (955 records) were never processed
 * 3. Tree-building from subsectors missed some edge cases in path resolution
 *
 * This script takes a different approach: scan existing MDX files for their `id` fields,
 * then generate files for any TSV record whose id is not already present.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { execSync } from 'child_process';

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

// ─── Parse TSV ───────────────────────────────────────────────────────────────

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
      obj.level = parseInt(obj.level) || 0;
      return obj as Industry;
    });
}

// ─── Scan existing MDX files ─────────────────────────────────────────────────

function scanExistingIds(industriesDir: string): { ids: Set<string>; codeToPath: Map<string, string>; idToPath: Map<string, string> } {
  const ids = new Set<string>();
  const codeToPath = new Map<string, string>();
  const idToPath = new Map<string, string>();

  // Use find to get all mdx files
  let files: string[];
  try {
    const output = execSync(`find "${industriesDir}" -name "*.mdx" -type f`, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
    files = output.trim().split('\n').filter(Boolean);
  } catch {
    files = [];
  }

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) continue;

    const fm = frontmatterMatch[1];
    const idMatch = fm.match(/^id:\s*(.+)$/m);
    const codeMatch = fm.match(/^code:\s*"?([^"\n]+)"?$/m);

    if (idMatch) {
      const id = idMatch[1].trim();
      ids.add(id);
      idToPath.set(id, filePath);
    }
    if (codeMatch) {
      const code = codeMatch[1].trim();
      codeToPath.set(code, filePath);
    }
  }

  return { ids, codeToPath, idToPath };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toPascalCase(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 0)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

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

function getParentCode(code: string): string | null {
  if (code.length <= 2) return null;
  return code.slice(0, -1);
}

// Sector definitions (same as original script)
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

// SIC major group to NAICS sector mapping (SIC codes are 4-digit, first 2 = major group)
const SIC_TO_SECTOR: Record<string, string> = {
  '01': '11', '02': '11', '07': '11', '08': '11', '09': '11', // Agriculture
  '10': '21', '11': '21', '12': '21', '13': '21', '14': '21', // Mining
  '15': '23', '16': '23', '17': '23', // Construction
  '20': '31-33', '21': '31-33', '22': '31-33', '23': '31-33', '24': '31-33',
  '25': '31-33', '26': '31-33', '27': '31-33', '28': '31-33', '29': '31-33',
  '30': '31-33', '31': '31-33', '32': '31-33', '33': '31-33', '34': '31-33',
  '35': '31-33', '36': '31-33', '37': '31-33', '38': '31-33', '39': '31-33',
  '40': '48-49', '41': '48-49', '42': '48-49', '43': '48-49', '44': '48-49',
  '45': '48-49', '46': '48-49', '47': '48-49',
  '48': '51', '49': '22', // Communications -> Information, Utilities
  '50': '42', '51': '42', // Wholesale
  '52': '44-45', '53': '44-45', '54': '44-45', '55': '44-45', '56': '44-45',
  '57': '44-45', '58': '72', '59': '44-45', // Retail + Food services
  '60': '52', '61': '52', '62': '52', '63': '52', '64': '52', '65': '53', '67': '52',
  '70': '72', '72': '81', '73': '56', '75': '81', '76': '81', '78': '71', '79': '71',
  '80': '62', '81': '54', '82': '61', '83': '62', '84': '81',
  '86': '81', '87': '54', '88': '81', '89': '54',
  '91': '92', '92': '92', '93': '92', '94': '92', '95': '92', '96': '92', '97': '92', '99': '92',
};

function getSectorForCode(code: string, sourceType: string): { sectorKey: string; sectorDef: typeof SECTOR_DEFINITIONS[string] } | null {
  if (sourceType === 'NAICS') {
    const prefix = code.slice(0, 2);
    for (const [key, def] of Object.entries(SECTOR_DEFINITIONS)) {
      if (def.codes.includes(prefix)) return { sectorKey: key, sectorDef: def };
    }
  } else if (sourceType === 'SIC') {
    const majorGroup = code.slice(0, 2);
    const naicsSector = SIC_TO_SECTOR[majorGroup];
    if (naicsSector && SECTOR_DEFINITIONS[naicsSector]) {
      return { sectorKey: naicsSector, sectorDef: SECTOR_DEFINITIONS[naicsSector] };
    }
  }
  return null;
}

// ─── Path resolution ─────────────────────────────────────────────────────────

/**
 * Determine the folder path for an industry by looking at its code's parent chain
 * and finding existing MDX files for ancestors.
 */
function resolveIndustryPath(
  industry: Industry,
  allIndustries: Industry[],
  codeToPath: Map<string, string>,
  industriesDir: string,
): string | null {
  const sectorInfo = getSectorForCode(industry.code, industry.sourceType);
  if (!sectorInfo) return null;

  const sectorFolder = path.join(industriesDir, sectorInfo.sectorDef.folder);
  const industryFileName = toPascalCase(industry.name);

  if (industry.sourceType === 'SIC') {
    // SIC industries go into a SIC subfolder under the sector
    const sicFolder = path.join(sectorFolder, 'SIC');
    return path.join(sicFolder, `${industryFileName}.mdx`);
  }

  // NAICS: walk up the parent code chain to find existing ancestors
  const code = industry.code;

  // For sector-level (2-digit codes), it's just the sector index
  if (code.length <= 2) {
    return path.join(sectorFolder, 'index.mdx');
  }

  // Try to find parent path from existing files
  const ancestorCodes: string[] = [];
  let c = code;
  while (c.length > 2) {
    c = c.slice(0, -1);
    ancestorCodes.unshift(c);
  }

  // Build path by finding known ancestors or inferring from other industries with same code prefix
  let currentPath = sectorFolder;

  for (const ancestorCode of ancestorCodes) {
    if (ancestorCode.length <= 2) continue;

    const existingPath = codeToPath.get(ancestorCode);
    if (existingPath) {
      // Use the directory of the existing file
      if (existingPath.endsWith('index.mdx')) {
        currentPath = path.dirname(existingPath);
      } else {
        // It's a leaf file like Foo.mdx - the "folder" would be sibling level
        currentPath = path.dirname(existingPath);
        // But if this ancestor has children, it should be a folder
        // Check if a folder version exists
        const folderName = path.basename(existingPath, '.mdx');
        const possibleFolder = path.join(path.dirname(existingPath), folderName);
        if (fs.existsSync(possibleFolder)) {
          currentPath = possibleFolder;
        }
      }
    } else {
      // No existing file for this ancestor code. Look up the industry name to build a folder.
      const ancestor = allIndustries.find(i => i.code === ancestorCode && i.sourceType === 'NAICS');
      if (ancestor) {
        currentPath = path.join(currentPath, toPascalCase(ancestor.name));
      }
    }
  }

  // Determine if this industry should be a folder/index.mdx or a leaf .mdx
  const hasChildren = allIndustries.some(i =>
    i.code.length === code.length + 1 &&
    i.code.startsWith(code) &&
    i.sourceType === 'NAICS'
  );

  if (hasChildren || code.length < 5) {
    return path.join(currentPath, industryFileName, 'index.mdx');
  } else {
    return path.join(currentPath, `${industryFileName}.mdx`);
  }
}

// ─── Content generation ──────────────────────────────────────────────────────

function generateProcessFlowchart(sectorName: string): string {
  const sector = sectorName.toLowerCase();

  let operating: string[], support: string[];

  if (sector.includes('agriculture') || sector.includes('farming') || sector.includes('forestry')) {
    operating = ['Planning', 'Planting/Stocking', 'Growing/Raising', 'Harvesting', 'Processing'];
    support = ['Equipment Maintenance', 'Supply Management', 'Quality Control', 'Logistics'];
  } else if (sector.includes('mining') || sector.includes('oil') || sector.includes('quarry')) {
    operating = ['Exploration', 'Site Development', 'Extraction', 'Processing', 'Reclamation'];
    support = ['Safety Systems', 'Equipment Maintenance', 'Environmental Compliance', 'Logistics'];
  } else if (sector.includes('utilities')) {
    operating = ['Generation/Collection', 'Transmission', 'Distribution', 'Metering', 'Customer Service'];
    support = ['Infrastructure Maintenance', 'Safety Systems', 'Regulatory Compliance', 'IT Systems'];
  } else if (sector.includes('construction')) {
    operating = ['Design/Planning', 'Site Preparation', 'Construction', 'Inspection', 'Completion'];
    support = ['Project Management', 'Safety Systems', 'Procurement', 'Quality Assurance'];
  } else if (sector.includes('manufacturing')) {
    operating = ['Raw Material Prep', 'Production', 'Assembly', 'Quality Control', 'Packaging'];
    support = ['Equipment Maintenance', 'Inventory Mgmt', 'Safety Systems', 'Logistics'];
  } else if (sector.includes('wholesale') || sector.includes('retail')) {
    operating = ['Procurement', 'Warehousing', 'Merchandising', 'Sales', 'Distribution'];
    support = ['Inventory Mgmt', 'Marketing', 'Customer Service', 'IT Systems'];
  } else if (sector.includes('transportation') || sector.includes('warehousing')) {
    operating = ['Receiving', 'Routing/Planning', 'Transport/Storage', 'Delivery', 'Tracking'];
    support = ['Fleet Management', 'Safety Systems', 'Compliance', 'IT Systems'];
  } else if (sector.includes('information')) {
    operating = ['Content Creation', 'Production', 'Distribution', 'Customer Access', 'Support'];
    support = ['Technology Mgmt', 'Rights Management', 'Marketing', 'Analytics'];
  } else if (sector.includes('finance') || sector.includes('insurance')) {
    operating = ['Client Acquisition', 'Underwriting/Analysis', 'Processing', 'Service Delivery', 'Reporting'];
    support = ['Risk Management', 'Compliance', 'IT Security', 'Customer Relations'];
  } else if (sector.includes('real estate') || sector.includes('rental') || sector.includes('leasing')) {
    operating = ['Acquisition', 'Marketing', 'Leasing/Sales', 'Property Management', 'Maintenance'];
    support = ['Financial Management', 'Legal Compliance', 'Tenant Relations', 'Market Analysis'];
  } else if (sector.includes('professional') || sector.includes('scientific') || sector.includes('technical')) {
    operating = ['Client Engagement', 'Research/Analysis', 'Solution Development', 'Delivery', 'Review'];
    support = ['Knowledge Mgmt', 'Quality Assurance', 'Business Development', 'HR/Training'];
  } else if (sector.includes('management') || sector.includes('enterprise')) {
    operating = ['Strategic Planning', 'Resource Allocation', 'Performance Mgmt', 'Reporting', 'Optimization'];
    support = ['Finance', 'Legal', 'HR', 'IT'];
  } else if (sector.includes('administrative') || sector.includes('support') || sector.includes('waste')) {
    operating = ['Service Design', 'Resource Allocation', 'Service Delivery', 'Quality Check', 'Reporting'];
    support = ['Staff Management', 'Compliance', 'Client Relations', 'Technology'];
  } else if (sector.includes('education')) {
    operating = ['Curriculum Design', 'Enrollment', 'Instruction', 'Assessment', 'Certification'];
    support = ['Administration', 'Student Services', 'Facilities Mgmt', 'Technology'];
  } else if (sector.includes('health') || sector.includes('social')) {
    operating = ['Patient/Client Intake', 'Assessment', 'Treatment/Service', 'Follow-up', 'Discharge'];
    support = ['Compliance', 'Records Mgmt', 'Billing', 'Quality Assurance'];
  } else if (sector.includes('arts') || sector.includes('entertainment') || sector.includes('recreation')) {
    operating = ['Content/Event Planning', 'Production', 'Marketing', 'Delivery', 'Guest Services'];
    support = ['Venue/Facility Mgmt', 'Ticketing', 'Safety', 'Talent Management'];
  } else if (sector.includes('accommodation') || sector.includes('food service')) {
    operating = ['Reservation/Booking', 'Guest Check-in', 'Service Delivery', 'Quality Assurance', 'Check-out'];
    support = ['Housekeeping', 'Maintenance', 'Marketing', 'Revenue Mgmt'];
  } else if (sector.includes('public administration')) {
    operating = ['Policy Development', 'Program Design', 'Implementation', 'Monitoring', 'Evaluation'];
    support = ['Budget Mgmt', 'HR', 'Legal', 'IT/Records'];
  } else {
    operating = ['Planning', 'Resource Allocation', 'Operations', 'Quality Control', 'Delivery'];
    support = ['Administration', 'Compliance', 'Technology', 'Customer Service'];
  }

  let flowchart = '```mermaid\nflowchart LR\n    subgraph Operating["Operating Processes"]\n';
  operating.forEach((p, i) => {
    flowchart += `        O${i + 1}["${p}"]\n`;
  });
  flowchart += '    end\n\n    subgraph Support["Support Processes"]\n';
  support.forEach((p, i) => {
    flowchart += `        S${i + 1}["${p}"]\n`;
  });
  flowchart += '    end\n\n';
  for (let i = 0; i < operating.length - 1; i++) {
    flowchart += `    O${i + 1} --> O${i + 2}\n`;
  }
  flowchart += `    S1 -.-> O2\n`;
  flowchart += `    S2 -.-> O3\n`;
  flowchart += '```';
  return flowchart;
}

function generateValueChain(sectorName: string): string {
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

function generateHierarchyDiagram(industry: Industry, allIndustries: Industry[], sectorName: string, sectorCode: string): string {
  const code = industry.code;
  let diagram = '```mermaid\ngraph TD\n';

  const sectorId = `S${sectorCode.replace('-', '')}`;
  diagram += `    ${sectorId}["${sectorCode}: ${sectorName}"]\n`;

  // Find ancestors
  const ancestors: Industry[] = [];
  let currentCode = code;
  while (currentCode.length > 2) {
    const parentCode = getParentCode(currentCode);
    if (!parentCode || parentCode.length <= 2) break;
    const parent = allIndustries.find(i => i.code === parentCode);
    if (parent) ancestors.unshift(parent);
    currentCode = parentCode;
  }

  let prevId = sectorId;
  for (const ancestor of ancestors) {
    const nodeId = `N${ancestor.code}`;
    const shortName = ancestor.name.length > 40 ? ancestor.name.slice(0, 37) + '...' : ancestor.name;
    diagram += `    ${prevId} --> ${nodeId}["${ancestor.code}: ${shortName}"]\n`;
    prevId = nodeId;
  }

  const currentId = `N${code}`;
  const currentShortName = industry.name.length > 40 ? industry.name.slice(0, 37) + '...' : industry.name;
  diagram += `    ${prevId} --> ${currentId}["${code}: ${currentShortName}"]\n`;
  diagram += `    style ${currentId} fill:#f96,stroke:#333,stroke-width:2px\n`;

  // Children
  const children = allIndustries.filter(i =>
    i.code.startsWith(code) &&
    i.code.length === code.length + 1
  ).slice(0, 5);

  for (const child of children) {
    const childId = `N${child.code}`;
    const childShortName = child.name.length > 35 ? child.name.slice(0, 32) + '...' : child.name;
    diagram += `    ${currentId} --> ${childId}["${child.code}: ${childShortName}"]\n`;
  }

  const totalChildren = allIndustries.filter(i =>
    i.code.startsWith(code) &&
    i.code.length === code.length + 1
  ).length;
  if (totalChildren > 5) {
    diagram += `    ${currentId} --> more["... +${totalChildren - 5} more"]\n`;
  }

  diagram += '```';
  return diagram;
}

function generateMDXContent(
  industry: Industry,
  allIndustries: Industry[],
  sectorName: string,
  sectorCode: string,
): string {
  const level = industry.sourceType === 'SIC' ? `SIC (${industry.code})` : getNAICSLevel(industry.code);
  const code = industry.code;

  const children = allIndustries.filter(i =>
    i.code.startsWith(code) &&
    i.code.length === code.length + 1 &&
    i.sourceType === industry.sourceType
  );

  const parent = allIndustries.find(i =>
    i.code === getParentCode(code) &&
    i.sourceType === industry.sourceType
  );

  // Frontmatter
  let content = `---
id: ${industry.id}
name: "${industry.name}"
code: "${industry.code}"
type: Industry
level: ${level}
status: complete
---

`;

  // Title and overview
  content += `# ${industry.name}\n\n`;

  const description = industry.description || `Establishments primarily engaged in ${industry.name.toLowerCase()}.`;
  const firstSentence = description.split('.').filter(s => s.trim().length > 0)[0];
  content += `> ${firstSentence}.\n\n`;

  content += `## Overview\n\n`;
  content += `${industry.name} represents ${level === 'National Industry' ? 'a specialized segment' : 'an important category'} within the ${sectorName} sector`;
  content += industry.sourceType === 'SIC' ? ` (SIC ${code}).\n\n` : ` (NAICS ${sectorCode}).\n\n`;

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
  content += `| ${industry.sourceType} Code | ${code} |\n`;
  content += `| Level | ${level} |\n`;
  if (parent) {
    content += `| Parent | [${parent.name}](../) |\n`;
  }
  content += `| Child Industries | ${children.length} |\n\n`;

  // Sub-industries table
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

  // Related occupations placeholder
  content += `## Related Occupations\n\n`;
  content += `See the [occupations directory](/occupations) for roles commonly found in this industry.\n\n`;

  // Process flowchart
  content += `## Core Business Processes\n\n`;
  content += generateProcessFlowchart(sectorName) + '\n\n';

  // Value chain
  content += `## Industry Value Chain\n\n`;
  content += generateValueChain(sectorName) + '\n\n';

  content += `---\n\n`;
  content += `*Source: ${industry.sourceType} ${code} - ${industry.name}*\n`;

  return content;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const industriesDir = path.resolve(__dirname, '../industries');
  const tsvPath = path.resolve(__dirname, '../.data/Industries.tsv');

  console.log('Parsing Industries.tsv...');
  const allIndustries = parseTSV(tsvPath);
  console.log(`Total records in TSV: ${allIndustries.length}`);

  console.log('Scanning existing MDX files...');
  const { ids: existingIds, codeToPath, idToPath } = scanExistingIds(industriesDir);
  console.log(`Existing MDX files with IDs: ${existingIds.size}`);

  // Find missing industries
  const missing = allIndustries.filter(ind => !existingIds.has(ind.id));
  console.log(`Missing industries: ${missing.length}`);

  // Diagnostic: show a few examples of why they were missed
  console.log('\n--- Diagnostic: Sample missing industries ---');
  const sampleMissing = missing.slice(0, 10);
  for (const ind of sampleMissing) {
    const sectorInfo = getSectorForCode(ind.code, ind.sourceType);
    const duplicateCode = allIndustries.filter(i => i.code === ind.code);
    console.log(`  ID: ${ind.id}, Code: ${ind.code}, Source: ${ind.sourceType}, Sector: ${sectorInfo?.sectorDef.folder || 'NONE'}, Same-code entries: ${duplicateCode.length} [${duplicateCode.map(d => d.id).join(', ')}]`);
  }
  console.log('---\n');

  let filesCreated = 0;
  let filesSkipped = 0;
  let filesErrored = 0;
  const createdPaths: string[] = [];

  for (const industry of missing) {
    const sectorInfo = getSectorForCode(industry.code, industry.sourceType);
    if (!sectorInfo) {
      filesErrored++;
      continue;
    }

    const filePath = resolveIndustryPath(industry, allIndustries, codeToPath, industriesDir);
    if (!filePath) {
      filesErrored++;
      continue;
    }

    if (fs.existsSync(filePath)) {
      filesSkipped++;
      continue;
    }

    const content = generateMDXContent(
      industry,
      allIndustries,
      sectorInfo.sectorDef.name,
      sectorInfo.sectorKey,
    );

    const dir = path.dirname(filePath);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, content);
    filesCreated++;
    createdPaths.push(filePath);

    // Also register in codeToPath so subsequent siblings can find this
    codeToPath.set(industry.code, filePath);

    if (filesCreated % 100 === 0) {
      console.log(`  Created ${filesCreated} files so far...`);
    }
  }

  console.log(`\n========================================`);
  console.log(`Done!`);
  console.log(`  Files created:  ${filesCreated}`);
  console.log(`  Files skipped:  ${filesSkipped} (already exist at target path)`);
  console.log(`  Files errored:  ${filesErrored} (no sector mapping)`);
  console.log(`  Previously existing: ${existingIds.size}`);
  console.log(`  Total coverage: ${existingIds.size + filesCreated} / ${allIndustries.length}`);
  console.log(`========================================`);

  if (createdPaths.length > 0 && createdPaths.length <= 20) {
    console.log('\nCreated files:');
    createdPaths.forEach(p => console.log(`  ${p}`));
  } else if (createdPaths.length > 20) {
    console.log(`\nFirst 20 created files:`);
    createdPaths.slice(0, 20).forEach(p => console.log(`  ${p}`));
    console.log(`  ... and ${createdPaths.length - 20} more`);
  }
}

main().catch(console.error);
