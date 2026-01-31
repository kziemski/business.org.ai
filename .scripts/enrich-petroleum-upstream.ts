/**
 * Enriches petroleum upstream process files with:
 * 1. Process-specific occupations based on APQC category
 * 2. Process-relevant departments based on APQC category
 * 3. Industry variations section explaining E&P-specific approaches
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PETROLEUM_DIR = path.join(__dirname, '../processes/industries/petroleum-upstream')

// APQC Category to Occupation mappings for Petroleum Upstream
const categoryOccupations: Record<string, { occupations: string[]; paths: string[] }> = {
  // 1.0 - Develop Vision and Strategy
  '1': {
    occupations: [
      'Chief Executives',
      'General and Operations Managers',
      'Management Analysts',
      'Petroleum Engineers',
      'Geoscientists, Except Hydrologists and Geographers',
    ],
    paths: [
      '/occupations/Management/ChiefExecutives',
      '/occupations/Management/GeneralAndOperationsManagers',
      '/occupations/Business/ManagementAnalysts',
      '/occupations/Engineering/PetroleumEngineers',
      '/occupations/Science/GeoscientistsExceptHydrologistsAndGeographers',
    ],
  },
  // 2.0 - Design and Develop Products and Services
  '2': {
    occupations: [
      'Petroleum Engineers',
      'Geoscientists, Except Hydrologists and Geographers',
      'Architectural and Engineering Managers',
      'Chemical Engineers',
      'Project Management Specialists',
    ],
    paths: [
      '/occupations/Engineering/PetroleumEngineers',
      '/occupations/Science/GeoscientistsExceptHydrologistsAndGeographers',
      '/occupations/Management/ArchitecturalAndEngineeringManagers',
      '/occupations/Engineering/ChemicalEngineers',
      '/occupations/Business/ProjectManagementSpecialists',
    ],
  },
  // 3.0 - Market and Sell Products and Services (Exploration & Appraisal in Upstream)
  '3': {
    occupations: [
      'Geoscientists, Except Hydrologists and Geographers',
      'Petroleum Engineers',
      'Environmental Scientists and Specialists, Including Health',
      'Hydrologists',
      'Sales Managers',
    ],
    paths: [
      '/occupations/Science/GeoscientistsExceptHydrologistsAndGeographers',
      '/occupations/Engineering/PetroleumEngineers',
      '/occupations/Science/EnvironmentalScientistsAndSpecialists',
      '/occupations/Science/Hydrologists',
      '/occupations/Management/SalesManagers',
    ],
  },
  // 4.0 - Deliver Physical Products (Production Operations in Upstream)
  '4': {
    occupations: [
      'Rotary Drill Operators, Oil and Gas',
      'Derrick Operators, Oil and Gas',
      'Service Unit Operators, Oil and Gas',
      'Petroleum Pump System Operators, Refinery Operators, and Gaugers',
      'Industrial Production Managers',
    ],
    paths: [
      '/occupations/Production/RotaryDrillOperatorsOilAndGas',
      '/occupations/Production/DerrickOperatorsOilAndGas',
      '/occupations/Production/ServiceUnitOperatorsOilAndGas',
      '/occupations/Production/PetroleumPumpSystemOperatorsRefineryOperatorsAndGaugers',
      '/occupations/Management/IndustrialProductionManagers',
    ],
  },
  // 5.0 - Deliver Services (Field Services in Upstream)
  '5': {
    occupations: [
      'Petroleum Engineers',
      'Service Unit Operators, Oil and Gas',
      'Roustabouts, Oil and Gas',
      'Industrial Machinery Mechanics',
      'First-Line Supervisors of Mechanics, Installers, and Repairers',
    ],
    paths: [
      '/occupations/Engineering/PetroleumEngineers',
      '/occupations/Production/ServiceUnitOperatorsOilAndGas',
      '/occupations/Production/RoustaboutsOilAndGas',
      '/occupations/Installation/IndustrialMachineryMechanics',
      '/occupations/Management/FirstLineSupervisorsOfMechanicsInstallersAndRepairers',
    ],
  },
  // 6.0 - Manage Customer Service
  '6': {
    occupations: [
      'Customer Service Representatives',
      'Sales Representatives, Technical and Scientific Products',
      'Sales Managers',
      'General and Operations Managers',
      'Logisticians',
    ],
    paths: [
      '/occupations/Office/CustomerServiceRepresentatives',
      '/occupations/Sales/SalesRepresentativesTechnicalAndScientificProducts',
      '/occupations/Management/SalesManagers',
      '/occupations/Management/GeneralAndOperationsManagers',
      '/occupations/Business/Logisticians',
    ],
  },
  // 7.0 - Develop and Manage Human Capital
  '7': {
    occupations: [
      'Human Resources Managers',
      'Training and Development Specialists',
      'Compensation, Benefits, and Job Analysis Specialists',
      'Human Resources Specialists',
      'Occupational Health and Safety Specialists',
    ],
    paths: [
      '/occupations/Management/HumanResourcesManagers',
      '/occupations/Business/TrainingAndDevelopmentSpecialists',
      '/occupations/Business/CompensationBenefitsAndJobAnalysisSpecialists',
      '/occupations/Business/HumanResourcesSpecialists',
      '/occupations/HealthSafety/OccupationalHealthAndSafetySpecialists',
    ],
  },
  // 8.0 - Manage Information Technology
  '8': {
    occupations: [
      'Computer and Information Systems Managers',
      'Software Developers',
      'Database Administrators',
      'Network and Computer Systems Administrators',
      'Information Security Analysts',
    ],
    paths: [
      '/occupations/Management/ComputerAndInformationSystemsManagers',
      '/occupations/Technology/SoftwareDevelopers',
      '/occupations/Technology/DatabaseAdministrators',
      '/occupations/Technology/NetworkAndComputerSystemsAdministrators',
      '/occupations/Technology/InformationSecurityAnalysts',
    ],
  },
  // 9.0 - Manage Financial Resources
  '9': {
    occupations: [
      'Financial Managers',
      'Accountants and Auditors',
      'Financial and Investment Analysts',
      'Budget Analysts',
      'Treasurers and Controllers',
    ],
    paths: [
      '/occupations/Management/FinancialManagers',
      '/occupations/Business/AccountantsAndAuditors',
      '/occupations/Business/FinancialAndInvestmentAnalysts',
      '/occupations/Business/BudgetAnalysts',
      '/occupations/Management/TreasurersAndControllers',
    ],
  },
  // 10.0 - Acquire, Construct, and Manage Assets
  '10': {
    occupations: [
      'Construction Managers',
      'Petroleum Engineers',
      'Industrial Production Managers',
      'Facilities Managers',
      'Purchasing Managers',
    ],
    paths: [
      '/occupations/Management/ConstructionManagers',
      '/occupations/Engineering/PetroleumEngineers',
      '/occupations/Management/IndustrialProductionManagers',
      '/occupations/Management/FacilitiesManagers',
      '/occupations/Management/PurchasingManagers',
    ],
  },
  // 11.0 - Manage Enterprise Risk, Compliance, Remediation, Resiliency
  '11': {
    occupations: [
      'Compliance Managers',
      'Health and Safety Engineers, Except Mining Safety Engineers and Inspectors',
      'Occupational Health and Safety Specialists',
      'Environmental Compliance Inspectors',
      'Regulatory Affairs Managers',
    ],
    paths: [
      '/occupations/Management/ComplianceManagers',
      '/occupations/Engineering/HealthAndSafetyEngineersExceptMiningSafetyEngineersAndInspectors',
      '/occupations/HealthSafety/OccupationalHealthAndSafetySpecialists',
      '/occupations/Business/EnvironmentalComplianceInspectors',
      '/occupations/Management/RegulatoryAffairsManagers',
    ],
  },
  // 12.0 - Manage External Relationships
  '12': {
    occupations: [
      'Public Relations Managers',
      'Lawyers',
      'Chief Executives',
      'Community and Social Service Managers',
      'Environmental Scientists and Specialists, Including Health',
    ],
    paths: [
      '/occupations/Management/PublicRelationsManagers',
      '/occupations/Legal/Lawyers',
      '/occupations/Management/ChiefExecutives',
      '/occupations/Management/SocialAndCommunityServiceManagers',
      '/occupations/Science/EnvironmentalScientistsAndSpecialists',
    ],
  },
  // 13.0 - Develop and Manage Business Capabilities
  '13': {
    occupations: [
      'Management Analysts',
      'Business Operations Specialists, All Other',
      'Project Management Specialists',
      'Quality Control Systems Managers',
      'Industrial Engineers',
    ],
    paths: [
      '/occupations/Business/ManagementAnalysts',
      '/occupations/Business/BusinessOperationsSpecialists',
      '/occupations/Business/ProjectManagementSpecialists',
      '/occupations/Management/QualityControlSystemsManagers',
      '/occupations/Engineering/IndustrialEngineers',
    ],
  },
}

// APQC Category to Department mappings for Petroleum Upstream
const categoryDepartments: Record<string, { departments: string[]; paths: string[] }> = {
  '1': {
    departments: ['Executive', 'Strategy', 'Finance'],
    paths: ['/departments/Executive', '/departments/Strategy', '/departments/Finance'],
  },
  '2': {
    departments: ['Research', 'Technology', 'Product'],
    paths: ['/departments/Research', '/departments/Technology', '/departments/Product'],
  },
  '3': {
    departments: ['Exploration', 'Research', 'Operations'],
    paths: ['/departments/Research', '/departments/Operations', '/departments/Sales'],
  },
  '4': {
    departments: ['Operations', 'Production', 'SupplyChain'],
    paths: ['/departments/Operations', '/departments/SupplyChain', '/departments/Quality'],
  },
  '5': {
    departments: ['Operations', 'Support', 'Quality'],
    paths: ['/departments/Operations', '/departments/Support', '/departments/Quality'],
  },
  '6': {
    departments: ['Sales', 'Support', 'Operations'],
    paths: ['/departments/Sales', '/departments/Support', '/departments/Operations'],
  },
  '7': {
    departments: ['HR', 'Operations', 'Executive'],
    paths: ['/departments/HR', '/departments/Operations', '/departments/Executive'],
  },
  '8': {
    departments: ['Technology', 'Security', 'DataAnalytics'],
    paths: ['/departments/Technology', '/departments/Security', '/departments/DataAnalytics'],
  },
  '9': {
    departments: ['Finance', 'Executive', 'Operations'],
    paths: ['/departments/Finance', '/departments/Executive', '/departments/Operations'],
  },
  '10': {
    departments: ['Operations', 'Procurement', 'Finance'],
    paths: ['/departments/Operations', '/departments/Procurement', '/departments/Finance'],
  },
  '11': {
    departments: ['Legal', 'Operations', 'Executive'],
    paths: ['/departments/Legal', '/departments/Operations', '/departments/Executive'],
  },
  '12': {
    departments: ['Legal', 'Executive', 'Marketing'],
    paths: ['/departments/Legal', '/departments/Executive', '/departments/Marketing'],
  },
  '13': {
    departments: ['Strategy', 'Operations', 'Quality'],
    paths: ['/departments/Strategy', '/departments/Operations', '/departments/Quality'],
  },
}

// Industry Variations by APQC Category
const categoryIndustryVariations: Record<string, string> = {
  '1': `## Petroleum Upstream Industry Variations

In petroleum upstream (E&P) companies, vision and strategy development involves unique considerations:

- **Exploration Portfolio Management**: Strategic decisions balance exploration risk across geographic basins and play types, considering proved, probable, and possible reserves
- **Resource Nationalism**: Strategy must account for host country regulations, production sharing agreements (PSAs), and concession terms that vary significantly by jurisdiction
- **Commodity Price Volatility**: Long-term strategic planning incorporates oil and gas price scenarios, hedging strategies, and break-even economics for different asset classes
- **Joint Venture Governance**: Many upstream assets are held in joint ventures requiring alignment with partners on capital allocation, operatorship, and development sequencing
- **Energy Transition Planning**: Strategy increasingly addresses decarbonization pathways, carbon capture potential, and positioning in the evolving energy landscape
- **Reserves Replacement**: Strategic KPIs focus on reserve replacement ratios, finding and development costs (F&D), and organic vs. inorganic growth`,

  '2': `## Petroleum Upstream Industry Variations

In petroleum upstream operations, product and service development focuses on:

- **Reservoir Development Planning**: Field development plans (FDPs) optimize recovery factors through well placement, artificial lift selection, and enhanced oil recovery (EOR) techniques
- **Drilling Technology Innovation**: Development of drilling programs incorporating horizontal wells, multilateral completions, and managed pressure drilling for complex reservoirs
- **Production System Design**: Engineering of surface facilities, separation processes, and export infrastructure tailored to fluid properties and environmental conditions
- **Subsea Technology**: For offshore developments, design of subsea production systems, flow assurance solutions, and tieback architectures
- **Digital Oilfield Solutions**: Development of real-time reservoir monitoring, automated well control, and integrated operations centers
- **HSE-by-Design**: Safety and environmental considerations embedded in facility design from concept through commissioning`,

  '3': `## Petroleum Upstream Industry Variations

In petroleum upstream, market and sell activities center on exploration and appraisal:

- **Seismic Data Acquisition**: 2D/3D seismic surveys, ocean bottom nodes, and 4D monitoring programs to characterize subsurface structures
- **Geological and Geophysical Analysis**: Basin modeling, prospect generation, and volumetric estimation using deterministic and probabilistic methods
- **Appraisal Well Planning**: Delineation drilling programs to reduce uncertainty in reservoir extent, quality, and hydrocarbon contacts
- **Acreage Marketing**: Farm-in/farm-out negotiations, block licensing rounds, and asset portfolio optimization
- **Resource Certification**: Third-party reserves audits and SEC compliance for proved reserves reporting
- **Data Room Management**: Technical data packages for asset transactions and due diligence processes`,

  '4': `## Petroleum Upstream Industry Variations

In petroleum upstream, delivery of physical products involves hydrocarbon production:

- **Drilling Operations**: Management of rig fleets, directional drilling, casing programs, and cementing operations for development wells
- **Well Completions**: Perforation, stimulation (hydraulic fracturing, acidizing), and artificial lift installation
- **Production Operations**: Daily production optimization, well testing, and allocation between commingled streams
- **Reservoir Management**: Water/gas injection programs, pressure maintenance, and infill drilling to maximize recovery
- **Export and Marketing**: Crude oil lifting schedules, gas nominations, and pipeline/tanker logistics
- **Asset Integrity**: Inspection, maintenance, and repair programs for wells, facilities, and pipelines under harsh operating conditions`,

  '5': `## Petroleum Upstream Industry Variations

In petroleum upstream, service delivery encompasses field support operations:

- **Well Intervention Services**: Workover operations, coiled tubing, wireline services, and well stimulation
- **Production Enhancement**: Artificial lift optimization, chemical treatments, and sand control remediation
- **Facilities Maintenance**: Scheduled and unscheduled maintenance of processing plants, compression, and rotating equipment
- **Integrity Management**: Pipeline inspection, cathodic protection, and corrosion monitoring programs
- **Emergency Response**: Well control, spill response, and evacuation procedures for offshore and remote operations
- **Contractor Management**: Coordination of oilfield service companies, drilling contractors, and specialized vendors`,

  '6': `## Petroleum Upstream Industry Variations

In petroleum upstream, customer service relates to partner and stakeholder management:

- **Joint Venture Partner Relations**: Operating committee support, authorization for expenditure (AFE) processing, and cash call management
- **Government Relations**: Regulatory compliance reporting, royalty calculations, and license obligations
- **Offtaker Management**: Crude oil and gas sales agreements, quality specifications, and delivery scheduling
- **Community Engagement**: Local content requirements, community investment programs, and grievance mechanisms
- **Landowner Relations**: Surface access agreements, compensation, and ongoing communication for onshore operations
- **Investor Communications**: Quarterly production reports, reserves updates, and capital markets engagement`,

  '7': `## Petroleum Upstream Industry Variations

In petroleum upstream, human capital management addresses unique workforce needs:

- **Technical Competency Development**: Petroleum engineering, geoscience, and subsurface expertise development programs
- **Rotational Workforce Management**: Crew changes, rotation schedules, and fatigue management for offshore and remote locations
- **Safety Training and Certification**: Well control certification, HSE training, and emergency response competencies
- **Global Mobility**: Expatriate assignments, local national development, and cross-cultural training
- **Contractor Workforce Integration**: Competency assurance for contracted personnel working alongside employees
- **Succession Planning**: Pipeline for critical technical and leadership roles given industry demographics`,

  '8': `## Petroleum Upstream Industry Variations

In petroleum upstream, IT management supports specialized technical operations:

- **SCADA and Process Control**: Supervisory control systems for wells, facilities, and pipeline operations
- **Subsurface Software**: Seismic interpretation, reservoir simulation, and well planning applications
- **Digital Oilfield Platforms**: Real-time production monitoring, predictive analytics, and integrated operations
- **OT/IT Convergence**: Securing operational technology environments while enabling data-driven operations
- **Remote Operations Support**: Connectivity for offshore platforms, remote fields, and mobile drilling rigs
- **Data Management**: Petrotechnical data repositories, well data governance, and subsurface model versioning`,

  '9': `## Petroleum Upstream Industry Variations

In petroleum upstream, financial management involves specialized accounting and reporting:

- **Joint Venture Accounting**: Cost sharing, operator/non-operator billing, and joint interest calculations
- **Reserves-Based Lending**: Borrowing base calculations tied to proved reserves valuations
- **Production Sharing Contract Accounting**: Cost oil, profit oil, and government take calculations
- **Depletion and Depreciation**: Full cost vs. successful efforts methods for exploration and development costs
- **Asset Retirement Obligations**: Decommissioning liability estimation and funding requirements
- **Transfer Pricing**: Intercompany transactions for crude oil and services across tax jurisdictions`,

  '10': `## Petroleum Upstream Industry Variations

In petroleum upstream, asset management spans the full lifecycle:

- **Exploration Assets**: Seismic data libraries, prospect inventories, and license management
- **Development Projects**: Major capital projects with stage-gate governance and FID processes
- **Production Assets**: Wells, facilities, and infrastructure under production operations
- **Brownfield Modifications**: Tie-backs, capacity expansions, and life extension projects
- **Decommissioning Planning**: Plug and abandonment (P&A), facility removal, and site restoration
- **Portfolio Optimization**: Asset divestiture programs, farm-downs, and strategic acquisitions`,

  '11': `## Petroleum Upstream Industry Variations

In petroleum upstream, risk and compliance management is extensive:

- **HSE Management Systems**: Process safety management, contractor safety, and environmental compliance
- **Major Accident Hazard Prevention**: Safety cases, risk assessments, and barrier management
- **Regulatory Compliance**: Drilling permits, environmental authorizations, and production licenses
- **Environmental Management**: Emissions monitoring, waste management, and biodiversity protection
- **Security Risk Management**: Personnel security, facility protection, and supply chain resilience
- **Insurance and Risk Transfer**: Operator's extra expense, control of well, and liability coverage`,

  '12': `## Petroleum Upstream Industry Variations

In petroleum upstream, external relationship management involves:

- **Host Government Relations**: Ministerial engagement, license compliance, and policy advocacy
- **Joint Venture Partnerships**: Operatorship agreements, technical secondments, and technology sharing
- **Industry Associations**: IOGP, API, and regional association participation
- **Community Relations**: Social performance programs, local content, and stakeholder engagement
- **Academic and Research Partnerships**: University collaborations and technology development consortia
- **Supply Chain Relationships**: Strategic alliances with oilfield service companies and drilling contractors`,

  '13': `## Petroleum Upstream Industry Variations

In petroleum upstream, business capability development focuses on:

- **Operational Excellence Programs**: Production efficiency, reliability improvement, and cost optimization
- **Subsurface Excellence**: Reservoir management best practices and technical assurance processes
- **Project Delivery Capability**: Major project execution, contractor management, and lessons learned
- **Digital Transformation**: Adoption of AI/ML, automation, and integrated operations capabilities
- **Knowledge Management**: Technical communities of practice and expertise retention
- **Continuous Improvement**: Lean operations, reliability-centered maintenance, and performance benchmarking`,
}

function getCategoryFromCode(code: string): string {
  // Extract first number from code like "9.9.2.5" -> "9"
  const match = code.match(/^(\d+)\./)
  return match ? match[1] : '1'
}

function processFile(filePath: string): void {
  const content = fs.readFileSync(filePath, 'utf-8')

  // Check if it's an Activity-level file (X.Y.Z.A pattern)
  const codeMatch = content.match(/code: "(\d+\.\d+\.\d+\.\d+)"/)
  if (!codeMatch) {
    return // Skip non-Activity files
  }

  const code = codeMatch[1]
  const category = getCategoryFromCode(code)

  // Get category-specific data
  const occupationData = categoryOccupations[category] || categoryOccupations['1']
  const departmentData = categoryDepartments[category] || categoryDepartments['1']
  const industryVariation = categoryIndustryVariations[category] || categoryIndustryVariations['1']

  // Generate new occupation section
  const occupationSection = occupationData.occupations
    .map((occ, i) => `- [${occ}](${occupationData.paths[i]})`)
    .join('\n')

  // Generate new department section
  const departmentSection = departmentData.departments
    .map((dept, i) => `- [${dept}](${departmentData.paths[i]})`)
    .join('\n')

  // Replace occupations section
  let newContent = content.replace(
    /## Related Occupations\n\n(- \[.*\]\(.*\)\n?)+/,
    `## Related Occupations\n\n${occupationSection}\n`
  )

  // Replace departments section
  newContent = newContent.replace(
    /## Related Departments\n\n(- \[.*\]\(.*\)\n?)+/,
    `## Related Departments\n\n${departmentSection}\n`
  )

  // Add or replace industry variations section at the end
  if (newContent.includes('## Petroleum Upstream Industry Variations')) {
    // Replace existing section
    newContent = newContent.replace(
      /## Petroleum Upstream Industry Variations[\s\S]*$/,
      industryVariation
    )
  } else {
    // Add new section at the end
    newContent = newContent.trimEnd() + '\n\n' + industryVariation + '\n'
  }

  fs.writeFileSync(filePath, newContent)
}

async function main() {
  const files = fs.readdirSync(PETROLEUM_DIR).filter((f) => f.endsWith('.mdx') && f !== 'index.mdx')

  console.log(`Processing ${files.length} files...`)

  let processed = 0
  for (const file of files) {
    const filePath = path.join(PETROLEUM_DIR, file)
    try {
      processFile(filePath)
      processed++
      if (processed % 100 === 0) {
        console.log(`Processed ${processed}/${files.length} files`)
      }
    } catch (error) {
      console.error(`Error processing ${file}:`, error)
    }
  }

  console.log(`Completed: ${processed} files processed`)
}

main().catch(console.error)
