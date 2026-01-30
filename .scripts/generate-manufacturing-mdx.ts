/**
 * Generate MDX files for all Manufacturing industries (NAICS 31-33)
 *
 * APPROACH DOCUMENTATION:
 * =======================
 *
 * This script generates a hierarchical folder structure for all Manufacturing industries
 * based on the NAICS classification system. The structure follows these principles:
 *
 * 1. FOLDER STRUCTURE:
 *    - Manufacturing/ (Sector 31-33)
 *      - index.mdx (Sector overview)
 *      - FoodManufacturing/ (Subsector 311)
 *        - index.mdx (Subsector overview)
 *        - AnimalFoodManufacturing/ (Industry Group 3111)
 *          - index.mdx (Industry Group overview)
 *          - DogAndCatFoodManufacturing.mdx (National Industry 311111)
 *          - OtherAnimalFoodManufacturing.mdx (National Industry 311119)
 *
 * 2. NAMING CONVENTIONS:
 *    - Folders use PascalCase without redundant "Manufacturing" suffix when clear from context
 *    - Files for leaf nodes (6-digit national industries) use PascalCase .mdx
 *    - Each level has an index.mdx for that level's overview
 *
 * 3. CONTENT STRUCTURE:
 *    - YAML frontmatter with id, name, code, type, status
 *    - Mermaid hierarchy diagram showing NAICS position
 *    - Key statistics table
 *    - Related occupations
 *    - Core business processes with flowchart
 *    - Value chain diagram
 *    - Regulatory environment
 *    - Technology trends
 *
 * 4. HIERARCHY LEVELS:
 *    - Sector (2-digit): 31-33 Manufacturing
 *    - Subsector (3-digit): 311 Food Manufacturing
 *    - Industry Group (4-digit): 3111 Animal Food Manufacturing
 *    - Industry (5-digit): 31111 Dog and Cat Food Manufacturing
 *    - National Industry (6-digit): 311111 Dog and Cat Food Manufacturing
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

// Filter manufacturing industries (31, 32, 33)
function filterManufacturing(industries: Industry[]): Industry[] {
  return industries.filter(ind => {
    if (ind.sourceType !== 'NAICS') return false;
    const code = ind.code;
    return code.startsWith('31') || code.startsWith('32') || code.startsWith('33');
  });
}

// Determine NAICS level from code
function getNAICSLevel(code: string): string {
  switch(code.length) {
    case 2: return 'Sector';
    case 3: return 'Subsector';
    case 4: return 'Industry Group';
    case 5: return 'Industry';
    case 6: return 'National Industry';
    default: return 'Unknown';
  }
}

// Convert name to PascalCase folder/file name
function toPascalCase(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

// Create cleaner folder name (remove redundant Manufacturing suffix when appropriate)
function cleanFolderName(name: string, parentName: string = ''): string {
  let cleaned = toPascalCase(name);

  // Remove "Manufacturing" if parent already indicates it
  if (parentName.includes('Manufacturing') && cleaned.endsWith('Manufacturing')) {
    const withoutManufacturing = cleaned.slice(0, -13);
    if (withoutManufacturing.length > 3) {
      cleaned = withoutManufacturing;
    }
  }

  return cleaned;
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
function generateHierarchyDiagram(industry: Industry, allIndustries: Industry[]): string {
  const code = industry.code;
  const level = getNAICSLevel(code);

  let diagram = '```mermaid\ngraph TD\n';

  // Find ancestors
  const ancestors: Industry[] = [];
  let currentCode = code;

  while (currentCode.length > 2) {
    const parentCode = getParentCode(currentCode);
    if (!parentCode) break;

    const parent = allIndustries.find(i => i.code === parentCode);
    if (parent) {
      ancestors.unshift(parent);
    }
    currentCode = parentCode;
  }

  // Add Manufacturing sector at top
  diagram += `    S31["31-33: Manufacturing"]\n`;

  // Add ancestor chain
  let prevId = 'S31';
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
    i.code.length === code.length + 1 &&
    i.sourceType === 'NAICS'
  ).slice(0, 5);

  for (const child of children) {
    const childId = `N${child.code}`;
    const childShortName = child.name.length > 35 ? child.name.slice(0, 32) + '...' : child.name;
    diagram += `    ${currentId} --> ${childId}["${child.code}: ${childShortName}"]\n`;
  }

  if (children.length === 5) {
    const totalChildren = allIndustries.filter(i =>
      i.code.startsWith(code) &&
      i.code.length === code.length + 1 &&
      i.sourceType === 'NAICS'
    ).length;
    if (totalChildren > 5) {
      diagram += `    ${currentId} --> more["... +${totalChildren - 5} more"]\n`;
    }
  }

  diagram += '```';
  return diagram;
}

// Generate process flowchart based on industry type
function generateProcessFlowchart(industry: Industry): string {
  const name = industry.name.toLowerCase();

  // Customize based on industry type
  let processes: { operating: string[], support: string[] };

  if (name.includes('food')) {
    processes = {
      operating: ['Sourcing', 'Processing', 'Quality Control', 'Packaging', 'Distribution'],
      support: ['Supply Chain Mgmt', 'Food Safety', 'Regulatory Compliance', 'R&D']
    };
  } else if (name.includes('chemical') || name.includes('pharmaceutical')) {
    processes = {
      operating: ['R&D', 'Formulation', 'Production', 'Quality Assurance', 'Packaging'],
      support: ['Safety Management', 'Environmental Control', 'Regulatory Affairs', 'Supply Chain']
    };
  } else if (name.includes('metal') || name.includes('steel') || name.includes('iron')) {
    processes = {
      operating: ['Raw Material Prep', 'Smelting/Forging', 'Forming', 'Finishing', 'Quality Testing'],
      support: ['Equipment Maintenance', 'Safety Systems', 'Environmental Control', 'Logistics']
    };
  } else if (name.includes('electronic') || name.includes('computer') || name.includes('semiconductor')) {
    processes = {
      operating: ['Design', 'Fabrication', 'Assembly', 'Testing', 'Packaging'],
      support: ['Cleanroom Mgmt', 'Quality Systems', 'Supply Chain', 'R&D']
    };
  } else if (name.includes('vehicle') || name.includes('automotive') || name.includes('aircraft')) {
    processes = {
      operating: ['Design Engineering', 'Parts Manufacturing', 'Assembly', 'Quality Testing', 'Finishing'],
      support: ['Supply Chain', 'Tooling Mgmt', 'Safety Systems', 'Logistics']
    };
  } else if (name.includes('plastic') || name.includes('rubber')) {
    processes = {
      operating: ['Compound Prep', 'Molding/Extrusion', 'Finishing', 'Quality Control', 'Packaging'],
      support: ['Material Handling', 'Mold Maintenance', 'Quality Systems', 'Logistics']
    };
  } else if (name.includes('textile') || name.includes('apparel') || name.includes('fabric')) {
    processes = {
      operating: ['Material Prep', 'Weaving/Knitting', 'Dyeing/Finishing', 'Cutting', 'Assembly'],
      support: ['Design', 'Quality Control', 'Inventory Mgmt', 'Distribution']
    };
  } else if (name.includes('wood') || name.includes('furniture')) {
    processes = {
      operating: ['Material Selection', 'Cutting/Shaping', 'Assembly', 'Finishing', 'Packaging'],
      support: ['Design', 'Inventory Mgmt', 'Quality Control', 'Distribution']
    };
  } else if (name.includes('paper') || name.includes('printing')) {
    processes = {
      operating: ['Pulping/Prep', 'Forming', 'Finishing', 'Quality Control', 'Packaging'],
      support: ['Environmental Control', 'Equipment Maintenance', 'Inventory', 'Logistics']
    };
  } else {
    // Generic manufacturing
    processes = {
      operating: ['Raw Material Prep', 'Production', 'Assembly', 'Quality Control', 'Packaging'],
      support: ['Equipment Maintenance', 'Inventory Mgmt', 'Safety Systems', 'Logistics']
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

  // Connect operating processes
  for (let i = 0; i < processes.operating.length - 1; i++) {
    flowchart += `    O${i + 1} --> O${i + 2}\n`;
  }

  // Connect support to operating
  flowchart += `    S1 -.-> O2\n`;
  flowchart += `    S2 -.-> O3\n`;
  flowchart += '```';

  return flowchart;
}

// Generate value chain diagram
function generateValueChain(industry: Industry): string {
  const name = industry.name.toLowerCase();

  let inputs: string[], outputs: string[], customers: string[];

  if (name.includes('food')) {
    inputs = ['Agricultural Products', 'Packaging Materials', 'Processing Equipment'];
    outputs = ['Processed Foods', 'Beverages', 'Prepared Meals'];
    customers = ['Retailers', 'Food Service', 'Distributors', 'Export Markets'];
  } else if (name.includes('chemical') || name.includes('pharmaceutical')) {
    inputs = ['Raw Chemicals', 'Active Ingredients', 'Packaging'];
    outputs = ['Chemical Products', 'Medicines', 'Formulations'];
    customers = ['Healthcare', 'Industrial Users', 'Retailers', 'Research'];
  } else if (name.includes('metal') || name.includes('steel')) {
    inputs = ['Ores', 'Scrap Metal', 'Energy', 'Alloys'];
    outputs = ['Steel Products', 'Metal Components', 'Fabricated Parts'];
    customers = ['Construction', 'Automotive', 'Machinery', 'Aerospace'];
  } else if (name.includes('electronic') || name.includes('computer')) {
    inputs = ['Semiconductors', 'Components', 'Raw Materials'];
    outputs = ['Electronics', 'Computers', 'Components'];
    customers = ['OEMs', 'Retailers', 'Enterprise', 'Government'];
  } else if (name.includes('vehicle') || name.includes('automotive')) {
    inputs = ['Steel', 'Components', 'Electronics', 'Plastics'];
    outputs = ['Vehicles', 'Parts', 'Assemblies'];
    customers = ['Dealers', 'Fleet Operators', 'OEMs', 'Aftermarket'];
  } else {
    inputs = ['Raw Materials', 'Components', 'Equipment'];
    outputs = ['Finished Products', 'Components', 'Assemblies'];
    customers = ['Industrial Buyers', 'Retailers', 'Distributors', 'End Users'];
  }

  return `\`\`\`mermaid
graph LR
    subgraph Inputs["Inputs"]
        ${inputs.map((inp, i) => `I${i + 1}["${inp}"]`).join('\n        ')}
    end

    subgraph Primary["Primary Activities"]
        A1["Inbound Logistics"]
        A2["Manufacturing Operations"]
        A3["Quality Assurance"]
        A4["Outbound Logistics"]
    end

    subgraph Outputs["Products"]
        ${outputs.map((out, i) => `O${i + 1}["${out}"]`).join('\n        ')}
    end

    subgraph Customers["Markets"]
        ${customers.map((cust, i) => `C${i + 1}["${cust}"]`).join('\n        ')}
    end

    Inputs --> Primary --> Outputs --> Customers
\`\`\``;
}

// Generate related occupations
function generateOccupations(industry: Industry): string {
  const name = industry.name.toLowerCase();

  // Common manufacturing occupations plus industry-specific
  let occupations: { name: string, path: string, desc: string }[] = [
    { name: 'Industrial Production Managers', path: 'IndustrialProductionManagers', desc: 'Plan and coordinate production activities' },
    { name: 'First-Line Supervisors of Production Workers', path: 'FirstLineSupervisorsOfProductionAndOperatingWorkers', desc: 'Supervise production floor operations' },
    { name: 'Quality Control Inspectors', path: 'QualityControlInspectors', desc: 'Inspect products for defects and compliance' },
  ];

  if (name.includes('food')) {
    occupations.push(
      { name: 'Food Scientists and Technologists', path: 'FoodScientistsAndTechnologists', desc: 'Develop food products and processes' },
      { name: 'Food Batchmakers', path: 'FoodBatchmakers', desc: 'Set up and operate food processing equipment' }
    );
  } else if (name.includes('chemical') || name.includes('pharmaceutical')) {
    occupations.push(
      { name: 'Chemical Engineers', path: 'ChemicalEngineers', desc: 'Design and optimize chemical processes' },
      { name: 'Chemical Plant Operators', path: 'ChemicalPlantAndSystemOperators', desc: 'Control chemical process equipment' }
    );
  } else if (name.includes('metal') || name.includes('steel')) {
    occupations.push(
      { name: 'Metal Workers and Plastic Workers', path: 'MetalAndPlasticWorkers', desc: 'Shape and form metal products' },
      { name: 'Welders, Cutters, Solderers', path: 'WeldersCuttersSolderersAndBrazers', desc: 'Join metal parts' }
    );
  } else if (name.includes('electronic') || name.includes('computer')) {
    occupations.push(
      { name: 'Electrical and Electronics Engineers', path: 'ElectricalAndElectronicsEngineers', desc: 'Design electronic systems' },
      { name: 'Semiconductor Processing Technicians', path: 'SemiconductorProcessingTechnicians', desc: 'Operate semiconductor equipment' }
    );
  } else if (name.includes('machine')) {
    occupations.push(
      { name: 'Machinists', path: 'Machinists', desc: 'Set up and operate machine tools' },
      { name: 'CNC Machine Tool Programmers', path: 'ComputerNumericallyControlledMachineToolProgrammers', desc: 'Program CNC machines' }
    );
  }

  return occupations.map(occ =>
    `- [${occ.name}](/occupations/${occ.path}) - ${occ.desc}`
  ).join('\n');
}

// Generate regulatory environment text
function generateRegulatoryEnvironment(industry: Industry): string {
  const name = industry.name.toLowerCase();

  let regulations: string[] = [
    '**OSHA Regulations**: Workplace safety standards, machine guarding, hazard communication',
    '**EPA Requirements**: Air emissions, water discharge, hazardous waste management',
  ];

  if (name.includes('food') || name.includes('beverage')) {
    regulations.push(
      '**FDA Regulations**: Food safety (FSMA), labeling requirements, facility registration',
      '**USDA Inspection**: Meat, poultry, and egg products inspection',
      '**State Health Departments**: Local food safety requirements'
    );
  } else if (name.includes('pharmaceutical') || name.includes('medical')) {
    regulations.push(
      '**FDA Requirements**: GMP compliance, drug approval process, device regulations',
      '**DEA Registration**: Controlled substance manufacturing',
      '**State Pharmacy Boards**: State-level licensing requirements'
    );
  } else if (name.includes('chemical')) {
    regulations.push(
      '**TSCA Compliance**: Toxic Substances Control Act requirements',
      '**RCRA Requirements**: Hazardous waste management',
      '**DHS CFATS**: Chemical facility anti-terrorism standards'
    );
  } else if (name.includes('aerospace') || name.includes('defense')) {
    regulations.push(
      '**FAA Regulations**: Aviation safety and certification requirements',
      '**ITAR/EAR**: Export control regulations for defense articles',
      '**DoD Contracts**: Defense procurement requirements'
    );
  } else if (name.includes('automotive') || name.includes('vehicle')) {
    regulations.push(
      '**NHTSA Standards**: Motor vehicle safety standards (FMVSS)',
      '**EPA Emissions**: Vehicle emissions and fuel economy standards',
      '**State Regulations**: State-specific vehicle requirements'
    );
  }

  regulations.push('**State/Local Requirements**: Zoning, permits, and local environmental regulations');

  return regulations.join('\n- ');
}

// Generate technology trends
function generateTechnologyTrends(industry: Industry): string {
  const name = industry.name.toLowerCase();

  let trends: string[] = [
    '**Industry 4.0**: Connected manufacturing, IoT sensors, and real-time monitoring',
    '**Automation & Robotics**: Automated production lines and robotic assembly',
    '**Data Analytics**: Predictive maintenance, quality analytics, and process optimization',
  ];

  if (name.includes('food')) {
    trends.push(
      '**Food Safety Technology**: Blockchain traceability, rapid testing, and smart packaging',
      '**Sustainable Processing**: Energy-efficient equipment, waste reduction, and water recycling'
    );
  } else if (name.includes('chemical') || name.includes('pharmaceutical')) {
    trends.push(
      '**Continuous Manufacturing**: Flow chemistry and continuous processing',
      '**AI in Drug Discovery**: Machine learning for compound screening and optimization'
    );
  } else if (name.includes('electronic') || name.includes('semiconductor')) {
    trends.push(
      '**Advanced Packaging**: 3D packaging, chiplets, and heterogeneous integration',
      '**EUV Lithography**: Extreme ultraviolet lithography for smaller nodes'
    );
  } else if (name.includes('vehicle') || name.includes('automotive')) {
    trends.push(
      '**Electric Vehicle Manufacturing**: Battery production and EV assembly',
      '**Connected Manufacturing**: Digital twin and smart factory integration'
    );
  } else if (name.includes('metal') || name.includes('3d')) {
    trends.push(
      '**Additive Manufacturing**: 3D printing and metal additive production',
      '**Advanced Materials**: High-performance alloys and composites'
    );
  }

  trends.push(
    '**Sustainability**: Carbon reduction, circular economy, and green manufacturing',
    '**Digital Twin**: Virtual replicas for simulation and optimization'
  );

  return trends.map(t => `- ${t}`).join('\n');
}

// Generate MDX content for an industry
function generateMDXContent(industry: Industry, allIndustries: Industry[], children: Industry[]): string {
  const level = getNAICSLevel(industry.code);
  const parent = allIndustries.find(i => i.code === getParentCode(industry.code));

  let content = generateFrontmatter(industry) + '\n\n';
  content += `# ${industry.name}\n\n`;

  // Description/overview
  const description = industry.description || `Manufacturing establishments primarily engaged in ${industry.name.toLowerCase()}.`;
  content += `> ${description.split('.')[0]}.\n\n`;

  content += `## Overview\n\n`;
  content += `${industry.name} represents ${level === 'National Industry' ? 'a specialized segment' : 'an important category'} within the U.S. Manufacturing sector (NAICS 31-33). `;
  content += `This ${level.toLowerCase()} encompasses establishments primarily engaged in ${industry.name.toLowerCase()}.\n\n`;

  if (industry.description && industry.description.length > 100) {
    content += `${industry.description}\n\n`;
  }

  // Hierarchy diagram
  content += `## Industry Hierarchy\n\n`;
  content += generateHierarchyDiagram(industry, allIndustries) + '\n\n';

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

  // Related occupations
  content += `## Related Occupations\n\n`;
  content += generateOccupations(industry) + '\n\n';

  // Core business processes
  content += `## Core Business Processes\n\n`;
  content += generateProcessFlowchart(industry) + '\n\n';

  // Value chain
  content += `## Industry Value Chain\n\n`;
  content += generateValueChain(industry) + '\n\n';

  // Regulatory environment
  content += `## Regulatory Environment\n\n`;
  content += `Manufacturing operations in this industry are subject to various federal, state, and local regulations:\n\n`;
  content += `- ${generateRegulatoryEnvironment(industry)}\n\n`;

  // Technology & Innovation
  content += `## Technology & Innovation\n\n`;
  content += `The ${industry.name.toLowerCase()} industry is experiencing significant technological advancement:\n\n`;
  content += generateTechnologyTrends(industry) + '\n\n';

  content += `---\n\n`;
  content += `*Source: NAICS ${industry.code} - ${industry.name}*\n`;

  return content;
}

// Build the industry tree structure
interface IndustryNode {
  industry: Industry;
  children: IndustryNode[];
  path: string;
}

function buildIndustryTree(industries: Industry[]): IndustryNode[] {
  // Find all subsectors (3-digit codes)
  const subsectors = industries.filter(i => i.code.length === 3);

  function buildNode(industry: Industry, basePath: string): IndustryNode {
    const folderName = toPascalCase(industry.name);
    const nodePath = path.join(basePath, folderName);

    // Find direct children
    const children = industries
      .filter(i => {
        if (i.code.length !== industry.code.length + 1) return false;
        return i.code.startsWith(industry.code);
      })
      .map(child => buildNode(child, nodePath));

    return {
      industry,
      children,
      path: nodePath
    };
  }

  return subsectors.map(sub => buildNode(sub, 'Manufacturing'));
}

// Write MDX file
function writeMDXFile(filePath: string, content: string) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content);
  console.log(`Created: ${filePath}`);
}

// Process and create all files
function processIndustryNode(node: IndustryNode, allIndustries: Industry[], baseDir: string) {
  const fullPath = path.join(baseDir, node.path);

  // Get direct children for this industry
  const directChildren = node.children.map(c => c.industry);

  // Generate content
  const content = generateMDXContent(node.industry, allIndustries, directChildren);

  // Determine if this is a leaf node (no children or 6-digit code)
  if (node.industry.code.length === 6 || node.children.length === 0) {
    // Write as single file
    writeMDXFile(`${fullPath}.mdx`, content);
  } else {
    // Write as index.mdx in folder
    writeMDXFile(path.join(fullPath, 'index.mdx'), content);

    // Process children
    for (const child of node.children) {
      processIndustryNode(child, allIndustries, baseDir);
    }
  }
}

// Main function
async function main() {
  const industriesPath = path.resolve(__dirname, '../.data/Industries.tsv');
  const outputDir = path.resolve(__dirname, '../industries');

  console.log('Parsing Industries.tsv...');
  const allIndustries = parseTSV(industriesPath);

  console.log('Filtering manufacturing industries...');
  const manufacturing = filterManufacturing(allIndustries);
  console.log(`Found ${manufacturing.length} manufacturing industries`);

  // Create Manufacturing sector overview
  const manufacturingSector: Industry = {
    ns: 'industries.org.ai',
    type: 'Industry',
    id: 'Manufacturing',
    name: 'Manufacturing',
    description: 'The Manufacturing sector comprises establishments engaged in the mechanical, physical, or chemical transformation of materials, substances, or components into new products. Establishments in the Manufacturing sector are often described as plants, factories, or mills and characteristically use power-driven machines and materials-handling equipment. The assembly of component parts of manufactured products is considered manufacturing.',
    code: '31-33',
    shortName: 'mfg',
    sourceType: 'NAICS',
    level: 1
  };

  const subsectors = manufacturing.filter(i => i.code.length === 3);
  const sectorContent = generateMDXContent(manufacturingSector, manufacturing, subsectors);
  writeMDXFile(path.join(outputDir, 'Manufacturing', 'index.mdx'), sectorContent);

  // Build tree and process all nodes
  console.log('Building industry tree...');
  const tree = buildIndustryTree(manufacturing);

  console.log('Generating MDX files...');
  for (const node of tree) {
    processIndustryNode(node, manufacturing, outputDir);
  }

  console.log('Done!');
}

main().catch(console.error);
