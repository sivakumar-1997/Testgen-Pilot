import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '15mb' }));

// Shared Gemini client utility
const getGeminiClient = (customKey?: string) => {
  const apiKey = customKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment or settings.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// API Route for AI Generation with Multi-Agent Auto-Failover
app.post('/api/generate', async (req: Request, res: Response) => {
  const {
    requirements,
    scenarioTitle,
    moduleName,
    ticketPlatform = 'gitlab',
    ticketKey,
    template,
    knowledgeBase,
    previousSuite,
    historicalContext,
    isIncrementalUpdate,
    modelConfig = { provider: 'gemini', modelName: 'gemini-3.8-flash', autoFailoverEnabled: true },
  } = req.body;

  if (!requirements || typeof requirements !== 'string' || !requirements.trim()) {
    return res.status(400).json({ error: 'Ticket description or instructions are required.' });
  }

  const { provider, modelName, apiKey, localEndpoint, autoFailoverEnabled = true } = modelConfig;
  let failoverNotice: string | null = null;
  let finalProvider = provider;

  // Primary Agent Execution Attempt
  try {
    let result: any = null;

    if (provider === 'openai') {
      try {
        result = await callOpenAI({ requirements, scenarioTitle, moduleName, ticketPlatform, template, knowledgeBase, previousSuite, historicalContext, isIncrementalUpdate, apiKey, modelName });
      } catch (err: any) {
        if (!autoFailoverEnabled) throw err;
        console.warn('OpenAI agent token/error; triggering auto-failover to Gemini:', err.message);
        failoverNotice = `Primary agent (OpenAI) encountered token or rate limit: ${err.message}. Seamlessly auto-failed over to Gemini 3.8 Flash agent.`;
        finalProvider = 'gemini';
        result = await callGemini({ requirements, scenarioTitle, moduleName, ticketPlatform, template, knowledgeBase, previousSuite, historicalContext, isIncrementalUpdate });
      }
    } else if (provider === 'anthropic') {
      try {
        result = await callAnthropic({ requirements, scenarioTitle, moduleName, ticketPlatform, template, knowledgeBase, previousSuite, historicalContext, isIncrementalUpdate, apiKey, modelName });
      } catch (err: any) {
        if (!autoFailoverEnabled) throw err;
        console.warn('Anthropic agent token/error; triggering auto-failover to Gemini:', err.message);
        failoverNotice = `Primary agent (Claude) encountered token or rate limit: ${err.message}. Seamlessly auto-failed over to Gemini 3.8 Flash agent.`;
        finalProvider = 'gemini';
        result = await callGemini({ requirements, scenarioTitle, moduleName, ticketPlatform, template, knowledgeBase, previousSuite, historicalContext, isIncrementalUpdate });
      }
    } else if (provider === 'ollama' || provider === 'local') {
      try {
        result = await callOllama({ requirements, scenarioTitle, moduleName, ticketPlatform, template, knowledgeBase, previousSuite, historicalContext, isIncrementalUpdate, localEndpoint, modelName });
      } catch (err: any) {
        if (!autoFailoverEnabled) throw err;
        console.warn('Local agent error; triggering auto-failover to Gemini:', err.message);
        failoverNotice = `Local Ollama agent unavailable. Seamlessly auto-failed over to cloud Gemini 3.8 Flash agent.`;
        finalProvider = 'gemini';
        result = await callGemini({ requirements, scenarioTitle, moduleName, ticketPlatform, template, knowledgeBase, previousSuite, historicalContext, isIncrementalUpdate });
      }
    } else {
      // Default: Gemini (with fallback to lite if needed)
      result = await callGemini({ requirements, scenarioTitle, moduleName, ticketPlatform, template, knowledgeBase, previousSuite, historicalContext, isIncrementalUpdate, customKey: apiKey });
    }

    return res.json({
      ...result,
      agentUsed: finalProvider,
      failoverNotice,
    });
  } catch (error: any) {
    console.error('All AI agents exhausted or generation error:', error);
    return res.status(500).json({
      error: error.message || 'Generation failed. Please try again or switch model in settings.',
      failoverNotice,
    });
  }
});

function buildMasterPrompt({
  requirements,
  scenarioTitle,
  moduleName,
  ticketPlatform,
  template,
  knowledgeBase,
  previousSuite,
  historicalContext,
  isIncrementalUpdate,
}: any) {
  let prompt = `SOURCE TICKET / MR CONTEXT [Platform: ${String(ticketPlatform).toUpperCase()}]:\n`;
  if (moduleName) prompt += `Module / Domain: ${moduleName}\n`;
  if (scenarioTitle) prompt += `Target Ticket / MR Title: ${scenarioTitle}\n`;
  prompt += `\n"""\n${requirements}\n"""\n\n`;

  if (historicalContext && historicalContext.trim()) {
    prompt += `RECALLED HISTORICAL MEMORY & PREVIOUS SEARCHES (Learn from earlier test cases & bug patterns in this domain):\n"""\n${historicalContext}\n"""\n\n`;
  }

  if (knowledgeBase && knowledgeBase.trim()) {
    prompt += `ORGANIZATIONAL QA STANDARDS & TEST CONVENTIONS:\n"""\n${knowledgeBase}\n"""\n\n`;
  }

  if (template) {
    prompt += `OUTPUT TEMPLATE SPECIFICATION (Strictly adhere to these columns in Section 4):\n`;
    prompt += `Template Name: ${template.name || 'Standard'}\n`;
    prompt += `Columns required: ${JSON.stringify(template.columns || ['id', 'scenario', 'preconditions', 'steps', 'testData', 'expectedResult', 'priority', 'status'])}\n\n`;
  }

  if (isIncrementalUpdate && previousSuite && previousSuite.length > 0) {
    prompt += `INCREMENTAL UPDATE & MEMORY CONTEXT:\n`;
    prompt += `Existing test cases drafted for this feature:\n${JSON.stringify(previousSuite.slice(0, 15), null, 2)}\n`;
    prompt += `Preserve existing IDs, adjust steps where rules changed, add new cases with diffType: "new", and mark obsolete cases as "deprecated".\n\n`;
  }

  prompt += `MANDATORY 4-SECTION OUTPUT REQUIREMENTS:
1. Section 1 (Template): Follow the requested columns precisely in testCases.
2. Section 2 (MR Analysis): Analyze what the actual fix or Merge Request is doing. Identify root cause, impacted components, regression risks, and architecture changes.
3. Section 3 (Tester Questions): List at least 4 critical, high-impact technical questions that a Senior QA/Tester must ask the developer or PM before signing off.
4. Section 4 (Complete Test Suite): Generate exhaustive test cases covering Positive, Negative, Boundary, Edge cases, Corner cases, Security (OWASP, RBAC, input sanitization), and UI/Accessibility (responsive rendering, keyboard navigation).`;

  return prompt;
}

async function callGemini(params: any) {
  const ai = getGeminiClient(params.customKey);
  const promptText = buildMasterPrompt(params);

  const systemInstruction = `You are a Principal Software Quality Assurance (QA) and Test Engineering Architect specialized in reviewing GitLab/Jira tickets and Merge Requests (MRs).
Always output strictly valid JSON with keys:
- mrAnalysis: { actualFixSummary, rootCause, impactedComponents, regressionRisks, architectureChanges, suggestedAutomations }
- testerQuestions: array of { id, question, rationale, targetRole }
- suiteSummary: { totalCases, positiveCount, negativeCount, boundaryCount, edgeCount, cornerCount, accessibilityCount, securityCount, uiCount, coveragePercentage }
- requirementsList: array of { reqId, title, description, priority }
- testCases: array of { id, order, scenario, scope, category, priority, preconditions, steps, testData, expectedResult, expectation, status, mappedRequirementIds, diffType, diffSummary }
- traceabilityMatrix: array of { reqId, reqTitle, mappedTestCaseIds, coverageStatus }
- changeLog: array of { changeType, description }`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: promptText,
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          mrAnalysis: {
            type: Type.OBJECT,
            properties: {
              actualFixSummary: { type: Type.STRING },
              rootCause: { type: Type.STRING },
              impactedComponents: { type: Type.ARRAY, items: { type: Type.STRING } },
              regressionRisks: { type: Type.ARRAY, items: { type: Type.STRING } },
              architectureChanges: { type: Type.ARRAY, items: { type: Type.STRING } },
              suggestedAutomations: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ['actualFixSummary', 'rootCause', 'impactedComponents', 'regressionRisks'],
          },
          testerQuestions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                question: { type: Type.STRING },
                rationale: { type: Type.STRING },
                targetRole: { type: Type.STRING },
              },
              required: ['id', 'question', 'rationale', 'targetRole'],
            },
          },
          suiteSummary: {
            type: Type.OBJECT,
            properties: {
              totalCases: { type: Type.INTEGER },
              positiveCount: { type: Type.INTEGER },
              negativeCount: { type: Type.INTEGER },
              boundaryCount: { type: Type.INTEGER },
              edgeCount: { type: Type.INTEGER },
              cornerCount: { type: Type.INTEGER },
              accessibilityCount: { type: Type.INTEGER },
              securityCount: { type: Type.INTEGER },
              uiCount: { type: Type.INTEGER },
              coveragePercentage: { type: Type.NUMBER },
            },
            required: ['totalCases', 'positiveCount', 'negativeCount', 'coveragePercentage'],
          },
          requirementsList: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                reqId: { type: Type.STRING },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                priority: { type: Type.STRING },
              },
              required: ['reqId', 'title', 'priority'],
            },
          },
          testCases: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                order: { type: Type.INTEGER },
                scenario: { type: Type.STRING },
                scope: { type: Type.STRING },
                category: { type: Type.STRING },
                priority: { type: Type.STRING },
                preconditions: { type: Type.STRING },
                steps: { type: Type.ARRAY, items: { type: Type.STRING } },
                testData: { type: Type.STRING },
                expectedResult: { type: Type.STRING },
                expectation: { type: Type.STRING },
                status: { type: Type.STRING },
                mappedRequirementIds: { type: Type.ARRAY, items: { type: Type.STRING } },
                diffType: { type: Type.STRING },
                diffSummary: { type: Type.STRING },
              },
              required: ['id', 'scenario', 'category', 'priority', 'preconditions', 'steps', 'expectedResult'],
            },
          },
          traceabilityMatrix: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                reqId: { type: Type.STRING },
                reqTitle: { type: Type.STRING },
                mappedTestCaseIds: { type: Type.ARRAY, items: { type: Type.STRING } },
                coverageStatus: { type: Type.STRING },
              },
              required: ['reqId', 'mappedTestCaseIds', 'coverageStatus'],
            },
          },
          changeLog: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                changeType: { type: Type.STRING },
                description: { type: Type.STRING },
              },
              required: ['changeType', 'description'],
            },
          },
        },
        required: ['mrAnalysis', 'testerQuestions', 'suiteSummary', 'requirementsList', 'testCases', 'traceabilityMatrix'],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error('Gemini returned an empty response.');
  return JSON.parse(text);
}

async function callOpenAI(params: any) {
  if (!params.apiKey) throw new Error('OpenAI API Key is missing.');
  const promptText = buildMasterPrompt(params);

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.apiKey}`,
    },
    body: JSON.stringify({
      model: params.modelName || 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You are a principal QA engineer reviewing Merge Requests and Tickets. Output JSON containing: mrAnalysis, testerQuestions, suiteSummary, requirementsList, testCases, traceabilityMatrix, changeLog.',
        },
        { role: 'user', content: promptText },
      ],
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  return JSON.parse(content || '{}');
}

async function callAnthropic(params: any) {
  if (!params.apiKey) throw new Error('Anthropic API Key is missing.');
  const promptText = buildMasterPrompt(params);

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': params.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: params.modelName || 'claude-3-7-sonnet-20250219',
      max_tokens: 4000,
      messages: [{ role: 'user', content: promptText + '\n\nOutput ONLY raw JSON with keys: mrAnalysis, testerQuestions, suiteSummary, requirementsList, testCases, traceabilityMatrix, changeLog.' }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Anthropic error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const text = data.content?.[0]?.text || '';
  return JSON.parse(extractJson(text));
}

async function callOllama(params: any) {
  const endpoint = params.localEndpoint || 'http://localhost:11434';
  const promptText = buildMasterPrompt(params);

  const res = await fetch(`${endpoint}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: params.modelName || 'llama3.3',
      prompt: promptText + '\n\nOutput ONLY valid JSON with keys: mrAnalysis, testerQuestions, suiteSummary, requirementsList, testCases, traceabilityMatrix, changeLog.',
      stream: false,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Ollama error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return JSON.parse(extractJson(data.response || data.text || ''));
}

function extractJson(raw: string): string {
  const match = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (match) return match[1].trim();
  const firstBrace = raw.indexOf('{');
  const lastBrace = raw.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return raw.slice(firstBrace, lastBrace + 1).trim();
  }
  return raw.trim();
}

// Development Vite Middleware setup or Production Static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`TestGen Pilot server running on http://0.0.0.0:${port}`);
  });
}

startServer();
