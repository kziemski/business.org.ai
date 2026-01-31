/**
 * Enrich healthcare-provider industry process files with:
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
const PROCESSES_DIR = path.join(__dirname, '..', 'processes', 'industries', 'healthcare-provider')

// APQC Category mappings to occupations and departments
interface CategoryMapping {
  occupations: { path: string; name: string }[]
  departments: { path: string; name: string }[]
  industryVariation: string
}

// Healthcare-specific occupations organized by function
const HEALTHCARE_OCCUPATIONS = {
  clinical: [
    { path: '/occupations/HealthcarePractitioners/RegisteredNurses', name: 'Registered Nurses' },
    { path: '/occupations/HealthcarePractitioners/Physicians', name: 'Physicians' },
    { path: '/occupations/HealthcarePractitioners/PhysicianAssistants', name: 'Physician Assistants' },
    { path: '/occupations/HealthcarePractitioners/NursePractitioners', name: 'Nurse Practitioners' },
    { path: '/occupations/HealthcarePractitioners/LicensedPracticalAndLicensedVocationalNurses', name: 'Licensed Practical Nurses' },
  ],
  clinicalSupport: [
    { path: '/occupations/HealthcareSupport/MedicalAssistants', name: 'Medical Assistants' },
    { path: '/occupations/HealthcareSupport/NursingAssistants', name: 'Nursing Assistants' },
    { path: '/occupations/HealthcareSupport/Phlebotomists', name: 'Phlebotomists' },
    { path: '/occupations/HealthcareSupport/MedicalEquipmentPreparers', name: 'Medical Equipment Preparers' },
  ],
  pharmacy: [
    { path: '/occupations/HealthcarePractitioners/Pharmacists', name: 'Pharmacists' },
    { path: '/occupations/HealthcarePractitioners/PharmacyTechnicians', name: 'Pharmacy Technicians' },
    { path: '/occupations/HealthcareSupport/PharmacyAides', name: 'Pharmacy Aides' },
  ],
  diagnostics: [
    { path: '/occupations/HealthcarePractitioners/MedicalAndClinicalLaboratoryTechnologists', name: 'Clinical Laboratory Technologists' },
    { path: '/occupations/HealthcarePractitioners/MedicalAndClinicalLaboratoryTechnicians', name: 'Clinical Laboratory Technicians' },
    { path: '/occupations/HealthcarePractitioners/RadiologicTechnologistsAndTechnicians', name: 'Radiologic Technologists' },
    { path: '/occupations/HealthcarePractitioners/DiagnosticMedicalSonographers', name: 'Diagnostic Medical Sonographers' },
  ],
  therapy: [
    { path: '/occupations/HealthcarePractitioners/PhysicalTherapists', name: 'Physical Therapists' },
    { path: '/occupations/HealthcarePractitioners/OccupationalTherapists', name: 'Occupational Therapists' },
    { path: '/occupations/HealthcarePractitioners/RespiratoryTherapists', name: 'Respiratory Therapists' },
    { path: '/occupations/HealthcarePractitioners/SpeechLanguagePathologists', name: 'Speech-Language Pathologists' },
  ],
  management: [
    { path: '/occupations/Management/MedicalAndHealthServicesManagers', name: 'Medical and Health Services Managers' },
    { path: '/occupations/Management/GeneralAndOperationsManagers', name: 'General and Operations Managers' },
    { path: '/occupations/Management/ChiefExecutives', name: 'Chief Executives' },
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
    { path: '/occupations/Business/Financial/FinancialAnalysts', name: 'Financial Analysts' },
    { path: '/occupations/Administrative/BillingAndPostingClerks', name: 'Billing and Posting Clerks' },
  ],
  it: [
    { path: '/occupations/Management/ComputerAndInformationSystemsManagers', name: 'Computer and Information Systems Managers' },
    { path: '/occupations/Technology/SoftwareDevelopers', name: 'Software Developers' },
    { path: '/occupations/Technology/ComputerSystemsAnalysts', name: 'Computer Systems Analysts' },
    { path: '/occupations/Technology/InformationSecurityAnalysts', name: 'Information Security Analysts' },
    { path: '/occupations/HealthcarePractitioners/HealthInformationTechnologistsAndMedicalRegistrars', name: 'Health Information Technologists' },
  ],
  administrative: [
    { path: '/occupations/Administrative/MedicalSecretariesAndAdministrativeAssistants', name: 'Medical Secretaries' },
    { path: '/occupations/Administrative/ReceptionistsAndInformationClerks', name: 'Receptionists and Information Clerks' },
    { path: '/occupations/HealthcarePractitioners/MedicalRecordsSpecialists', name: 'Medical Records Specialists' },
    { path: '/occupations/Administrative/CustomerServiceRepresentatives', name: 'Customer Service Representatives' },
  ],
  compliance: [
    { path: '/occupations/Management/ComplianceManagers', name: 'Compliance Managers' },
    { path: '/occupations/Management/RegulatoryAffairsManagers', name: 'Regulatory Affairs Managers' },
    { path: '/occupations/Business/ComplianceOfficers', name: 'Compliance Officers' },
  ],
  quality: [
    { path: '/occupations/Management/QualityControlSystemsManagers', name: 'Quality Control Systems Managers' },
    { path: '/occupations/Business/ManagementAnalysts', name: 'Management Analysts' },
  ],
  procurement: [
    { path: '/occupations/Management/PurchasingManagers', name: 'Purchasing Managers' },
    { path: '/occupations/Business/PurchasingAgentsExceptWholesaleRetailAndFarmProducts', name: 'Purchasing Agents' },
    { path: '/occupations/Management/SupplyChainManagers', name: 'Supply Chain Managers' },
  ],
  facilities: [
    { path: '/occupations/Management/FacilitiesManagers', name: 'Facilities Managers' },
    { path: '/occupations/Maintenance/MaintenanceAndRepairWorkers', name: 'Maintenance and Repair Workers' },
    { path: '/occupations/Facilities/JanitorsAndCleaners', name: 'Janitors and Cleaners' },
  ],
  research: [
    { path: '/occupations/Management/ClinicalResearchCoordinators', name: 'Clinical Research Coordinators' },
    { path: '/occupations/Science/MedicalScientists', name: 'Medical Scientists' },
    { path: '/occupations/Science/Epidemiologists', name: 'Epidemiologists' },
  ],
  marketing: [
    { path: '/occupations/Management/MarketingManagers', name: 'Marketing Managers' },
    { path: '/occupations/Business/MarketResearchAnalystsAndMarketingSpecialists', name: 'Market Research Analysts' },
    { path: '/occupations/Management/PublicRelationsManagers', name: 'Public Relations Managers' },
  ],
  emergency: [
    { path: '/occupations/HealthcarePractitioners/EmergencyMedicinePhysicians', name: 'Emergency Medicine Physicians' },
    { path: '/occupations/HealthcarePractitioners/Paramedics', name: 'Paramedics' },
    { path: '/occupations/HealthcarePractitioners/EmergencyMedicalTechnicians', name: 'Emergency Medical Technicians' },
    { path: '/occupations/HealthcarePractitioners/CriticalCareNurses', name: 'Critical Care Nurses' },
  ],
}

// Healthcare-specific departments
const HEALTHCARE_DEPARTMENTS = {
  clinical: [
    { path: '/departments/Operations', name: 'Clinical Operations' },
    { path: '/departments/Quality', name: 'Quality and Patient Safety' },
  ],
  administrative: [
    { path: '/departments/Operations', name: 'Operations' },
    { path: '/departments/Support', name: 'Administrative Support' },
  ],
  hr: [
    { path: '/departments/HR', name: 'Human Resources' },
  ],
  finance: [
    { path: '/departments/Finance', name: 'Finance' },
  ],
  it: [
    { path: '/departments/Technology', name: 'Health Information Technology' },
    { path: '/departments/DataAnalytics', name: 'Data Analytics' },
  ],
  compliance: [
    { path: '/departments/Legal', name: 'Legal and Compliance' },
  ],
  research: [
    { path: '/departments/Research', name: 'Research and Development' },
  ],
  marketing: [
    { path: '/departments/Marketing', name: 'Marketing and Communications' },
  ],
  strategy: [
    { path: '/departments/Strategy', name: 'Strategy' },
    { path: '/departments/Executive', name: 'Executive Leadership' },
  ],
  procurement: [
    { path: '/departments/Procurement', name: 'Procurement' },
    { path: '/departments/SupplyChain', name: 'Supply Chain' },
  ],
  facilities: [
    { path: '/departments/Operations', name: 'Facilities Management' },
  ],
  quality: [
    { path: '/departments/Quality', name: 'Quality Assurance' },
  ],
}

// APQC category to occupation/department mapping
function getCategoryMapping(code: string, processName: string): CategoryMapping {
  const category = code.split('.')[0]
  const nameLower = processName.toLowerCase()

  // Keyword-based occupation selection
  const getOccupationsByKeywords = (): { path: string; name: string }[] => {
    const occupations: { path: string; name: string }[] = []

    // HR keywords - check first with high priority
    if (nameLower.includes('employee') || nameLower.includes('staff') || nameLower.includes('recruit') ||
        nameLower.includes('training') || nameLower.includes('compensation') || nameLower.includes('benefit') ||
        nameLower.includes('payroll') || nameLower.includes('workforce') || nameLower.includes('hr ') ||
        nameLower.includes('human resource') || nameLower.includes('talent') || nameLower.includes('onboard') ||
        nameLower.includes('separation') || nameLower.includes('retire') || nameLower.includes('learning program') ||
        nameLower.includes('competenc') || nameLower.includes('performance review') || nameLower.includes('career') ||
        nameLower.includes('labor relation') || nameLower.includes('grievance')) {
      occupations.push(...HEALTHCARE_OCCUPATIONS.hr)
      // Return early for HR processes to avoid mixing with other categories
      if (category === '7') return occupations
    }

    // Finance keywords - check early with high priority
    if (nameLower.includes('financ') || nameLower.includes('budget') || nameLower.includes('account') ||
        nameLower.includes('billing') || nameLower.includes('revenue') || nameLower.includes('cost') ||
        nameLower.includes('tax') || nameLower.includes('payable') || nameLower.includes('receivable') ||
        nameLower.includes('audit') || nameLower.includes('invoice') || nameLower.includes('treasury') ||
        nameLower.includes('capital') || nameLower.includes('ledger') || nameLower.includes('depreciation')) {
      occupations.push(...HEALTHCARE_OCCUPATIONS.finance)
      // Return early for finance processes
      if (category === '9') return occupations
    }

    // IT keywords - check early with high priority
    if (nameLower.includes('it ') || nameLower.includes('information technology') ||
        nameLower.includes('software') || nameLower.includes('network') || nameLower.includes('infrastructure') ||
        nameLower.includes('ehr') || nameLower.includes('emr') || nameLower.includes('cyber') ||
        nameLower.includes('deployment') || nameLower.includes('portfolio') || nameLower.includes('application')) {
      occupations.push(...HEALTHCARE_OCCUPATIONS.it)
      // Return early for IT processes
      if (category === '8') return occupations
    }

    // Research keywords - check before clinical to catch "clinical trials"
    if (nameLower.includes('trial') || nameLower.includes('research') || nameLower.includes('study')) {
      occupations.push(...HEALTHCARE_OCCUPATIONS.research)
      occupations.push(...HEALTHCARE_OCCUPATIONS.clinical.slice(0, 2))
      return occupations
    }

    // Patient care keywords
    if (nameLower.includes('patient') || nameLower.includes('vital') || nameLower.includes('medication') ||
        nameLower.includes('treatment') || nameLower.includes('diagnosis') || nameLower.includes('care') ||
        nameLower.includes('clinical') || nameLower.includes('specimen') || nameLower.includes('exam')) {
      occupations.push(...HEALTHCARE_OCCUPATIONS.clinical.slice(0, 3))
      occupations.push(...HEALTHCARE_OCCUPATIONS.clinicalSupport.slice(0, 2))
    }

    // Pharmacy keywords
    if (nameLower.includes('medication') || nameLower.includes('pharmacy') || nameLower.includes('drug') ||
        nameLower.includes('prescription') || nameLower.includes('dispens')) {
      occupations.push(...HEALTHCARE_OCCUPATIONS.pharmacy)
    }

    // Lab/diagnostics keywords
    if (nameLower.includes('lab') || nameLower.includes('test') || nameLower.includes('specimen') ||
        nameLower.includes('diagnostic') || nameLower.includes('imaging') || nameLower.includes('radiology')) {
      occupations.push(...HEALTHCARE_OCCUPATIONS.diagnostics.slice(0, 3))
    }

    // Therapy keywords
    if (nameLower.includes('therapy') || nameLower.includes('rehabilitation') || nameLower.includes('physical')) {
      occupations.push(...HEALTHCARE_OCCUPATIONS.therapy.slice(0, 2))
    }

    // Emergency keywords
    if (nameLower.includes('emergency') || nameLower.includes('urgent') || nameLower.includes('critical') ||
        nameLower.includes('triage') || nameLower.includes('ambulance')) {
      occupations.push(...HEALTHCARE_OCCUPATIONS.emergency.slice(0, 3))
    }

    // Data/analytics keywords (distinct from IT infrastructure)
    if (nameLower.includes('data') || nameLower.includes('analytic') || nameLower.includes('metric') ||
        nameLower.includes('report') || nameLower.includes('dashboard') || nameLower.includes('insight')) {
      occupations.push(...HEALTHCARE_OCCUPATIONS.it.slice(0, 2))
    }

    // Security keywords
    if (nameLower.includes('security') || nameLower.includes('access control') || nameLower.includes('authenticat')) {
      occupations.push(...HEALTHCARE_OCCUPATIONS.it.slice(3, 5))
    }

    // Compliance keywords
    if (nameLower.includes('compliance') || nameLower.includes('regulatory') || nameLower.includes('hipaa') ||
        nameLower.includes('legal') || nameLower.includes('audit') || nameLower.includes('policy') ||
        nameLower.includes('accreditation') || nameLower.includes('joint commission')) {
      occupations.push(...HEALTHCARE_OCCUPATIONS.compliance)
    }

    // Quality keywords
    if (nameLower.includes('quality') || nameLower.includes('safety') || nameLower.includes('improvement') ||
        nameLower.includes('outcome') || nameLower.includes('performance') || nameLower.includes('metric')) {
      occupations.push(...HEALTHCARE_OCCUPATIONS.quality)
    }

    // Procurement/supply chain keywords
    if (nameLower.includes('procur') || nameLower.includes('supply') || nameLower.includes('vendor') ||
        nameLower.includes('purchas') || nameLower.includes('supplier') || nameLower.includes('inventory') ||
        nameLower.includes('equipment') || nameLower.includes('material')) {
      occupations.push(...HEALTHCARE_OCCUPATIONS.procurement)
    }

    // Facilities keywords
    if (nameLower.includes('facilit') || nameLower.includes('building') || nameLower.includes('maintenance') ||
        nameLower.includes('workspace') || nameLower.includes('asset') || nameLower.includes('property')) {
      occupations.push(...HEALTHCARE_OCCUPATIONS.facilities)
    }

    // Research keywords
    if (nameLower.includes('research') || nameLower.includes('trial') || nameLower.includes('study') ||
        nameLower.includes('innovation') || nameLower.includes('develop') && nameLower.includes('new')) {
      occupations.push(...HEALTHCARE_OCCUPATIONS.research)
    }

    // Marketing keywords
    if (nameLower.includes('market') || nameLower.includes('brand') || nameLower.includes('advertis') ||
        nameLower.includes('campaign') || nameLower.includes('public relation') || nameLower.includes('outreach')) {
      occupations.push(...HEALTHCARE_OCCUPATIONS.marketing)
    }

    // Administrative keywords
    if (nameLower.includes('schedule') || nameLower.includes('appointment') || nameLower.includes('registration') ||
        nameLower.includes('record') || nameLower.includes('document') || nameLower.includes('filing') ||
        nameLower.includes('demographic')) {
      occupations.push(...HEALTHCARE_OCCUPATIONS.administrative)
    }

    return occupations
  }

  // Keyword-based department selection
  const getDepartmentsByKeywords = (): { path: string; name: string }[] => {
    const departments: { path: string; name: string }[] = []

    // Category-first approach: for specific categories, prioritize department alignment
    if (category === '7') {
      // Category 7 = HR - always return HR departments
      return [...HEALTHCARE_DEPARTMENTS.hr]
    }

    if (category === '9') {
      // Category 9 = Finance - always return Finance departments
      return [...HEALTHCARE_DEPARTMENTS.finance]
    }

    if (category === '8') {
      // Category 8 = IT - always return IT departments
      return [...HEALTHCARE_DEPARTMENTS.it]
    }

    // HR keywords
    if (nameLower.includes('employee') || nameLower.includes('staff') || nameLower.includes('hr') ||
        nameLower.includes('recruit') || nameLower.includes('training') || nameLower.includes('workforce') ||
        nameLower.includes('benefit') || nameLower.includes('compensation') || nameLower.includes('payroll') ||
        nameLower.includes('talent') || nameLower.includes('learning') || nameLower.includes('competenc') ||
        nameLower.includes('onboard') || nameLower.includes('separation') || nameLower.includes('retire')) {
      departments.push(...HEALTHCARE_DEPARTMENTS.hr)
    }

    // Finance keywords
    if (nameLower.includes('financ') || nameLower.includes('budget') || nameLower.includes('account') ||
        nameLower.includes('billing') || nameLower.includes('revenue') || nameLower.includes('tax') ||
        nameLower.includes('treasury') || nameLower.includes('capital') || nameLower.includes('ledger')) {
      departments.push(...HEALTHCARE_DEPARTMENTS.finance)
    }

    // IT keywords
    if (nameLower.includes('it ') || nameLower.includes('technology') || nameLower.includes('software') ||
        nameLower.includes('network') || nameLower.includes('infrastructure') || nameLower.includes('portfolio') ||
        nameLower.includes('deployment') || nameLower.includes('application')) {
      departments.push(...HEALTHCARE_DEPARTMENTS.it)
    }

    if (nameLower.includes('patient') || nameLower.includes('clinical') || nameLower.includes('care') ||
        nameLower.includes('treatment') || nameLower.includes('medication')) {
      departments.push(...HEALTHCARE_DEPARTMENTS.clinical)
    }
    if (nameLower.includes('data') || nameLower.includes('analytic') || nameLower.includes('metric') ||
        nameLower.includes('report') || nameLower.includes('dashboard')) {
      departments.push(...HEALTHCARE_DEPARTMENTS.it)
    }
    if (nameLower.includes('security') || nameLower.includes('access')) {
      departments.push({ path: '/departments/Security', name: 'Security' })
    }
    if (nameLower.includes('compliance') || nameLower.includes('regulatory') || nameLower.includes('legal') ||
        nameLower.includes('hipaa') || nameLower.includes('policy')) {
      departments.push(...HEALTHCARE_DEPARTMENTS.compliance)
    }
    if (nameLower.includes('research') || nameLower.includes('trial') || nameLower.includes('innovation')) {
      departments.push(...HEALTHCARE_DEPARTMENTS.research)
    }
    if (nameLower.includes('market') || nameLower.includes('brand') || nameLower.includes('communication')) {
      departments.push(...HEALTHCARE_DEPARTMENTS.marketing)
    }
    if (nameLower.includes('strateg') || nameLower.includes('vision') || nameLower.includes('mission') ||
        nameLower.includes('business model') || nameLower.includes('executive')) {
      departments.push(...HEALTHCARE_DEPARTMENTS.strategy)
    }
    if (nameLower.includes('procur') || nameLower.includes('supply') || nameLower.includes('vendor') ||
        nameLower.includes('purchas')) {
      departments.push(...HEALTHCARE_DEPARTMENTS.procurement)
    }
    if (nameLower.includes('facilit') || nameLower.includes('building') || nameLower.includes('maintenance') ||
        nameLower.includes('asset')) {
      departments.push(...HEALTHCARE_DEPARTMENTS.facilities)
    }
    if (nameLower.includes('quality') || nameLower.includes('safety') || nameLower.includes('improvement')) {
      departments.push(...HEALTHCARE_DEPARTMENTS.quality)
    }

    return departments
  }

  // Get industry variation based on category and keywords
  const getIndustryVariation = (): string => {
    // HR processes - check category first for category 7
    if (category === '7' || nameLower.includes('employee') || nameLower.includes('staff') || nameLower.includes('recruit') ||
        nameLower.includes('training') || nameLower.includes('workforce') || nameLower.includes('hr ') ||
        nameLower.includes('benefit') || nameLower.includes('compensation') || nameLower.includes('payroll') ||
        nameLower.includes('talent') || nameLower.includes('onboard') || nameLower.includes('learning') ||
        nameLower.includes('competenc') || nameLower.includes('separation') || nameLower.includes('retire')) {
      if (category === '7') {
        return `In healthcare settings, this HR process must address unique challenges including 24/7 staffing requirements, clinical credentialing and privileging, continuing education requirements for licensed professionals, and managing a diverse workforce of clinical and non-clinical staff. Healthcare organizations must also navigate nurse-to-patient ratios, on-call scheduling, and compliance with healthcare-specific labor regulations.`
      }
    }

    // Research processes - check before clinical to catch "clinical trials"
    if (nameLower.includes('trial') || nameLower.includes('research') || nameLower.includes('study')) {
      return `Clinical research in healthcare settings requires IRB approval, informed consent processes, and compliance with FDA regulations and Good Clinical Practice (GCP) guidelines. Healthcare providers conducting research must balance research activities with patient care responsibilities and ensure appropriate patient selection and safety monitoring.`
    }

    // Patient care processes
    if (nameLower.includes('patient') || nameLower.includes('clinical') || nameLower.includes('care') ||
        nameLower.includes('treatment') || nameLower.includes('medication') || nameLower.includes('diagnosis')) {
      return `Healthcare providers implement this process with patient safety and clinical outcomes as the primary focus. Unlike other industries, this process must comply with HIPAA privacy regulations, clinical documentation requirements, and evidence-based practice standards. The process integrates with Electronic Health Records (EHR) systems and follows Joint Commission accreditation standards.`
    }

    // Finance processes
    if (nameLower.includes('financ') || nameLower.includes('budget') || nameLower.includes('billing') ||
        nameLower.includes('revenue') || nameLower.includes('account') || nameLower.includes('tax')) {
      return `Healthcare financial processes are uniquely complex due to multiple payer systems (Medicare, Medicaid, commercial insurance, self-pay), complex reimbursement models (fee-for-service, value-based care, bundled payments), and regulatory requirements around billing practices. Revenue cycle management must integrate with clinical documentation and coding (ICD-10, CPT) to ensure accurate claims submission and minimize denials.`
    }

    // IT processes
    if (nameLower.includes('it ') || nameLower.includes('technology') || nameLower.includes('system') ||
        nameLower.includes('data') || nameLower.includes('software')) {
      return `Healthcare IT processes must prioritize HIPAA compliance, patient data security, and interoperability between clinical systems. This includes EHR/EMR integration, health information exchange (HIE) connectivity, and support for clinical decision support systems. IT must ensure 99.99% uptime for critical patient care systems and maintain audit trails for all PHI access.`
    }

    // Compliance processes
    if (nameLower.includes('compliance') || nameLower.includes('regulatory') || nameLower.includes('risk') ||
        nameLower.includes('legal') || nameLower.includes('policy')) {
      return `Healthcare compliance involves navigating a complex regulatory landscape including HIPAA, the Affordable Care Act, Stark Law, Anti-Kickback Statute, EMTALA, and state-specific healthcare regulations. Healthcare providers must also maintain accreditation with bodies like The Joint Commission, CMS Conditions of Participation, and specialty-specific certification requirements.`
    }

    // Quality processes
    if (nameLower.includes('quality') || nameLower.includes('safety') || nameLower.includes('improvement') ||
        nameLower.includes('outcome')) {
      return `Quality management in healthcare is driven by patient safety imperatives and regulatory requirements. This process incorporates clinical quality measures (CQMs), patient satisfaction scores (HCAHPS), and value-based purchasing metrics. Healthcare providers utilize root cause analysis, sentinel event reporting, and continuous quality improvement methodologies specific to clinical settings.`
    }

    // Research processes
    if (nameLower.includes('research') || nameLower.includes('trial') || nameLower.includes('study')) {
      return `Clinical research in healthcare settings requires IRB approval, informed consent processes, and compliance with FDA regulations and Good Clinical Practice (GCP) guidelines. Healthcare providers conducting research must balance research activities with patient care responsibilities and ensure appropriate patient selection and safety monitoring.`
    }

    // Procurement/supply chain processes
    if (nameLower.includes('procur') || nameLower.includes('supply') || nameLower.includes('vendor') ||
        nameLower.includes('inventory') || nameLower.includes('equipment')) {
      return `Healthcare supply chain management requires specialized handling of pharmaceuticals, medical devices, and biological materials. This includes cold chain management, sterile supply processing, and compliance with FDA device regulations. Healthcare providers must also manage Group Purchasing Organization (GPO) contracts and ensure supply continuity for critical patient care items.`
    }

    // Facilities processes
    if (nameLower.includes('facilit') || nameLower.includes('building') || nameLower.includes('maintenance') ||
        nameLower.includes('asset')) {
      return `Healthcare facilities management must comply with healthcare-specific building codes, infection control requirements, and life safety standards. This includes maintaining specialized HVAC systems, medical gas systems, and emergency power systems. Facilities must meet The Joint Commission Environment of Care standards and CMS physical environment requirements.`
    }

    // Marketing processes
    if (nameLower.includes('market') || nameLower.includes('brand') || nameLower.includes('advertis') ||
        nameLower.includes('outreach')) {
      return `Healthcare marketing must comply with advertising regulations, HIPAA restrictions on patient information use, and ethical guidelines from medical associations. Marketing strategies focus on community health education, service line promotion, and physician referral development while maintaining patient trust and organizational reputation.`
    }

    // Strategy processes
    if (nameLower.includes('strateg') || nameLower.includes('vision') || nameLower.includes('plan') ||
        nameLower.includes('business model')) {
      return `Strategic planning in healthcare must consider the unique dynamics of the healthcare market including changing reimbursement models, population health trends, regulatory changes, and community health needs assessments. Healthcare strategy integrates clinical quality goals with financial sustainability and addresses the shift from volume-based to value-based care delivery.`
    }

    // Default by category
    switch (category) {
      case '1':
        return `Healthcare providers approach strategic planning with consideration for community health needs, regulatory requirements, and the shift toward value-based care. Strategy must balance clinical mission with financial sustainability and stakeholder expectations including patients, clinicians, payers, and regulators.`
      case '2':
        return `Service development in healthcare involves clinical protocol development, care pathway design, and evidence-based practice implementation. New service lines require medical staff approval, regulatory compliance review, and integration with existing clinical workflows.`
      case '3':
        return `Healthcare marketing and patient acquisition focuses on physician referral development, community health education, and service line awareness. Patient engagement strategies must comply with HIPAA and healthcare advertising regulations.`
      case '4':
        return `Clinical service delivery in healthcare follows evidence-based protocols, quality standards, and patient safety requirements. Care delivery integrates clinical documentation, care coordination, and outcome measurement.`
      case '5':
        return `Healthcare service delivery emphasizes patient-centered care, clinical quality, and care coordination across the continuum. Services must meet accreditation standards and regulatory requirements while achieving optimal patient outcomes.`
      case '6':
        return `Patient service and experience management in healthcare involves patient navigation, care coordination, and addressing both clinical and non-clinical patient needs. Patient satisfaction directly impacts reimbursement through value-based purchasing programs.`
      case '7':
        return `Healthcare human capital management addresses unique challenges including clinical credentialing, continuing education requirements, 24/7 staffing, and managing a diverse workforce of licensed and non-licensed professionals.`
      case '8':
        return `Healthcare IT management prioritizes HIPAA compliance, EHR optimization, clinical decision support, and interoperability. IT must ensure high availability of systems critical to patient care and maintain comprehensive audit trails.`
      case '9':
        return `Healthcare financial management navigates complex payer mix, regulatory reimbursement requirements, and the transition to value-based payment models. Revenue cycle management integrates closely with clinical documentation and coding.`
      case '10':
        return `Healthcare asset management includes specialized medical equipment, clinical technology lifecycle management, and facilities that meet healthcare-specific building and safety codes.`
      case '11':
        return `Healthcare risk and compliance management addresses extensive regulatory requirements including HIPAA, clinical quality reporting, accreditation standards, and professional liability considerations.`
      case '12':
        return `Healthcare external relationships include payer contracting, physician network development, community partnerships, and regulatory agency relations. Stakeholder management must balance clinical, financial, and community health objectives.`
      case '13':
        return `Healthcare business capabilities focus on clinical excellence, patient experience, and operational efficiency. Capability development supports the organization's ability to deliver high-quality, cost-effective care across the continuum.`
      default:
        return `Healthcare providers implement this process with emphasis on patient safety, regulatory compliance, and clinical quality. The process integrates with clinical workflows and must comply with healthcare-specific regulations including HIPAA and accreditation standards.`
    }
  }

  // Get occupations based on keywords and category
  let occupations = getOccupationsByKeywords()

  // If no keyword matches, use category-based defaults
  if (occupations.length === 0) {
    switch (category) {
      case '1': // Strategy
        occupations = [...HEALTHCARE_OCCUPATIONS.management, ...HEALTHCARE_OCCUPATIONS.clinical.slice(0, 1)]
        break
      case '2': // Product/Service Development
        occupations = [...HEALTHCARE_OCCUPATIONS.clinical.slice(0, 2), ...HEALTHCARE_OCCUPATIONS.research, ...HEALTHCARE_OCCUPATIONS.management.slice(0, 1)]
        break
      case '3': // Marketing/Sales
        occupations = [...HEALTHCARE_OCCUPATIONS.marketing, ...HEALTHCARE_OCCUPATIONS.management.slice(0, 1)]
        break
      case '4': // Deliver Products (Clinical Delivery)
        occupations = [...HEALTHCARE_OCCUPATIONS.clinical, ...HEALTHCARE_OCCUPATIONS.clinicalSupport.slice(0, 2)]
        break
      case '5': // Deliver Services
        occupations = [...HEALTHCARE_OCCUPATIONS.clinical.slice(0, 3), ...HEALTHCARE_OCCUPATIONS.therapy.slice(0, 2)]
        break
      case '6': // Customer Service
        occupations = [...HEALTHCARE_OCCUPATIONS.administrative, ...HEALTHCARE_OCCUPATIONS.clinical.slice(0, 1)]
        break
      case '7': // HR
        occupations = [...HEALTHCARE_OCCUPATIONS.hr, ...HEALTHCARE_OCCUPATIONS.management.slice(0, 1)]
        break
      case '8': // IT
        occupations = [...HEALTHCARE_OCCUPATIONS.it]
        break
      case '9': // Finance
        occupations = [...HEALTHCARE_OCCUPATIONS.finance]
        break
      case '10': // Assets
        occupations = [...HEALTHCARE_OCCUPATIONS.facilities, ...HEALTHCARE_OCCUPATIONS.procurement.slice(0, 1)]
        break
      case '11': // Risk/Compliance
        occupations = [...HEALTHCARE_OCCUPATIONS.compliance, ...HEALTHCARE_OCCUPATIONS.quality]
        break
      case '12': // External Relationships
        occupations = [...HEALTHCARE_OCCUPATIONS.management, ...HEALTHCARE_OCCUPATIONS.marketing.slice(0, 1)]
        break
      case '13': // Capabilities
        occupations = [...HEALTHCARE_OCCUPATIONS.management, ...HEALTHCARE_OCCUPATIONS.quality, ...HEALTHCARE_OCCUPATIONS.it.slice(0, 1)]
        break
      default:
        occupations = [...HEALTHCARE_OCCUPATIONS.management, ...HEALTHCARE_OCCUPATIONS.clinical.slice(0, 2)]
    }
  }

  // Get departments based on keywords and category
  let departments = getDepartmentsByKeywords()

  // If no keyword matches, use category-based defaults
  if (departments.length === 0) {
    switch (category) {
      case '1':
        departments = [...HEALTHCARE_DEPARTMENTS.strategy]
        break
      case '2':
        departments = [...HEALTHCARE_DEPARTMENTS.clinical, ...HEALTHCARE_DEPARTMENTS.research]
        break
      case '3':
        departments = [...HEALTHCARE_DEPARTMENTS.marketing]
        break
      case '4':
      case '5':
        departments = [...HEALTHCARE_DEPARTMENTS.clinical]
        break
      case '6':
        departments = [...HEALTHCARE_DEPARTMENTS.administrative, ...HEALTHCARE_DEPARTMENTS.clinical.slice(0, 1)]
        break
      case '7':
        departments = [...HEALTHCARE_DEPARTMENTS.hr]
        break
      case '8':
        departments = [...HEALTHCARE_DEPARTMENTS.it]
        break
      case '9':
        departments = [...HEALTHCARE_DEPARTMENTS.finance]
        break
      case '10':
        departments = [...HEALTHCARE_DEPARTMENTS.facilities, ...HEALTHCARE_DEPARTMENTS.procurement]
        break
      case '11':
        departments = [...HEALTHCARE_DEPARTMENTS.compliance, ...HEALTHCARE_DEPARTMENTS.quality]
        break
      case '12':
        departments = [...HEALTHCARE_DEPARTMENTS.strategy, ...HEALTHCARE_DEPARTMENTS.marketing]
        break
      case '13':
        departments = [...HEALTHCARE_DEPARTMENTS.strategy, ...HEALTHCARE_DEPARTMENTS.quality]
        break
      default:
        departments = [...HEALTHCARE_DEPARTMENTS.clinical, ...HEALTHCARE_DEPARTMENTS.administrative]
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
  console.log('=== Enriching Healthcare Provider Process Files ===\n')

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
