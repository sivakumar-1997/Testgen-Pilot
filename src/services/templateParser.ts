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
