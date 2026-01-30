import { readdir, readFile, writeFile } from 'fs/promises'
import { join } from 'path'

const BASE = join(import.meta.dirname, '..', 'processes', 'industries')

// Industry → occupations with their category paths
const industryOccupations: Record<string, { name: string; path: string }[]> = {
  'aerospace-and-defense': [
    { name: 'Industrial Production Managers', path: '/occupations/Production/IndustrialProductionManagers' },
    { name: 'Mechanical Engineers', path: '/occupations/Architecture/MechanicalEngineers' },
    { name: 'Aerospace Engineers', path: '/occupations/Architecture/AerospaceEngineers' },
  ],
  'airline': [
    { name: 'Airline and Commercial Pilots', path: '/occupations/Transportation/AirlineAndCommercialPilots' },
    { name: 'Flight Attendants', path: '/occupations/Transportation/FlightAttendants' },
    { name: 'Air Traffic Controllers', path: '/occupations/Transportation/AirTrafficControllers' },
  ],
  'automotive': [
    { name: 'Industrial Production Managers', path: '/occupations/Production/IndustrialProductionManagers' },
    { name: 'Mechanical Engineers', path: '/occupations/Architecture/MechanicalEngineers' },
    { name: 'Industrial Engineers', path: '/occupations/Architecture/IndustrialEngineers' },
  ],
  'banking': [
    { name: 'Financial Managers', path: '/occupations/Management/FinancialManagers' },
    { name: 'Loan Officers', path: '/occupations/Business/LoanOfficers' },
    { name: 'Credit Analysts', path: '/occupations/Business/CreditAnalysts' },
    { name: 'Financial Analysts', path: '/occupations/Business/FinancialAnalysts' },
  ],
  'broadcasting': [
    { name: 'Broadcast Announcers and Radio DJs', path: '/occupations/ArtsMedia/BroadcastAnnouncersAndRadioDJs' },
    { name: 'Film and Video Editors', path: '/occupations/ArtsMedia/FilmAndVideoEditors' },
    { name: 'Producers and Directors', path: '/occupations/ArtsMedia/ProducersAndDirectors' },
  ],
  'city-government': [
    { name: 'Urban and Regional Planners', path: '/occupations/Legal/UrbanAndRegionalPlanners' },
    { name: 'Administrative Services Managers', path: '/occupations/Management/AdministrativeServicesManagers' },
    { name: 'Social and Community Service Managers', path: '/occupations/Management/SocialAndCommunityServiceManagers' },
  ],
  'consumer-electronics': [
    { name: 'Electrical Engineers', path: '/occupations/Architecture/ElectricalEngineers' },
    { name: 'Industrial Engineers', path: '/occupations/Architecture/IndustrialEngineers' },
    { name: 'Sales Managers', path: '/occupations/Management/SalesManagers' },
    { name: 'Market Research Analysts', path: '/occupations/Business/MarketResearchAnalysts' },
  ],
  'consumer-products': [
    { name: 'Market Research Analysts', path: '/occupations/Business/MarketResearchAnalysts' },
    { name: 'Sales Managers', path: '/occupations/Management/SalesManagers' },
    { name: 'Industrial Production Managers', path: '/occupations/Production/IndustrialProductionManagers' },
  ],
  'cross-industry': [
    { name: 'General and Operations Managers', path: '/occupations/Management/GeneralAndOperationsManagers' },
    { name: 'Management Analysts', path: '/occupations/Business/ManagementAnalysts' },
    { name: 'Chief Executives', path: '/occupations/Management/ChiefExecutives' },
  ],
  'education': [
    { name: 'Instructional Coordinators', path: '/occupations/Education/InstructionalCoordinators' },
    { name: 'Education Administrators', path: '/occupations/Management/EducationAdministrators' },
    { name: 'Teachers', path: '/occupations/Education/Teachers' },
    { name: 'Training and Development Managers', path: '/occupations/Management/TrainingAndDevelopmentManagers' },
  ],
  'health-insurance': [
    { name: 'Insurance Underwriters', path: '/occupations/Business/InsuranceUnderwriters' },
    { name: 'Claims Adjusters', path: '/occupations/Business/ClaimsAdjusters' },
    { name: 'Actuaries', path: '/occupations/Business/Actuaries' },
    { name: 'Medical and Health Services Managers', path: '/occupations/Management/MedicalAndHealthServicesManagers' },
  ],
  'healthcare-provider': [
    { name: 'Registered Nurses', path: '/occupations/HealthcarePractitioners/RegisteredNurses' },
    { name: 'Physicians and Surgeons', path: '/occupations/HealthcarePractitioners/PhysiciansAndSurgeons' },
    { name: 'Medical and Health Services Managers', path: '/occupations/Management/MedicalAndHealthServicesManagers' },
  ],
  'life-sciences': [
    { name: 'Medical Scientists', path: '/occupations/HealthcarePractitioners/MedicalScientists' },
    { name: 'Biological Technicians', path: '/occupations/HealthcarePractitioners/BiologicalTechnicians' },
    { name: 'Chemical Engineers', path: '/occupations/Architecture/ChemicalEngineers' },
  ],
  'petroleum-downstream': [
    { name: 'Chemical Engineers', path: '/occupations/Architecture/ChemicalEngineers' },
    { name: 'Petroleum Engineers', path: '/occupations/Architecture/PetroleumEngineers' },
    { name: 'Industrial Production Managers', path: '/occupations/Production/IndustrialProductionManagers' },
  ],
  'petroleum-upstream': [
    { name: 'Petroleum Engineers', path: '/occupations/Architecture/PetroleumEngineers' },
    { name: 'Geoscientists', path: '/occupations/Architecture/Geoscientists' },
    { name: 'Mining and Geological Engineers', path: '/occupations/Architecture/MiningAndGeologicalEngineers' },
  ],
  'property-and-casualty-insurance': [
    { name: 'Insurance Underwriters', path: '/occupations/Business/InsuranceUnderwriters' },
    { name: 'Claims Adjusters', path: '/occupations/Business/ClaimsAdjusters' },
    { name: 'Actuaries', path: '/occupations/Business/Actuaries' },
  ],
  'retail': [
    { name: 'Sales Managers', path: '/occupations/Management/SalesManagers' },
    { name: 'Retail Salespersons', path: '/occupations/Sales/RetailSalespersons' },
    { name: 'Cashiers', path: '/occupations/Sales/Cashiers' },
  ],
  'utilities': [
    { name: 'Power Plant Operators', path: '/occupations/Production/PowerPlantOperators' },
    { name: 'Electrical Engineers', path: '/occupations/Architecture/ElectricalEngineers' },
    { name: 'Water Treatment Plant Operators', path: '/occupations/Production/WaterAndWastewaterTreatmentPlantAndSystemOperators' },
  ],
}

const industryDepartments: Record<string, { name: string; path: string }[]> = {
  'aerospace-and-defense': [
    { name: 'Operations', path: '/departments/Operations' },
    { name: 'Research', path: '/departments/Research' },
    { name: 'Legal', path: '/departments/Legal' },
  ],
  'airline': [
    { name: 'Operations', path: '/departments/Operations' },
    { name: 'HR', path: '/departments/HR' },
    { name: 'Sales', path: '/departments/Sales' },
  ],
  'automotive': [
    { name: 'Operations', path: '/departments/Operations' },
    { name: 'Research', path: '/departments/Research' },
    { name: 'Marketing', path: '/departments/Marketing' },
  ],
  'banking': [
    { name: 'Finance', path: '/departments/Finance' },
    { name: 'Legal', path: '/departments/Legal' },
    { name: 'Operations', path: '/departments/Operations' },
  ],
  'broadcasting': [
    { name: 'Marketing', path: '/departments/Marketing' },
    { name: 'Operations', path: '/departments/Operations' },
    { name: 'Sales', path: '/departments/Sales' },
  ],
  'city-government': [
    { name: 'Operations', path: '/departments/Operations' },
    { name: 'Legal', path: '/departments/Legal' },
    { name: 'Finance', path: '/departments/Finance' },
  ],
  'consumer-electronics': [
    { name: 'Research', path: '/departments/Research' },
    { name: 'Marketing', path: '/departments/Marketing' },
    { name: 'Operations', path: '/departments/Operations' },
  ],
  'consumer-products': [
    { name: 'Marketing', path: '/departments/Marketing' },
    { name: 'Sales', path: '/departments/Sales' },
    { name: 'Operations', path: '/departments/Operations' },
  ],
  'cross-industry': [
    { name: 'Executive', path: '/departments/Executive' },
    { name: 'Operations', path: '/departments/Operations' },
    { name: 'Finance', path: '/departments/Finance' },
  ],
  'education': [
    { name: 'Operations', path: '/departments/Operations' },
    { name: 'HR', path: '/departments/HR' },
    { name: 'Finance', path: '/departments/Finance' },
  ],
  'health-insurance': [
    { name: 'Finance', path: '/departments/Finance' },
    { name: 'Legal', path: '/departments/Legal' },
    { name: 'Operations', path: '/departments/Operations' },
  ],
  'healthcare-provider': [
    { name: 'Operations', path: '/departments/Operations' },
    { name: 'HR', path: '/departments/HR' },
    { name: 'Research', path: '/departments/Research' },
  ],
  'life-sciences': [
    { name: 'Research', path: '/departments/Research' },
    { name: 'Legal', path: '/departments/Legal' },
    { name: 'Operations', path: '/departments/Operations' },
  ],
  'petroleum-downstream': [
    { name: 'Operations', path: '/departments/Operations' },
    { name: 'Research', path: '/departments/Research' },
    { name: 'Legal', path: '/departments/Legal' },
  ],
  'petroleum-upstream': [
    { name: 'Operations', path: '/departments/Operations' },
    { name: 'Research', path: '/departments/Research' },
    { name: 'Finance', path: '/departments/Finance' },
  ],
  'property-and-casualty-insurance': [
    { name: 'Finance', path: '/departments/Finance' },
    { name: 'Legal', path: '/departments/Legal' },
    { name: 'Operations', path: '/departments/Operations' },
  ],
  'retail': [
    { name: 'Sales', path: '/departments/Sales' },
    { name: 'Marketing', path: '/departments/Marketing' },
    { name: 'Operations', path: '/departments/Operations' },
  ],
  'utilities': [
    { name: 'Operations', path: '/departments/Operations' },
    { name: 'Finance', path: '/departments/Finance' },
    { name: 'Legal', path: '/departments/Legal' },
  ],
}

async function main() {
  const industries = await readdir(BASE)
  let totalEnriched = 0
  let totalSkipped = 0

  for (const industry of industries) {
    const dir = join(BASE, industry)
    const files = (await readdir(dir)).filter(f => f.endsWith('.mdx') && f !== 'index.mdx')
    const occupations = industryOccupations[industry]
    const departments = industryDepartments[industry]

    if (!occupations || !departments) {
      console.log(`⚠ No mapping for industry: ${industry}, skipping ${files.length} files`)
      totalSkipped += files.length
      continue
    }

    let enriched = 0
    // Process in batches of 200 for memory
    for (let i = 0; i < files.length; i += 200) {
      const batch = files.slice(i, i + 200)
      await Promise.all(batch.map(async (file) => {
        const filePath = join(dir, file)
        const content = await readFile(filePath, 'utf-8')

        // Skip if already enriched
        if (content.includes('## Related Occupations')) {
          return
        }

        const occSection = occupations.map(o => `- [${o.name}](${o.path})`).join('\n')
        const deptSection = departments.map(d => `- [${d.name}](${d.path})`).join('\n')

        const appendix = `\n## Related Occupations\n\n${occSection}\n\n## Related Departments\n\n${deptSection}\n`

        await writeFile(filePath, content.trimEnd() + '\n' + appendix, 'utf-8')
        enriched++
      }))
    }

    console.log(`${industry}: enriched ${enriched}/${files.length} files`)
    totalEnriched += enriched
  }

  console.log(`\nTotal: ${totalEnriched} files enriched, ${totalSkipped} skipped`)
}

main().catch(console.error)
