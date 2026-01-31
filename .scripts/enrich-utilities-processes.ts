import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const utilitiesDir = path.join(__dirname, '../processes/industries/utilities');

// APQC Category mappings for utilities industry
// Based on the 13 APQC categories + utility-specific categories (14)

interface CategoryMapping {
  occupations: string[];
  departments: string[];
  industryVariations: string;
}

const categoryMappings: Record<string, CategoryMapping> = {
  // 1.0 - Develop Vision and Strategy
  '1': {
    occupations: [
      '[Chief Executives](/occupations/Management/ChiefExecutives)',
      '[General and Operations Managers](/occupations/Management/GeneralAndOperationsManagers)',
      '[Management Analysts](/occupations/Business/ManagementAnalysts)',
      '[Financial Managers](/occupations/Management/FinancialManagers)',
      '[Regulatory Affairs Managers](/occupations/Management/RegulatoryAffairsManagers)',
    ],
    departments: [
      '[Executive Office](/departments/Executive)',
      '[Strategic Planning](/departments/StrategicPlanning)',
      '[Regulatory Affairs](/departments/RegulatoryAffairs)',
      '[Finance](/departments/Finance)',
    ],
    industryVariations: `## Industry Variations

### Electric Utilities
- Strategy must align with grid modernization initiatives and renewable energy mandates
- Long-term integrated resource planning (IRP) required for generation portfolio
- NERC reliability standards influence strategic planning horizons
- Distributed energy resources (DERs) and customer-owned generation reshape traditional utility models

### Gas Utilities
- Pipeline safety and integrity management drive strategic investments
- Natural gas as transition fuel positions utilities in decarbonization debates
- Storage and peaking capacity strategies for seasonal demand variations
- Renewable natural gas (RNG) and hydrogen blending opportunities

### Water Utilities
- Asset management strategies address aging infrastructure (pipes often 50-100+ years old)
- Climate adaptation planning for drought, flooding, and water scarcity
- Source water protection and watershed management integral to strategy
- Conservation mandates may conflict with revenue requirements`,
  },

  // 2.0 - Design and Develop Products and Services
  '2': {
    occupations: [
      '[Marketing Managers](/occupations/Management/MarketingManagers)',
      '[Market Research Analysts and Marketing Specialists](/occupations/Business/MarketResearchAnalystsAndMarketingSpecialists)',
      '[Electrical Engineers](/occupations/Architecture/ElectricalEngineers)',
      '[Energy Auditors](/occupations/Construction/EnergyAuditors)',
      '[Regulatory Affairs Specialists](/occupations/Business/RegulatoryAffairsSpecialists)',
    ],
    departments: [
      '[Product Development](/departments/ProductDevelopment)',
      '[Marketing](/departments/Marketing)',
      '[Regulatory Affairs](/departments/RegulatoryAffairs)',
      '[Engineering](/departments/Engineering)',
    ],
    industryVariations: `## Industry Variations

### Electric Utilities
- Rate design involves time-of-use pricing, demand charges, and tiered structures
- New products include electric vehicle charging programs, battery storage, and demand response
- Tariff filings require Public Utility Commission (PUC) approval
- Green power programs and renewable energy certificates (RECs) offerings

### Gas Utilities
- Service offerings include equipment rebates, energy efficiency programs, and appliance repair services
- Rate cases involve cost allocation between residential, commercial, and industrial customers
- Transportation-only service for large industrial customers
- Combined heat and power (CHP) program development

### Water Utilities
- Conservation rate structures (increasing block rates) encourage efficiency
- Reclaimed water programs for irrigation and industrial use
- Fire protection services and hydrant maintenance programs
- Water quality testing and reporting services for customers`,
  },

  // 3.0 - Market and Sell Products and Services
  '3': {
    occupations: [
      '[Sales Managers](/occupations/Management/SalesManagers)',
      '[Marketing Managers](/occupations/Management/MarketingManagers)',
      '[Market Research Analysts and Marketing Specialists](/occupations/Business/MarketResearchAnalystsAndMarketingSpecialists)',
      '[Customer Service Representatives](/occupations/Office/CustomerServiceRepresentatives)',
      '[Public Relations Managers](/occupations/Management/PublicRelationsManagers)',
    ],
    departments: [
      '[Sales](/departments/Sales)',
      '[Marketing](/departments/Marketing)',
      '[Customer Service](/departments/CustomerService)',
      '[Communications](/departments/Communications)',
      '[Regulatory Affairs](/departments/RegulatoryAffairs)',
    ],
    industryVariations: `## Industry Variations

### Electric Utilities
- Limited traditional sales in regulated territories due to franchise monopolies
- Competitive retail markets in deregulated states require active marketing
- Key account management for large commercial and industrial (C&I) customers
- Energy efficiency and demand response program marketing
- Electric vehicle adoption campaigns and infrastructure partnerships

### Gas Utilities
- Fuel switching competition with electric utilities (especially for HVAC)
- Builder/developer programs for new construction gas service
- Appliance rebate program marketing for high-efficiency equipment
- CNG/LNG vehicle fuel sales for fleet customers
- Combined utility marketing for dual-fuel customers

### Water Utilities
- Limited sales function due to essential service monopoly
- Conservation messaging often primary marketing focus
- Developer relations for new service connections
- Public education on water quality and source protection
- Reclaimed water marketing to irrigation and industrial customers`,
  },

  // 4.0 - Deliver Physical Products
  '4': {
    occupations: [
      '[Electrical Power-Line Installers and Repairers](/occupations/Installation/ElectricalPowerLineInstallersAndRepairers)',
      '[Pipelayers](/occupations/Construction/Pipelayers)',
      '[Plumbers, Pipefitters, and Steamfitters](/occupations/Construction/PlumbersPipefittersAndSteamfitters)',
      '[Control and Valve Installers and Repairers](/occupations/Installation/ControlAndValveInstallersAndRepairersExceptMechanicalDoor)',
      '[Construction Managers](/occupations/Management/ConstructionManagers)',
    ],
    departments: [
      '[Distribution Operations](/departments/DistributionOperations)',
      '[Transmission Operations](/departments/TransmissionOperations)',
      '[Construction](/departments/Construction)',
      '[Engineering](/departments/Engineering)',
      '[Supply Chain](/departments/SupplyChain)',
    ],
    industryVariations: `## Industry Variations

### Electric Utilities
- Transmission and distribution (T&D) infrastructure delivery
- Grid interconnection for new generation sources including customer-owned DERs
- Substation construction and equipment installation
- Underground vs. overhead distribution system considerations
- Storm hardening and resilience investments

### Gas Utilities
- Pipeline construction with integrity management requirements
- Pressure regulation station installation and maintenance
- Meter set assemblies and service line installation
- Cathodic protection system deployment
- Pipeline replacement programs for aging infrastructure

### Water Utilities
- Main installation and replacement projects
- Pump station and storage tank construction
- Service line installation and meter setting
- Fire hydrant installation and maintenance
- Treatment plant construction and upgrades`,
  },

  // 5.0 - Deliver Services
  '5': {
    occupations: [
      '[Power Plant Operators](/occupations/Production/PowerPlantOperators)',
      '[Power Distributors and Dispatchers](/occupations/Production/PowerDistributorsAndDispatchers)',
      '[Water and Wastewater Treatment Plant and System Operators](/occupations/Production/WaterAndWastewaterTreatmentPlantAndSystemOperators)',
      '[Gas Plant Operators](/occupations/Production/GasPlantOperators)',
      '[Stationary Engineers and Boiler Operators](/occupations/Production/StationaryEngineersAndBoilerOperators)',
    ],
    departments: [
      '[Generation Operations](/departments/GenerationOperations)',
      '[System Operations](/departments/SystemOperations)',
      '[Treatment Operations](/departments/TreatmentOperations)',
      '[Field Services](/departments/FieldServices)',
      '[Dispatch](/departments/Dispatch)',
    ],
    industryVariations: `## Industry Variations

### Electric Utilities
- Real-time balancing of generation and load across interconnected grid
- Economic dispatch optimization for lowest-cost generation
- Renewable integration and intermittency management
- Demand response activation during peak periods
- Ancillary services provision (frequency regulation, reserves, voltage support)

### Gas Utilities
- System pressure management and balancing
- Gas quality monitoring and blending
- Storage injection and withdrawal scheduling
- Interruptible service curtailment procedures
- Emergency response for leaks and service interruptions

### Water Utilities
- Treatment process optimization for water quality compliance
- System pressure management and fire flow requirements
- Water quality sampling and monitoring schedules
- Emergency water supply and mutual aid agreements
- Boil water notices and public health notifications`,
  },

  // 6.0 - Manage Customer Service
  '6': {
    occupations: [
      '[Customer Service Representatives](/occupations/Office/CustomerServiceRepresentatives)',
      '[Meter Readers, Utilities](/occupations/Office/MeterReadersUtilities)',
      '[Bill and Account Collectors](/occupations/Office/BillAndAccountCollectors)',
      '[Dispatchers](/occupations/Office/DispatchersExceptPoliceFireAndAmbulance)',
      '[Office Clerks, General](/occupations/Office/OfficeClerkGeneral)',
    ],
    departments: [
      '[Customer Service](/departments/CustomerService)',
      '[Billing](/departments/Billing)',
      '[Collections](/departments/Collections)',
      '[Call Center](/departments/CallCenter)',
      '[Field Services](/departments/FieldServices)',
    ],
    industryVariations: `## Industry Variations

### Electric Utilities
- Meter-to-cash cycle management for millions of customer accounts
- Advanced metering infrastructure (AMI) enables remote meter reading and service connect/disconnect
- Time-of-use billing and demand charge explanations
- Net metering administration for solar customers
- Payment assistance and low-income program enrollment (LIHEAP, PIPP)

### Gas Utilities
- Seasonal billing variations require customer education
- Budget billing programs to level monthly payments
- Emergency gas leak reporting (24/7 call center operations)
- Appliance service programs and scheduling
- Safety messaging and carbon monoxide awareness

### Water Utilities
- High bill investigations often related to leaks or meter issues
- Conservation program enrollment and rebate processing
- Water quality complaint response and testing
- Backflow prevention program administration
- Cross-connection control and compliance`,
  },

  // 7.0 - Develop and Manage Human Capital
  '7': {
    occupations: [
      '[Human Resources Managers](/occupations/Management/HumanResourcesManagers)',
      '[Human Resources Specialists](/occupations/Business/HumanResourcesSpecialists)',
      '[Training and Development Managers](/occupations/Management/TrainingAndDevelopmentManagers)',
      '[Training and Development Specialists](/occupations/Business/TrainingAndDevelopmentSpecialists)',
      '[Compensation, Benefits, and Job Analysis Specialists](/occupations/Business/CompensationBenefitsAndJobAnalysisSpecialists)',
    ],
    departments: [
      '[Human Resources](/departments/HumanResources)',
      '[Training and Development](/departments/TrainingAndDevelopment)',
      '[Compensation and Benefits](/departments/CompensationAndBenefits)',
      '[Labor Relations](/departments/LaborRelations)',
      '[Safety](/departments/Safety)',
    ],
    industryVariations: `## Industry Variations

### Electric Utilities
- Specialized technical training for lineworkers, substation technicians, and power plant operators
- OSHA electrical safety certifications and NFPA 70E compliance training
- Apprenticeship programs typically 3-4 years for craft positions
- Workforce planning for aging workforce (many utilities facing 30-50% retirement eligibility)
- Union labor relations with IBEW and other trade unions

### Gas Utilities
- Pipeline operator qualification (OQ) programs per federal requirements
- Excavation safety and damage prevention training
- Hazmat and emergency response certifications
- Cross-training for multi-skilled technicians
- Safety culture programs focused on public and employee safety

### Water Utilities
- State certification requirements for treatment plant operators (varying levels)
- Cross-connection control specialist certification
- Confined space entry and trenching safety training
- Laboratory technician certifications for water quality testing
- Emergency response and incident command training`,
  },

  // 8.0 - Manage Information Technology
  '8': {
    occupations: [
      '[Computer and Information Systems Managers](/occupations/Management/ComputerAndInformationSystemsManagers)',
      '[Information Security Analysts](/occupations/Computer/InformationSecurityAnalysts)',
      '[Network and Computer Systems Administrators](/occupations/Computer/NetworkAndComputerSystemsAdministrators)',
      '[Software Developers](/occupations/Computer/SoftwareDevelopers)',
      '[Database Administrators](/occupations/Computer/DatabaseAdministrators)',
    ],
    departments: [
      '[Information Technology](/departments/InformationTechnology)',
      '[Cybersecurity](/departments/Cybersecurity)',
      '[Enterprise Systems](/departments/EnterpriseSystems)',
      '[Network Operations](/departments/NetworkOperations)',
      '[Data Management](/departments/DataManagement)',
    ],
    industryVariations: `## Industry Variations

### Electric Utilities
- Operational Technology (OT) security for SCADA/EMS systems critical to grid operations
- NERC CIP (Critical Infrastructure Protection) compliance mandatory for bulk electric system
- Advanced Metering Infrastructure (AMI) data management and analytics
- Distributed Energy Resource Management Systems (DERMS) implementation
- Grid modernization and smart grid technology deployment

### Gas Utilities
- Pipeline SCADA systems for monitoring and control
- Geographic Information Systems (GIS) for pipeline mapping and integrity management
- Mobile workforce management for field operations
- Leak detection system integration
- TSA Pipeline Security Guidelines compliance

### Water Utilities
- SCADA systems for treatment plant and distribution system control
- America's Water Infrastructure Act (AWIA) cybersecurity requirements
- Asset management systems for aging infrastructure
- Customer Information Systems (CIS) for billing and service
- Water quality monitoring and laboratory information management`,
  },

  // 9.0 - Manage Financial Resources
  '9': {
    occupations: [
      '[Financial Managers](/occupations/Management/FinancialManagers)',
      '[Accountants and Auditors](/occupations/Business/AccountantsAndAuditors)',
      '[Budget Analysts](/occupations/Business/BudgetAnalysts)',
      '[Financial and Investment Analysts](/occupations/Business/FinancialAndInvestmentAnalysts)',
      '[Treasurers and Controllers](/occupations/Management/TreasurersAndControllers)',
    ],
    departments: [
      '[Finance](/departments/Finance)',
      '[Accounting](/departments/Accounting)',
      '[Treasury](/departments/Treasury)',
      '[Budgeting](/departments/Budgeting)',
      '[Rates](/departments/Rates)',
    ],
    industryVariations: `## Industry Variations

### Electric Utilities
- Rate case filings to recover costs and earn authorized return on equity
- FERC Form 1 and state regulatory reporting requirements
- Fuel cost adjustment clauses for pass-through of generation costs
- Renewable energy credit (REC) accounting and tracking
- Capital structure optimization within regulatory constraints

### Gas Utilities
- Purchased gas adjustment (PGA) mechanisms for commodity cost recovery
- Weather normalization adjustments in rate design
- Infrastructure replacement surcharges for pipeline safety programs
- FERC Form 2 reporting for interstate pipelines
- Gas cost reconciliation and hedging programs

### Water Utilities
- Cash basis vs. utility basis accounting considerations
- Infrastructure Financing Authority (IFA) and State Revolving Fund (SRF) loan compliance
- Rate sufficiency analysis for bond covenants
- GASB pronouncements for government-owned utilities
- Developer contribution and capacity fee accounting`,
  },

  // 10.0 - Acquire, Construct, and Manage Assets
  '10': {
    occupations: [
      '[Construction Managers](/occupations/Management/ConstructionManagers)',
      '[Civil Engineers](/occupations/Architecture/CivilEngineers)',
      '[Electrical Engineers](/occupations/Architecture/ElectricalEngineers)',
      '[Industrial Machinery Mechanics](/occupations/Installation/IndustrialMachineryMechanics)',
      '[Facilities Managers](/occupations/Management/FacilitiesManagers)',
    ],
    departments: [
      '[Engineering](/departments/Engineering)',
      '[Construction](/departments/Construction)',
      '[Asset Management](/departments/AssetManagement)',
      '[Facilities](/departments/Facilities)',
      '[Planning](/departments/Planning)',
    ],
    industryVariations: `## Industry Variations

### Electric Utilities
- Generation asset management including power plants and renewable facilities
- Transmission and distribution asset health monitoring
- Substation equipment lifecycle management (transformers, breakers, switches)
- Vegetation management programs for right-of-way maintenance
- Grid hardening and resilience investments (undergrounding, composite poles)

### Gas Utilities
- Pipeline integrity management programs per federal regulations (DIMP, TIMP)
- Cathodic protection system maintenance
- Compressor station and regulator station asset management
- Meter and regulator replacement programs
- Plastic pipe fusion and steel pipe welding quality programs

### Water Utilities
- Treatment plant asset management (pumps, filters, chemical systems)
- Distribution system asset management (pipes, valves, hydrants)
- Storage tank inspection and maintenance programs
- Meter replacement and AMI deployment
- Lead service line replacement programs`,
  },

  // 11.0 - Manage Enterprise Risk, Compliance, Remediation, and Resiliency
  '11': {
    occupations: [
      '[Compliance Managers](/occupations/Management/ComplianceManagers)',
      '[Compliance Officers](/occupations/Business/ComplianceOfficers)',
      '[Environmental Compliance Inspectors](/occupations/Business/EnvironmentalComplianceInspectors)',
      '[Emergency Management Directors](/occupations/Management/EmergencyManagementDirectors)',
      '[Regulatory Affairs Managers](/occupations/Management/RegulatoryAffairsManagers)',
    ],
    departments: [
      '[Compliance](/departments/Compliance)',
      '[Risk Management](/departments/RiskManagement)',
      '[Environmental](/departments/Environmental)',
      '[Emergency Management](/departments/EmergencyManagement)',
      '[Regulatory Affairs](/departments/RegulatoryAffairs)',
    ],
    industryVariations: `## Industry Variations

### Electric Utilities
- NERC reliability standards compliance (mandatory with significant penalties)
- Environmental compliance (Clean Air Act, water permits for thermal plants)
- Nuclear Regulatory Commission (NRC) oversight for nuclear plants
- Wildfire risk management and Public Safety Power Shutoffs (PSPS)
- Cyber security compliance under NERC CIP standards

### Gas Utilities
- Pipeline and Hazardous Materials Safety Administration (PHMSA) compliance
- Distribution and Transmission Integrity Management Programs (DIMP/TIMP)
- State pipeline safety program oversight
- Emergency response and damage prevention programs
- Greenhouse gas emissions reporting and reduction programs

### Water Utilities
- Safe Drinking Water Act (SDWA) compliance and primacy agency oversight
- Clean Water Act compliance for wastewater discharges
- America's Water Infrastructure Act (AWIA) risk assessments
- Source water protection and contamination prevention
- Emergency response plans and mutual aid agreements`,
  },

  // 12.0 - Manage External Relationships
  '12': {
    occupations: [
      '[Public Relations Managers](/occupations/Management/PublicRelationsManagers)',
      '[Lawyers](/occupations/Legal/Lawyers)',
      '[Regulatory Affairs Specialists](/occupations/Business/RegulatoryAffairsSpecialists)',
      '[Government Relations Specialists](/occupations/Business/PublicRelationsSpecialists)',
      '[Management Analysts](/occupations/Business/ManagementAnalysts)',
    ],
    departments: [
      '[Government Relations](/departments/GovernmentRelations)',
      '[Regulatory Affairs](/departments/RegulatoryAffairs)',
      '[Legal](/departments/Legal)',
      '[Communications](/departments/Communications)',
      '[Community Relations](/departments/CommunityRelations)',
    ],
    industryVariations: `## Industry Variations

### Electric Utilities
- Public Utility Commission (PUC) and FERC regulatory relationships
- Regional Transmission Organization (RTO/ISO) coordination
- Interconnection with neighboring utilities and independent power producers
- Environmental advocacy groups and renewable energy stakeholders
- Local government franchise agreements and right-of-way negotiations

### Gas Utilities
- State utility commission rate case proceedings
- PHMSA and state pipeline safety regulator relationships
- Local government coordination for pipeline routing and permits
- Industry associations (AGA, state gas associations)
- Environmental groups regarding methane emissions and climate policy

### Water Utilities
- State drinking water primacy agency relationships
- Environmental Protection Agency (EPA) coordination
- Local health departments for water quality matters
- Environmental advocacy groups regarding watershed protection
- Municipal/county government relationships for public utilities`,
  },

  // 13.0 - Develop and Manage Business Capabilities
  '13': {
    occupations: [
      '[Management Analysts](/occupations/Business/ManagementAnalysts)',
      '[Business Operations Specialists](/occupations/Business/BusinessOperationsSpecialists)',
      '[Project Management Specialists](/occupations/Business/ProjectManagementSpecialists)',
      '[Training and Development Specialists](/occupations/Business/TrainingAndDevelopmentSpecialists)',
      '[Industrial Engineers](/occupations/Architecture/IndustrialEngineers)',
    ],
    departments: [
      '[Business Transformation](/departments/BusinessTransformation)',
      '[Process Improvement](/departments/ProcessImprovement)',
      '[Project Management Office](/departments/ProjectManagementOffice)',
      '[Knowledge Management](/departments/KnowledgeManagement)',
      '[Quality Assurance](/departments/QualityAssurance)',
    ],
    industryVariations: `## Industry Variations

### Electric Utilities
- Grid modernization program management and benefits realization
- Advanced analytics capabilities for predictive maintenance
- Customer experience transformation with digital channels
- Distributed energy resource integration capabilities
- Workforce development for emerging technologies (battery storage, EVs)

### Gas Utilities
- Pipeline replacement program execution and tracking
- Geographic Information System (GIS) capabilities
- Mobile workforce enablement
- Damage prevention and excavation notification systems
- Methane emissions reduction capabilities

### Water Utilities
- Asset management maturity improvement programs
- Water loss reduction and non-revenue water programs
- Customer portal and digital engagement capabilities
- Automated meter reading/AMI implementation
- Treatment process optimization capabilities`,
  },

  // 14.0 - Utility-specific processes (Meter to Cash, Field Operations, etc.)
  '14': {
    occupations: [
      '[Meter Readers, Utilities](/occupations/Office/MeterReadersUtilities)',
      '[Power Plant Operators](/occupations/Production/PowerPlantOperators)',
      '[Water and Wastewater Treatment Plant and System Operators](/occupations/Production/WaterAndWastewaterTreatmentPlantAndSystemOperators)',
      '[Electrical Power-Line Installers and Repairers](/occupations/Installation/ElectricalPowerLineInstallersAndRepairers)',
      '[Control and Valve Installers and Repairers](/occupations/Installation/ControlAndValveInstallersAndRepairersExceptMechanicalDoor)',
    ],
    departments: [
      '[Metering](/departments/Metering)',
      '[Field Operations](/departments/FieldOperations)',
      '[Revenue Protection](/departments/RevenueProtection)',
      '[System Operations](/departments/SystemOperations)',
      '[Dispatch](/departments/Dispatch)',
    ],
    industryVariations: `## Industry Variations

### Electric Utilities
- Advanced Metering Infrastructure (AMI) enables remote reading, connect/disconnect, and outage detection
- Meter-to-cash cycle optimized with interval data and automated billing
- Outage Management System (OMS) integration with AMI for faster restoration
- Revenue protection programs address theft and tampering
- Net metering for customer-owned generation requires bidirectional metering

### Gas Utilities
- Meter reading routes optimized for safety and efficiency
- Automated meter reading (AMR) deployment reduces manual reads
- High-bill investigations may require meter testing and calibration
- Service disconnection requires physical presence due to safety
- Pressure monitoring at customer meters for system integrity

### Water Utilities
- Meter reading frequency varies (monthly, bi-monthly, quarterly)
- AMI deployment enables leak detection alerts to customers
- Large meter testing and accuracy verification programs
- Fire service meter and backflow testing requirements
- Estimated billing policies when meters are inaccessible`,
  },
};

// Sub-category specific variations for more precise mapping
const subCategoryMappings: Record<string, Partial<CategoryMapping>> = {
  // 1.1 - Define business concept and long-range vision
  '1.1': {
    occupations: [
      '[Chief Executives](/occupations/Management/ChiefExecutives)',
      '[General and Operations Managers](/occupations/Management/GeneralAndOperationsManagers)',
      '[Management Analysts](/occupations/Business/ManagementAnalysts)',
      '[Financial Managers](/occupations/Management/FinancialManagers)',
    ],
  },
  // 3.3 - Develop and manage pricing
  '3.3': {
    occupations: [
      '[Financial Managers](/occupations/Management/FinancialManagers)',
      '[Budget Analysts](/occupations/Business/BudgetAnalysts)',
      '[Regulatory Affairs Specialists](/occupations/Business/RegulatoryAffairsSpecialists)',
      '[Economists](/occupations/Social/Economists)',
      '[Financial and Investment Analysts](/occupations/Business/FinancialAndInvestmentAnalysts)',
    ],
    departments: [
      '[Rates](/departments/Rates)',
      '[Regulatory Affairs](/departments/RegulatoryAffairs)',
      '[Finance](/departments/Finance)',
      '[Pricing](/departments/Pricing)',
    ],
    industryVariations: `## Industry Variations

### Electric Utilities
- General rate cases filed every 3-5 years to establish revenue requirements
- Fuel adjustment clauses allow pass-through of generation fuel costs between rate cases
- Decoupling mechanisms separate revenue from volumetric sales
- Time-of-use and demand-based rate structures encourage load shifting
- Renewable portfolio standard compliance costs recovered through riders
- FERC-jurisdictional transmission rates for wholesale/interstate service

### Gas Utilities
- Purchased gas adjustment (PGA) mechanisms for commodity cost recovery
- Infrastructure replacement surcharges (pipeline safety programs)
- Weather normalization adjustments in rate design
- Straight-fixed-variable rate design allocates fixed costs appropriately
- Choice program transportation rates for competitive supply
- Interruptible vs. firm service pricing differentials

### Water Utilities
- Conservation rate structures (increasing block rates) balance revenue stability
- Infrastructure surcharges for pipe replacement programs
- Fire protection charges separate from consumption-based rates
- Capacity fees and system development charges for new connections
- Lifeline rates and low-income assistance programs
- Rate sufficiency for bond covenant compliance`,
  },
  // 7.5 - Reward and retain employees
  '7.5': {
    occupations: [
      '[Compensation and Benefits Managers](/occupations/Management/CompensationAndBenefitsManagers)',
      '[Compensation, Benefits, and Job Analysis Specialists](/occupations/Business/CompensationBenefitsAndJobAnalysisSpecialists)',
      '[Human Resources Managers](/occupations/Management/HumanResourcesManagers)',
      '[Payroll and Timekeeping Clerks](/occupations/Office/PayrollAndTimekeepingClerks)',
    ],
    departments: [
      '[Compensation and Benefits](/departments/CompensationAndBenefits)',
      '[Human Resources](/departments/HumanResources)',
      '[Payroll](/departments/Payroll)',
    ],
    industryVariations: `## Industry Variations

### Electric Utilities
- Competitive compensation for skilled trades (lineworkers command premium wages)
- Defined benefit pension plans common in utility industry
- Shift differential pay for 24/7 operations (generation, dispatch)
- Storm restoration overtime and mutual aid compensation
- Union negotiated wages and benefits (IBEW, UWUA)
- Safety incentive programs tied to OSHA recordable rates

### Gas Utilities
- Hazardous duty pay for pipeline workers
- On-call compensation for emergency response
- Incentive pay for leak survey and compliance metrics
- Retention bonuses for certified pipeline professionals
- Multi-skilled worker compensation structures
- Wellness programs addressing physical job demands

### Water Utilities
- Operator certification pay differentials
- Standby and call-out pay for system emergencies
- Public sector pension and benefit structures (government-owned)
- Collective bargaining with AFSCME and similar unions
- Health benefits addressing waterborne pathogen exposure
- Longevity pay rewarding institutional knowledge`,
  },
  // 8.3 - Develop and manage IT resilience
  '8.3': {
    occupations: [
      '[Information Security Analysts](/occupations/Computer/InformationSecurityAnalysts)',
      '[Computer and Information Systems Managers](/occupations/Management/ComputerAndInformationSystemsManagers)',
      '[Network and Computer Systems Administrators](/occupations/Computer/NetworkAndComputerSystemsAdministrators)',
      '[Database Administrators](/occupations/Computer/DatabaseAdministrators)',
      '[Business Continuity Planners](/occupations/Business/BusinessContinuityPlanners)',
    ],
    departments: [
      '[Cybersecurity](/departments/Cybersecurity)',
      '[Information Technology](/departments/InformationTechnology)',
      '[Business Continuity](/departments/BusinessContinuity)',
      '[Network Operations](/departments/NetworkOperations)',
    ],
    industryVariations: `## Industry Variations

### Electric Utilities
- NERC CIP (Critical Infrastructure Protection) compliance mandatory for bulk electric system
- Operational Technology (OT) and Information Technology (IT) convergence challenges
- Energy Management System (EMS) and SCADA cybersecurity
- Supply chain security for grid components and software
- Insider threat programs for critical access positions
- Incident response coordination with E-ISAC and federal agencies

### Gas Utilities
- TSA Pipeline Security Directives compliance (post-Colonial Pipeline)
- SCADA system hardening and network segmentation
- Physical security integration with cybersecurity
- Third-party risk management for pipeline contractors
- OT security for compressor stations and control centers
- Coordination with natural gas ISAC

### Water Utilities
- America's Water Infrastructure Act (AWIA) Section 2013 requirements
- Risk and Resilience Assessment (RRA) and Emergency Response Plans
- Process control system security for treatment plants
- Remote access security for distributed assets
- Water ISAC membership and threat sharing
- State drinking water program cyber requirements`,
  },
  // 9.3 - Perform revenue accounting
  '9.3': {
    occupations: [
      '[Accountants and Auditors](/occupations/Business/AccountantsAndAuditors)',
      '[Financial Managers](/occupations/Management/FinancialManagers)',
      '[Billing and Posting Clerks](/occupations/Office/BillingAndPostingClerks)',
      '[Bookkeeping, Accounting, and Auditing Clerks](/occupations/Office/BookkeepingAccountingAndAuditingClerks)',
    ],
    departments: [
      '[Accounting](/departments/Accounting)',
      '[Revenue Accounting](/departments/RevenueAccounting)',
      '[Finance](/departments/Finance)',
      '[Billing](/departments/Billing)',
    ],
  },
  // 9.5 - Process accounts payable and expense reimbursements
  '9.5': {
    occupations: [
      '[Accountants and Auditors](/occupations/Business/AccountantsAndAuditors)',
      '[Financial Managers](/occupations/Management/FinancialManagers)',
      '[Bookkeeping, Accounting, and Auditing Clerks](/occupations/Office/BookkeepingAccountingAndAuditingClerks)',
      '[Purchasing Agents](/occupations/Business/PurchasingAgentsExceptWholesaleRetailAndFarmProducts)',
    ],
    departments: [
      '[Accounts Payable](/departments/AccountsPayable)',
      '[Accounting](/departments/Accounting)',
      '[Finance](/departments/Finance)',
      '[Procurement](/departments/Procurement)',
    ],
  },
  // 9.7 - Manage taxes
  '9.7': {
    occupations: [
      '[Accountants and Auditors](/occupations/Business/AccountantsAndAuditors)',
      '[Financial Managers](/occupations/Management/FinancialManagers)',
      '[Tax Examiners and Collectors, and Revenue Agents](/occupations/Business/TaxExaminersAndCollectorsAndRevenueAgents)',
      '[Tax Preparers](/occupations/Business/TaxPreparers)',
    ],
    departments: [
      '[Tax](/departments/Tax)',
      '[Accounting](/departments/Accounting)',
      '[Finance](/departments/Finance)',
      '[Legal](/departments/Legal)',
    ],
  },
  // 14.3 - Meter reading and billing
  '14.3': {
    occupations: [
      '[Meter Readers, Utilities](/occupations/Office/MeterReadersUtilities)',
      '[Billing and Posting Clerks](/occupations/Office/BillingAndPostingClerks)',
      '[Customer Service Representatives](/occupations/Office/CustomerServiceRepresentatives)',
      '[Control and Valve Installers and Repairers](/occupations/Installation/ControlAndValveInstallersAndRepairersExceptMechanicalDoor)',
    ],
    departments: [
      '[Metering](/departments/Metering)',
      '[Billing](/departments/Billing)',
      '[Customer Service](/departments/CustomerService)',
      '[Field Services](/departments/FieldServices)',
    ],
    industryVariations: `## Industry Variations

### Electric Utilities
- AMI (Advanced Metering Infrastructure) enables 15-minute interval data collection
- Head-end systems aggregate meter data for billing and analytics
- Meter Data Management Systems (MDMS) validate and store usage data
- Net metering calculations for customer-owned solar generation
- Green Button data standards for customer data access
- Demand response integration with interval metering

### Gas Utilities
- Temperature and pressure compensation for accurate measurement
- Rotary and diaphragm meters for different load sizes
- Corrector devices adjust for gas composition variations
- EFM (Electronic Flow Measurement) for large commercial/industrial
- Meter proving and calibration schedules
- Theft detection through unmeasured gas analysis

### Water Utilities
- Positive displacement meters for residential accuracy
- Compound meters for variable flow commercial accounts
- Automatic Meter Reading (AMR) vs. AMI deployment decisions
- Leak detection alerts based on continuous flow patterns
- Large meter testing programs per AWWA standards
- Meter replacement programs based on age and accuracy`,
  },
  // 10.3 - Manage maintenance and repair
  '10.3': {
    occupations: [
      '[Industrial Machinery Mechanics](/occupations/Installation/IndustrialMachineryMechanics)',
      '[Electrical Power-Line Installers and Repairers](/occupations/Installation/ElectricalPowerLineInstallersAndRepairers)',
      '[Electrical and Electronics Repairers, Powerhouse, Substation, and Relay](/occupations/Installation/ElectricalAndElectronicsRepairersPowerhouseSubstationAndRelay)',
      '[Control and Valve Installers and Repairers](/occupations/Installation/ControlAndValveInstallersAndRepairersExceptMechanicalDoor)',
      '[Maintenance and Repair Workers, General](/occupations/Installation/MaintenanceAndRepairWorkersGeneral)',
    ],
    departments: [
      '[Maintenance](/departments/Maintenance)',
      '[Field Operations](/departments/FieldOperations)',
      '[Asset Management](/departments/AssetManagement)',
      '[Engineering](/departments/Engineering)',
    ],
    industryVariations: `## Industry Variations

### Electric Utilities
- Preventive maintenance schedules for substations, transformers, breakers
- Predictive maintenance using dissolved gas analysis and thermal imaging
- Vegetation management for distribution line clearance (tree trimming)
- Pole inspection and treatment/replacement programs
- Generator maintenance outage coordination with system operators
- Underground cable testing and fault location

### Gas Utilities
- Pipeline integrity management programs (DIMP for distribution, TIMP for transmission)
- Leak survey and repair programs per regulatory requirements
- Cathodic protection system monitoring and maintenance
- Regulator station maintenance and pressure testing
- Valve exercising programs for emergency shutoff capability
- Meter and service line maintenance protocols

### Water Utilities
- Valve exercising and replacement programs
- Hydrant flushing and maintenance schedules
- Pump station preventive maintenance
- Treatment plant equipment maintenance protocols
- Tank inspection and cleaning programs
- Main break repair and restoration procedures`,
  },
  // 11.1 - Develop enterprise risk management framework
  '11.1': {
    occupations: [
      '[Compliance Managers](/occupations/Management/ComplianceManagers)',
      '[Risk Management Specialists](/occupations/Business/CreditAnalysts)',
      '[Emergency Management Directors](/occupations/Management/EmergencyManagementDirectors)',
      '[Environmental Compliance Inspectors](/occupations/Business/EnvironmentalComplianceInspectors)',
      '[Regulatory Affairs Managers](/occupations/Management/RegulatoryAffairsManagers)',
    ],
    departments: [
      '[Risk Management](/departments/RiskManagement)',
      '[Compliance](/departments/Compliance)',
      '[Emergency Management](/departments/EmergencyManagement)',
      '[Regulatory Affairs](/departments/RegulatoryAffairs)',
      '[Legal](/departments/Legal)',
    ],
    industryVariations: `## Industry Variations

### Electric Utilities
- Enterprise risk management frameworks address operational, financial, regulatory, and strategic risks
- Grid reliability risks (NERC violations carry significant penalties)
- Wildfire liability risks driving vegetation management and PSPS programs
- Commodity price risk for fuel procurement and power purchases
- Cybersecurity risks to critical infrastructure
- Workforce risks from aging demographics and skilled labor shortages

### Gas Utilities
- Safety risk assessment central to enterprise risk framework
- Pipeline integrity risks (excavation damage, corrosion, material defects)
- Public safety risks from leaks and explosions
- Regulatory compliance risks (PHMSA, state commissions)
- Climate transition risks (stranded assets, policy changes)
- Customer migration risks from electrification

### Water Utilities
- Water quality risks (contamination, treatment failures)
- Infrastructure failure risks (main breaks, dam safety)
- Source water protection risks (drought, contamination)
- Financial risks (revenue sufficiency, rate affordability)
- Cybersecurity risks to treatment and distribution systems
- Climate adaptation risks (flooding, drought, sea level rise)`,
  },
  // 6.2 - Manage customer service operations
  '6.2': {
    occupations: [
      '[Customer Service Representatives](/occupations/Office/CustomerServiceRepresentatives)',
      '[Dispatchers, Except Police, Fire, and Ambulance](/occupations/Office/DispatchersExceptPoliceFireAndAmbulance)',
      '[Bill and Account Collectors](/occupations/Office/BillAndAccountCollectors)',
      '[Office Clerks, General](/occupations/Office/OfficeClerkGeneral)',
      '[First-Line Supervisors of Office and Administrative Support Workers](/occupations/Office/FirstLineSupervisorsOfOfficeAndAdministrativeSupportWorkers)',
    ],
    departments: [
      '[Customer Service](/departments/CustomerService)',
      '[Call Center](/departments/CallCenter)',
      '[Field Services](/departments/FieldServices)',
      '[Dispatch](/departments/Dispatch)',
      '[Collections](/departments/Collections)',
    ],
    industryVariations: `## Industry Variations

### Electric Utilities
- Outage reporting and restoration status updates (critical service expectation)
- High bill investigation protocols for usage spikes
- Service connection and disconnection scheduling
- Net metering and interconnection customer support
- Time-of-use rate education and enrollment
- Electric vehicle program support and charging station assistance

### Gas Utilities
- Gas leak reporting (24/7 emergency response required)
- Appliance service scheduling and support
- Carbon monoxide safety education and response
- Budget billing enrollment and adjustments
- Service restoration after shutoff (safety inspection required)
- Gas conversion and new construction coordination

### Water Utilities
- Water quality complaints and testing requests
- High bill investigations (often leak-related)
- Service connection and meter installation scheduling
- Conservation program support and rebate processing
- Boil water notice communications
- Cross-connection and backflow program administration`,
  },
  // 4.2 - Procure materials and services
  '4.2': {
    occupations: [
      '[Purchasing Managers](/occupations/Management/PurchasingManagers)',
      '[Purchasing Agents, Except Wholesale, Retail, and Farm Products](/occupations/Business/PurchasingAgentsExceptWholesaleRetailAndFarmProducts)',
      '[Supply Chain Managers](/occupations/Management/SupplyChainManagers)',
      '[Logisticians](/occupations/Business/Logisticians)',
      '[Contract Specialists](/occupations/Business/ComplianceOfficers)',
    ],
    departments: [
      '[Procurement](/departments/Procurement)',
      '[Supply Chain](/departments/SupplyChain)',
      '[Contracts](/departments/Contracts)',
      '[Materials Management](/departments/MaterialsManagement)',
      '[Warehouse](/departments/Warehouse)',
    ],
    industryVariations: `## Industry Variations

### Electric Utilities
- Long-lead time equipment procurement (transformers, turbines - 12-24 months)
- Strategic inventory for storm restoration (poles, wire, transformers)
- Fuel procurement and hedging strategies for generation
- Renewable energy equipment sourcing (solar panels, wind turbines, batteries)
- Supplier qualification for safety-critical components
- Joint purchasing arrangements through industry cooperatives

### Gas Utilities
- Pipeline material procurement with quality assurance requirements
- Meter and regulator inventory management
- Emergency repair materials stockpiling
- Cathodic protection materials and equipment
- Vehicle and equipment fleet procurement
- Gas supply procurement and portfolio management

### Water Utilities
- Treatment chemicals procurement (chlorine, fluoride, coagulants)
- Pipe and fitting materials (various types: DI, HDPE, PVC)
- Pump and motor equipment sourcing
- Meter procurement and inventory management
- Laboratory supplies and testing equipment
- Emergency response equipment and materials`,
  },
};

function getMapping(code: string): CategoryMapping {
  // Extract the major category (first number)
  const parts = code.split('.');
  const majorCategory = parts[0];
  const subCategory = parts.length >= 2 ? `${parts[0]}.${parts[1]}` : null;

  // Start with the major category mapping
  const baseMapping = categoryMappings[majorCategory] || categoryMappings['1'];

  // If there's a sub-category mapping, merge it (sub-category takes precedence)
  if (subCategory && subCategoryMappings[subCategory]) {
    const subMapping = subCategoryMappings[subCategory];
    return {
      occupations: subMapping.occupations || baseMapping.occupations,
      departments: subMapping.departments || baseMapping.departments,
      industryVariations: subMapping.industryVariations || baseMapping.industryVariations,
    };
  }

  return baseMapping;
}

function processFile(filePath: string): void {
  const content = fs.readFileSync(filePath, 'utf-8');

  // Extract the APQC code from frontmatter
  const codeMatch = content.match(/code:\s*"([^"]+)"/);
  if (!codeMatch) {
    console.log(`Skipping ${filePath} - no code found`);
    return;
  }

  const code = codeMatch[1];

  // Only process Activity-level files (X.Y.Z.A pattern)
  const codeParts = code.split('.');
  if (codeParts.length < 4) {
    console.log(`Skipping ${filePath} - not Activity level (${code})`);
    return;
  }

  const mapping = getMapping(code);

  // Build the new Related Occupations section
  const occupationsSection = `## Related Occupations

${mapping.occupations.map(occ => `- ${occ}`).join('\n')}`;

  // Build the new Related Departments section
  const departmentsSection = `## Related Departments

${mapping.departments.map(dept => `- ${dept}`).join('\n')}`;

  // Find and replace the existing Related Occupations section
  let newContent = content.replace(
    /## Related Occupations\n\n(?:- \[.*?\]\(.*?\)\n)+\n*/,
    `${occupationsSection}\n\n`
  );

  // Remove existing Industry Variations section if present
  newContent = newContent.replace(
    /## Industry Variations\n\n[\s\S]*$/,
    ''
  );

  // Find and replace the existing Related Departments section (now should be at end)
  newContent = newContent.replace(
    /## Related Departments\n\n(?:- \[.*?\]\(.*?\)\n)+\n*$/,
    `${departmentsSection}\n\n${mapping.industryVariations}\n`
  );

  // Write the updated content
  fs.writeFileSync(filePath, newContent);
  console.log(`Updated ${path.basename(filePath)} (${code})`);
}

function main(): void {
  // Get all mdx files in the utilities directory
  const files = fs.readdirSync(utilitiesDir)
    .filter(f => f.endsWith('.mdx') && f !== 'index.mdx');

  console.log(`Found ${files.length} files to process`);

  let processed = 0;
  let skipped = 0;

  for (const file of files) {
    const filePath = path.join(utilitiesDir, file);
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const codeMatch = content.match(/code:\s*"([^"]+)"/);

      if (codeMatch) {
        const codeParts = codeMatch[1].split('.');
        if (codeParts.length >= 4) {
          processFile(filePath);
          processed++;
        } else {
          skipped++;
        }
      } else {
        skipped++;
      }
    } catch (error) {
      console.error(`Error processing ${file}:`, error);
    }
  }

  console.log(`\nProcessed: ${processed} files`);
  console.log(`Skipped: ${skipped} files (not Activity level)`);
}

main();
