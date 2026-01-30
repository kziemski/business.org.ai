import { readFileSync, writeFileSync, statSync } from 'fs'
import { execSync } from 'child_process'
import { resolve, relative } from 'path'

const ROOT = '/Users/nathanclevenger/projects/business.org.ai'
const INDUSTRIES_DIR = `${ROOT}/industries`

// Find all MDX files excluding the template
const allFiles = execSync(`find ${INDUSTRIES_DIR} -name "*.mdx" -not -name "\\[Industry\\].mdx"`, { encoding: 'utf-8' })
  .trim().split('\n').filter(Boolean)

console.log(`Found ${allFiles.length} total MDX files`)

// Sector folder name -> NAICS code prefix mapping (from index.mdx frontmatter)
const sectorMap: Record<string, string> = {
  Agriculture: '11',
  Mining: '21',
  OilAndGas: '21',
  Quarrying: '21',
  Utilities: '22',
  Construction: '23',
  Manufacturing: '31',
  Wholesale: '42',
  Retail: '44',
  TransportationAndWarehousing: '48',
  Information: '51',
  Finance: '52',
  Insurance: '524',
  RealEstate: '531',
  Rental: '532',
  Leasing: '533',
  Scientific: '54',
  TechnicalServices: '54',
  Management: '55',
  Enterprises: '55',
  Administrative: '56',
  Support: '56',
  Education: '61',
  Healthcare: '62',
  Entertainment: '71',
  Accommodation: '72',
  OtherServices: '81',
  PublicAdministration: '92',
}

// Sector -> occupation data
interface OccupationLink {
  id: string
  name: string
  description: string
}

const sectorOccupations: Record<string, OccupationLink[]> = {
  '11': [
    { id: 'FarmersRanchersAndOtherAgriculturalManagers', name: 'Farmers, Ranchers, and Other Agricultural Managers', description: 'Plan, direct, or coordinate farm operations' },
    { id: 'AgriculturalEngineers', name: 'Agricultural Engineers', description: 'Apply engineering principles to agriculture' },
    { id: 'AgriculturalTechnicians', name: 'Agricultural Technicians', description: 'Food and fiber production and management' },
    { id: 'FarmEquipmentMechanics', name: 'Farm Equipment Mechanics', description: 'Maintain and repair agricultural equipment' },
  ],
  '21': [
    { id: 'MiningAndGeologicalEngineers', name: 'Mining and Geological Engineers', description: 'Design mines and extraction systems' },
    { id: 'GeologicalTechniciansExceptHydrologicTechnicians', name: 'Geological Technicians', description: 'Assist geologists in exploration' },
    { id: 'ContinuousMiningMachineOperators', name: 'Continuous Mining Machine Operators', description: 'Operate mining machinery' },
    { id: 'RotaryDrillOperatorsOilAndGas', name: 'Rotary Drill Operators, Oil and Gas', description: 'Operate drilling equipment' },
  ],
  '22': [
    { id: 'ElectricalEngineers', name: 'Electrical Engineers', description: 'Design electrical systems and equipment' },
    { id: 'EnergyEngineersExceptWindAndSolar', name: 'Energy Engineers', description: 'Design energy-efficient systems' },
    { id: 'PowerPlantOperators', name: 'Power Plant Operators', description: 'Control power generation systems' },
    { id: 'WaterAndWastewaterTreatmentPlantAndSystemOperators', name: 'Water Treatment Plant Operators', description: 'Operate water treatment facilities' },
  ],
  '23': [
    { id: 'ConstructionManagers', name: 'Construction Managers', description: 'Plan and coordinate construction projects' },
    { id: 'Carpenters', name: 'Carpenters', description: 'Construct and repair building frameworks' },
    { id: 'Electricians', name: 'Electricians', description: 'Install and maintain electrical systems' },
    { id: 'ConstructionLaborers', name: 'Construction Laborers', description: 'Perform physical labor at construction sites' },
  ],
  '31': [
    { id: 'IndustrialProductionManagers', name: 'Industrial Production Managers', description: 'Oversee daily operations of manufacturing plants' },
    { id: 'IndustrialEngineers', name: 'Industrial Engineers', description: 'Design efficient production systems' },
    { id: 'MachinistsAndToolAndDieMakers', name: 'Machinists', description: 'Operate machine tools to produce parts' },
    { id: 'QualityControlAnalysts', name: 'Quality Control Analysts', description: 'Inspect products for quality standards' },
  ],
  '42': [
    { id: 'PurchasingManagers', name: 'Purchasing Managers', description: 'Plan and coordinate purchasing activities' },
    { id: 'WholesaleAndRetailBuyersExceptFarmProducts', name: 'Wholesale and Retail Buyers', description: 'Buy merchandise for resale' },
    { id: 'SalesRepresentativesWholesaleAndManufacturingExceptTechnicalAndScientificProducts', name: 'Sales Representatives, Wholesale', description: 'Sell goods to businesses' },
    { id: 'Logisticians', name: 'Logisticians', description: 'Coordinate supply chain operations' },
  ],
  '44': [
    { id: 'SalesManagers', name: 'Sales Managers', description: 'Direct sales teams and set goals' },
    { id: 'RetailSalespersons', name: 'Retail Salespersons', description: 'Sell merchandise in retail settings' },
    { id: 'Cashiers', name: 'Cashiers', description: 'Process customer transactions' },
    { id: 'FirstLineSupervisorsOfRetailSalesWorkers', name: 'First-Line Supervisors of Retail Sales Workers', description: 'Supervise retail staff' },
  ],
  '48': [
    { id: 'TransportationStorageAndDistributionManagers', name: 'Transportation, Storage, and Distribution Managers', description: 'Plan and direct transportation operations' },
    { id: 'Logisticians', name: 'Logisticians', description: 'Analyze and coordinate supply chain' },
    { id: 'TransportationEngineers', name: 'Transportation Engineers', description: 'Design transportation infrastructure' },
    { id: 'LogisticsAnalysts', name: 'Logistics Analysts', description: 'Analyze logistics data to optimize operations' },
  ],
  '51': [
    { id: 'ComputerAndInformationSystemsManagers', name: 'Computer and Information Systems Managers', description: 'Plan and direct IT activities' },
    { id: 'SoftwareDevelopers', name: 'Software Developers', description: 'Design and develop software applications' },
    { id: 'InformationSecurityAnalysts', name: 'Information Security Analysts', description: 'Plan and implement security measures' },
    { id: 'DatabaseAdministrators', name: 'Database Administrators', description: 'Administer and maintain databases' },
  ],
  '52': [
    { id: 'FinancialManagers', name: 'Financial Managers', description: 'Direct financial activities of organizations' },
    { id: 'AccountantsAndAuditors', name: 'Accountants and Auditors', description: 'Examine and prepare financial records' },
    { id: 'LoanOfficers', name: 'Loan Officers', description: 'Evaluate and authorize loan applications' },
    { id: 'FinancialAndInvestmentAnalysts', name: 'Financial and Investment Analysts', description: 'Analyze financial data and investment opportunities' },
  ],
  '524': [
    { id: 'InsuranceUnderwriters', name: 'Insurance Underwriters', description: 'Evaluate insurance applications and risk' },
    { id: 'Actuaries', name: 'Actuaries', description: 'Analyze statistical data to estimate risk' },
    { id: 'ClaimsAdjustersExaminersAndInvestigators', name: 'Claims Adjusters, Examiners, and Investigators', description: 'Process insurance claims' },
    { id: 'InsuranceSalesAgents', name: 'Insurance Sales Agents', description: 'Sell insurance policies' },
  ],
  '531': [
    { id: 'PropertyRealEstateAndCommunityAssociationManagers', name: 'Property and Real Estate Managers', description: 'Manage real property operations' },
    { id: 'RealEstateBrokers', name: 'Real Estate Brokers', description: 'Operate real estate offices' },
    { id: 'RealEstateSalesAgents', name: 'Real Estate Sales Agents', description: 'Rent, buy, or sell property' },
    { id: 'AppraisersAndAssessorsOfRealEstate', name: 'Appraisers and Assessors of Real Estate', description: 'Appraise real property value' },
  ],
  '532': [
    { id: 'PropertyRealEstateAndCommunityAssociationManagers', name: 'Property and Real Estate Managers', description: 'Manage rental property operations' },
    { id: 'SalesManagers', name: 'Sales Managers', description: 'Direct rental sales activities' },
    { id: 'Logisticians', name: 'Logisticians', description: 'Coordinate equipment logistics' },
  ],
  '533': [
    { id: 'PropertyRealEstateAndCommunityAssociationManagers', name: 'Property and Real Estate Managers', description: 'Manage leasing operations' },
    { id: 'FinancialManagers', name: 'Financial Managers', description: 'Direct financial activities' },
    { id: 'AccountantsAndAuditors', name: 'Accountants and Auditors', description: 'Manage lease accounting' },
  ],
  '54': [
    { id: 'ManagementAnalysts', name: 'Management Analysts', description: 'Propose ways to improve organizational efficiency' },
    { id: 'ComputerAndInformationResearchScientists', name: 'Computer and Information Research Scientists', description: 'Conduct research in computing' },
    { id: 'ArchitectsExceptLandscapeAndNaval', name: 'Architects', description: 'Plan and design structures' },
    { id: 'LawyersAndJudicialWorkers', name: 'Lawyers', description: 'Advise and represent on legal matters' },
  ],
  '55': [
    { id: 'ChiefExecutives', name: 'Chief Executives', description: 'Determine and formulate company policies' },
    { id: 'GeneralAndOperationsManagers', name: 'General and Operations Managers', description: 'Plan and direct operations' },
    { id: 'FinancialManagers', name: 'Financial Managers', description: 'Direct financial activities' },
    { id: 'HumanResourcesManagers', name: 'Human Resources Managers', description: 'Plan and direct HR activities' },
  ],
  '56': [
    { id: 'AdministrativeServicesManagers', name: 'Administrative Services Managers', description: 'Plan and coordinate support services' },
    { id: 'JanitorsAndCleaners', name: 'Janitors and Cleaners', description: 'Keep buildings clean and orderly' },
    { id: 'SecurityGuards', name: 'Security Guards', description: 'Guard and patrol property' },
    { id: 'LandscapingAndGroundskeepingWorkers', name: 'Landscaping and Groundskeeping Workers', description: 'Maintain grounds and landscapes' },
  ],
  '61': [
    { id: 'EducationAdministratorsPostsecondary', name: 'Education Administrators, Postsecondary', description: 'Plan and coordinate academic programs' },
    { id: 'EducationAdministratorsKindergartenThroughSecondary', name: 'Education Administrators, K-12', description: 'Manage school operations' },
    { id: 'EducationalGuidanceAndCareerCounselorsAndAdvisors', name: 'Educational Counselors and Advisors', description: 'Advise students on academic plans' },
    { id: 'InstructionalCoordinators', name: 'Instructional Coordinators', description: 'Develop curricula and teaching standards' },
  ],
  '62': [
    { id: 'MedicalAndHealthServicesManagers', name: 'Medical and Health Services Managers', description: 'Plan and direct health services' },
    { id: 'RegisteredNurses', name: 'Registered Nurses', description: 'Provide and coordinate patient care' },
    { id: 'PhysiciansAllOther', name: 'Physicians', description: 'Diagnose and treat illnesses' },
    { id: 'Pharmacists', name: 'Pharmacists', description: 'Dispense medications and advise patients' },
  ],
  '71': [
    { id: 'EntertainmentAndRecreationManagersExceptGambling', name: 'Entertainment and Recreation Managers', description: 'Plan and direct entertainment activities' },
    { id: 'Actors', name: 'Actors', description: 'Play parts in stage, TV, or film productions' },
    { id: 'ProducersAndDirectors', name: 'Producers and Directors', description: 'Produce or direct performing arts' },
    { id: 'AthletesAndSportsCompetitors', name: 'Athletes and Sports Competitors', description: 'Compete in athletic events' },
  ],
  '72': [
    { id: 'FoodServiceManagers', name: 'Food Service Managers', description: 'Plan and direct food service activities' },
    { id: 'LodgingManagers', name: 'Lodging Managers', description: 'Plan and direct hotel operations' },
    { id: 'ChefsAndHeadCooks', name: 'Chefs and Head Cooks', description: 'Direct food preparation activities' },
    { id: 'WaitersAndWaitresses', name: 'Waiters and Waitresses', description: 'Take orders and serve food' },
  ],
  '81': [
    { id: 'AutomotiveServiceTechniciansAndMechanics', name: 'Automotive Service Technicians', description: 'Diagnose and repair motor vehicles' },
    { id: 'HairdressersHairstylistsAndCosmetologists', name: 'Hairdressers and Cosmetologists', description: 'Provide beauty services' },
    { id: 'GeneralMaintenanceAndRepairWorkers', name: 'General Maintenance and Repair Workers', description: 'Perform general maintenance tasks' },
    { id: 'Clergy', name: 'Clergy', description: 'Conduct religious services and provide spiritual guidance' },
  ],
  '92': [
    { id: 'Legislators', name: 'Legislators', description: 'Develop and enact laws' },
    { id: 'ChiefExecutives', name: 'Chief Executives', description: 'Direct government agency operations' },
    { id: 'UrbanAndRegionalPlanners', name: 'Urban and Regional Planners', description: 'Develop land use plans' },
    { id: 'FirefightersAndFireInspectors', name: 'Firefighters', description: 'Control and extinguish fires' },
  ],
}

// Sector -> regulatory environment
const sectorRegulatory: Record<string, string> = {
  '11': `- **USDA** (United States Department of Agriculture) - Oversees agricultural practices, food safety, and farm subsidies
- **EPA** (Environmental Protection Agency) - Regulates pesticide use, water quality, and environmental impact
- **FDA** (Food and Drug Administration) - Ensures safety of agricultural food products
- **State Departments of Agriculture** - Enforce local farming regulations and licensing`,
  '21': `- **MSHA** (Mine Safety and Health Administration) - Enforces safety and health standards in mines
- **EPA** (Environmental Protection Agency) - Regulates environmental impact of extraction operations
- **Bureau of Land Management** - Manages mineral rights on federal lands
- **State Mining Commissions** - Oversee permitting and reclamation requirements`,
  '22': `- **FERC** (Federal Energy Regulatory Commission) - Regulates interstate energy transmission
- **EPA** (Environmental Protection Agency) - Enforces emissions and environmental standards
- **NRC** (Nuclear Regulatory Commission) - Oversees nuclear power facilities
- **State Public Utility Commissions** - Set rates and service standards`,
  '23': `- **OSHA** (Occupational Safety and Health Administration) - Enforces workplace safety standards
- **EPA** (Environmental Protection Agency) - Regulates construction environmental impact
- **State and Local Building Codes** - Govern construction standards and permitting
- **Department of Labor** - Enforces prevailing wage and labor requirements`,
  '31': `- **OSHA** (Occupational Safety and Health Administration) - Enforces workplace safety in factories
- **EPA** (Environmental Protection Agency) - Regulates manufacturing emissions and waste
- **FDA** (Food and Drug Administration) - Oversees food and pharmaceutical manufacturing
- **CPSC** (Consumer Product Safety Commission) - Ensures product safety standards`,
  '42': `- **FTC** (Federal Trade Commission) - Regulates fair trade and anti-competitive practices
- **DOT** (Department of Transportation) - Governs shipping and logistics requirements
- **Customs and Border Protection** - Oversees import/export compliance
- **State Licensing Boards** - Regulate wholesale distribution permits`,
  '44': `- **FTC** (Federal Trade Commission) - Enforces consumer protection and truth-in-advertising
- **CPSC** (Consumer Product Safety Commission) - Regulates product safety in retail
- **State Consumer Protection Agencies** - Handle retail licensing and consumer complaints
- **ADA** (Americans with Disabilities Act) - Governs accessibility requirements for retail spaces`,
  '48': `- **DOT** (Department of Transportation) - Regulates transportation safety and operations
- **FMCSA** (Federal Motor Carrier Safety Administration) - Oversees commercial vehicle operations
- **FAA** (Federal Aviation Administration) - Regulates air transportation
- **FRA** (Federal Railroad Administration) - Governs railroad safety and operations`,
  '51': `- **FCC** (Federal Communications Commission) - Regulates telecommunications and broadcasting
- **FTC** (Federal Trade Commission) - Enforces data privacy and consumer protection
- **Copyright Office** - Manages intellectual property in media and publishing
- **State Data Privacy Laws** - Govern consumer data handling (e.g., CCPA, state equivalents)`,
  '52': `- **SEC** (Securities and Exchange Commission) - Regulates securities markets and financial reporting
- **FDIC** (Federal Deposit Insurance Corporation) - Insures deposits and supervises banks
- **Federal Reserve** - Sets monetary policy and regulates banking institutions
- **CFPB** (Consumer Financial Protection Bureau) - Enforces consumer financial regulations`,
  '524': `- **State Insurance Commissioners** - Regulate insurance rates, policies, and solvency
- **NAIC** (National Association of Insurance Commissioners) - Sets model regulations
- **Federal Insurance Office** - Monitors systemic risk in insurance
- **State Guaranty Associations** - Protect policyholders from insurer insolvency`,
  '531': `- **HUD** (Department of Housing and Urban Development) - Enforces fair housing laws
- **State Real Estate Commissions** - License and regulate agents and brokers
- **Local Zoning Boards** - Govern land use and property development
- **CFPB** (Consumer Financial Protection Bureau) - Regulates mortgage and lending practices`,
  '532': `- **FTC** (Federal Trade Commission) - Enforces fair business practices in rental
- **State Consumer Protection Agencies** - Regulate rental agreements and disputes
- **DOT** (Department of Transportation) - Governs vehicle rental standards
- **Local Licensing Authorities** - Issue rental business permits`,
  '533': `- **SEC** (Securities and Exchange Commission) - Regulates leasing of financial assets
- **FASB** (Financial Accounting Standards Board) - Sets lease accounting standards (ASC 842)
- **State Licensing Authorities** - Govern leasing company operations
- **FTC** (Federal Trade Commission) - Enforces transparency in leasing terms`,
  '54': `- **State Licensing Boards** - Regulate professional services (legal, accounting, engineering)
- **SEC** (Securities and Exchange Commission) - Oversees consulting and advisory firms
- **EPA** (Environmental Protection Agency) - Governs environmental consulting standards
- **Patent and Trademark Office** - Manages intellectual property protections`,
  '55': `- **SEC** (Securities and Exchange Commission) - Regulates holding company disclosures
- **IRS** (Internal Revenue Service) - Governs tax treatment of management companies
- **State Corporate Governance Laws** - Regulate corporate structures
- **FTC** (Federal Trade Commission) - Enforces anti-trust and competitive practices`,
  '56': `- **OSHA** (Occupational Safety and Health Administration) - Enforces workplace safety for service workers
- **EPA** (Environmental Protection Agency) - Regulates waste management and cleaning chemical use
- **State Licensing Boards** - Govern security, janitorial, and staffing licenses
- **Department of Labor** - Enforces wage, hour, and employment standards`,
  '61': `- **Department of Education** - Sets federal education standards and administers funding
- **State Education Agencies** - Accredit institutions and certify educators
- **FERPA** (Family Educational Rights and Privacy Act) - Protects student records
- **ADA** (Americans with Disabilities Act) - Ensures accessibility in educational settings`,
  '62': `- **CMS** (Centers for Medicare & Medicaid Services) - Administers healthcare reimbursement programs
- **FDA** (Food and Drug Administration) - Regulates medical devices and pharmaceuticals
- **HIPAA** (Health Insurance Portability and Accountability Act) - Protects patient data privacy
- **State Health Departments** - License healthcare facilities and practitioners`,
  '71': `- **FCC** (Federal Communications Commission) - Regulates broadcasting of entertainment
- **State Athletic Commissions** - Govern professional sports and events
- **Copyright Office** - Manages intellectual property for creative works
- **Local Permitting Authorities** - Issue event and venue operation permits`,
  '72': `- **FDA** (Food and Drug Administration) - Enforces food safety standards in restaurants
- **State Health Departments** - Inspect and license food service establishments
- **TTB** (Alcohol and Tobacco Tax and Trade Bureau) - Regulates alcohol service
- **Local Health and Fire Codes** - Govern facility safety and sanitation`,
  '81': `- **EPA** (Environmental Protection Agency) - Regulates auto repair waste and emissions testing
- **State Licensing Boards** - License repair shops, cosmetologists, and other services
- **IRS** (Internal Revenue Service) - Governs tax-exempt status for religious organizations
- **OSHA** (Occupational Safety and Health Administration) - Workplace safety for service workers`,
  '92': `- **Office of Management and Budget** - Oversees federal budgeting and regulatory review
- **Government Accountability Office** - Audits government programs and spending
- **Office of Personnel Management** - Manages federal workforce policies
- **State and Local Ethics Commissions** - Enforce government transparency and accountability`,
}

// Sector -> technology trends
const sectorTechnology: Record<string, string> = {
  '11': `- **Precision Agriculture** - GPS-guided equipment, drone monitoring, and variable-rate application technologies
- **Agricultural Biotechnology** - Genetically modified crops, CRISPR gene editing, and disease-resistant varieties
- **IoT and Smart Farming** - Sensor networks for soil moisture, weather monitoring, and automated irrigation
- **Autonomous Equipment** - Self-driving tractors, robotic harvesters, and AI-powered crop management`,
  '21': `- **Autonomous Mining** - Self-driving haul trucks, automated drilling, and remote-operated equipment
- **Advanced Exploration** - 3D seismic imaging, AI-powered geological modeling, and satellite surveying
- **Environmental Technologies** - Carbon capture, mine water treatment, and land reclamation innovations
- **Digital Twins** - Virtual mine modeling for operational optimization and safety planning`,
  '22': `- **Renewable Energy** - Solar, wind, and energy storage technologies transforming the grid
- **Smart Grid** - Advanced metering, demand response, and distributed energy management
- **Energy Storage** - Battery technologies, pumped hydro, and hydrogen storage solutions
- **Microgrids** - Decentralized power generation for resilience and efficiency`,
  '23': `- **Building Information Modeling (BIM)** - 3D digital representations for design and construction planning
- **Prefabrication and Modular Construction** - Off-site manufacturing of building components
- **Construction Robotics** - Automated bricklaying, 3D-printed structures, and drone site surveys
- **Green Building** - Sustainable materials, energy-efficient designs, and LEED certification`,
  '31': `- **Industry 4.0** - IoT-connected factories, digital twins, and smart manufacturing systems
- **Additive Manufacturing** - 3D printing for rapid prototyping and custom production
- **Robotics and Automation** - Collaborative robots, automated assembly, and AI quality inspection
- **Sustainable Manufacturing** - Circular economy practices, waste reduction, and green chemistry`,
  '42': `- **Supply Chain Digitization** - Real-time tracking, blockchain provenance, and automated ordering
- **Warehouse Automation** - Robotic picking, automated storage systems, and drone inventory
- **E-commerce Integration** - B2B online platforms and omnichannel distribution
- **Predictive Analytics** - AI-driven demand forecasting and inventory optimization`,
  '44': `- **E-commerce and Omnichannel** - Unified online/offline shopping experiences and last-mile delivery
- **AI Personalization** - Machine learning product recommendations and dynamic pricing
- **Cashierless Stores** - Computer vision and sensor-based automated checkout
- **Augmented Reality** - Virtual try-on, in-store navigation, and product visualization`,
  '48': `- **Autonomous Vehicles** - Self-driving trucks, delivery drones, and autonomous ships
- **Fleet Telematics** - Real-time GPS tracking, fuel optimization, and predictive maintenance
- **Electric Transportation** - EV fleet adoption, charging infrastructure, and battery technology
- **Digital Freight Platforms** - Online marketplaces matching shippers with carriers`,
  '51': `- **Artificial Intelligence** - Generative AI, machine learning, and natural language processing
- **Cloud Computing** - SaaS platforms, edge computing, and hybrid cloud architectures
- **5G and Connectivity** - High-speed networks enabling IoT, AR/VR, and real-time applications
- **Cybersecurity** - Zero-trust architectures, AI threat detection, and privacy-enhancing technologies`,
  '52': `- **Fintech and Digital Banking** - Mobile banking, digital wallets, and neobank platforms
- **Blockchain and DeFi** - Distributed ledger technology for payments and smart contracts
- **AI-Powered Risk Assessment** - Machine learning credit scoring and fraud detection
- **Open Banking** - API-driven financial services and data sharing ecosystems`,
  '524': `- **Insurtech** - Digital-first insurance platforms and automated underwriting
- **Telematics and IoT** - Usage-based insurance, connected devices, and real-time risk monitoring
- **AI Claims Processing** - Automated damage assessment, fraud detection, and chatbot customer service
- **Parametric Insurance** - Event-triggered automatic payouts using smart contracts`,
  '531': `- **PropTech** - Digital platforms for property management, leasing, and tenant engagement
- **Smart Buildings** - IoT sensors for energy management, security, and occupant comfort
- **Virtual Tours** - 3D property walkthroughs and AI-powered property valuation
- **Blockchain in Real Estate** - Tokenized property ownership and smart contract transactions`,
  '532': `- **Digital Platforms** - Online rental marketplaces and mobile booking applications
- **IoT Asset Tracking** - GPS and sensor-based monitoring of rental equipment
- **Predictive Maintenance** - AI-driven scheduling for equipment upkeep and repair
- **Contactless Transactions** - Digital contracts, keyless access, and automated billing`,
  '533': `- **Digital Lease Management** - Automated lease accounting, compliance, and document management
- **AI-Powered Valuation** - Machine learning models for asset and IP valuation
- **Blockchain Licensing** - Smart contracts for automated royalty payments and IP tracking
- **Data Analytics** - Advanced analytics for portfolio optimization and risk assessment`,
  '54': `- **AI and Machine Learning** - Automated analysis, predictive modeling, and generative tools
- **Cloud Collaboration** - Remote work platforms, virtual whiteboards, and real-time co-editing
- **Digital Twin Technology** - Virtual modeling for engineering, architecture, and scientific research
- **Low-Code Platforms** - Rapid application development and process automation`,
  '55': `- **Enterprise Resource Planning** - Integrated management systems for multi-business operations
- **Data Analytics and BI** - Advanced dashboards, predictive analytics, and AI-driven insights
- **Digital Transformation** - Cloud migration, process automation, and digital strategy
- **Cybersecurity Governance** - Enterprise-wide security frameworks and risk management`,
  '56': `- **Robotic Process Automation** - Automated data entry, scheduling, and workflow management
- **AI-Powered Staffing** - Machine learning job matching and candidate screening
- **IoT Facility Management** - Smart sensors for cleaning schedules and building maintenance
- **Drone Services** - Aerial inspection, security surveillance, and landscaping assessment`,
  '61': `- **EdTech Platforms** - Learning management systems, virtual classrooms, and adaptive learning
- **AI Tutoring** - Personalized learning paths, automated grading, and chatbot assistants
- **Virtual and Augmented Reality** - Immersive simulations for hands-on training and education
- **Credentialing Technology** - Digital badges, blockchain transcripts, and micro-credentials`,
  '62': `- **Telehealth** - Virtual consultations, remote monitoring, and digital therapeutics
- **AI Diagnostics** - Machine learning-assisted imaging, pathology, and clinical decision support
- **Electronic Health Records** - Interoperable patient data systems and health information exchanges
- **Wearable Health Devices** - Continuous monitoring sensors, smartwatches, and biosensors`,
  '71': `- **Streaming and Digital Distribution** - OTT platforms, live streaming, and virtual events
- **Virtual and Augmented Reality** - Immersive experiences, VR gaming, and AR venue enhancements
- **AI Content Creation** - Generative AI for music, visual effects, and interactive storytelling
- **Sports Analytics** - Performance tracking, fan engagement platforms, and real-time statistics`,
  '72': `- **Contactless Hospitality** - Mobile check-in, digital keys, and automated service kiosks
- **Restaurant Technology** - Online ordering, kitchen automation, and delivery platform integration
- **AI Revenue Management** - Dynamic pricing, demand forecasting, and personalized marketing
- **Sustainability Tech** - Food waste reduction systems, energy management, and eco-friendly operations`,
  '81': `- **Digital Booking Platforms** - Online appointment scheduling for auto repair, salons, and services
- **Diagnostic Technology** - OBD-II scanners, AI-powered diagnostics, and predictive vehicle maintenance
- **Mobile Service Delivery** - On-demand home repair, mobile detailing, and field service apps
- **Contactless Payments** - Tap-to-pay, mobile wallets, and automated invoicing`,
  '92': `- **GovTech** - Digital government services, e-permitting, and online citizen engagement
- **Open Data** - Public data portals, transparency dashboards, and civic analytics
- **AI in Government** - Automated case management, predictive policing, and fraud detection
- **Smart City Infrastructure** - IoT sensors, connected transportation, and digital public services`,
}

// Sector -> industry outlook
const sectorOutlook: Record<string, string> = {
  '11': 'The agriculture sector continues to evolve with growing global food demand, climate adaptation challenges, and rapid technology adoption. Precision agriculture and sustainable farming practices are driving productivity gains while reducing environmental impact. The sector faces workforce challenges as traditional farming communities age, but technology-enabled farming is attracting new entrants and investment.',
  '21': 'The mining and extraction sector faces a dual transition: meeting ongoing demand for traditional minerals while rapidly scaling production of critical minerals needed for clean energy technologies. Automation and remote operations are reshaping the workforce, and environmental stewardship is increasingly central to obtaining social license to operate. Long-term demand for lithium, cobalt, and rare earth elements continues to drive exploration investment.',
  '22': 'The utilities sector is undergoing a historic transformation driven by decarbonization mandates, distributed energy resources, and grid modernization. Renewable energy capacity continues to grow, with solar and wind becoming the most cost-effective generation sources. Investment in grid resilience, energy storage, and smart infrastructure is accelerating to support electrification of transportation and buildings.',
  '23': 'The construction industry benefits from sustained infrastructure investment, housing demand, and commercial development. Labor shortages continue to drive adoption of modular construction, prefabrication, and automation. Green building practices and energy-efficient design are becoming standard requirements, while technology adoption in project management and building information modeling improves productivity.',
  '31': 'The manufacturing sector is experiencing a resurgence driven by reshoring initiatives, supply chain diversification, and advanced automation. Industry 4.0 technologies including IoT, AI, and robotics are transforming production efficiency. Sustainability requirements are driving innovation in materials, processes, and circular economy practices, while workforce development programs address the skilled labor gap.',
  '42': 'The wholesale trade sector is adapting to digital transformation with B2B e-commerce platforms and supply chain automation reshaping traditional distribution models. Real-time inventory management and predictive analytics are improving efficiency, while consolidation continues as companies seek scale. Supply chain resilience and diversification remain top priorities following recent global disruptions.',
  '44': 'The retail sector continues its omnichannel evolution, with seamless integration between physical stores and digital channels becoming essential. AI-driven personalization, last-mile delivery innovation, and experiential retail are key differentiators. Consumer preferences for sustainability and social responsibility are influencing product sourcing and business practices across the industry.',
  '48': 'The transportation and warehousing sector is investing heavily in electrification, automation, and digital logistics platforms. E-commerce growth continues to drive demand for last-mile delivery and warehouse capacity. Autonomous vehicle technology, drone delivery, and sustainable fleet management are key areas of innovation, while labor market tightness drives investment in driver retention and automated operations.',
  '51': 'The information sector continues to expand rapidly, driven by AI, cloud computing, and data-driven business models. Generative AI is transforming content creation, software development, and information services. Cybersecurity investment is growing alongside increasing digital threats, while regulatory frameworks for data privacy and AI governance are evolving across jurisdictions.',
  '52': 'The finance and insurance sector is being reshaped by fintech innovation, digital banking, and evolving regulatory frameworks. AI and machine learning are transforming risk assessment, fraud detection, and customer service. Open banking and embedded finance are creating new business models, while cryptocurrency and digital assets continue to influence the financial landscape.',
  '524': 'The insurance industry is embracing digital transformation through insurtech partnerships, automated underwriting, and data-driven risk assessment. Climate-related risks are reshaping actuarial models and product offerings, while parametric and usage-based insurance gain market share. Customer expectations for digital-first experiences are driving investment in self-service platforms and AI-powered claims processing.',
  '531': 'The real estate sector is adapting to shifting work and lifestyle patterns, with hybrid work models influencing demand for office, residential, and mixed-use properties. PropTech solutions are transforming property management, valuation, and tenant experience. Sustainability and ESG considerations increasingly drive investment decisions, while housing affordability remains a central policy challenge.',
  '532': 'The rental and leasing sector benefits from the growing sharing and subscription economy, with consumers and businesses increasingly preferring access over ownership. Digital platforms are streamlining rental operations and expanding market reach. Equipment rental demand remains strong from construction and industrial sectors, while automotive rental adapts to electric and autonomous vehicle trends.',
  '533': 'The lessors of nonfinancial intangible assets sector is growing as intellectual property, brand licensing, and digital assets become increasingly valuable. Technology licensing and software-as-a-service models continue to expand. Organizations are monetizing data assets and digital IP through new licensing frameworks, while global IP protection and enforcement remain complex challenges.',
  '54': 'The professional, scientific, and technical services sector continues to grow as organizations seek specialized expertise in technology, compliance, and strategy. AI and automation are augmenting professional workflows while creating demand for new advisory services. Remote work has expanded the talent pool and global service delivery, while cybersecurity and data analytics consulting see particularly strong demand.',
  '55': 'The management of companies sector reflects broader economic trends as corporate structures evolve toward more agile and technology-enabled holding company models. Digital transformation, ESG governance, and talent management are top strategic priorities. Mergers, acquisitions, and portfolio optimization continue as companies seek growth and operational synergies.',
  '56': 'The administrative and support services sector is growing with demand for outsourced business functions, temporary staffing, and facility services. Automation and AI are transforming staffing, security, and facility management operations. Labor market dynamics continue to drive demand for flexible workforce solutions, while environmental services and waste management benefit from sustainability mandates.',
  '61': 'The education sector is evolving with technology-enabled learning, alternative credentialing, and lifelong learning models. Online and hybrid education formats continue to expand post-pandemic, while AI tutoring and adaptive learning platforms personalize student experiences. Workforce development programs are growing in response to skills gaps, and institutions are adapting curricula to meet changing employer needs.',
  '62': 'The healthcare sector continues to expand with aging populations, chronic disease management, and technological innovation driving demand. Telehealth has become a permanent feature of care delivery, while AI-assisted diagnostics and personalized medicine advance clinical outcomes. Value-based care models and interoperability standards are reshaping reimbursement and health information systems.',
  '71': 'The arts, entertainment, and recreation sector has recovered strongly with live events, experiential entertainment, and sports driving growth. Streaming platforms and digital content distribution continue to reshape media business models. Virtual reality, AI-generated content, and immersive experiences represent new frontiers, while sports betting legalization creates additional revenue streams.',
  '72': 'The accommodation and food services sector has rebounded with strong travel demand and evolving consumer dining preferences. Technology adoption in ordering, delivery, and kitchen operations is accelerating. Labor challenges drive investment in automation and employee retention, while sustainability practices and local sourcing increasingly influence consumer choice and business strategy.',
  '81': 'The other services sector encompasses diverse businesses adapting to digital transformation and changing consumer preferences. Auto repair shops are navigating the transition to electric vehicles, personal care services are adopting online booking and contactless payments, and religious organizations are expanding digital outreach. Skilled trade shortages and aging workforce demographics present ongoing challenges.',
  '92': 'The public administration sector is modernizing through digital government initiatives, data-driven decision making, and citizen-centric service design. AI and automation are improving operational efficiency in permitting, compliance, and public safety. Smart city investments in connected infrastructure, sustainability, and resilience planning are accelerating, while cybersecurity and data governance remain critical priorities.',
}

function getSectorCode(filePath: string): string {
  const rel = relative(INDUSTRIES_DIR, filePath)
  const topFolder = rel.split('/')[0]
  return sectorMap[topFolder] || ''
}

function hasRealOccupationLinks(content: string): boolean {
  // Check if file has actual occupation links like [Name](/occupations/Id)
  const relOccSection = content.match(/## Related Occupations\n([\s\S]*?)(?=\n## |$)/)?.[1] || ''
  return /\[.+\]\(\/occupations\/\w+\)/.test(relOccSection)
}

function enrichFile(filePath: string, content: string, sectorCode: string): string {
  const occupations = sectorOccupations[sectorCode]
  const regulatory = sectorRegulatory[sectorCode]
  const technology = sectorTechnology[sectorCode]
  const outlook = sectorOutlook[sectorCode]

  if (!occupations || !regulatory || !technology || !outlook) {
    console.log(`  Skipping: no data for sector code "${sectorCode}"`)
    return content
  }

  let result = content

  // 1. Replace placeholder Related Occupations section
  const occPlaceholder = /## Related Occupations\n\nSee the \[occupations directory\]\(\/occupations\) for roles commonly found in this industry\./
  if (occPlaceholder.test(result)) {
    const occLinks = occupations.map(o => `- [${o.name}](/occupations/${o.id}) - ${o.description}`).join('\n')
    result = result.replace(occPlaceholder, `## Related Occupations\n\n${occLinks}`)
  } else if (!/## Related Occupations/.test(result)) {
    // Add Related Occupations before Core Business Processes or at the end
    const occLinks = occupations.map(o => `- [${o.name}](/occupations/${o.id}) - ${o.description}`).join('\n')
    const section = `\n## Related Occupations\n\n${occLinks}\n`
    const insertBefore = '## Core Business Processes'
    if (result.includes(insertBefore)) {
      result = result.replace(insertBefore, section + '\n' + insertBefore)
    } else {
      result = result.trimEnd() + '\n' + section
    }
  }

  // 2. Add Regulatory Environment if missing
  if (!/## Regulatory Environment/.test(result)) {
    const regSection = `\n## Regulatory Environment\n\n${regulatory}\n`
    // Insert before the final source line
    const sourceMatch = result.match(/\n---\n\n\*Source:/)
    if (sourceMatch) {
      result = result.replace(/\n---\n\n\*Source:/, `${regSection}\n---\n\n*Source:`)
    } else {
      result = result.trimEnd() + '\n' + regSection
    }
  }

  // 3. Add Technology & Innovation if missing
  if (!/## Technology & Innovation/.test(result)) {
    const techSection = `\n## Technology & Innovation\n\n${technology}\n`
    const sourceMatch = result.match(/\n---\n\n\*Source:/)
    if (sourceMatch) {
      result = result.replace(/\n---\n\n\*Source:/, `${techSection}\n---\n\n*Source:`)
    } else {
      result = result.trimEnd() + '\n' + techSection
    }
  }

  // 4. Add Industry Outlook if missing
  if (!/## Industry Outlook/.test(result)) {
    const outlookSection = `\n## Industry Outlook\n\n${outlook}\n`
    const sourceMatch = result.match(/\n---\n\n\*Source:/)
    if (sourceMatch) {
      result = result.replace(/\n---\n\n\*Source:/, `${outlookSection}\n---\n\n*Source:`)
    } else {
      result = result.trimEnd() + '\n' + outlookSection
    }
  }

  return result
}

// Main
let enrichedCount = 0
let skippedCount = 0

for (const filePath of allFiles) {
  const stats = statSync(filePath)
  if (stats.size >= 3072) {
    skippedCount++
    continue
  }

  const content = readFileSync(filePath, 'utf-8')

  if (hasRealOccupationLinks(content)) {
    skippedCount++
    continue
  }

  const sectorCode = getSectorCode(filePath)
  if (!sectorCode) {
    console.log(`Skipping ${relative(INDUSTRIES_DIR, filePath)}: unknown sector`)
    skippedCount++
    continue
  }

  const enriched = enrichFile(filePath, content, sectorCode)
  if (enriched !== content) {
    writeFileSync(filePath, enriched, 'utf-8')
    console.log(`Enriched: ${relative(INDUSTRIES_DIR, filePath)}`)
    enrichedCount++
  } else {
    skippedCount++
  }
}

console.log(`\nDone! Enriched: ${enrichedCount}, Skipped: ${skippedCount}, Total: ${allFiles.length}`)
