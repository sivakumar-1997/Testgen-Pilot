import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { TestCase, TraceabilityMapping } from '../types';

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/documents');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to retrieve access token from Google Sign-In.');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logoutGoogle = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

/**
 * Export test cases and RTCM to Google Sheets
 */
export async function exportToGoogleSheets(
  title: string,
  testCases: TestCase[],
  matrix: TraceabilityMapping[]
): Promise<{ spreadsheetId: string; url: string }> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Please sign in with Google to export to Google Sheets.');
  }

  // 1. Create a new Spreadsheet with two sheets
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: `TestGen Pilot - ${title} - ${new Date().toLocaleDateString()}`,
      },
      sheets: [
        {
          properties: {
            title: 'Test Cases',
            gridProperties: { rowCount: testCases.length + 5, columnCount: 10 },
          },
        },
        {
          properties: {
            title: 'Traceability Matrix',
            gridProperties: { rowCount: matrix.length + 5, columnCount: 6 },
          },
        },
      ],
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Google Sheets creation failed (${createRes.status}): ${err}`);
  }

  const spreadsheetData = await createRes.json();
  const spreadsheetId = spreadsheetData.spreadsheetId;

  // 2. Prepare Test Cases data
  const testCaseRows: any[][] = [
    ['Test ID', 'Order', 'Scope / Action', 'Preconditions', 'Expectation', 'Expected Result', 'Priority', 'Category', 'Status'],
    ...testCases.map((tc) => [
      tc.id,
      tc.order,
      tc.scope || tc.scenario,
      tc.preconditions,
      tc.expectation,
      tc.expectedResult,
      tc.priority.toUpperCase(),
      tc.category.toUpperCase(),
      tc.status.toUpperCase(),
    ]),
  ];

  // 3. Prepare Traceability Matrix data
  const matrixRows: any[][] = [
    ['Requirement ID', 'Requirement Title', 'Mapped Test Cases', 'Coverage Status'],
    ...matrix.map((m) => [
      m.reqId,
      m.reqTitle,
      m.mappedTestCaseIds.join(', '),
      m.coverageStatus === 'fully_covered' ? 'Fully Covered (100%)' : m.coverageStatus,
    ]),
  ];

  // 4. Batch update values
  const updateValuesRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: [
          {
            range: "'Test Cases'!A1",
            values: testCaseRows,
          },
          {
            range: "'Traceability Matrix'!A1",
            values: matrixRows,
          },
        ],
      }),
    }
  );

  if (!updateValuesRes.ok) {
    const err = await updateValuesRes.text();
    console.warn('Sheets value populate warning:', err);
  }

  return {
    spreadsheetId,
    url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
  };
}

/**
 * Export test suite and RTCM to Google Docs
 */
export async function exportToGoogleDocs(
  title: string,
  requirementsRaw: string,
  testCases: TestCase[],
  matrix: TraceabilityMapping[]
): Promise<{ documentId: string; url: string }> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Please sign in with Google to export to Google Docs.');
  }

  // 1. Create a blank Google Document
  const createRes = await fetch('https://docs.googleapis.com/v1/documents', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: `Test Specification: ${title}`,
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Google Docs creation failed (${createRes.status}): ${err}`);
  }

  const docData = await createRes.json();
  const documentId = docData.documentId;

  // 2. Prepare structured text
  let bodyText = `\nTEST SPECIFICATION & COVERAGE MATRIX (RTCM)\n`;
  bodyText += `Feature / Suite: ${title}\n`;
  bodyText += `Generated by TestGen Pilot AI on ${new Date().toLocaleString()}\n\n`;

  bodyText += `===============================================\n`;
  bodyText += `1. REQUIREMENTS SUMMARY\n`;
  bodyText += `===============================================\n`;
  bodyText += `${requirementsRaw}\n\n`;

  bodyText += `===============================================\n`;
  bodyText += `2. REQUIREMENTS TRACEABILITY MATRIX (RTCM)\n`;
  bodyText += `===============================================\n`;
  matrix.forEach((m) => {
    bodyText += `• ${m.reqId}: ${m.reqTitle}\n  Covered by: [${m.mappedTestCaseIds.join(', ')}] — ${m.coverageStatus}\n\n`;
  });

  bodyText += `===============================================\n`;
  bodyText += `3. DETAILED TEST CASES (${testCases.length} Total)\n`;
  bodyText += `===============================================\n\n`;

  testCases.forEach((tc) => {
    bodyText += `[${tc.id}] ${tc.scenario}\n`;
    bodyText += `  Priority: ${tc.priority.toUpperCase()} | Category: ${tc.category.toUpperCase()} | Status: ${tc.status.toUpperCase()}\n`;
    bodyText += `  Preconditions: ${tc.preconditions}\n`;
    bodyText += `  Steps:\n`;
    tc.steps.forEach((step, idx) => {
      bodyText += `    ${idx + 1}. ${step}\n`;
    });
    if (tc.testData) bodyText += `  Test Data: ${tc.testData}\n`;
    bodyText += `  Expected Result: ${tc.expectedResult}\n`;
    if (tc.notes) bodyText += `  Notes: ${tc.notes}\n`;
    bodyText += `\n-----------------------------------------------\n\n`;
  });

  // 3. Insert text into document
  await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [
        {
          insertText: {
            location: { index: 1 },
            text: bodyText,
          },
        },
      ],
    }),
  });

  return {
    documentId,
    url: `https://docs.google.com/document/d/${documentId}/edit`,
  };
}

/**
 * Export test suite directly to Google Drive as CSV or JSON
 */
export async function exportToGoogleDrive(
  fileName: string,
  content: string,
  mimeType: string = 'text/csv'
): Promise<{ fileId: string; url: string }> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Please sign in with Google to export to Google Drive.');
  }

  const metadata = {
    name: fileName,
    mimeType,
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${mimeType}\r\n\r\n` +
    content +
    closeDelimiter;

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartRequestBody,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google Drive upload failed (${res.status}): ${err}`);
  }

  const fileData = await res.json();
  return {
    fileId: fileData.id,
    url: `https://drive.google.com/file/d/${fileData.id}/view`,
  };
}
