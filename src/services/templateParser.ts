import * as XLSX from 'xlsx';
import { ColumnDefinition, CustomTemplate } from '../types';

export interface ParsedTemplateResult {
  sheetName: string;
  allSheetNames: string[];
  columns: ColumnDefinition[];
  sampleRows: any[];
  template: CustomTemplate;
}

const TAB_KEYWORDS = [
  'usecases',
  'use cases',
  'use_cases',
  'test cases',
  'testcases',
  'test_cases',
  'cases',
  'test suite',
  'testsuite',
  'scenarios',
  'tests',
  'test_script',
  'matrix',
];

/**
 * Identify best matching sheet tab by name
 */
export function findBestMatchingSheet(sheetNames: string[]): string {
  if (!sheetNames || sheetNames.length === 0) return '';
  if (sheetNames.length === 1) return sheetNames[0];

  for (const keyword of TAB_KEYWORDS) {
    const match = sheetNames.find((name) => {
      const normalized = name.toLowerCase().replace(/[-_]/g, ' ').trim();
      return normalized.includes(keyword) || normalized === keyword;
    });
    if (match) return match;
  }

  // Fallback to first sheet
  return sheetNames[0];
}

/**
 * Parse an Excel or CSV file buffer into template columns
 */
export async function parseTemplateFile(
  file: File,
  forcedSheetName?: string
): Promise<ParsedTemplateResult> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  const allSheetNames = workbook.SheetNames || [];
  if (allSheetNames.length === 0) {
    throw new Error('The uploaded spreadsheet contains no sheets.');
  }

  const selectedSheetName = forcedSheetName || findBestMatchingSheet(allSheetNames);
  const worksheet = workbook.Sheets[selectedSheetName];
  if (!worksheet) {
    throw new Error(`Sheet "${selectedSheetName}" not found in workbook.`);
  }

  // Convert to JSON array of objects
  const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  if (!rawData || rawData.length === 0) {
    throw new Error(`Sheet "${selectedSheetName}" is empty.`);
  }

  // Find header row (first row with multiple strings)
  let headerRowIndex = 0;
  let headers: string[] = [];

  for (let i = 0; i < Math.min(rawData.length, 5); i++) {
    const row = rawData[i];
    if (Array.isArray(row) && row.some((cell) => typeof cell === 'string' && cell.trim().length > 0)) {
      headers = row.map((c) => (c !== undefined && c !== null ? String(c).trim() : ''));
      headerRowIndex = i;
      break;
    }
  }

  if (headers.length === 0) {
    throw new Error(`Could not find header row in sheet "${selectedSheetName}".`);
  }

  // Filter out empty headers
  const validHeaders = headers
    .map((h, idx) => ({ label: h || `Column_${idx + 1}`, originalIdx: idx }))
    .filter((h) => h.label.length > 0);

  // Map to ColumnDefinition
  const columns: ColumnDefinition[] = validHeaders.map(({ label }) => {
    const key = label.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/^_+|_+$/g, '');
    let type: ColumnDefinition['type'] = 'text';

    if (/^(status|pass|fail|execution|state|result)$/i.test(key) || /status/i.test(label)) {
      type = 'status';
    } else if (/^(id|tc_id|test_id|key|code)$/i.test(key) || /id$/i.test(label)) {
      type = 'badge';
    } else if (/^(steps|test_steps|action_steps|procedure)$/i.test(key) || /steps/i.test(label)) {
      type = 'steps';
    }

    return {
      key: key || `col_${Math.random().toString(36).substring(2, 7)}`,
      label,
      type,
      editable: true,
    };
  });

  // Extract sample rows
  const sampleRows = rawData
    .slice(headerRowIndex + 1, headerRowIndex + 6)
    .filter((r) => Array.isArray(r) && r.length > 0)
    .map((row) => {
      const obj: Record<string, any> = {};
      columns.forEach((col, idx) => {
        obj[col.key] = row[idx] !== undefined ? String(row[idx]) : '';
      });
      return obj;
    });

  const template: CustomTemplate = {
    id: `template-uploaded-${Date.now()}`,
    name: `${file.name.replace(/\.[^/.]+$/, '')} (${selectedSheetName})`,
    description: `Uploaded template from tab "${selectedSheetName}" (${columns.length} columns)`,
    isBuiltIn: false,
    columns,
  };

  return {
    sheetName: selectedSheetName,
    allSheetNames,
    columns,
    sampleRows,
    template,
  };
}

/**
 * Parse an Excel, CSV, or JSON file to extract complete test cases for Memory Brain learning
 */
export async function parseExistingTestCases(
  file: File,
  forcedSheetName?: string
): Promise<{
  sheetName: string;
  allSheetNames: string[];
  testCases: import('../types').TestCase[];
  detectedModule: string;
}> {
  // If JSON file
  if (file.name.endsWith('.json')) {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const rawCases = Array.isArray(parsed) ? parsed : parsed.testCases || parsed.cases || [];
    const testCases: import('../types').TestCase[] = rawCases.map((rc: any, idx: number) => ({
      id: rc.id || rc.testCaseId || `TC-IMP-${String(idx + 1).padStart(3, '0')}`,
      order: idx + 1,
      scenario: rc.scenario || rc.title || rc.name || `Imported Scenario ${idx + 1}`,
      scope: rc.scope || rc.action || rc.description || '',
      category: (rc.category as any) || 'positive',
      priority: (rc.priority as any) || 'high',
      preconditions: rc.preconditions || rc.precondition || 'None',
      steps: Array.isArray(rc.steps)
        ? rc.steps
        : typeof rc.steps === 'string'
        ? rc.steps.split('\n').map((s: string) => s.trim()).filter(Boolean)
        : ['Execute imported test step'],
      testData: rc.testData || rc.data || 'N/A',
      expectedResult: rc.expectedResult || rc.expected || rc.result || 'Expected behavior verified',
      expectation: rc.expectation || rc.expectedResult || '',
      status: rc.status || 'passed',
      mappedRequirementIds: Array.isArray(rc.mappedRequirementIds) ? rc.mappedRequirementIds : ['FR-IMP'],
      sourceOrigin: 'imported',
      diffType: 'new',
    }));

    return {
      sheetName: 'JSON Root',
      allSheetNames: ['JSON Root'],
      testCases,
      detectedModule: parsed.module || parsed.name || file.name.replace(/\.[^/.]+$/, ''),
    };
  }

  // Otherwise, Excel / CSV
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const allSheetNames = workbook.SheetNames || [];
  if (allSheetNames.length === 0) {
    throw new Error('Spreadsheet has no sheets.');
  }

  const selectedSheetName = forcedSheetName || findBestMatchingSheet(allSheetNames);
  const worksheet = workbook.Sheets[selectedSheetName];
  if (!worksheet) {
    throw new Error(`Sheet "${selectedSheetName}" not found.`);
  }

  const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  if (rawRows.length === 0) {
    throw new Error('Sheet is empty.');
  }

  // Find header row
  let headerRowIndex = 0;
  let headers: string[] = [];
  for (let i = 0; i < Math.min(rawRows.length, 5); i++) {
    const row = rawRows[i];
    if (Array.isArray(row) && row.some((c) => typeof c === 'string' && c.trim().length > 0)) {
      headers = row.map((c) => (c ? String(c).trim().toLowerCase() : ''));
      headerRowIndex = i;
      break;
    }
  }

  // Map column index to field
  const findCol = (regex: RegExp) => headers.findIndex((h) => regex.test(h));
  const idIdx = findCol(/^(id|tc_id|test_id|test id|case id|testcase id)$/i);
  const scenarioIdx = findCol(/^(scenario|test scenario|title|name|summary|description|test case)$/i);
  const scopeIdx = findCol(/^(scope|action|test objective|objective)$/i);
  const preconditionsIdx = findCol(/^(preconditions|precondition|pre-condition|setup)$/i);
  const stepsIdx = findCol(/^(steps|test steps|procedure|execution steps|action steps)$/i);
  const testDataIdx = findCol(/^(test data|data|input|inputs|test_data)$/i);
  const expectedIdx = findCol(/^(expected result|expected|expectation|outcome|expected outcome)$/i);
  const priorityIdx = findCol(/^(priority|severity|importance)$/i);
  const statusIdx = findCol(/^(status|result|execution status|state)$/i);
  const categoryIdx = findCol(/^(category|type|test type|case type)$/i);

  const testCases: import('../types').TestCase[] = [];

  for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!Array.isArray(row) || row.every((c) => c === undefined || c === null || String(c).trim() === '')) {
      continue;
    }

    const order = testCases.length + 1;
    const rawId = idIdx !== -1 && row[idIdx] ? String(row[idIdx]).trim() : '';
    const id = rawId || `TC-IMP-${String(order).padStart(3, '0')}`;
    const scenario = scenarioIdx !== -1 && row[scenarioIdx] ? String(row[scenarioIdx]).trim() : `Imported Case ${order}`;
    const scope = scopeIdx !== -1 && row[scopeIdx] ? String(row[scopeIdx]).trim() : scenario;
    const preconditions = preconditionsIdx !== -1 && row[preconditionsIdx] ? String(row[preconditionsIdx]).trim() : 'Preconditions verified';
    
    // Steps handling
    const rawSteps = stepsIdx !== -1 && row[stepsIdx] ? String(row[stepsIdx]) : '';
    const steps = rawSteps
      ? rawSteps.split(/[\r\n]+|\d+\.\s+/).map((s) => s.trim()).filter((s) => s.length > 0)
      : ['Execute test action and verify output'];

    const testData = testDataIdx !== -1 && row[testDataIdx] ? String(row[testDataIdx]).trim() : 'Standard test payload';
    const expectedResult = expectedIdx !== -1 && row[expectedIdx] ? String(row[expectedIdx]).trim() : 'Action produces expected outcome';
    const rawPriority = priorityIdx !== -1 && row[priorityIdx] ? String(row[priorityIdx]).trim().toLowerCase() : 'high';
    const priority = ['critical', 'high', 'medium', 'low'].includes(rawPriority) ? (rawPriority as any) : 'high';

    const rawStatus = statusIdx !== -1 && row[statusIdx] ? String(row[statusIdx]).trim().toLowerCase() : 'passed';
    const status = ['passed', 'failed', 'pending', 'blocked'].includes(rawStatus) ? (rawStatus as any) : 'passed';

    const rawCategory = categoryIdx !== -1 && row[categoryIdx] ? String(row[categoryIdx]).trim().toLowerCase() : 'positive';
    const category = ['positive', 'negative', 'boundary', 'corner', 'edge', 'security', 'ui', 'accessibility'].includes(rawCategory)
      ? (rawCategory as any)
      : 'positive';

    testCases.push({
      id,
      order,
      scenario,
      scope,
      category,
      priority,
      preconditions,
      steps: steps.length > 0 ? steps : ['Step 1: Execute action'],
      testData,
      expectedResult,
      expectation: expectedResult,
      status,
      mappedRequirementIds: [`FR-IMP-${order}`],
      sourceOrigin: 'imported',
      diffType: 'new',
    });
  }

  const cleanModuleName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

  return {
    sheetName: selectedSheetName,
    allSheetNames,
    testCases,
    detectedModule: cleanModuleName,
  };
}

