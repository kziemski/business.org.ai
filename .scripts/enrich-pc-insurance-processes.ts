#!/usr/bin/env npx tsx
/**
 * Enriches Property & Casualty Insurance Activity-level process files
 *
 * Adds:
 * 1. Process-specific occupations based on APQC category
 * 2. Process-relevant departments based on APQC category
 * 3. Industry variations section explaining P&C insurance approach
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PC_INSURANCE_DIR = path.join(__dirname, '..', 'processes', 'industries', 'property-and-casualty-insurance')

// APQC Category to P&C Insurance Occupation mappings
const CATEGORY_OCCUPATIONS: Record<string, { occupations: string[], departments: string[] }> = {
  // 1.0 - Develop Vision and Strategy
  '1': {
    occupations: [
      '[Chief Executives](/occupations/Management/ChiefExecutives)',
      '[Financial Managers](/occupations/Management/FinancialManagers)',
      '[Insurance Underwriters](/occupations/Business/InsuranceUnderwriters)',
      '[Actuaries](/occupations/Science/Actuaries)',
      '[Management Analysts](/occupations/Business/ManagementAnalysts)'
    ],
    departments: [
      '[Executive](/departments/Executive)',
      '[Strategy](/departments/Strategy)',
      '[Finance](/departments/Finance)'
    ]
  },
  // 2.0 - Design and Develop Products and Services
  '2': {
    occupations: [
      '[Actuaries](/occupations/Science/Actuaries)',
      '[Insurance Underwriters](/occupations/Business/InsuranceUnderwriters)',
      '[Financial Analysts](/occupations/Business/FinancialAndInvestmentAnalysts)',
      '[Market Research Analysts](/occupations/Business/MarketResearchAnalystsAndMarketingSpecialists)',
      '[Compliance Officers](/occupations/Business/ComplianceOfficers)'
    ],
    departments: [
      '[Product](/departments/Product)',
      '[Research](/departments/Research)',
      '[Legal](/departments/Legal)',
      '[DataAnalytics](/departments/DataAnalytics)'
    ]
  },
  // 3.0 - Market and Sell Products and Services
  '3': {
    occupations: [
      '[Insurance Sales Agents](/occupations/Sales/InsuranceSalesAgents)',
      '[Insurance Underwriters](/occupations/Business/InsuranceUnderwriters)',
      '[Sales Managers](/occupations/Management/SalesManagers)',
      '[Marketing Managers](/occupations/Management/MarketingManagers)',
      '[Customer Service Representatives](/occupations/Administrative/CustomerServiceRepresentatives)'
    ],
    departments: [
      '[Sales](/departments/Sales)',
      '[Marketing](/departments/Marketing)',
      '[Operations](/departments/Operations)'
    ]
  },
  // 4.0 - Deliver Physical Products
  '4': {
    occupations: [
      '[Insurance Underwriters](/occupations/Business/InsuranceUnderwriters)',
      '[Claims Adjusters, Examiners, and Investigators](/occupations/Business/ClaimsAdjustersExaminersAndInvestigators)',
      '[Logisticians](/occupations/Business/Logisticians)',
      '[Administrative Services Managers](/occupations/Management/AdministrativeServicesManagers)',
      '[Project Management Specialists](/occupations/Business/ProjectManagementSpecialists)'
    ],
    departments: [
      '[Operations](/departments/Operations)',
      '[SupplyChain](/departments/SupplyChain)',
      '[Procurement](/departments/Procurement)'
    ]
  },
  // 5.0 - Deliver Services
  '5': {
    occupations: [
      '[Claims Adjusters, Examiners, and Investigators](/occupations/Business/ClaimsAdjustersExaminersAndInvestigators)',
      '[Insurance Underwriters](/occupations/Business/InsuranceUnderwriters)',
      '[Insurance Appraisers, Auto Damage](/occupations/Business/InsuranceAppraisersAutoDamage)',
      '[Customer Service Representatives](/occupations/Administrative/CustomerServiceRepresentatives)',
      '[Loss Prevention Managers](/occupations/Management/LossPreventionManagers)'
    ],
    departments: [
      '[Operations](/departments/Operations)',
      '[Support](/departments/Support)',
      '[Quality](/departments/Quality)'
    ]
  },
  // 6.0 - Manage Customer Service
  '6': {
    occupations: [
      '[Customer Service Representatives](/occupations/Administrative/CustomerServiceRepresentatives)',
      '[Claims Adjusters, Examiners, and Investigators](/occupations/Business/ClaimsAdjustersExaminersAndInvestigators)',
      '[Insurance Sales Agents](/occupations/Sales/InsuranceSalesAgents)',
      '[Administrative Services Managers](/occupations/Management/AdministrativeServicesManagers)',
      '[Quality Control Systems Managers](/occupations/Management/QualityControlSystemsManagers)'
    ],
    departments: [
      '[Support](/departments/Support)',
      '[Operations](/departments/Operations)',
      '[Quality](/departments/Quality)'
    ]
  },
  // 7.0 - Develop and Manage Human Capital
  '7': {
    occupations: [
      '[Human Resources Managers](/occupations/Management/HumanResourcesManagers)',
      '[Human Resources Specialists](/occupations/Business/HumanResourcesSpecialists)',
      '[Training and Development Managers](/occupations/Management/TrainingAndDevelopmentManagers)',
      '[Compensation and Benefits Managers](/occupations/Management/CompensationAndBenefitsManagers)',
      '[Training and Development Specialists](/occupations/Business/TrainingAndDevelopmentSpecialists)'
    ],
    departments: [
      '[HR](/departments/HR)',
      '[Executive](/departments/Executive)',
      '[Operations](/departments/Operations)'
    ]
  },
  // 8.0 - Manage Information Technology
  '8': {
    occupations: [
      '[Computer and Information Systems Managers](/occupations/Management/ComputerAndInformationSystemsManagers)',
      '[Information Security Analysts](/occupations/Technology/InformationSecurityAnalysts)',
      '[Software Developers](/occupations/Technology/SoftwareDevelopers)',
      '[Database Administrators](/occupations/Technology/DatabaseAdministrators)',
      '[Computer Systems Analysts](/occupations/Technology/ComputerSystemsAnalysts)'
    ],
    departments: [
      '[Technology](/departments/Technology)',
      '[Security](/departments/Security)',
      '[DataAnalytics](/departments/DataAnalytics)'
    ]
  },
  // 9.0 - Manage Financial Resources
  '9': {
    occupations: [
      '[Financial Managers](/occupations/Management/FinancialManagers)',
      '[Accountants and Auditors](/occupations/Business/AccountantsAndAuditors)',
      '[Financial Analysts](/occupations/Business/FinancialAndInvestmentAnalysts)',
      '[Budget Analysts](/occupations/Business/BudgetAnalysts)',
      '[Actuaries](/occupations/Science/Actuaries)'
    ],
    departments: [
      '[Finance](/departments/Finance)',
      '[Executive](/departments/Executive)',
      '[DataAnalytics](/departments/DataAnalytics)'
    ]
  },
  // 10.0 - Acquire, Construct, and Manage Assets
  '10': {
    occupations: [
      '[Property, Real Estate, and Community Association Managers](/occupations/Management/PropertyRealEstateAndCommunityAssociationManagers)',
      '[Facilities Managers](/occupations/Management/FacilitiesManagers)',
      '[Purchasing Managers](/occupations/Management/PurchasingManagers)',
      '[Appraisers and Assessors of Real Estate](/occupations/Business/AppraisersAndAssessorsOfRealEstate)',
      '[Financial Managers](/occupations/Management/FinancialManagers)'
    ],
    departments: [
      '[Operations](/departments/Operations)',
      '[Finance](/departments/Finance)',
      '[Procurement](/departments/Procurement)'
    ]
  },
  // 11.0 - Manage Enterprise Risk, Compliance, Remediation, Resiliency
  '11': {
    occupations: [
      '[Compliance Managers](/occupations/Management/ComplianceManagers)',
      '[Financial Risk Specialists](/occupations/Business/FinancialRiskSpecialists)',
      '[Compliance Officers](/occupations/Business/ComplianceOfficers)',
      '[Actuaries](/occupations/Science/Actuaries)',
      '[Insurance Underwriters](/occupations/Business/InsuranceUnderwriters)'
    ],
    departments: [
      '[Legal](/departments/Legal)',
      '[Executive](/departments/Executive)',
      '[Finance](/departments/Finance)',
      '[Security](/departments/Security)'
    ]
  },
  // 12.0 - Manage External Relationships
  '12': {
    occupations: [
      '[Public Relations Managers](/occupations/Management/PublicRelationsManagers)',
      '[Marketing Managers](/occupations/Management/MarketingManagers)',
      '[Compliance Officers](/occupations/Business/ComplianceOfficers)',
      '[Insurance Sales Agents](/occupations/Sales/InsuranceSalesAgents)',
      '[Management Analysts](/occupations/Business/ManagementAnalysts)'
    ],
    departments: [
      '[Marketing](/departments/Marketing)',
      '[Executive](/departments/Executive)',
      '[Legal](/departments/Legal)'
    ]
  },
  // 13.0 - Develop and Manage Business Capabilities
  '13': {
    occupations: [
      '[Management Analysts](/occupations/Business/ManagementAnalysts)',
      '[Business Continuity Planners](/occupations/Business/BusinessContinuityPlanners)',
      '[Computer and Information Systems Managers](/occupations/Management/ComputerAndInformationSystemsManagers)',
      '[Project Management Specialists](/occupations/Business/ProjectManagementSpecialists)',
      '[Actuaries](/occupations/Science/Actuaries)'
    ],
    departments: [
      '[Strategy](/departments/Strategy)',
      '[Technology](/departments/Technology)',
      '[DataAnalytics](/departments/DataAnalytics)',
      '[Operations](/departments/Operations)'
    ]
  }
}

// Industry variations by APQC category for P&C Insurance
const CATEGORY_VARIATIONS: Record<string, string> = {
  '1': `
## Industry Variations

In P&C insurance, strategy development differs significantly from other industries:

- **Underwriting Philosophy**: Strategic vision must balance growth with risk selection, defining appetite for different lines of business (auto, home, commercial, specialty)
- **Catastrophe Exposure Management**: Strategy must account for geographic concentration risk, reinsurance programs, and catastrophe modeling to manage exposure to hurricanes, earthquakes, wildfires, and other natural disasters
- **Regulatory Environment**: Each state has its own insurance department with rate filing requirements, market conduct standards, and solvency regulations that shape strategic options
- **Distribution Strategy**: Decisions between captive agents, independent agents, direct-to-consumer channels, and broker relationships significantly impact business model
- **Investment Portfolio Strategy**: Insurance float creates investment opportunities that must balance yield against liability duration and regulatory capital requirements
- **Reinsurance Relationships**: Strategic partnerships with reinsurers affect capacity, pricing, and catastrophe protection
`,
  '2': `
## Industry Variations

Product development in P&C insurance involves unique considerations:

- **Actuarial Pricing**: Products must be priced using historical loss data, catastrophe models, and regulatory rate filing requirements that vary by state
- **Coverage Form Development**: Policy language must be carefully crafted to define coverage, exclusions, and conditions while remaining compliant with state regulations
- **State Filing Requirements**: New products require regulatory approval in each state, with different timelines and requirements across jurisdictions
- **Catastrophe Modeling Integration**: Property products must incorporate CAT model outputs for hurricane, earthquake, wildfire, flood, and other perils
- **Underwriting Guidelines**: Product launches require comprehensive underwriting manuals, risk selection criteria, and pricing algorithms
- **Reinsurance Implications**: New products may require treaty amendments or facultative coverage arrangements
- **Claims Handling Procedures**: Products must be designed with claims processes in mind, including third-party vendor networks and settlement guidelines
`,
  '3': `
## Industry Variations

Marketing and sales in P&C insurance have distinct characteristics:

- **Distribution Channel Management**: Sales occur through independent agents, captive agents, brokers, direct channels, and InsurTech partnerships, each requiring different approaches
- **Quote-to-Bind Process**: Sales cycle involves application gathering, underwriting, pricing, quote delivery, and policy issuance with regulatory compliance at each step
- **Comparative Rating**: Customers often compare quotes across multiple carriers, requiring competitive positioning and response time optimization
- **Producer Compensation**: Commission structures, contingent commissions, and profit-sharing arrangements drive agent behavior and loyalty
- **Regulatory Advertising Requirements**: Marketing materials must comply with state insurance advertising regulations and unfair trade practices laws
- **Renewal Marketing**: Retention strategies must address price shopping behavior, policy modifications, and competitive win-back campaigns
- **Surplus Lines**: Marketing specialty or non-admitted products requires understanding of surplus lines regulations and broker licensing
`,
  '4': `
## Industry Variations

Physical delivery in P&C insurance relates primarily to document and certificate management:

- **Policy Document Production**: Physical and electronic delivery of policies, endorsements, and declarations pages must comply with state delivery requirements
- **Certificate of Insurance Management**: COI production for commercial accounts requires coordination with certificate holders and ongoing maintenance
- **Evidence of Insurance Cards**: Auto insurance requires ID card production and distribution meeting state specifications
- **Claims Payment Delivery**: Physical checks, EFT payments, and debit card distributions must be tracked and reconciled
- **Salvage and Subrogation**: Recovery operations involve physical handling of salvage vehicles, damaged property, and documentation
- **Loss Control Services**: Delivery of risk engineering reports, safety recommendations, and inspection findings to policyholders
`,
  '5': `
## Industry Variations

Service delivery in P&C insurance centers on claims handling and policy service:

- **First Notice of Loss (FNOL)**: Claims intake processes must capture essential information while providing empathetic customer service during stressful situations
- **Claims Investigation**: Field adjusters, Special Investigation Units (SIU), and third-party vendors conduct investigations based on claim complexity and red flags
- **Damage Assessment**: Auto damage appraisals, property inspections, and liability investigations follow specific protocols for each line of business
- **Catastrophe Response**: Large-scale events require rapid deployment of CAT teams, mobile claims units, and vendor networks
- **Subrogation and Recovery**: Pursuing recoveries from at-fault parties, salvage operations, and reinsurance collections
- **Litigation Management**: Defense of third-party claims involves panel counsel, litigation guidelines, and settlement authority protocols
- **Policy Endorsements**: Mid-term changes, coverage additions, and policy modifications require underwriting review and premium adjustments
`,
  '6': `
## Industry Variations

Customer service in P&C insurance involves specialized interactions:

- **Policyholder Service**: Handling billing inquiries, coverage questions, policy changes, and document requests across multiple channels
- **Claims Status Updates**: Providing claimants with investigation progress, payment status, and settlement information
- **Agent Support**: Servicing agent inquiries about policies, commissions, underwriting decisions, and system issues
- **Complaint Resolution**: Managing DOI complaints, BBB inquiries, and escalated customer issues within regulatory timeframes
- **First Notice of Loss**: Customer service representatives often serve as first point of contact for claims reporting
- **Payment Arrangements**: Establishing payment plans for premium due, managing cancellation notices, and processing reinstatements
- **Coverage Verification**: Responding to lender requests, DMV inquiries, and third-party verification needs
`,
  '7': `
## Industry Variations

Human capital management in P&C insurance has specialized requirements:

- **Licensing and Continuing Education**: Agents, adjusters, and underwriters must maintain state licenses with ongoing CE requirements
- **Technical Training**: Claims, underwriting, and actuarial staff require specialized insurance education and certifications (CPCU, ARM, FCAS, etc.)
- **Catastrophe Staffing**: Surge capacity planning for CAT events requires flexible staffing models and rapid deployment capabilities
- **Regulatory Compliance Training**: Staff must understand state-specific regulations, market conduct requirements, and unfair claims practices acts
- **Producer Appointment Management**: Tracking agent appointments, licensing status, and compliance across multiple states
- **Succession Planning**: Insurance technical expertise requires long development cycles, making knowledge transfer critical
- **Remote Workforce**: Field adjusters, underwriters, and agents often work remotely, requiring distributed workforce management
`,
  '8': `
## Industry Variations

IT management in P&C insurance addresses unique technology needs:

- **Policy Administration Systems**: Core systems must handle complex policy structures, rating algorithms, and regulatory form requirements
- **Claims Management Systems**: End-to-end claims processing requires integration with vendor networks, payment systems, and document management
- **Catastrophe Modeling**: Integration with RMS, AIR, and other CAT modeling platforms for exposure management and pricing
- **Rating Engines**: Real-time quote generation requires sophisticated pricing algorithms and third-party data integration
- **Regulatory Reporting**: NAIC statutory reporting, state data calls, and market conduct exam support require specialized systems
- **Telematics and IoT**: Connected vehicle and smart home data integration for usage-based insurance products
- **Fraud Detection**: Advanced analytics and machine learning for claims and application fraud identification
- **Agent Portal Management**: Producer-facing systems for quoting, policy service, and commission tracking
`,
  '9': `
## Industry Variations

Financial management in P&C insurance involves specialized accounting and reserving:

- **Loss Reserve Management**: Actuarial analysis of IBNR (Incurred But Not Reported) and case reserves requires sophisticated estimation methods
- **Statutory Accounting**: NAIC SAP reporting differs significantly from GAAP, requiring parallel accounting systems
- **Premium Accounting**: Earned premium calculations, unearned premium reserves, and reinsurance accounting follow insurance-specific rules
- **Reinsurance Accounting**: Ceded premium, recoverable tracking, and treaty accounting require specialized expertise
- **Investment Portfolio Management**: Insurance float investment within regulatory constraints and duration matching to liabilities
- **Combined Ratio Analysis**: Tracking loss ratio, expense ratio, and combined ratio metrics for profitability management
- **Risk-Based Capital**: Maintaining adequate capital levels per NAIC RBC formulas and rating agency requirements
- **Salvage and Subrogation Accounting**: Tracking recoveries and their impact on loss reserves and financial results
`,
  '10': `
## Industry Variations

Asset management in P&C insurance extends beyond physical assets:

- **Investment Portfolio Management**: Managing bonds, equities, and alternative investments within regulatory guidelines and ALM constraints
- **Reinsurance Recoverables**: Tracking and collecting amounts due from reinsurers as significant balance sheet assets
- **Premium Receivables**: Managing agent balances, direct bill receivables, and collection processes
- **Real Estate Holdings**: Some insurers hold real estate investments or own office buildings requiring property management
- **Salvage Operations**: Managing recovered vehicles, damaged property, and auction relationships
- **Technology Infrastructure**: Core systems, data centers, and cloud investments as strategic business assets
- **Data Assets**: Leveraging historical loss data, customer information, and third-party data for competitive advantage
`,
  '11': `
## Industry Variations

Risk and compliance management is core to P&C insurance operations:

- **Enterprise Risk Management**: Balancing underwriting risk, investment risk, operational risk, and strategic risk within the overall risk appetite
- **Regulatory Compliance**: Managing compliance with state insurance laws, NAIC model acts, and federal regulations across all operating jurisdictions
- **Market Conduct**: Ensuring compliance with unfair trade practices acts, claims handling regulations, and anti-discrimination laws
- **Solvency Monitoring**: Maintaining capital adequacy per RBC requirements and rating agency expectations
- **Reinsurance Credit Risk**: Evaluating and monitoring reinsurer creditworthiness and collectability
- **Catastrophe Risk Management**: Using CAT models to manage aggregate exposure and purchase appropriate reinsurance protection
- **Claims Practices Compliance**: Adhering to state-specific claims handling timeframes and fair settlement requirements
- **Privacy and Data Security**: Protecting policyholder information under state privacy laws and cybersecurity regulations
`,
  '12': `
## Industry Variations

External relationship management in P&C insurance involves multiple stakeholders:

- **Regulatory Relationships**: Managing relationships with state insurance departments, NAIC, and federal regulators
- **Reinsurance Partnerships**: Maintaining relationships with reinsurers, reinsurance brokers, and managing treaty renewals
- **Agent and Broker Relationships**: Supporting distribution partners through training, marketing, and technology resources
- **Rating Agency Management**: Interacting with A.M. Best, S&P, Moody's, and Fitch for financial strength ratings
- **Industry Associations**: Participating in ISO, AAIS, NAIC, and trade associations for forms, data, and advocacy
- **Vendor Management**: Overseeing third-party administrators, restoration contractors, auto repair networks, and other service providers
- **Policyholder Advocacy Groups**: Responding to consumer advocacy organizations and addressing public policy concerns
- **Legislative Affairs**: Monitoring and influencing insurance legislation at state and federal levels
`,
  '13': `
## Industry Variations

Business capability development in P&C insurance focuses on core competencies:

- **Underwriting Capabilities**: Building sophisticated risk selection, pricing, and portfolio management capabilities
- **Claims Excellence**: Developing efficient, accurate, and customer-friendly claims handling processes
- **Actuarial Analytics**: Advancing predictive modeling, catastrophe analysis, and reserve estimation capabilities
- **Digital Transformation**: Modernizing legacy systems while maintaining regulatory compliance and data integrity
- **Data and Analytics**: Leveraging internal and external data for pricing, fraud detection, and customer insights
- **Customer Experience**: Improving policyholder journeys across quoting, servicing, and claims touchpoints
- **Process Automation**: Implementing straight-through processing for low-touch transactions while maintaining quality
- **Innovation Management**: Evaluating InsurTech partnerships, new distribution models, and emerging risk coverage
`
}

function extractCategoryFromCode(code: string): string {
  // Extract first number from APQC code (e.g., "11.1.3.4" -> "11")
  const match = code.match(/^(\d+)\./)
  return match ? match[1] : '1'
}

function processFile(filePath: string): boolean {
  const content = fs.readFileSync(filePath, 'utf-8')

  // Check if this is an Activity-level file (X.Y.Z.A pattern) or deeper (X.Y.Z.A.B, X.Y.Z.A.B.C)
  const codeMatch = content.match(/^code: "(\d+\.\d+\.\d+\.\d+(?:\.\d+)*)"$/m)
  if (!codeMatch) {
    return false // Not an Activity-level file or deeper
  }

  const code = codeMatch[1]
  const category = extractCategoryFromCode(code)

  const mapping = CATEGORY_OCCUPATIONS[category]
  if (!mapping) {
    console.log(`No mapping for category ${category} in ${filePath}`)
    return false
  }

  const variation = CATEGORY_VARIATIONS[category]

  // Build new occupations section
  const newOccupations = `## Related Occupations

${mapping.occupations.map(o => `- ${o}`).join('\n')}`

  // Build new departments section
  const newDepartments = `## Related Departments

${mapping.departments.map(d => `- ${d}`).join('\n')}`

  // Replace existing occupations section
  let newContent = content.replace(
    /## Related Occupations\n\n(?:- \[.*?\]\(.*?\)\n)+/g,
    newOccupations + '\n\n'
  )

  // Replace existing departments section
  newContent = newContent.replace(
    /## Related Departments\n\n(?:- \[.*?\]\(.*?\)\n)+/g,
    newDepartments + '\n\n'
  )

  // Add Industry Variations if not present and if there's content to add
  if (variation && !newContent.includes('## Industry Variations')) {
    // Remove trailing whitespace and add variation
    newContent = newContent.trimEnd() + '\n' + variation
  }

  // Write back if changed
  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent)
    return true
  }

  return false
}

async function main() {
  console.log('Enriching P&C Insurance Activity-level process files...')

  const files = fs.readdirSync(PC_INSURANCE_DIR)
    .filter(f => f.endsWith('.mdx') && f !== 'index.mdx')
    .map(f => path.join(PC_INSURANCE_DIR, f))

  let processed = 0
  let modified = 0

  for (const file of files) {
    processed++
    if (processFile(file)) {
      modified++
      if (modified % 100 === 0) {
        console.log(`Modified ${modified} files...`)
      }
    }
  }

  console.log(`\nDone! Processed ${processed} files, modified ${modified} files.`)
}

main().catch(console.error)
