export type TestCaseCategory =
  | 'positive'
  | 'negative'
  | 'boundary'
  | 'corner'
  | 'accessibility'
  | 'edge'
  | 'security';

export type TestCasePriority = 'critical' | 'high' | 'medium' | 'low';

export type TestCaseStatus = 'passed' | 'failed' | 'pending' | 'blocked' | 'skipped';

export type DiffType = 'new' | 'modified' | 'deprecated' | 'unchanged';

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
  expectation: string; // Short concise expectation (as shown in reference screenshot)
  status: TestCaseStatus;
  mappedRequirementIds: string[]; // e.g. ['FR-001', 'FR-006']
  diffType?: DiffType;
  diffSummary?: string;
  customFields?: Record<string, string>;
  notes?: string;
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
  coveragePercentage: number;
  assumptions?: string[];
}

export interface ChangeLogItem {
  changeType: 'added' | 'modified' | 'deprecated' | 'unchanged';
  description: string;
  affectedItems?: string[];
}

export interface TestSuiteVersion {
  version: number;
  timestamp: string;
  requirementsRaw: string;
  changeSummary: string;
  testCases: TestCase[];
}

export interface TestSuite {
  id: string;
  name: string;
  module: string;
  scenarioTitle: string;
  version: number;
  requirementsRaw: string;
  requirementsList: RequirementItem[];
  testCases: TestCase[];
  traceabilityMatrix: TraceabilityMapping[];
  suiteSummary?: SuiteSummary;
  templateId: string;
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
}

export interface KnowledgeDocument {
  id: string;
  name: string;
  content: string;
  category: 'guideline' | 'template' | 'glossary' | 'bug_pattern';
  fileSize?: string;
  isActive: boolean;
  createdAt: string;
}
