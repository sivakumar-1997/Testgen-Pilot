import { TestCase, TraceabilityMapping, CustomTemplate } from '../types';

/**
 * Escape field for CSV according to RFC 4180
 */
function escapeCsv(val: any): string {
  if (val === null || val === undefined) return '""';
  if (Array.isArray(val)) {
    val = val.join('; ');
  }
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Generate CSV string from test cases
 */
export function generateTestCasesCsv(testCases: TestCase[], template?: CustomTemplate): string {
  const columns = template?.columns || [
    { key: 'id', label: 'Test ID' },
    { key: 'order', label: 'Order' },
    { key: 'scenario', label: 'Scenario' },
    { key: 'scope', label: 'Scope' },
    { key: 'preconditions', label: 'Preconditions' },
    { key: 'steps', label: 'Steps' },
    { key: 'testData', label: 'Test Data' },
    { key: 'expectedResult', label: 'Expected Result' },
    { key: 'expectation', label: 'Expectation' },
    { key: 'priority', label: 'Priority' },
    { key: 'category', label: 'Category' },
    { key: 'status', label: 'Status' },
    { key: 'mappedRequirementIds', label: 'Mapped Requirements' },
  ];

  const header = columns.map((c) => escapeCsv(c.label)).join(',');
  const rows = testCases.map((tc: any) => {
    return columns
      .map((c) => {
        let val = tc[c.key];
        if (c.key === 'steps' && Array.isArray(val)) {
          val = val.map((s, idx) => `${idx + 1}. ${s}`).join(' \n');
        } else if (c.key === 'mappedRequirementIds' && Array.isArray(val)) {
          val = val.join(', ');
        }
        return escapeCsv(val);
      })
      .join(',');
  });

  return [header, ...rows].join('\r\n');
}

/**
 * Generate RTCM matrix CSV string
 */
export function generateMatrixCsv(matrix: TraceabilityMapping[]): string {
  const header = ['Requirement ID', 'Requirement Title', 'Mapped Test Cases', 'Coverage Status']
    .map(escapeCsv)
    .join(',');

  const rows = matrix.map((m) =>
    [m.reqId, m.reqTitle, m.mappedTestCaseIds.join(', '), m.coverageStatus].map(escapeCsv).join(',')
  );

  return [header, ...rows].join('\r\n');
}

/**
 * Generate Markdown Table representation
 */
export function generateMarkdown(testCases: TestCase[], title: string, matrix?: TraceabilityMapping[]): string {
  let md = `# Test Specification: ${title}\n\n`;

  if (matrix && matrix.length > 0) {
    md += `## 1. Requirements Traceability Matrix (RTCM)\n\n`;
    md += `| Requirement ID | Requirement Description | Mapped Test Cases | Status |\n`;
    md += `|---|---|---|---|\n`;
    matrix.forEach((m) => {
      md += `| **${m.reqId}** | ${m.reqTitle.replace(/\|/g, '-')} | ${m.mappedTestCaseIds.join(', ')} | \`${m.coverageStatus}\` |\n`;
    });
    md += `\n\n`;
  }

  md += `## 2. Test Cases (${testCases.length} total)\n\n`;
  md += `| # | Test ID | Scenario / Scope | Preconditions | Steps | Test Data | Expected Result | Priority | Status |\n`;
  md += `|---|---|---|---|---|---|---|---|---|\n`;

  testCases.forEach((tc) => {
    const stepsFormatted = tc.steps.map((s, i) => `${i + 1}. ${s}`).join('<br>');
    md += `| ${tc.order} | **${tc.id}** | ${tc.scope || tc.scenario} | ${tc.preconditions.replace(/\|/g, '-')} | ${stepsFormatted.replace(/\|/g, '-')} | ${tc.testData.replace(/\|/g, '-')} | ${tc.expectedResult.replace(/\|/g, '-')} | **${tc.priority.toUpperCase()}** | **${tc.status.toUpperCase()}** |\n`;
  });

  return md;
}

/**
 * Download text file in browser
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'text/plain') {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
