/**
 * Enrich petroleum-downstream industry process files with:
 * 1. Process-specific occupation cross-references
 * 2. Process-specific department cross-references
 * 3. Industry variations section
 *
 * Focuses on Activity-level files (X.Y.Z.A pattern)
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROCESSES_DIR = path.join(__dirname, '..', 'processes', 'industries', 'petroleum-downstream')

// APQC Category mappings to occupations and departments
interface CategoryMapping {
  occupations: { path: string; name: string }[]
  departments: { path: string; name: string }[]
  industryVariation: string
}

// Petroleum downstream-specific occupations organized by function
const PETROLEUM_OCCUPATIONS = {
  operations: [
    { path: '/occupations/Production/PetroleumPumpSystemOperatorsRefineryOperatorsAndGaugers', name: 'Petroleum Pump System Operators and Refinery Operators' },
    { path: '/occupations/Production/GasPlantOperators', name: 'Gas Plant Operators' },
    { path: '/occupations/Production/StationaryEngineersAndBoilerOperators', name: 'Stationary Engineers and Boiler Operators' },
    { path: '/occupations/Production/GasCompressorAndGasPumpingStationOperators', name: 'Gas Compressor and Pumping Station Operators' },
    { path: '/occupations/Production/ChemicalPlantAndSystemOperators', name: 'Chemical Plant and System Operators' },
  ],
  engineering: [
    { path: '/occupations/Architecture/PetroleumEngineers', name: 'Petroleum Engineers' },
    { path: '/occupations/Architecture/ChemicalEngineers', name: 'Chemical Engineers' },
    { path: '/occupations/Architecture/MechanicalEngineers', name: 'Mechanical Engineers' },
    { path: '/occupations/Architecture/IndustrialEngineers', name: 'Industrial Engineers' },
    { path: '/occupations/Architecture/EnvironmentalEngineers', name: 'Environmental Engineers' },
  ],
  hse: [
    { path: '/occupations/Architecture/HealthAndSafetyEngineersExceptMiningSafetyEngineersAndInspectors', name: 'Health and Safety Engineers' },
    { path: '/occupations/Business/OccupationalHealthAndSafetySpecialists', name: 'Occupational Health and Safety Specialists' },
    { path: '/occupations/Science/OccupationalHealthAndSafetyTechnicians', name: 'Occupational Health and Safety Technicians' },
    { path: '/occupations/Business/EnvironmentalComplianceInspectors', name: 'Environmental Compliance Inspectors' },
    { path: '/occupations/Architecture/FirePreventionAndProtectionEngineers', name: 'Fire Prevention and Protection Engineers' },
  ],
  management: [
    { path: '/occupations/Management/IndustrialProductionManagers', name: 'Industrial Production Managers' },
    { path: '/occupations/Management/GeneralAndOperationsManagers', name: 'General and Operations Managers' },
    { path: '/occupations/Management/ChiefExecutives', name: 'Chief Executives' },
    { path: '/occupations/Management/ArchitecturalAndEngineeringManagers', name: 'Architectural and Engineering Managers' },
  ],
  logistics: [
    { path: '/occupations/Management/TransportationStorageAndDistributionManagers', name: 'Transportation, Storage, and Distribution Managers' },
    { path: '/occupations/Management/SupplyChainManagers', name: 'Supply Chain Managers' },
    { path: '/occupations/Business/Logisticians', name: 'Logisticians' },
    { path: '/occupations/Business/LogisticsAnalysts', name: 'Logistics Analysts' },
    { path: '/occupations/Production/TankCarTruckAndShipLoaders', name: 'Tank Car, Truck, and Ship Loaders' },
  ],
  maintenance: [
    { path: '/occupations/Maintenance/IndustrialMachineryMechanics', name: 'Industrial Machinery Mechanics' },
    { path: '/occupations/Maintenance/MaintenanceAndRepairWorkers', name: 'Maintenance and Repair Workers' },
    { path: '/occupations/Maintenance/PipeLayersPlumbersPipefittersAndSteamfitters', name: 'Pipefitters and Steamfitters' },
    { path: '/occupations/Maintenance/ElectricalAndElectronicsRepairers', name: 'Electrical and Electronics Repairers' },
  ],
  hr: [
    { path: '/occupations/Management/HumanResourcesManagers', name: 'Human Resources Managers' },
    { path: '/occupations/Business/HumanResourcesSpecialists', name: 'Human Resources Specialists' },
    { path: '/occupations/Management/TrainingAndDevelopmentManagers', name: 'Training and Development Managers' },
    { path: '/occupations/Management/CompensationAndBenefitsManagers', name: 'Compensation and Benefits Managers' },
  ],
  finance: [
    { path: '/occupations/Management/FinancialManagers', name: 'Financial Managers' },
    { path: '/occupations/Business/Financial/AccountantsAndAuditors', name: 'Accountants and Auditors' },
    { path: '/occupations/Business/Financial/BudgetAnalysts', name: 'Budget Analysts' },
    { path: '/occupations/Business/Financial/FinancialAndInvestmentAnalysts', name: 'Financial Analysts' },
    { path: '/occupations/Management/TreasurersAndControllers', name: 'Treasurers and Controllers' },
  ],
  it: [
    { path: '/occupations/Management/ComputerAndInformationSystemsManagers', name: 'Computer and Information Systems Managers' },
    { path: '/occupations/Technology/SoftwareDevelopers', name: 'Software Developers' },
    { path: '/occupations/Technology/ComputerSystemsAnalysts', name: 'Computer Systems Analysts' },
    { path: '/occupations/Technology/InformationSecurityAnalysts', name: 'Information Security Analysts' },
    { path: '/occupations/Technology/DatabaseAdministrators', name: 'Database Administrators' },
  ],
  compliance: [
    { path: '/occupations/Management/ComplianceManagers', name: 'Compliance Managers' },
    { path: '/occupations/Management/RegulatoryAffairsManagers', name: 'Regulatory Affairs Managers' },
    { path: '/occupations/Business/ComplianceOfficers', name: 'Compliance Officers' },
    { path: '/occupations/Business/RegulatoryAffairsSpecialists', name: 'Regulatory Affairs Specialists' },
  ],
  quality: [
    { path: '/occupations/Management/QualityControlSystemsManagers', name: 'Quality Control Systems Managers' },
    { path: '/occupations/Science/ChemicalTechnicians', name: 'Chemical Technicians' },
    { path: '/occupations/Business/ManagementAnalysts', name: 'Management Analysts' },
  ],
  procurement: [
    { path: '/occupations/Management/PurchasingManagers', name: 'Purchasing Managers' },
    { path: '/occupations/Business/PurchasingAgentsExceptWholesaleRetailAndFarmProducts', name: 'Purchasing Agents' },
    { path: '/occupations/Management/SupplyChainManagers', name: 'Supply Chain Managers' },
  ],
  marketing: [
    { path: '/occupations/Management/MarketingManagers', name: 'Marketing Managers' },
    { path: '/occupations/Management/SalesManagers', name: 'Sales Managers' },
    { path: '/occupations/Business/MarketResearchAnalystsAndMarketingSpecialists', name: 'Market Research Analysts' },
  ],
  environmental: [
    { path: '/occupations/Architecture/EnvironmentalEngineers', name: 'Environmental Engineers' },
    { path: '/occupations/Science/EnvironmentalScientistsAndSpecialists', name: 'Environmental Scientists and Specialists' },
    { path: '/occupations/Business/EnvironmentalComplianceInspectors', name: 'Environmental Compliance Inspectors' },
    { path: '/occupations/Science/EnvironmentalScienceAndProtectionTechnicians', name: 'Environmental Science Technicians' },
  ],
}

// Petroleum downstream-specific departments
const PETROLEUM_DEPARTMENTS = {
  operations: [
    { path: '/departments/Operations', name: 'Refinery Operations' },
  ],
  engineering: [
    { path: '/departments/Research', name: 'Engineering and Technical Services' },
  ],
  hse: [
    { path: '/departments/Operations', name: 'Health, Safety, and Environment (HSE)' },
    { path: '/departments/Quality', name: 'Process Safety Management' },
  ],
  logistics: [
    { path: '/departments/SupplyChain', name: 'Supply Chain and Logistics' },
    { path: '/departments/Operations', name: 'Terminal Operations' },
  ],
  hr: [
    { path: '/departments/HR', name: 'Human Resources' },
  ],
  finance: [
    { path: '/departments/Finance', name: 'Finance' },
  ],
  it: [
    { path: '/departments/Technology', name: 'Information Technology' },
    { path: '/departments/DataAnalytics', name: 'Data Analytics' },
  ],
  compliance: [
    { path: '/departments/Legal', name: 'Legal and Regulatory Affairs' },
  ],
  quality: [
    { path: '/departments/Quality', name: 'Quality Assurance' },
  ],
  procurement: [
    { path: '/departments/Procurement', name: 'Procurement' },
    { path: '/departments/SupplyChain', name: 'Supply Chain' },
  ],
  marketing: [
    { path: '/departments/Marketing', name: 'Marketing' },
    { path: '/departments/Sales', name: 'Sales and Commercial' },
  ],
  strategy: [
    { path: '/departments/Strategy', name: 'Strategy' },
    { path: '/departments/Executive', name: 'Executive Leadership' },
  ],
  maintenance: [
    { path: '/departments/Operations', name: 'Maintenance and Reliability' },
  ],
}

// APQC category to occupation/department mapping
function getCategoryMapping(code: string, processName: string): CategoryMapping {
  const category = code.split('.')[0]
  const nameLower = processName.toLowerCase()

  // Keyword-based occupation selection
  const getOccupationsByKeywords = (): { path: string; name: string }[] => {
    const occupations: { path: string; name: string }[] = []

    // HSE/Safety keywords - check FIRST with highest priority for petroleum
    if (nameLower.includes('safety') || nameLower.includes('hse') || nameLower.includes('health and safety') ||
        nameLower.includes('environmental') || nameLower.includes('hazard') ||
        nameLower.includes('incident') || nameLower.includes('emergency') || nameLower.includes('fire') ||
        nameLower.includes('spill') || nameLower.includes('emission') || nameLower.includes('permit')) {
      occupations.push(...PETROLEUM_OCCUPATIONS.hse)
      occupations.push(...PETROLEUM_OCCUPATIONS.environmental.slice(0, 2))
      return occupations
    }

    // HR keywords - check first with high priority
    if (nameLower.includes('employee') || nameLower.includes('staff') || nameLower.includes('recruit') ||
        nameLower.includes('training') || nameLower.includes('compensation') || nameLower.includes('benefit') ||
        nameLower.includes('payroll') || nameLower.includes('workforce') || nameLower.includes('hr ') ||
        nameLower.includes('human resource') || nameLower.includes('talent') || nameLower.includes('onboard') ||
        nameLower.includes('separation') || nameLower.includes('retire') || nameLower.includes('learning program') ||
        nameLower.includes('competenc') || nameLower.includes('performance review') || nameLower.includes('career') ||
        nameLower.includes('labor relation') || nameLower.includes('grievance')) {
      occupations.push(...PETROLEUM_OCCUPATIONS.hr)
      if (category === '7') return occupations
    }

    // Finance keywords - check early with high priority (but not for HSE audits)
    if ((nameLower.includes('financ') || nameLower.includes('budget') || nameLower.includes('account') ||
        nameLower.includes('billing') || nameLower.includes('revenue') || nameLower.includes('cost') ||
        nameLower.includes('tax') || nameLower.includes('payable') || nameLower.includes('receivable') ||
        nameLower.includes('audit') || nameLower.includes('invoice') || nameLower.includes('treasury') ||
        nameLower.includes('capital') || nameLower.includes('ledger') || nameLower.includes('depreciation')) &&
        !nameLower.includes('safety') && !nameLower.includes('environmental') && !nameLower.includes('health')) {
      occupations.push(...PETROLEUM_OCCUPATIONS.finance)
      if (category === '9') return occupations
    }

    // IT keywords - check early with high priority
    if (nameLower.includes('it ') || nameLower.includes('information technology') ||
        nameLower.includes('software') || nameLower.includes('network') || nameLower.includes('infrastructure') ||
        nameLower.includes('cyber') || nameLower.includes('deployment') || nameLower.includes('portfolio') ||
        nameLower.includes('application') || nameLower.includes('data ') || nameLower.includes('system')) {
      occupations.push(...PETROLEUM_OCCUPATIONS.it)
      if (category === '8') return occupations
    }

    // Risk keywords (but not HSE which is handled at the top)
    if (nameLower.includes('risk') && !nameLower.includes('safety') && !nameLower.includes('environmental')) {
      occupations.push(...PETROLEUM_OCCUPATIONS.compliance)
    }

    // Operations/refinery keywords
    if (nameLower.includes('refin') || nameLower.includes('process') || nameLower.includes('unit') ||
        nameLower.includes('plant') || nameLower.includes('operat') || nameLower.includes('produc') ||
        nameLower.includes('turnaround') || nameLower.includes('shutdown') || nameLower.includes('startup')) {
      occupations.push(...PETROLEUM_OCCUPATIONS.operations.slice(0, 3))
      occupations.push(...PETROLEUM_OCCUPATIONS.engineering.slice(0, 2))
    }

    // Logistics/distribution keywords
    if (nameLower.includes('logistics') || nameLower.includes('transport') || nameLower.includes('distribut') ||
        nameLower.includes('terminal') || nameLower.includes('pipeline') || nameLower.includes('tank') ||
        nameLower.includes('storage') || nameLower.includes('delivery') || nameLower.includes('ship') ||
        nameLower.includes('load') || nameLower.includes('truck') || nameLower.includes('rail')) {
      occupations.push(...PETROLEUM_OCCUPATIONS.logistics)
    }

    // Maintenance keywords
    if (nameLower.includes('mainten') || nameLower.includes('repair') || nameLower.includes('reliab') ||
        nameLower.includes('inspect') || nameLower.includes('equipment') || nameLower.includes('asset')) {
      occupations.push(...PETROLEUM_OCCUPATIONS.maintenance)
      occupations.push(...PETROLEUM_OCCUPATIONS.engineering.slice(2, 4))
    }

    // Quality keywords
    if (nameLower.includes('quality') || nameLower.includes('test') || nameLower.includes('specif') ||
        nameLower.includes('standard') || nameLower.includes('assurance') || nameLower.includes('control')) {
      occupations.push(...PETROLEUM_OCCUPATIONS.quality)
    }

    // Compliance/regulatory keywords
    if (nameLower.includes('compliance') || nameLower.includes('regulatory') || nameLower.includes('legal') ||
        nameLower.includes('policy') || nameLower.includes('governance') || nameLower.includes('audit')) {
      occupations.push(...PETROLEUM_OCCUPATIONS.compliance)
    }

    // Procurement/supply chain keywords
    if (nameLower.includes('procur') || nameLower.includes('supply') || nameLower.includes('vendor') ||
        nameLower.includes('purchas') || nameLower.includes('supplier') || nameLower.includes('contract') ||
        nameLower.includes('source') || nameLower.includes('material')) {
      occupations.push(...PETROLEUM_OCCUPATIONS.procurement)
    }

    // Marketing/sales keywords
    if (nameLower.includes('market') || nameLower.includes('brand') || nameLower.includes('sales') ||
        nameLower.includes('customer') || nameLower.includes('pricing') || nameLower.includes('commercial')) {
      occupations.push(...PETROLEUM_OCCUPATIONS.marketing)
    }

    // Engineering/design keywords
    if (nameLower.includes('engineer') || nameLower.includes('design') || nameLower.includes('develop') ||
        nameLower.includes('project') || nameLower.includes('technical')) {
      occupations.push(...PETROLEUM_OCCUPATIONS.engineering.slice(0, 3))
    }

    // Strategy keywords
    if (nameLower.includes('strateg') || nameLower.includes('vision') || nameLower.includes('plan') ||
        nameLower.includes('business model') || nameLower.includes('stakeholder')) {
      occupations.push(...PETROLEUM_OCCUPATIONS.management)
    }

    return occupations
  }

  // Keyword-based department selection
  const getDepartmentsByKeywords = (): { path: string; name: string }[] => {
    const departments: { path: string; name: string }[] = []

    // Category-first approach for specific categories
    if (category === '7') {
      return [...PETROLEUM_DEPARTMENTS.hr]
    }
    if (category === '9') {
      return [...PETROLEUM_DEPARTMENTS.finance]
    }
    if (category === '8') {
      return [...PETROLEUM_DEPARTMENTS.it]
    }

    // HSE keywords
    if (nameLower.includes('safety') || nameLower.includes('hse') || nameLower.includes('environment') ||
        nameLower.includes('hazard') || nameLower.includes('incident') || nameLower.includes('emergency')) {
      departments.push(...PETROLEUM_DEPARTMENTS.hse)
    }

    // HR keywords
    if (nameLower.includes('employee') || nameLower.includes('staff') || nameLower.includes('hr') ||
        nameLower.includes('recruit') || nameLower.includes('training') || nameLower.includes('workforce') ||
        nameLower.includes('benefit') || nameLower.includes('compensation') || nameLower.includes('payroll')) {
      departments.push(...PETROLEUM_DEPARTMENTS.hr)
    }

    // Finance keywords
    if (nameLower.includes('financ') || nameLower.includes('budget') || nameLower.includes('account') ||
        nameLower.includes('billing') || nameLower.includes('revenue') || nameLower.includes('tax') ||
        nameLower.includes('treasury') || nameLower.includes('capital') || nameLower.includes('ledger')) {
      departments.push(...PETROLEUM_DEPARTMENTS.finance)
    }

    // IT keywords
    if (nameLower.includes('it ') || nameLower.includes('technology') || nameLower.includes('software') ||
        nameLower.includes('network') || nameLower.includes('infrastructure') || nameLower.includes('portfolio') ||
        nameLower.includes('deployment') || nameLower.includes('application') || nameLower.includes('data')) {
      departments.push(...PETROLEUM_DEPARTMENTS.it)
    }

    // Operations keywords
    if (nameLower.includes('refin') || nameLower.includes('operat') || nameLower.includes('produc') ||
        nameLower.includes('plant') || nameLower.includes('process') || nameLower.includes('unit')) {
      departments.push(...PETROLEUM_DEPARTMENTS.operations)
    }

    // Logistics keywords
    if (nameLower.includes('logistics') || nameLower.includes('transport') || nameLower.includes('distribut') ||
        nameLower.includes('terminal') || nameLower.includes('storage') || nameLower.includes('delivery')) {
      departments.push(...PETROLEUM_DEPARTMENTS.logistics)
    }

    // Compliance keywords
    if (nameLower.includes('compliance') || nameLower.includes('regulatory') || nameLower.includes('legal') ||
        nameLower.includes('policy')) {
      departments.push(...PETROLEUM_DEPARTMENTS.compliance)
    }

    // Engineering keywords
    if (nameLower.includes('engineer') || nameLower.includes('design') || nameLower.includes('technical')) {
      departments.push(...PETROLEUM_DEPARTMENTS.engineering)
    }

    // Marketing keywords
    if (nameLower.includes('market') || nameLower.includes('brand') || nameLower.includes('sales') ||
        nameLower.includes('commercial')) {
      departments.push(...PETROLEUM_DEPARTMENTS.marketing)
    }

    // Strategy keywords
    if (nameLower.includes('strateg') || nameLower.includes('vision') || nameLower.includes('business model')) {
      departments.push(...PETROLEUM_DEPARTMENTS.strategy)
    }

    // Procurement keywords
    if (nameLower.includes('procur') || nameLower.includes('supply') || nameLower.includes('vendor') ||
        nameLower.includes('purchas')) {
      departments.push(...PETROLEUM_DEPARTMENTS.procurement)
    }

    // Quality keywords
    if (nameLower.includes('quality') || nameLower.includes('test') || nameLower.includes('assurance')) {
      departments.push(...PETROLEUM_DEPARTMENTS.quality)
    }

    // Maintenance keywords
    if (nameLower.includes('mainten') || nameLower.includes('repair') || nameLower.includes('reliab') ||
        nameLower.includes('asset')) {
      departments.push(...PETROLEUM_DEPARTMENTS.maintenance)
    }

    return departments
  }

  // Get industry variation based on category and keywords
  const getIndustryVariation = (): string => {
    // HR processes
    if (category === '7' || nameLower.includes('employee') || nameLower.includes('staff') || nameLower.includes('recruit') ||
        nameLower.includes('training') || nameLower.includes('workforce') || nameLower.includes('hr ') ||
        nameLower.includes('benefit') || nameLower.includes('compensation') || nameLower.includes('payroll')) {
      return `In petroleum downstream operations, HR processes must address unique workforce challenges including 24/7 shift operations at refineries and terminals, specialized technical training requirements, and stringent safety certifications (OSHA, HAZWOPER). Organizations must maintain operator qualification programs for pipeline and terminal personnel, manage union relationships common in refinery settings, and ensure adequate staffing for turnaround and emergency response teams. Workforce planning accounts for the cyclical nature of maintenance turnarounds and seasonal fuel demand variations.`
    }

    // HSE processes
    if (nameLower.includes('safety') || nameLower.includes('hse') || nameLower.includes('environment') ||
        nameLower.includes('hazard') || nameLower.includes('incident') || nameLower.includes('emergency')) {
      return `HSE management in petroleum downstream is governed by extensive regulatory frameworks including OSHA Process Safety Management (PSM), EPA Risk Management Program (RMP), and state environmental regulations. Refineries and terminals must maintain comprehensive emergency response plans, conduct regular safety drills, and implement Management of Change (MOC) procedures for any process modifications. API standards (API 750, 752, 753) guide facility siting, building occupancy, and portable building placement. Environmental compliance includes air emissions permits, wastewater treatment, and hazardous waste management under RCRA.`
    }

    // Operations/refinery processes
    if (nameLower.includes('refin') || nameLower.includes('process') || nameLower.includes('unit') ||
        nameLower.includes('plant') || nameLower.includes('operat') || nameLower.includes('produc')) {
      return `Refinery operations in petroleum downstream involve complex hydrocarbon processing including crude distillation, catalytic cracking, hydrotreating, and blending operations. Process control systems must maintain product quality specifications while optimizing yields and energy efficiency. Operations follow API and ASME standards for equipment design and maintenance. Turnaround planning requires coordination of inspection, maintenance, and capital projects during scheduled shutdowns. Real-time optimization systems and advanced process control (APC) maximize throughput while maintaining safety margins and environmental compliance.`
    }

    // Logistics/distribution processes
    if (nameLower.includes('logistics') || nameLower.includes('transport') || nameLower.includes('distribut') ||
        nameLower.includes('terminal') || nameLower.includes('pipeline') || nameLower.includes('storage') ||
        nameLower.includes('delivery')) {
      return `Petroleum downstream logistics involves managing bulk product movements through pipelines, marine vessels, rail cars, and truck fleets to terminals and retail locations. Terminal operations must maintain product quality segregation, custody transfer accuracy, and compliance with DOT hazardous materials regulations. Pipeline operators follow PHMSA regulations and API 1160/1161 for integrity management. Inventory management balances seasonal demand variations with storage constraints. Distribution networks must respond to supply disruptions while maintaining fuel availability for critical infrastructure.`
    }

    // Finance processes
    if (category === '9' || nameLower.includes('financ') || nameLower.includes('budget') || nameLower.includes('billing') ||
        nameLower.includes('revenue') || nameLower.includes('account') || nameLower.includes('tax')) {
      return `Financial management in petroleum downstream addresses unique aspects of the refining and fuel distribution business including volatile commodity prices, complex transfer pricing for intercompany crude and product movements, and significant capital investment requirements. Margin management focuses on crack spreads between crude costs and refined product prices. Tax accounting must handle fuel excise taxes, environmental fees, and renewable fuel credit trading. Working capital management balances crude oil inventory carrying costs with supply security requirements.`
    }

    // IT processes
    if (category === '8' || nameLower.includes('it ') || nameLower.includes('technology') || nameLower.includes('system') ||
        nameLower.includes('data') || nameLower.includes('software')) {
      return `IT systems in petroleum downstream integrate process control systems (DCS/SCADA), enterprise resource planning (ERP), and specialized applications for blending optimization, scheduling, and custody transfer. Cybersecurity is critical given the designation of refineries and pipelines as critical infrastructure under CISA guidelines. IT must maintain separation between operational technology (OT) networks and business systems while enabling data integration for operational intelligence. Systems must support 24/7 operations with high availability requirements and disaster recovery capabilities.`
    }

    // Compliance/regulatory processes
    if (nameLower.includes('compliance') || nameLower.includes('regulatory') || nameLower.includes('risk') ||
        nameLower.includes('legal') || nameLower.includes('policy')) {
      return `Regulatory compliance in petroleum downstream spans environmental (EPA, state agencies), safety (OSHA, PHMSA), and product quality (EPA fuels regulations, state weights and measures) requirements. Companies must maintain permits for air emissions, wastewater discharge, and hazardous waste handling. Renewable fuel standard (RFS) compliance requires tracking and trading of renewable identification numbers (RINs). Anti-trust considerations affect pricing and supply practices. Import/export activities require customs compliance and adherence to international trade regulations.`
    }

    // Quality processes
    if (nameLower.includes('quality') || nameLower.includes('test') || nameLower.includes('standard') ||
        nameLower.includes('specif')) {
      return `Quality management in petroleum downstream ensures refined products meet ASTM specifications, EPA fuel quality regulations, and customer contractual requirements. Laboratory testing programs monitor product properties including octane rating, sulfur content, vapor pressure, and cetane number. Quality systems must maintain chain of custody documentation and support product traceability. Blending operations optimize product quality while maximizing component utilization. Quality incidents can result in significant liability, recalls, and regulatory penalties.`
    }

    // Procurement/supply chain processes
    if (nameLower.includes('procur') || nameLower.includes('supply') || nameLower.includes('vendor') ||
        nameLower.includes('purchas') || nameLower.includes('material')) {
      return `Procurement in petroleum downstream manages crude oil acquisition, catalyst and chemical supplies, and maintenance materials for refinery and terminal operations. Crude procurement involves complex trading relationships, quality banking arrangements, and logistics coordination. Spare parts inventory must balance carrying costs with equipment criticality and lead times. Vendor management includes qualification requirements for safety-critical equipment and services. Strategic sourcing addresses long-term catalyst supply agreements and major equipment purchases for capital projects.`
    }

    // Marketing/sales processes
    if (nameLower.includes('market') || nameLower.includes('brand') || nameLower.includes('sales') ||
        nameLower.includes('customer') || nameLower.includes('pricing')) {
      return `Marketing in petroleum downstream encompasses wholesale and retail fuel distribution, branded dealer relationships, and commercial/industrial customer accounts. Pricing strategies must respond to volatile commodity markets while maintaining competitive positioning. Retail operations involve franchise relationships, credit card processing, and convenience store integration. Brand management includes fuel quality differentiation and loyalty programs. B2B relationships with airlines, utilities, and industrial customers require contract negotiation and supply reliability commitments.`
    }

    // Maintenance processes
    if (nameLower.includes('mainten') || nameLower.includes('repair') || nameLower.includes('reliab') ||
        nameLower.includes('asset') || nameLower.includes('equipment')) {
      return `Maintenance in petroleum downstream follows reliability-centered maintenance (RCM) principles with emphasis on mechanical integrity for pressure vessels, piping, and rotating equipment. Predictive maintenance programs use vibration analysis, thermography, and corrosion monitoring to optimize equipment availability. Turnaround planning integrates inspection, maintenance, and capital projects during scheduled outages. API inspection codes (API 510, 570, 653) govern pressure vessel, piping, and tank inspection intervals. Maintenance execution follows work permit systems and lockout/tagout procedures for safe equipment isolation.`
    }

    // Strategy processes
    if (nameLower.includes('strateg') || nameLower.includes('vision') || nameLower.includes('plan') ||
        nameLower.includes('business model')) {
      return `Strategic planning in petroleum downstream must address the energy transition, evolving environmental regulations, and changing consumer preferences. Refineries evaluate investments in low-carbon fuels, renewable diesel, and hydrogen production. Portfolio optimization balances traditional fuel production with emerging energy products. Capital allocation decisions consider refinery configuration flexibility and terminal network optimization. Strategic partnerships may include biofuel producers, electric vehicle charging networks, and renewable energy developers.`
    }

    // Default by category
    switch (category) {
      case '1':
        return `Petroleum downstream strategic planning addresses the evolving energy landscape including decarbonization pressures, renewable fuel mandates, and changing transportation patterns. Strategy must balance traditional refining and distribution assets with investments in low-carbon alternatives while maintaining competitive positioning in wholesale and retail fuel markets.`
      case '2':
        return `Product and service development in petroleum downstream involves refinery process optimization, new fuel formulations, and enhanced customer offerings. Development activities must comply with EPA fuel regulations and consider infrastructure compatibility. Innovation focuses on improved fuel efficiency, emissions reduction, and integration of renewable components.`
      case '3':
        return `Marketing and sales in petroleum downstream serves diverse customer segments from retail consumers to industrial users and aviation customers. Activities must comply with fuel quality advertising regulations and competitive pricing laws. Customer relationships often involve long-term supply contracts with volume commitments and quality guarantees.`
      case '4':
        return `Physical product delivery in petroleum downstream involves complex logistics networks including pipelines, terminals, marine vessels, rail cars, and truck fleets. Operations must maintain product quality, custody transfer accuracy, and compliance with DOT hazardous materials regulations throughout the supply chain.`
      case '5':
        return `Service delivery in petroleum downstream includes technical support for customers, equipment maintenance services, and operational consulting. Service activities must address the specialized requirements of fuel handling, storage, and dispensing equipment while maintaining safety and environmental compliance.`
      case '6':
        return `Customer service in petroleum downstream addresses fuel quality concerns, delivery scheduling, account management, and emergency response coordination. Service levels must meet contractual commitments while managing supply constraints during market disruptions or extreme weather events.`
      case '7':
        return `Human capital management in petroleum downstream addresses specialized technical workforce requirements, 24/7 operations staffing, and stringent safety training mandates. Organizations must maintain operator qualification programs, manage union relationships, and ensure adequate staffing for turnaround and emergency response.`
      case '8':
        return `IT management in petroleum downstream integrates process control systems, business applications, and specialized industry software while maintaining cybersecurity for critical infrastructure. Systems must support 24/7 operations with high availability and enable data integration for operational optimization.`
      case '9':
        return `Financial management in petroleum downstream addresses commodity price volatility, complex transfer pricing, fuel excise taxes, and significant capital investment requirements. Margin management focuses on optimizing crack spreads while managing working capital and supply risks.`
      case '10':
        return `Asset management in petroleum downstream encompasses refineries, pipelines, terminals, and retail facilities requiring specialized maintenance, inspection, and reliability programs. Capital projects follow industry standards for design, construction, and commissioning of process equipment and infrastructure.`
      case '11':
        return `Risk and compliance management in petroleum downstream addresses extensive environmental, safety, and product quality regulations from federal, state, and local agencies. Organizations must maintain permits, implement management systems, and prepare for inspections while managing operational, financial, and reputational risks.`
      case '12':
        return `External relationships in petroleum downstream include regulatory agencies, industry associations (API, AFPM), community stakeholders, and trading partners. Relationship management must address environmental and safety concerns while maintaining industry advocacy and business partnerships.`
      case '13':
        return `Business capability development in petroleum downstream focuses on operational excellence, safety culture, and organizational agility to respond to market and regulatory changes. Capabilities must support both traditional refining operations and emerging opportunities in renewable fuels and energy transition.`
      default:
        return `Petroleum downstream companies implement this process with emphasis on safety, environmental compliance, and operational reliability. Activities must comply with industry standards (API, ASTM) and extensive federal and state regulations governing refinery operations, fuel distribution, and environmental protection.`
    }
  }

  // Get occupations based on keywords and category
  let occupations = getOccupationsByKeywords()

  // If no keyword matches, use category-based defaults
  if (occupations.length === 0) {
    switch (category) {
      case '1': // Strategy
        occupations = [...PETROLEUM_OCCUPATIONS.management, ...PETROLEUM_OCCUPATIONS.engineering.slice(0, 1)]
        break
      case '2': // Product/Service Development
        occupations = [...PETROLEUM_OCCUPATIONS.engineering, ...PETROLEUM_OCCUPATIONS.quality.slice(0, 1)]
        break
      case '3': // Marketing/Sales
        occupations = [...PETROLEUM_OCCUPATIONS.marketing, ...PETROLEUM_OCCUPATIONS.management.slice(0, 1)]
        break
      case '4': // Deliver Products
        occupations = [...PETROLEUM_OCCUPATIONS.logistics, ...PETROLEUM_OCCUPATIONS.operations.slice(0, 2)]
        break
      case '5': // Deliver Services
        occupations = [...PETROLEUM_OCCUPATIONS.operations.slice(0, 3), ...PETROLEUM_OCCUPATIONS.maintenance.slice(0, 2)]
        break
      case '6': // Customer Service
        occupations = [...PETROLEUM_OCCUPATIONS.marketing.slice(0, 1), ...PETROLEUM_OCCUPATIONS.logistics.slice(0, 2)]
        break
      case '7': // HR
        occupations = [...PETROLEUM_OCCUPATIONS.hr]
        break
      case '8': // IT
        occupations = [...PETROLEUM_OCCUPATIONS.it]
        break
      case '9': // Finance
        occupations = [...PETROLEUM_OCCUPATIONS.finance]
        break
      case '10': // Assets
        occupations = [...PETROLEUM_OCCUPATIONS.maintenance, ...PETROLEUM_OCCUPATIONS.engineering.slice(0, 2)]
        break
      case '11': // Risk/Compliance
        occupations = [...PETROLEUM_OCCUPATIONS.compliance, ...PETROLEUM_OCCUPATIONS.hse.slice(0, 2)]
        break
      case '12': // External Relationships
        occupations = [...PETROLEUM_OCCUPATIONS.management, ...PETROLEUM_OCCUPATIONS.compliance.slice(0, 1)]
        break
      case '13': // Capabilities
        occupations = [...PETROLEUM_OCCUPATIONS.management, ...PETROLEUM_OCCUPATIONS.quality, ...PETROLEUM_OCCUPATIONS.it.slice(0, 1)]
        break
      default:
        occupations = [...PETROLEUM_OCCUPATIONS.operations.slice(0, 2), ...PETROLEUM_OCCUPATIONS.engineering.slice(0, 2)]
    }
  }

  // Get departments based on keywords and category
  let departments = getDepartmentsByKeywords()

  // If no keyword matches, use category-based defaults
  if (departments.length === 0) {
    switch (category) {
      case '1':
        departments = [...PETROLEUM_DEPARTMENTS.strategy]
        break
      case '2':
        departments = [...PETROLEUM_DEPARTMENTS.engineering, ...PETROLEUM_DEPARTMENTS.quality]
        break
      case '3':
        departments = [...PETROLEUM_DEPARTMENTS.marketing]
        break
      case '4':
      case '5':
        departments = [...PETROLEUM_DEPARTMENTS.operations, ...PETROLEUM_DEPARTMENTS.logistics]
        break
      case '6':
        departments = [...PETROLEUM_DEPARTMENTS.marketing.slice(0, 1), ...PETROLEUM_DEPARTMENTS.operations]
        break
      case '7':
        departments = [...PETROLEUM_DEPARTMENTS.hr]
        break
      case '8':
        departments = [...PETROLEUM_DEPARTMENTS.it]
        break
      case '9':
        departments = [...PETROLEUM_DEPARTMENTS.finance]
        break
      case '10':
        departments = [...PETROLEUM_DEPARTMENTS.maintenance, ...PETROLEUM_DEPARTMENTS.engineering]
        break
      case '11':
        departments = [...PETROLEUM_DEPARTMENTS.compliance, ...PETROLEUM_DEPARTMENTS.hse]
        break
      case '12':
        departments = [...PETROLEUM_DEPARTMENTS.strategy, ...PETROLEUM_DEPARTMENTS.compliance]
        break
      case '13':
        departments = [...PETROLEUM_DEPARTMENTS.strategy, ...PETROLEUM_DEPARTMENTS.quality]
        break
      default:
        departments = [...PETROLEUM_DEPARTMENTS.operations, ...PETROLEUM_DEPARTMENTS.hse]
    }
  }

  // Deduplicate and limit
  const uniqueOccupations = [...new Map(occupations.map(o => [o.path, o])).values()].slice(0, 5)
  const uniqueDepartments = [...new Map(departments.map(d => [d.path, d])).values()].slice(0, 4)

  return {
    occupations: uniqueOccupations,
    departments: uniqueDepartments,
    industryVariation: getIndustryVariation()
  }
}

function isActivityLevel(code: string): boolean {
  // Activity level is X.Y.Z.A (4 numbers) or X.Y.Z.A.B (5 numbers)
  const parts = code.split('.')
  return parts.length >= 4
}

function processFile(filePath: string): boolean {
  const content = fs.readFileSync(filePath, 'utf-8')

  // Parse frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
  if (!frontmatterMatch) return false

  const frontmatter = frontmatterMatch[1]
  const codeMatch = frontmatter.match(/code:\s*"([^"]+)"/)
  const nameMatch = frontmatter.match(/name:\s*"([^"]+)"/)

  if (!codeMatch || !nameMatch) return false

  const code = codeMatch[1]
  const name = nameMatch[1]

  // Only process activity-level files
  if (!isActivityLevel(code)) return false

  // Get the mapping for this process
  const mapping = getCategoryMapping(code, name)

  // Build new occupation section
  const occupationSection = `## Related Occupations

${mapping.occupations.map(o => `- [${o.name}](${o.path})`).join('\n')}`

  // Build new department section
  const departmentSection = `## Related Departments

${mapping.departments.map(d => `- [${d.name}](${d.path})`).join('\n')}`

  // Build industry variations section
  const industryVariationSection = `## Industry Variations

${mapping.industryVariation}`

  // Replace existing sections and add new ones
  let newContent = content

  // Replace Related Occupations section (handle variable newlines)
  newContent = newContent.replace(
    /## Related Occupations\n\n(?:- \[.*?\]\(.*?\)\n)+\n*/,
    occupationSection + '\n\n'
  )

  // Replace Related Departments section and everything after it (including Industry Variations if exists)
  newContent = newContent.replace(
    /## Related Departments\n\n(?:- \[.*?\]\(.*?\)\n)+\n*(?:## Industry Variations[\s\S]*)?$/,
    departmentSection + '\n\n' + industryVariationSection + '\n'
  )

  // Write updated content
  fs.writeFileSync(filePath, newContent)
  return true
}

async function main() {
  console.log('=== Enriching Petroleum Downstream Process Files ===\n')

  const files = fs.readdirSync(PROCESSES_DIR).filter(f => f.endsWith('.mdx'))
  let processed = 0
  let skipped = 0

  for (const file of files) {
    const filePath = path.join(PROCESSES_DIR, file)
    try {
      if (processFile(filePath)) {
        processed++
        if (processed % 500 === 0) {
          console.log(`  Processed ${processed} files...`)
        }
      } else {
        skipped++
      }
    } catch (error) {
      console.error(`  Error processing ${file}:`, error)
    }
  }

  console.log(`\n=== Complete ===`)
  console.log(`  Processed: ${processed} activity-level files`)
  console.log(`  Skipped: ${skipped} non-activity files`)
}

main().catch(console.error)
