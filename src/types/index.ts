export type TestCaseCategory =
  | 'positive'
  | 'negative'
  | 'boundary'
  | 'corner'
  | 'accessibility'
  | 'edge'
  | 'security'
  | 'ui';

export type TestCasePriority = 'critical' | 'high' | 'medium' | 'low';

export type TestCaseStatus = 'passed' | 'failed' | 'pending' | 'blocked' | 'skipped';

export type DiffType = 'new' | 'modified' | 'deprecated' | 'unchanged' | 'recalled';

export interface TestCase {
  id: string; // e.g., TC-001
  order: number;
  scenario: string;
  scope: string; // Action / Scope (e.g. "Navigate to the file upload page")
  category: TestCaseCategory;
  priority: TestCasePriority;
  preconditions: string;
  steps: string[];
  testData: string;
  expectedResult: string;
  expectation: string; // Short concise expectation
  status: TestCaseStatus;
  mappedRequirementIds: string[]; // e.g. ['FR-001', 'FR-006']
  diffType?: DiffType;
  diffSummary?: string;
  customFields?: Record<string, string>;
  notes?: string;
  sourceOrigin?: 'current_mr' | 'historical_memory' | 'imported';
}

export interface RequirementItem {
  reqId: string; // e.g. FR-001
  title: string;
  description: string;
  type?: 'functional' | 'non-functional' | 'security' | 'usability';
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface TraceabilityMapping {
  reqId: string;
  reqTitle: string;
  mappedTestCaseIds: string[];
  coverageStatus: 'fully_covered' | 'partially_covered' | 'uncovered';
}

export interface SuiteSummary {
  totalCases: number;
  positiveCount: number;
  negativeCount: number;
  boundaryCount: number;
  edgeCount: number;
  cornerCount: number;
  accessibilityCount: number;
  securityCount: number;
  uiCount?: number;
  coveragePercentage: number;
  assumptions?: string[];
}

export interface ChangeLogItem {
  changeType: 'added' | 'modified' | 'deprecated' | 'unchanged' | 'recalled';
  description: string;
  affectedItems?: string[];
}

export interface TesterQuestion {
  id: string;
  question: string;
  rationale: string;
  targetRole: 'Developer' | 'Product Owner' | 'DevOps' | 'Security';
  status?: 'open' | 'answered' | 'verified';
  answer?: string;
}

export interface MRAnalysis {
  actualFixSummary: string; // Section 2: What the MR is going to fix
  rootCause: string;
  impactedComponents: string[];
  regressionRisks: string[];
  architectureChanges: string[];
  suggestedAutomations: string[];
}

export interface RecalledMemory {
  suiteId: string;
  suiteName: string;
  module: string;
  matchedKeywords: string[];
  recalledCasesCount: number;
  historicalCases: TestCase[];
  pastLearnings: string[];
}

export interface TestSuiteVersion {
  version: number;
  timestamp: string;
  requirementsRaw: string;
  changeSummary: string;
  testCases: TestCase[];
}

export type TicketPlatform = 'gitlab' | 'jira' | 'cyber' | 'linear' | 'generic';

export interface TestSuite {
  id: string;
  name: string;
  module: string;
  scenarioTitle: string;
  ticketPlatform?: TicketPlatform;
  ticketKey?: string;
  version: number;
  requirementsRaw: string;
  requirementsList: RequirementItem[];
  testCases: TestCase[];
  traceabilityMatrix: TraceabilityMapping[];
  suiteSummary?: SuiteSummary;
  templateId: string;
  mrAnalysis?: MRAnalysis; // Section 2
  testerQuestions?: TesterQuestion[]; // Section 3
  recalledMemories?: RecalledMemory[]; // Memory brain recall
  createdAt: string;
  updatedAt: string;
  history: TestSuiteVersion[];
}

export interface ColumnDefinition {
  key: string;
  label: string;
  width?: string;
  type: 'text' | 'badge' | 'steps' | 'status' | 'custom';
  editable?: boolean;
}

export interface CustomTemplate {
  id: string;
  name: string;
  description: string;
  isBuiltIn?: boolean;
  columns: ColumnDefinition[];
}

export type AIProvider = 'gemini' | 'openai' | 'anthropic' | 'ollama';

export interface ModelSettings {
  provider: AIProvider;
  modelName: string;
  apiKey?: string;
  localEndpoint?: string;
  autoFailoverEnabled?: boolean;
  fallbackProvider?: AIProvider;
}

export interface KnowledgeDocument {
  id: string;
  name: string;
  content: string;
  category: 'guideline' | 'template' | 'glossary' | 'bug_pattern' | 'past_cases';
  fileSize?: string;
  isActive: boolean;
  createdAt: string;
}

export interface UserAuthProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  authMethod: 'google' | 'sso' | 'password' | 'guest';
}
