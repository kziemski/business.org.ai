import { readFileSync, writeFileSync, statSync } from 'fs'
import { execSync } from 'child_process'
import { basename } from 'path'

// Find all MDX files under 2KB in 07-HR
const files = execSync(
  `find /Users/nathanclevenger/projects/business.org.ai/processes/07-HR -name "*.mdx" -size -2k`,
  { encoding: 'utf-8' }
).trim().split('\n').filter(Boolean)

console.log(`Found ${files.length} files under 2KB to enrich`)

// Mapping of process areas to relevant occupations
const occupationMap: Record<string, Array<{ name: string; path: string }>> = {
  '7.1': [
    { name: 'Human Resources Managers', path: '/occupations/HumanResourcesManagers' },
    { name: 'Compensation and Benefits Managers', path: '/occupations/CompensationAndBenefitsManagers' },
    { name: 'Training and Development Managers', path: '/occupations/TrainingAndDevelopmentManagers' },
    { name: 'Chief Executives', path: '/occupations/ChiefExecutives' },
    { name: 'Management Analysts', path: '/occupations/ManagementAnalysts' },
  ],
  '7.2': [
    { name: 'Human Resources Specialists', path: '/occupations/HumanResourcesSpecialists' },
    { name: 'Human Resources Managers', path: '/occupations/HumanResourcesManagers' },
    { name: 'Recruiting Coordinators', path: '/occupations/HumanResourcesSpecialists' },
    { name: 'Training and Development Specialists', path: '/occupations/TrainingAndDevelopmentSpecialists' },
    { name: 'Compensation and Benefits Managers', path: '/occupations/CompensationAndBenefitsManagers' },
  ],
  '7.3': [
    { name: 'Training and Development Managers', path: '/occupations/TrainingAndDevelopmentManagers' },
    { name: 'Training and Development Specialists', path: '/occupations/TrainingAndDevelopmentSpecialists' },
    { name: 'Human Resources Managers', path: '/occupations/HumanResourcesManagers' },
    { name: 'Instructional Coordinators', path: '/occupations/InstructionalCoordinators' },
    { name: 'Industrial-Organizational Psychologists', path: '/occupations/IndustrialOrganizationalPsychologists' },
  ],
  '7.4': [
    { name: 'Human Resources Managers', path: '/occupations/HumanResourcesManagers' },
    { name: 'Labor Relations Specialists', path: '/occupations/LaborRelationsSpecialists' },
    { name: 'Lawyers', path: '/occupations/Lawyers' },
    { name: 'Compliance Officers', path: '/occupations/ComplianceOfficers' },
    { name: 'Human Resources Specialists', path: '/occupations/HumanResourcesSpecialists' },
  ],
  '7.5': [
    { name: 'Compensation and Benefits Managers', path: '/occupations/CompensationAndBenefitsManagers' },
    { name: 'Compensation, Benefits, and Job Analysis Specialists', path: '/occupations/CompensationBenefitsAndJobAnalysisSpecialists' },
    { name: 'Human Resources Managers', path: '/occupations/HumanResourcesManagers' },
    { name: 'Payroll and Timekeeping Clerks', path: '/occupations/PayrollAndTimekeepingClerks' },
    { name: 'Financial Analysts', path: '/occupations/FinancialAnalysts' },
  ],
  '7.6': [
    { name: 'Human Resources Managers', path: '/occupations/HumanResourcesManagers' },
    { name: 'Human Resources Specialists', path: '/occupations/HumanResourcesSpecialists' },
    { name: 'Training and Development Managers', path: '/occupations/TrainingAndDevelopmentManagers' },
    { name: 'Compensation and Benefits Managers', path: '/occupations/CompensationAndBenefitsManagers' },
    { name: 'Management Analysts', path: '/occupations/ManagementAnalysts' },
  ],
  '7.7': [
    { name: 'Human Resources Managers', path: '/occupations/HumanResourcesManagers' },
    { name: 'Management Analysts', path: '/occupations/ManagementAnalysts' },
    { name: 'Database Administrators', path: '/occupations/DatabaseAdministrators' },
    { name: 'Statisticians', path: '/occupations/Statisticians' },
    { name: 'Human Resources Specialists', path: '/occupations/HumanResourcesSpecialists' },
  ],
  '7.8': [
    { name: 'Human Resources Managers', path: '/occupations/HumanResourcesManagers' },
    { name: 'Public Relations Specialists', path: '/occupations/PublicRelationsSpecialists' },
    { name: 'Human Resources Specialists', path: '/occupations/HumanResourcesSpecialists' },
    { name: 'Training and Development Specialists', path: '/occupations/TrainingAndDevelopmentSpecialists' },
    { name: 'Management Analysts', path: '/occupations/ManagementAnalysts' },
  ],
}

// Departments by process area
const departmentMap: Record<string, string[]> = {
  '7.1': ['Human Resources', 'Executive Leadership', 'Finance'],
  '7.2': ['Human Resources', 'Hiring Department', 'Legal'],
  '7.3': ['Human Resources', 'Learning & Development', 'Operations'],
  '7.4': ['Human Resources', 'Legal', 'Operations'],
  '7.5': ['Human Resources', 'Finance', 'Payroll'],
  '7.6': ['Human Resources', 'Operations', 'Finance'],
  '7.7': ['Human Resources', 'Information Technology', 'Analytics'],
  '7.8': ['Human Resources', 'Corporate Communications', 'Information Technology'],
}

// Industry variations by process area
const industryVariationMap: Record<string, Array<{ industry: string; detail: string }>> = {
  '7.1': [
    { industry: 'Healthcare', detail: 'Must account for clinical credentialing requirements, shift-based workforce models, and strict regulatory compliance (HIPAA, OSHA) when developing HR strategy.' },
    { industry: 'Technology', detail: 'Focuses on rapid scaling, competitive talent markets, stock-based compensation strategies, and remote-first workforce planning.' },
    { industry: 'Manufacturing', detail: 'Emphasizes union workforce considerations, safety certifications, skilled trade pipelines, and shift scheduling across multiple plant locations.' },
  ],
  '7.2': [
    { industry: 'Healthcare', detail: 'Requires credential verification, licensure validation, background checks for patient-facing roles, and compliance with Joint Commission standards.' },
    { industry: 'Technology', detail: 'Emphasizes technical assessments, coding challenges, cultural fit interviews, and competitive offer packages with equity components.' },
    { industry: 'Retail', detail: 'Focuses on high-volume seasonal hiring, part-time workforce management, quick turnaround screening, and multi-location coordination.' },
  ],
  '7.3': [
    { industry: 'Healthcare', detail: 'Requires mandatory continuing education (CME/CEU), clinical competency assessments, and compliance training for patient safety protocols.' },
    { industry: 'Financial Services', detail: 'Emphasizes regulatory compliance training (SOX, AML, KYC), licensing requirements (Series 7, CFA), and ethics certification programs.' },
    { industry: 'Manufacturing', detail: 'Focuses on safety certification (OSHA), equipment-specific training, lean/Six Sigma methodology, and apprenticeship programs.' },
  ],
  '7.4': [
    { industry: 'Manufacturing', detail: 'Heavy emphasis on union relations, collective bargaining agreements, grievance arbitration procedures, and shop floor labor management.' },
    { industry: 'Public Sector', detail: 'Governed by civil service rules, merit-based employment systems, public sector union agreements, and administrative law procedures.' },
    { industry: 'Healthcare', detail: 'Manages relations across clinical and non-clinical staff, navigates nursing unions, and addresses patient safety-related labor concerns.' },
  ],
  '7.5': [
    { industry: 'Technology', detail: 'Emphasizes stock options/RSUs, signing bonuses, flexible PTO policies, wellness stipends, and competitive total compensation benchmarking.' },
    { industry: 'Healthcare', detail: 'Includes shift differentials, on-call pay, malpractice coverage, continuing education reimbursement, and loan forgiveness programs.' },
    { industry: 'Financial Services', detail: 'Features performance-based bonuses, deferred compensation, profit sharing, comprehensive insurance packages, and regulatory-compliant incentive structures.' },
  ],
  '7.6': [
    { industry: 'Technology', detail: 'Manages frequent internal mobility, project-based redeployment, remote work transitions, and knowledge transfer during rapid organizational changes.' },
    { industry: 'Manufacturing', detail: 'Handles plant closures, production line reassignments, early retirement packages, and retraining programs for displaced workers.' },
    { industry: 'Public Sector', detail: 'Follows civil service redeployment rules, seniority-based reassignment, pension considerations, and mandatory retirement age policies.' },
  ],
  '7.7': [
    { industry: 'Technology', detail: 'Leverages advanced people analytics platforms, AI-driven workforce insights, real-time dashboards, and predictive attrition modeling.' },
    { industry: 'Healthcare', detail: 'Tracks credential expirations, staffing ratios, overtime compliance, and integrates with clinical scheduling and EHR systems.' },
    { industry: 'Financial Services', detail: 'Maintains strict data privacy controls, regulatory reporting requirements, compensation benchmarking data, and audit-ready employee records.' },
  ],
  '7.8': [
    { industry: 'Technology', detail: 'Uses digital-first communication channels, async collaboration tools, all-hands meetings, and transparent internal knowledge bases.' },
    { industry: 'Healthcare', detail: 'Requires multi-shift communication strategies, clinical vs. administrative messaging channels, and urgent safety communication protocols.' },
    { industry: 'Retail', detail: 'Manages communication across distributed store locations, frontline mobile apps, seasonal workforce messaging, and multilingual communications.' },
  ],
}

// KPIs by process area
const kpiMap: Record<string, Array<{ metric: string; description: string; target: string }>> = {
  '7.1': [
    { metric: 'HR Cost per Employee', description: 'Total HR department cost divided by headcount', target: '< $1,500/employee' },
    { metric: 'HR-to-Employee Ratio', description: 'Number of HR FTEs per 100 employees', target: '1.0-1.4 per 100' },
    { metric: 'Strategic Alignment Score', description: 'Degree of HR strategy alignment with business objectives', target: '> 80%' },
    { metric: 'Workforce Plan Accuracy', description: 'Accuracy of headcount and skills forecasting', target: '> 90%' },
  ],
  '7.2': [
    { metric: 'Time to Fill', description: 'Average days from requisition to accepted offer', target: '< 45 days' },
    { metric: 'Cost per Hire', description: 'Total recruitment cost divided by number of hires', target: '< $4,500' },
    { metric: 'Quality of Hire', description: 'New hire performance rating after 12 months', target: '> 3.5/5.0' },
    { metric: 'Offer Acceptance Rate', description: 'Percentage of offers accepted by candidates', target: '> 85%' },
  ],
  '7.3': [
    { metric: 'Training Hours per Employee', description: 'Average annual training hours per employee', target: '> 40 hours' },
    { metric: 'Training Completion Rate', description: 'Percentage of assigned training completed on time', target: '> 95%' },
    { metric: 'Employee Performance Improvement', description: 'Percentage of employees improving performance ratings year-over-year', target: '> 70%' },
    { metric: 'Internal Promotion Rate', description: 'Percentage of open positions filled internally', target: '> 30%' },
  ],
  '7.4': [
    { metric: 'Grievance Resolution Time', description: 'Average days to resolve employee grievances', target: '< 30 days' },
    { metric: 'Employee Relations Case Volume', description: 'Number of ER cases per 100 employees annually', target: '< 5 cases' },
    { metric: 'Labor Dispute Frequency', description: 'Number of formal labor disputes per year', target: '0 disputes' },
    { metric: 'Employee Satisfaction Score', description: 'Annual employee relations satisfaction survey score', target: '> 4.0/5.0' },
  ],
  '7.5': [
    { metric: 'Total Compensation Competitiveness', description: 'Percentile ranking vs. market benchmarks', target: '50th-75th percentile' },
    { metric: 'Benefits Utilization Rate', description: 'Percentage of employees actively using benefit programs', target: '> 80%' },
    { metric: 'Voluntary Turnover Rate', description: 'Annual voluntary employee departures as percentage of headcount', target: '< 12%' },
    { metric: 'Compensation Equity Ratio', description: 'Pay equity across demographic groups', target: '0.98-1.02' },
  ],
  '7.6': [
    { metric: 'Internal Mobility Rate', description: 'Percentage of roles filled through internal transfers', target: '> 25%' },
    { metric: 'Redeployment Success Rate', description: 'Percentage of redeployed employees retained after 12 months', target: '> 80%' },
    { metric: 'Separation Processing Time', description: 'Average days to complete separation process', target: '< 5 days' },
    { metric: 'Retirement Readiness Score', description: 'Percentage of eligible employees with retirement plans', target: '> 90%' },
  ],
  '7.7': [
    { metric: 'Data Accuracy Rate', description: 'Percentage of employee records without errors', target: '> 99%' },
    { metric: 'Report Generation Time', description: 'Average time to produce standard workforce reports', target: '< 4 hours' },
    { metric: 'HRIS System Uptime', description: 'System availability percentage', target: '> 99.5%' },
    { metric: 'Analytics Adoption Rate', description: 'Percentage of HR leaders using analytics dashboards', target: '> 75%' },
  ],
  '7.8': [
    { metric: 'Communication Reach Rate', description: 'Percentage of employees receiving key communications', target: '> 95%' },
    { metric: 'Employee Engagement Score', description: 'Annual engagement survey composite score', target: '> 4.0/5.0' },
    { metric: 'Survey Response Rate', description: 'Percentage of employees completing engagement surveys', target: '> 80%' },
    { metric: 'Internal Communication Satisfaction', description: 'Employee rating of communication effectiveness', target: '> 3.8/5.0' },
  ],
}

// RACI role mappings by area
const raciMap: Record<string, Array<{ activity: string; responsible: string; accountable: string; consulted: string; informed: string }>> = {
  '7.1': [
    { activity: 'Define HR strategy', responsible: 'HR Director', accountable: 'CHRO', consulted: 'C-Suite', informed: 'All Employees' },
    { activity: 'Allocate HR budget', responsible: 'HR Director', accountable: 'CFO', consulted: 'Finance', informed: 'Department Heads' },
    { activity: 'Design org structure', responsible: 'HR Business Partner', accountable: 'CHRO', consulted: 'Department Heads', informed: 'Employees' },
  ],
  '7.2': [
    { activity: 'Create job requisition', responsible: 'Hiring Manager', accountable: 'Department Head', consulted: 'HR Business Partner', informed: 'Recruiting Team' },
    { activity: 'Screen candidates', responsible: 'Recruiter', accountable: 'Talent Acquisition Lead', consulted: 'Hiring Manager', informed: 'HR Director' },
    { activity: 'Extend job offer', responsible: 'Recruiter', accountable: 'Hiring Manager', consulted: 'Compensation Team', informed: 'CHRO' },
  ],
  '7.3': [
    { activity: 'Design training program', responsible: 'L&D Specialist', accountable: 'L&D Manager', consulted: 'Department Heads', informed: 'HR Director' },
    { activity: 'Conduct performance review', responsible: 'Manager', accountable: 'Department Head', consulted: 'HR Business Partner', informed: 'Employee' },
    { activity: 'Develop career plan', responsible: 'Employee', accountable: 'Manager', consulted: 'HR Business Partner', informed: 'L&D Team' },
  ],
  '7.4': [
    { activity: 'Manage grievance', responsible: 'HR Specialist', accountable: 'HR Director', consulted: 'Legal Counsel', informed: 'Department Head' },
    { activity: 'Negotiate CBA', responsible: 'Labor Relations Specialist', accountable: 'CHRO', consulted: 'Legal Counsel', informed: 'Union Members' },
    { activity: 'Ensure compliance', responsible: 'HR Compliance Officer', accountable: 'HR Director', consulted: 'Legal Counsel', informed: 'All Employees' },
  ],
  '7.5': [
    { activity: 'Design compensation plan', responsible: 'Compensation Analyst', accountable: 'Compensation Manager', consulted: 'Finance', informed: 'HR Director' },
    { activity: 'Administer benefits', responsible: 'Benefits Specialist', accountable: 'Benefits Manager', consulted: 'Vendors', informed: 'Employees' },
    { activity: 'Process payroll', responsible: 'Payroll Specialist', accountable: 'Payroll Manager', consulted: 'Finance', informed: 'Employees' },
  ],
  '7.6': [
    { activity: 'Process separation', responsible: 'HR Specialist', accountable: 'HR Manager', consulted: 'Legal Counsel', informed: 'Department Head' },
    { activity: 'Manage redeployment', responsible: 'HR Business Partner', accountable: 'HR Director', consulted: 'Department Heads', informed: 'Employee' },
    { activity: 'Administer retirement', responsible: 'Benefits Specialist', accountable: 'Benefits Manager', consulted: 'Finance', informed: 'Employee' },
  ],
  '7.7': [
    { activity: 'Maintain HRIS', responsible: 'HRIS Analyst', accountable: 'HRIS Manager', consulted: 'IT', informed: 'HR Director' },
    { activity: 'Generate reports', responsible: 'HR Analyst', accountable: 'HR Director', consulted: 'Department Heads', informed: 'C-Suite' },
    { activity: 'Analyze workforce data', responsible: 'People Analytics Specialist', accountable: 'HR Director', consulted: 'Data Science', informed: 'Leadership' },
  ],
  '7.8': [
    { activity: 'Develop comms plan', responsible: 'HR Communications Specialist', accountable: 'HR Director', consulted: 'Corporate Comms', informed: 'All Employees' },
    { activity: 'Conduct engagement survey', responsible: 'HR Analyst', accountable: 'HR Director', consulted: 'Management', informed: 'All Employees' },
    { activity: 'Deliver communications', responsible: 'HR Communications Specialist', accountable: 'HR Director', consulted: 'Legal', informed: 'All Employees' },
  ],
}

function getProcessArea(filePath: string): string {
  // Extract 7.X from path
  const match = filePath.match(/7\.(\d)/)
  if (match) return `7.${match[1]}`
  return '7.1' // default
}

function getProcessDescription(name: string, verb: string, object: string): string {
  const descriptions: Record<string, string> = {}

  // Generate a contextual description based on the verb and object
  const verbDescriptions: Record<string, string> = {
    'identify': `This process focuses on systematically identifying and analyzing ${object.toLowerCase()} to support informed decision-making. It involves gathering relevant data, assessing current conditions, benchmarking against industry standards, and producing actionable insights that guide organizational strategy and operational improvements.`,
    'develop': `This process encompasses the end-to-end development of ${object.toLowerCase()}, from initial needs assessment through design, implementation, and evaluation. It requires cross-functional collaboration, alignment with organizational objectives, and iterative refinement based on stakeholder feedback and performance metrics.`,
    'manage': `This process provides a structured approach to managing ${object.toLowerCase()} across the organization. It includes establishing governance frameworks, defining operational procedures, monitoring performance, ensuring compliance with policies and regulations, and driving continuous improvement through data-driven insights.`,
    'define': `This process establishes clear definitions and frameworks for ${object.toLowerCase()}. It involves stakeholder consultation, industry benchmarking, documentation of standards and criteria, and alignment with organizational strategy to ensure consistency and clarity across all business units.`,
    'communicate': `This process ensures effective communication of ${object.toLowerCase()} across all organizational levels. It involves developing communication strategies, selecting appropriate channels, crafting targeted messaging, and measuring communication effectiveness to ensure stakeholder alignment and engagement.`,
    'determine': `This process involves systematic analysis and determination of ${object.toLowerCase()}. It requires data gathering, stakeholder input, comparative analysis, and structured decision-making to arrive at well-informed conclusions that support organizational objectives.`,
    'establish': `This process creates and establishes robust frameworks for ${object.toLowerCase()}. It involves defining standards, setting benchmarks, documenting procedures, obtaining stakeholder buy-in, and implementing governance structures to ensure long-term sustainability and effectiveness.`,
    'review': `This process provides systematic review and evaluation of ${object.toLowerCase()}. It includes performance assessment against established criteria, gap analysis, stakeholder feedback collection, and generation of recommendations for improvement and optimization.`,
    'monitor': `This process implements ongoing monitoring and tracking of ${object.toLowerCase()}. It involves defining key indicators, establishing reporting cadences, analyzing trends, identifying anomalies, and triggering corrective actions when performance deviates from established targets.`,
    'perform': `This process executes the core activities related to ${object.toLowerCase()}. It encompasses planning, resource allocation, task execution, quality assurance, and results documentation to deliver consistent and measurable outcomes aligned with organizational standards.`,
    'design': `This process covers the strategic design of ${object.toLowerCase()}. It involves requirements gathering, best practice research, stakeholder consultation, prototype development, pilot testing, and iterative refinement to create solutions that meet organizational needs effectively.`,
    'implement': `This process manages the implementation of ${object.toLowerCase()} from planning through execution and stabilization. It includes change management planning, resource mobilization, phased rollout, training delivery, and post-implementation review to ensure successful adoption.`,
    'evaluate': `This process conducts thorough evaluation of ${object.toLowerCase()} using quantitative and qualitative methods. It involves establishing evaluation criteria, collecting performance data, conducting analysis, benchmarking against standards, and producing actionable recommendations.`,
    'create': `This process guides the creation of ${object.toLowerCase()} following established organizational standards. It involves needs assessment, stakeholder requirements gathering, design and development, quality review, and formal approval processes.`,
    'administer': `This process handles the administration of ${object.toLowerCase()} across the organization. It includes processing transactions, maintaining records, ensuring policy compliance, managing exceptions, and providing support to stakeholders throughout the administrative lifecycle.`,
    'align': `This process ensures strategic alignment of ${object.toLowerCase()} with broader organizational objectives. It involves gap analysis, strategy mapping, cross-functional coordination, and continuous monitoring to maintain alignment as business priorities evolve.`,
    'maintain': `This process ensures ongoing maintenance and currency of ${object.toLowerCase()}. It includes regular reviews, updates based on changing requirements, quality assurance checks, version control, and stakeholder communication regarding any changes.`,
    'deliver': `This process manages the delivery of ${object.toLowerCase()} to target audiences. It involves planning delivery logistics, preparing materials, executing delivery activities, gathering feedback, and measuring effectiveness to ensure quality outcomes.`,
    'track': `This process provides systematic tracking of ${object.toLowerCase()} throughout their lifecycle. It includes data capture, status monitoring, progress reporting, exception management, and historical record maintenance for audit and analysis purposes.`,
    'analyze': `This process conducts in-depth analysis of ${object.toLowerCase()} to derive actionable insights. It involves data collection, statistical analysis, trend identification, root cause analysis, and presentation of findings to support strategic decision-making.`,
    'select': `This process manages the selection of ${object.toLowerCase()} through structured evaluation methods. It involves defining selection criteria, evaluating options, conducting comparative analysis, and making evidence-based decisions aligned with organizational needs.`,
    'process': `This process handles the end-to-end processing of ${object.toLowerCase()}. It includes intake, validation, processing steps, quality checks, exception handling, and completion tracking to ensure accurate and timely processing outcomes.`,
    'obtain': `This process manages the acquisition and collection of ${object.toLowerCase()}. It involves identifying sources, establishing collection procedures, validating accuracy, documenting results, and maintaining records for organizational use.`,
    'plan': `This process develops comprehensive plans for ${object.toLowerCase()}. It involves environmental scanning, needs assessment, resource planning, timeline development, risk identification, and stakeholder alignment to create actionable and achievable plans.`,
    'test': `This process designs and executes testing procedures for ${object.toLowerCase()}. It involves developing test criteria, administering assessments, scoring and analyzing results, ensuring validity and reliability, and reporting outcomes to decision-makers.`,
    'interview': `This process manages the interview and assessment of ${object.toLowerCase()}. It involves preparing structured interview frameworks, coordinating schedules, conducting evaluations, documenting findings, and providing recommendations based on assessment outcomes.`,
    'negotiate': `This process handles negotiations related to ${object.toLowerCase()}. It involves preparation and research, establishing negotiation parameters, conducting negotiations, documenting agreements, and ensuring compliance with organizational policies.`,
    'hire': `This process manages the hiring of ${object.toLowerCase()} from offer through onboarding. It involves extending offers, processing employment documentation, coordinating start dates, and ensuring a smooth transition into the organization.`,
    'draw': `This process involves drafting and preparing ${object.toLowerCase()}. It includes gathering requirements, drafting documentation, conducting reviews, obtaining approvals, and distributing final deliverables to relevant stakeholders.`,
    'introduce': `This process facilitates the introduction of ${object.toLowerCase()}. It involves planning orientation activities, preparing materials, conducting introductions, gathering initial feedback, and ensuring a positive first experience.`,
    'reinforce': `This process strengthens and reinforces ${object.toLowerCase()} through sustained effort. It involves identifying reinforcement opportunities, designing follow-up activities, measuring retention, and adapting approaches based on effectiveness data.`,
    'provide': `This process delivers and provides ${object.toLowerCase()} to employees and stakeholders. It involves assessing needs, preparing resources, scheduling delivery, executing support activities, and measuring impact and satisfaction.`,
    'differentiate': `This process establishes differentiation in ${object.toLowerCase()} based on specific criteria. It involves segmentation analysis, needs assessment by group, customized approach design, and effectiveness measurement across segments.`,
    'optimize': `This process focuses on optimizing ${object.toLowerCase()} for maximum effectiveness. It involves performance analysis, bottleneck identification, solution design, implementation of improvements, and measurement of optimization outcomes.`,
    'archive': `This process manages the archiving and retention of ${object.toLowerCase()}. It involves classification, storage, access control, retention schedule compliance, and secure disposal when retention periods expire.`,
    'complete': `This process ensures thorough completion of ${object.toLowerCase()}. It involves gathering required information, validating accuracy, processing submissions, resolving discrepancies, and maintaining completed records.`,
    'gather': `This process manages the systematic gathering of ${object.toLowerCase()}. It involves identifying data sources, designing collection methods, executing data gathering activities, validating collected data, and organizing results for analysis.`,
    'transform': `This process handles the transformation of ${object.toLowerCase()} into usable formats. It involves data cleansing, standardization, integration, quality validation, and preparation of transformed outputs for downstream consumption.`,
    'receive': `This process manages the receipt and intake of ${object.toLowerCase()}. It involves establishing intake procedures, validating received items, documenting receipt, routing to appropriate parties, and confirming completeness.`,
    'liaise': `This process manages liaison activities with ${object.toLowerCase()}. It involves establishing communication channels, coordinating information exchange, facilitating collaboration, resolving issues, and maintaining productive working relationships.`,
    'appraise': `This process conducts formal appraisal of ${object.toLowerCase()}. It involves establishing appraisal criteria, gathering evidence, conducting assessments, documenting findings, and communicating results to stakeholders.`,
    'conduct': `This process manages the execution of ${object.toLowerCase()}. It involves planning activities, preparing resources, conducting sessions, documenting outcomes, and following up on action items to ensure comprehensive completion.`,
    'reward': `This process manages the recognition and reward of ${object.toLowerCase()}. It involves identifying eligible recipients, selecting appropriate rewards, administering recognition programs, and measuring the impact on motivation and retention.`,
  }

  const lowerVerb = verb.toLowerCase()
  if (verbDescriptions[lowerVerb]) {
    return verbDescriptions[lowerVerb]
  }

  return `This process encompasses the systematic execution of activities related to ${object.toLowerCase()}. It involves planning, coordination, execution, and evaluation to ensure outcomes align with organizational objectives and industry best practices. The process requires cross-functional collaboration and adherence to established policies and regulatory requirements.`
}

function enrichFile(filePath: string) {
  const content = readFileSync(filePath, 'utf-8')
  const area = getProcessArea(filePath)

  // Parse frontmatter
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/)
  if (!fmMatch) return

  const fm = fmMatch[1]
  const nameMatch = fm.match(/name:\s*"([^"]+)"/)
  const hierarchyIdMatch = fm.match(/hierarchyId:\s*"([^"]+)"/)
  const codeMatch = fm.match(/code:\s*"([^"]+)"/)
  const typeMatch = fm.match(/type:\s*(\w+)/)

  if (!nameMatch) return

  const name = nameMatch[1]
  const hierarchyId = hierarchyIdMatch?.[1] || ''
  const code = codeMatch?.[1] || ''
  const type = typeMatch?.[1] || 'Activity'

  // Extract verb and object from GraphDL
  const graphdlMatch = content.match(/```\n(\w+)\.(\w[\w.]*)\n```/)
  const verb = graphdlMatch?.[1] || name.split(' ')[0].toLowerCase()
  const objectRaw = graphdlMatch?.[2] || name.split(' ').slice(1).join(' ')
  const objectReadable = objectRaw.replace(/([A-Z])/g, ' $1').trim().toLowerCase()

  // Check if already enriched (has Process Flow section)
  if (content.includes('## Process Flow') && content.includes('## RACI Matrix')) {
    console.log(`  Skipping (already enriched): ${basename(filePath)}`)
    return
  }

  // Build enrichment content
  const occupations = occupationMap[area] || occupationMap['7.1']
  const departments = departmentMap[area] || departmentMap['7.1']
  const variations = industryVariationMap[area] || industryVariationMap['7.1']
  const kpis = kpiMap[area] || kpiMap['7.1']
  const raci = raciMap[area] || raciMap['7.1']

  const processDescription = getProcessDescription(name, verb, objectReadable)

  // Find where to insert - before the source line at the bottom
  const sourceLineMatch = content.match(/\n---\n\n\*Source:.*\*\n?$/)

  let beforeSource: string
  let sourceLine: string

  if (sourceLineMatch) {
    const idx = content.lastIndexOf('\n---\n\n*Source:')
    beforeSource = content.substring(0, idx)
    sourceLine = content.substring(idx)
  } else {
    beforeSource = content
    sourceLine = ''
  }

  // Replace the existing thin Overview with enriched version
  // Find the overview section and enhance it
  const overviewMatch = beforeSource.match(/(## Overview\n\n)([\s\S]*?)(\n\n## )/)
  if (overviewMatch) {
    const existingOverview = overviewMatch[2]
    const enhancedOverview = `${existingOverview}\n\n${processDescription}`
    beforeSource = beforeSource.replace(
      `${overviewMatch[1]}${overviewMatch[2]}${overviewMatch[3]}`,
      `${overviewMatch[1]}${enhancedOverview}${overviewMatch[3]}`
    )
  }

  // Build new sections
  const newSections = `

## Process Flow

\`\`\`mermaid
flowchart LR
    subgraph Inputs["Inputs"]
        I1["Policy & Standards"]
        I2["Organizational Data"]
        I3["Stakeholder Requirements"]
    end

    subgraph Process["${name}"]
        S1["Initiate & Plan"]
        S2["Gather Information"]
        S3["Analyze & Assess"]
        S4["Execute & Implement"]
        S5["Review & Validate"]
    end

    subgraph Outputs["Outputs"]
        O1["Deliverables & Reports"]
        O2["Updated Records"]
        O3["Stakeholder Communication"]
    end

    I1 --> S1
    I2 --> S2
    I3 --> S1
    S1 --> S2
    S2 --> S3
    S3 --> S4
    S4 --> S5
    S5 --> O1
    S5 --> O2
    S4 --> O3
\`\`\`

## RACI Matrix

| Activity | Responsible | Accountable | Consulted | Informed |
|----------|------------|-------------|-----------|----------|
${raci.map(r => `| ${r.activity} | ${r.responsible} | ${r.accountable} | ${r.consulted} | ${r.informed} |`).join('\n')}

## Related Occupations

${occupations.map(o => `- [${o.name}](${o.path})`).join('\n')}

## Related Departments

${departments.map(d => `- ${d}`).join('\n')}

## Industry Variations

${variations.map(v => `### ${v.industry}\n\n${v.detail}`).join('\n\n')}

## KPIs & Metrics

| Metric | Description | Target |
|--------|-------------|--------|
${kpis.map(k => `| ${k.metric} | ${k.description} | ${k.target} |`).join('\n')}
`

  const enriched = beforeSource + newSections + sourceLine
  writeFileSync(filePath, enriched)

  const newSize = statSync(filePath).size
  console.log(`  Enriched: ${basename(filePath)} (${newSize} bytes)`)
}

// Process all files
let count = 0
for (const file of files) {
  enrichFile(file)
  count++
}

console.log(`\nCompleted: ${count} files processed`)
