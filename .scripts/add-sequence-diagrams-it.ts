#!/usr/bin/env npx ts-node

/**
 * Script to add Process Sequence diagrams to all Activity-level (level 4)
 * IT process files in processes/08-IT/
 *
 * Actors: Developer, Architect, DBA, Security Analyst, IT Manager, Service Desk, CI/CD System
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const IT_PROCESSES_DIR = path.join(__dirname, '../processes/08-IT')

// IT-relevant actors for sequence diagrams
const ACTORS = {
  Developer: 'Developer',
  Architect: 'Architect',
  DBA: 'DBA',
  SecurityAnalyst: 'Security Analyst',
  ITManager: 'IT Manager',
  ServiceDesk: 'Service Desk',
  CICD: 'CI/CD System',
  System: 'System',
  User: 'User',
  Auditor: 'Auditor',
  RiskManager: 'Risk Manager',
  ComplianceOfficer: 'Compliance Officer',
  InfraTeam: 'Infra Team',
  QAEngineer: 'QA Engineer',
  ReleaseManager: 'Release Manager',
  DataSteward: 'Data Steward',
  NetworkAdmin: 'Network Admin',
  SupportTeam: 'Support Team'
}

// Mapping of process categories/keywords to appropriate sequence diagrams
interface SequenceTemplate {
  actors: string[]
  steps: string[]
}

function getSequenceForProcess(fileName: string, processName: string, parentFolder: string): SequenceTemplate {
  const lowerName = processName.toLowerCase()
  const lowerFileName = fileName.toLowerCase()
  const lowerParent = parentFolder.toLowerCase()

  // Security and breach response processes
  if (lowerName.includes('breach') || lowerName.includes('security incident') || lowerName.includes('intrusion')) {
    return {
      actors: ['Security Analyst', 'IT Manager', 'Infra Team', 'System'],
      steps: [
        'System->>Security Analyst: Alert on security event',
        'Security Analyst->>Security Analyst: Analyze threat indicators',
        'Security Analyst->>IT Manager: Escalate incident',
        'IT Manager->>Infra Team: Initiate containment',
        'Infra Team->>System: Isolate affected systems',
        'Security Analyst->>Security Analyst: Conduct forensic analysis',
        'Security Analyst->>IT Manager: Report findings',
        'IT Manager->>Infra Team: Implement remediation',
        'Infra Team->>System: Restore services',
        'Security Analyst->>IT Manager: Document lessons learned'
      ]
    }
  }

  // Change management and deployment
  if (lowerName.includes('change') || lowerName.includes('release') || lowerName.includes('deploy')) {
    return {
      actors: ['Developer', 'Release Manager', 'CI/CD System', 'QA Engineer', 'IT Manager'],
      steps: [
        'Developer->>Release Manager: Submit change request',
        'Release Manager->>Release Manager: Review change impact',
        'Release Manager->>IT Manager: Request approval',
        'IT Manager->>Release Manager: Approve change',
        'Release Manager->>CI/CD System: Schedule deployment',
        'CI/CD System->>CI/CD System: Execute deployment pipeline',
        'CI/CD System->>QA Engineer: Trigger validation tests',
        'QA Engineer->>QA Engineer: Verify deployment',
        'QA Engineer->>Release Manager: Confirm success',
        'Release Manager->>IT Manager: Close change record'
      ]
    }
  }

  // Rollback processes
  if (lowerName.includes('rollback') || lowerName.includes('roll-back') || lowerName.includes('roll back')) {
    return {
      actors: ['Release Manager', 'IT Manager', 'CI/CD System', 'Infra Team'],
      steps: [
        'Release Manager->>IT Manager: Report deployment failure',
        'IT Manager->>IT Manager: Assess rollback decision',
        'IT Manager->>Release Manager: Authorize rollback',
        'Release Manager->>CI/CD System: Initiate rollback procedure',
        'CI/CD System->>Infra Team: Restore previous version',
        'Infra Team->>Infra Team: Verify system state',
        'Infra Team->>Release Manager: Confirm rollback complete',
        'Release Manager->>IT Manager: Document rollback outcome'
      ]
    }
  }

  // Penetration testing - check BEFORE generic testing
  if (lowerName.includes('penetration')) {
    return {
      actors: ['Security Analyst', 'IT Manager', 'System', 'Architect'],
      steps: [
        'IT Manager->>Security Analyst: Define penetration test scope',
        'Security Analyst->>Security Analyst: Plan attack vectors',
        'Security Analyst->>System: Execute reconnaissance',
        'Security Analyst->>System: Attempt exploitation',
        'System->>Security Analyst: Return vulnerability data',
        'Security Analyst->>Security Analyst: Document findings',
        'Security Analyst->>Architect: Review vulnerabilities',
        'Architect->>Architect: Design remediation',
        'Security Analyst->>IT Manager: Present security report'
      ]
    }
  }

  // Testing processes (generic - must come after penetration testing)
  if (lowerName.includes('test') || lowerName.includes('validation') || lowerName.includes('verify')) {
    return {
      actors: ['QA Engineer', 'Developer', 'System', 'IT Manager'],
      steps: [
        'Developer->>QA Engineer: Request testing',
        'QA Engineer->>QA Engineer: Prepare test environment',
        'QA Engineer->>System: Execute test cases',
        'System->>QA Engineer: Return test results',
        'QA Engineer->>QA Engineer: Analyze results',
        'QA Engineer->>Developer: Report defects (if any)',
        'Developer->>Developer: Resolve issues',
        'QA Engineer->>System: Re-execute tests',
        'QA Engineer->>IT Manager: Approve release'
      ]
    }
  }

  // Audit processes
  if (lowerName.includes('audit')) {
    return {
      actors: ['Auditor', 'IT Manager', 'Security Analyst', 'System'],
      steps: [
        'Auditor->>IT Manager: Initiate audit request',
        'IT Manager->>Security Analyst: Gather evidence',
        'Security Analyst->>System: Extract audit logs',
        'System->>Security Analyst: Return log data',
        'Security Analyst->>Auditor: Provide documentation',
        'Auditor->>Auditor: Analyze compliance',
        'Auditor->>IT Manager: Present findings',
        'IT Manager->>Security Analyst: Address gaps',
        'Auditor->>IT Manager: Issue audit report'
      ]
    }
  }

  // Compliance processes
  if (lowerName.includes('compliance') || lowerName.includes('regulatory')) {
    return {
      actors: ['Compliance Officer', 'IT Manager', 'Security Analyst', 'Auditor'],
      steps: [
        'Compliance Officer->>IT Manager: Identify compliance requirements',
        'IT Manager->>Security Analyst: Assess current controls',
        'Security Analyst->>Security Analyst: Map controls to requirements',
        'Security Analyst->>Compliance Officer: Report gaps',
        'Compliance Officer->>IT Manager: Define remediation plan',
        'IT Manager->>Security Analyst: Implement controls',
        'Security Analyst->>Auditor: Prepare evidence',
        'Auditor->>Compliance Officer: Validate compliance',
        'Compliance Officer->>IT Manager: Certify compliance status'
      ]
    }
  }

  // Risk management
  if (lowerName.includes('risk')) {
    return {
      actors: ['Risk Manager', 'IT Manager', 'Security Analyst', 'Architect'],
      steps: [
        'Risk Manager->>IT Manager: Initiate risk assessment',
        'IT Manager->>Security Analyst: Identify threats',
        'Security Analyst->>Security Analyst: Evaluate vulnerabilities',
        'Security Analyst->>Risk Manager: Report risk findings',
        'Risk Manager->>Risk Manager: Calculate risk scores',
        'Risk Manager->>Architect: Define mitigation strategies',
        'Architect->>IT Manager: Propose controls',
        'IT Manager->>IT Manager: Approve risk treatment',
        'Risk Manager->>IT Manager: Monitor risk status'
      ]
    }
  }

  // Identity and access management
  if (lowerName.includes('identity') || lowerName.includes('authorization') || lowerName.includes('authentication') || lowerName.includes('user directory')) {
    return {
      actors: ['Security Analyst', 'IT Manager', 'System', 'User'],
      steps: [
        'User->>Service Desk: Request access',
        'Service Desk->>IT Manager: Submit access request',
        'IT Manager->>IT Manager: Review request',
        'IT Manager->>Security Analyst: Verify permissions',
        'Security Analyst->>System: Configure access controls',
        'System->>User: Grant access',
        'Security Analyst->>Security Analyst: Log access grant',
        'Security Analyst->>IT Manager: Confirm provisioning'
      ]
    }
  }

  // Incident and support processes
  if (lowerName.includes('incident') || lowerName.includes('support') || lowerName.includes('service desk') || lowerName.includes('issue') || lowerName.includes('request') || lowerName.includes('triage') || lowerName.includes('escalat')) {
    return {
      actors: ['User', 'Service Desk', 'Support Team', 'IT Manager'],
      steps: [
        'User->>Service Desk: Report issue',
        'Service Desk->>Service Desk: Log incident',
        'Service Desk->>Service Desk: Categorize and prioritize',
        'Service Desk->>Support Team: Assign to resolver',
        'Support Team->>Support Team: Diagnose issue',
        'Support Team->>Support Team: Apply resolution',
        'Support Team->>User: Verify resolution',
        'User->>Service Desk: Confirm closure',
        'Service Desk->>IT Manager: Update metrics'
      ]
    }
  }

  // Data management and information
  if (lowerName.includes('data') || lowerName.includes('information') || lowerParent.includes('information')) {
    return {
      actors: ['Data Steward', 'DBA', 'Architect', 'IT Manager'],
      steps: [
        'IT Manager->>Data Steward: Define data requirements',
        'Data Steward->>Architect: Design data model',
        'Architect->>DBA: Specify implementation',
        'DBA->>DBA: Configure database objects',
        'DBA->>Data Steward: Validate schema',
        'Data Steward->>Data Steward: Define governance rules',
        'Data Steward->>IT Manager: Approve data structure',
        'DBA->>DBA: Deploy to production'
      ]
    }
  }

  // Architecture and design
  if (lowerName.includes('architect') || lowerName.includes('design') || lowerName.includes('pattern')) {
    return {
      actors: ['Architect', 'Developer', 'IT Manager', 'Security Analyst'],
      steps: [
        'IT Manager->>Architect: Define architecture requirements',
        'Architect->>Architect: Analyze constraints',
        'Architect->>Architect: Design solution architecture',
        'Architect->>Security Analyst: Review security aspects',
        'Security Analyst->>Architect: Provide security input',
        'Architect->>Developer: Present architecture',
        'Developer->>Architect: Provide feedback',
        'Architect->>IT Manager: Finalize architecture',
        'IT Manager->>Architect: Approve design'
      ]
    }
  }

  // Development processes
  if (lowerName.includes('develop') || lowerName.includes('build') || lowerName.includes('create') || lowerName.includes('implement')) {
    return {
      actors: ['Developer', 'Architect', 'QA Engineer', 'CI/CD System'],
      steps: [
        'Architect->>Developer: Assign development task',
        'Developer->>Developer: Implement solution',
        'Developer->>CI/CD System: Commit code',
        'CI/CD System->>CI/CD System: Run build pipeline',
        'CI/CD System->>QA Engineer: Deploy to test',
        'QA Engineer->>QA Engineer: Execute tests',
        'QA Engineer->>Developer: Report results',
        'Developer->>Architect: Request review',
        'Architect->>Developer: Approve implementation'
      ]
    }
  }

  // Infrastructure and operations
  if (lowerName.includes('infrastructure') || lowerName.includes('network') || lowerName.includes('server') || lowerName.includes('hardware') || lowerName.includes('capacity')) {
    return {
      actors: ['Infra Team', 'Network Admin', 'IT Manager', 'System'],
      steps: [
        'IT Manager->>Infra Team: Define infrastructure needs',
        'Infra Team->>Network Admin: Coordinate network setup',
        'Network Admin->>System: Configure network',
        'Infra Team->>System: Provision resources',
        'System->>Infra Team: Return status',
        'Infra Team->>Infra Team: Validate configuration',
        'Infra Team->>IT Manager: Report readiness',
        'IT Manager->>Infra Team: Approve for production'
      ]
    }
  }

  // Continuity and recovery
  if (lowerName.includes('continuity') || lowerName.includes('recovery') || lowerName.includes('backup') || lowerName.includes('disaster') || lowerName.includes('resilience')) {
    return {
      actors: ['IT Manager', 'Infra Team', 'Security Analyst', 'System'],
      steps: [
        'IT Manager->>Infra Team: Initiate continuity planning',
        'Infra Team->>Infra Team: Identify critical systems',
        'Infra Team->>Security Analyst: Assess recovery requirements',
        'Security Analyst->>Infra Team: Define recovery objectives',
        'Infra Team->>System: Configure backup procedures',
        'System->>Infra Team: Confirm backup status',
        'Infra Team->>Infra Team: Test recovery procedures',
        'Infra Team->>IT Manager: Report continuity readiness'
      ]
    }
  }

  // Training processes
  if (lowerName.includes('training') || lowerName.includes('learning') || lowerName.includes('education')) {
    return {
      actors: ['IT Manager', 'Developer', 'User', 'Support Team'],
      steps: [
        'IT Manager->>IT Manager: Identify training needs',
        'IT Manager->>Developer: Develop training content',
        'Developer->>Developer: Create training materials',
        'Developer->>IT Manager: Submit for review',
        'IT Manager->>IT Manager: Approve content',
        'IT Manager->>User: Schedule training',
        'Support Team->>User: Deliver training session',
        'User->>Support Team: Complete training',
        'IT Manager->>IT Manager: Track completion'
      ]
    }
  }

  // Strategy and planning
  if (lowerName.includes('strateg') || lowerName.includes('plan') || lowerName.includes('vision') || lowerName.includes('roadmap')) {
    return {
      actors: ['IT Manager', 'Architect', 'Developer', 'User'],
      steps: [
        'IT Manager->>IT Manager: Assess current state',
        'IT Manager->>User: Gather requirements',
        'User->>IT Manager: Provide input',
        'IT Manager->>Architect: Define target state',
        'Architect->>Architect: Design roadmap',
        'Architect->>IT Manager: Present strategy',
        'IT Manager->>IT Manager: Review and refine',
        'IT Manager->>Developer: Communicate plan',
        'IT Manager->>IT Manager: Monitor progress'
      ]
    }
  }

  // Monitoring and performance
  if (lowerName.includes('monitor') || lowerName.includes('performance') || lowerName.includes('metrics') || lowerName.includes('report')) {
    return {
      actors: ['System', 'Infra Team', 'IT Manager', 'Architect'],
      steps: [
        'System->>Infra Team: Collect performance data',
        'Infra Team->>Infra Team: Analyze metrics',
        'Infra Team->>IT Manager: Report performance status',
        'IT Manager->>IT Manager: Review against SLAs',
        'IT Manager->>Architect: Identify improvements',
        'Architect->>Infra Team: Recommend optimizations',
        'Infra Team->>System: Implement changes',
        'System->>IT Manager: Confirm improvements'
      ]
    }
  }

  // Governance and policy
  if (lowerName.includes('governance') || lowerName.includes('policy') || lowerName.includes('standard') || lowerName.includes('procedure')) {
    return {
      actors: ['IT Manager', 'Compliance Officer', 'Security Analyst', 'Architect'],
      steps: [
        'IT Manager->>Compliance Officer: Initiate policy review',
        'Compliance Officer->>Compliance Officer: Assess requirements',
        'Compliance Officer->>Security Analyst: Gather security input',
        'Security Analyst->>Compliance Officer: Provide recommendations',
        'Compliance Officer->>IT Manager: Draft policy',
        'IT Manager->>Architect: Review technical feasibility',
        'Architect->>IT Manager: Confirm alignment',
        'IT Manager->>IT Manager: Approve and publish',
        'IT Manager->>Compliance Officer: Communicate policy'
      ]
    }
  }

  // Service level and SLA
  if (lowerName.includes('sla') || lowerName.includes('service level')) {
    return {
      actors: ['IT Manager', 'Service Desk', 'User', 'Support Team'],
      steps: [
        'IT Manager->>User: Define service expectations',
        'User->>IT Manager: Confirm requirements',
        'IT Manager->>IT Manager: Draft SLA terms',
        'IT Manager->>Service Desk: Communicate targets',
        'Service Desk->>Support Team: Align processes',
        'Support Team->>System: Configure monitoring',
        'System->>IT Manager: Track SLA metrics',
        'IT Manager->>User: Report compliance'
      ]
    }
  }

  // Customer and stakeholder
  if (lowerName.includes('customer') || lowerName.includes('stakeholder') || lowerName.includes('relationship') || lowerName.includes('communication')) {
    return {
      actors: ['IT Manager', 'User', 'Service Desk', 'Architect'],
      steps: [
        'User->>IT Manager: Express needs',
        'IT Manager->>IT Manager: Analyze requirements',
        'IT Manager->>Architect: Assess feasibility',
        'Architect->>IT Manager: Provide options',
        'IT Manager->>User: Present solutions',
        'User->>IT Manager: Select preference',
        'IT Manager->>Service Desk: Initiate delivery',
        'Service Desk->>User: Confirm delivery',
        'IT Manager->>User: Gather feedback'
      ]
    }
  }

  // Portfolio and investment
  if (lowerName.includes('portfolio') || lowerName.includes('investment') || lowerName.includes('budget') || lowerName.includes('value')) {
    return {
      actors: ['IT Manager', 'Architect', 'Developer', 'User'],
      steps: [
        'IT Manager->>IT Manager: Review portfolio',
        'IT Manager->>Architect: Assess project health',
        'Architect->>Architect: Analyze resource usage',
        'Architect->>IT Manager: Report status',
        'IT Manager->>User: Validate business value',
        'User->>IT Manager: Confirm priorities',
        'IT Manager->>Developer: Adjust allocations',
        'IT Manager->>IT Manager: Update portfolio plan'
      ]
    }
  }

  // Vendor and external
  if (lowerName.includes('vendor') || lowerName.includes('external') || lowerName.includes('provider') || lowerName.includes('partner') || lowerName.includes('sourcing')) {
    return {
      actors: ['IT Manager', 'Architect', 'User', 'System'],
      steps: [
        'IT Manager->>IT Manager: Identify vendor requirements',
        'IT Manager->>Architect: Evaluate options',
        'Architect->>Architect: Assess technical fit',
        'Architect->>IT Manager: Recommend vendor',
        'IT Manager->>User: Confirm selection',
        'IT Manager->>IT Manager: Negotiate contract',
        'IT Manager->>System: Onboard vendor',
        'IT Manager->>IT Manager: Monitor performance'
      ]
    }
  }

  // Software and lifecycle
  if (lowerName.includes('software') || lowerName.includes('lifecycle') || lowerName.includes('solution') || lowerName.includes('application')) {
    return {
      actors: ['Architect', 'Developer', 'QA Engineer', 'IT Manager'],
      steps: [
        'IT Manager->>Architect: Define requirements',
        'Architect->>Architect: Design solution',
        'Architect->>Developer: Assign development',
        'Developer->>Developer: Build components',
        'Developer->>QA Engineer: Submit for testing',
        'QA Engineer->>QA Engineer: Validate quality',
        'QA Engineer->>Architect: Report results',
        'Architect->>IT Manager: Approve release',
        'IT Manager->>IT Manager: Track lifecycle'
      ]
    }
  }

  // License management
  if (lowerName.includes('license')) {
    return {
      actors: ['IT Manager', 'Infra Team', 'User', 'System'],
      steps: [
        'IT Manager->>IT Manager: Review license inventory',
        'IT Manager->>System: Query usage data',
        'System->>IT Manager: Return license metrics',
        'IT Manager->>Infra Team: Identify optimization',
        'Infra Team->>Infra Team: Reclaim unused licenses',
        'IT Manager->>User: Communicate changes',
        'IT Manager->>IT Manager: Update license records',
        'IT Manager->>IT Manager: Plan renewals'
      ]
    }
  }

  // Asset and configuration management
  if (lowerName.includes('asset') || lowerName.includes('configuration') || lowerName.includes('cmdb')) {
    return {
      actors: ['Infra Team', 'IT Manager', 'System', 'Auditor'],
      steps: [
        'IT Manager->>Infra Team: Define asset requirements',
        'Infra Team->>System: Discover assets',
        'System->>Infra Team: Return asset data',
        'Infra Team->>Infra Team: Update configuration records',
        'Infra Team->>IT Manager: Report asset status',
        'IT Manager->>Auditor: Provide inventory',
        'Auditor->>IT Manager: Validate records',
        'Infra Team->>System: Maintain asset lifecycle'
      ]
    }
  }

  // Workload and batch
  if (lowerName.includes('batch') || lowerName.includes('workload') || lowerName.includes('schedule') || lowerName.includes('job')) {
    return {
      actors: ['Infra Team', 'System', 'IT Manager', 'Support Team'],
      steps: [
        'IT Manager->>Infra Team: Define job requirements',
        'Infra Team->>System: Configure job schedule',
        'System->>System: Execute batch jobs',
        'System->>Infra Team: Report job status',
        'Infra Team->>Infra Team: Monitor execution',
        'Infra Team->>Support Team: Handle failures',
        'Support Team->>System: Restart failed jobs',
        'Infra Team->>IT Manager: Report completion'
      ]
    }
  }

  // Rollout and training
  if (lowerName.includes('rollout') || lowerName.includes('organizational change')) {
    return {
      actors: ['IT Manager', 'Support Team', 'User', 'Service Desk'],
      steps: [
        'IT Manager->>IT Manager: Plan rollout phases',
        'IT Manager->>Support Team: Prepare support resources',
        'IT Manager->>User: Communicate changes',
        'Support Team->>User: Conduct training',
        'User->>Service Desk: Report issues',
        'Service Desk->>Support Team: Escalate problems',
        'Support Team->>User: Resolve issues',
        'IT Manager->>IT Manager: Monitor adoption'
      ]
    }
  }

  // Default generic IT process
  return {
    actors: ['IT Manager', 'Developer', 'System', 'User'],
    steps: [
      'IT Manager->>IT Manager: Define process requirements',
      'IT Manager->>Developer: Assign implementation',
      'Developer->>System: Execute process steps',
      'System->>Developer: Return results',
      'Developer->>IT Manager: Report completion',
      'IT Manager->>User: Communicate outcomes',
      'User->>IT Manager: Provide feedback',
      'IT Manager->>IT Manager: Document process'
    ]
  }
}

function generateSequenceDiagram(template: SequenceTemplate): string {
  const participants = template.actors.map(a => `    participant ${a.replace(/ /g, '')}`).join('\n')
  const steps = template.steps.map(s => `    ${s.replace(/([A-Z][a-z]+) ([A-Z][a-z]+)/g, '$1$2')}`).join('\n')

  return `\`\`\`mermaid
sequenceDiagram
    autonumber
${participants}
${steps}
\`\`\``
}

function addSequenceDiagramToFile(filePath: string, forceReplace: boolean = false): boolean {
  let content = fs.readFileSync(filePath, 'utf-8')

  // Skip if already has sequenceDiagram (unless forcing replace)
  if (content.includes('sequenceDiagram') && !forceReplace) {
    console.log(`Skipping ${filePath} - already has sequenceDiagram`)
    return false
  }

  // If forcing replace, remove existing Process Sequence section
  if (content.includes('## Process Sequence') && forceReplace) {
    content = content.replace(/## Process Sequence\n\n```mermaid\nsequenceDiagram[\s\S]*?```\n\n/g, '')
  }

  // Extract process name from frontmatter
  const nameMatch = content.match(/name:\s*"([^"]+)"/)
  const processName = nameMatch ? nameMatch[1] : path.basename(filePath, '.mdx')

  // Get parent folder name
  const parentFolder = path.basename(path.dirname(filePath))

  // Generate appropriate sequence diagram
  const template = getSequenceForProcess(path.basename(filePath), processName, parentFolder)
  const diagram = generateSequenceDiagram(template)

  // Find the right place to insert - after Process Flow section or at the end before source line
  const processFlowMatch = content.match(/(## Process Flow[\s\S]*?```\n\n)/)
  const sourceMatch = content.match(/(\n---\n\n\*Source:)/)

  let newContent: string
  const sequenceSection = `## Process Sequence

${diagram}

`

  if (processFlowMatch) {
    // Insert after Process Flow section
    newContent = content.replace(
      processFlowMatch[0],
      processFlowMatch[0] + sequenceSection
    )
  } else if (sourceMatch) {
    // Insert before source line
    newContent = content.replace(
      sourceMatch[0],
      '\n' + sequenceSection + sourceMatch[0]
    )
  } else {
    // Append at the end
    newContent = content + '\n' + sequenceSection
  }

  fs.writeFileSync(filePath, newContent)
  console.log(`Updated ${filePath}`)
  return true
}

function findActivityFiles(dir: string): string[] {
  const files: string[] = []

  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      files.push(...findActivityFiles(fullPath))
    } else if (entry.isFile() && entry.name.endsWith('.mdx') && entry.name !== 'index.mdx') {
      // Check if it's level 4 (Activity)
      const content = fs.readFileSync(fullPath, 'utf-8')
      if (content.includes('level: 4') || content.includes('type: Activity')) {
        files.push(fullPath)
      }
    }
  }

  return files
}

// Main execution
console.log('Finding Activity-level files in processes/08-IT/...')
const activityFiles = findActivityFiles(IT_PROCESSES_DIR)
console.log(`Found ${activityFiles.length} Activity-level files`)

let updated = 0
let skipped = 0

// Check for --force flag
const forceReplace = process.argv.includes('--force')
if (forceReplace) {
  console.log('Force mode enabled - will replace existing sequence diagrams')
}

for (const file of activityFiles) {
  if (addSequenceDiagramToFile(file, forceReplace)) {
    updated++
  } else {
    skipped++
  }
}

console.log(`\nCompleted: ${updated} files updated, ${skipped} files skipped`)
