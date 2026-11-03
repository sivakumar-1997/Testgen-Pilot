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

// Initialize shared Gemini client
const getGeminiClient = (customKey?: string) => {
  const apiKey = customKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured. Please check your environment or settings.');
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

// API Route for AI Generation
app.post('/api/generate', async (req: Request, res: Response) => {
  try {
    const {
      requirements,
      scenarioTitle,
      moduleName,
      template,
      knowledgeBase,
      previousSuite,
      isIncrementalUpdate,
      modelConfig = { provider: 'gemini', modelName: 'gemini-3.8-flash' },
    } = req.body;

    if (!requirements || typeof requirements !== 'string' || !requirements.trim()) {
      return res.status(400).json({ error: 'Requirements text is required for test case generation.' });
    }

    const { provider, modelName, apiKey, localEndpoint } = modelConfig;

    // Handle Local LLM (Ollama or compatible)
    if (provider === 'ollama' || provider === 'local') {
      const endpoint = localEndpoint || 'http://localhost:11434';
      try {
        const promptText = buildPrompt({
          requirements,
          scenarioTitle,
          moduleName,
          template,
          knowledgeBase,
          previousSuite,
          isIncrementalUpdate,
        });

        const localRes = await fetch(`${endpoint}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: modelName || 'llama3.3',
            prompt: promptText + '\n\nOutput ONLY valid JSON with keys: testCases, requirementsList, traceabilityMatrix, changeLog.',
            stream: false,
          }),
        });

        if (!localRes.ok) {
          const errText = await localRes.text();
          throw new Error(`Local LLM failed (${localRes.status}): ${errText}`);
        }

        const data = await localRes.json();
        const cleanedText = extractJson(data.response || data.text || '');
        const parsed = JSON.parse(cleanedText);
        return res.json(parsed);
      } catch (err: any) {
        return res.status(500).json({ error: `Local LLM error: ${err.message}. Ensure Ollama is running at ${endpoint}` });
      }
    }

    // Handle OpenAI
    if (provider === 'openai') {
      if (!apiKey) {
        return res.status(400).json({ error: 'OpenAI API key is required when selecting OpenAI models.' });
      }

      const promptText = buildPrompt({
        requirements,
        scenarioTitle,
        moduleName,
        template,
        knowledgeBase,
        previousSuite,
        isIncrementalUpdate,
      });

      const openAiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: modelName || 'gpt-4o',
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: 'You are a principal QA automation and test design architect. Always output strictly valid JSON with keys: testCases, requirementsList, traceabilityMatrix, changeLog.',
            },
            { role: 'user', content: promptText },
          ],
          temperature: 0.2,
        }),
      });

      if (!openAiRes.ok) {
        const err = await openAiRes.text();
        return res.status(openAiRes.status).json({ error: `OpenAI API error: ${err}` });
      }

      const openAiData = await openAiRes.json();
      const content = openAiData.choices?.[0]?.message?.content;
      const parsed = JSON.parse(content || '{}');
      return res.json(parsed);
    }

    // Handle Anthropic Claude
    if (provider === 'anthropic') {
      if (!apiKey) {
        return res.status(400).json({ error: 'Anthropic API key is required when selecting Claude models.' });
      }

      const promptText = buildPrompt({
        requirements,
        scenarioTitle,
        moduleName,
        template,
        knowledgeBase,
        previousSuite,
        isIncrementalUpdate,
      });

      const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: modelName || 'claude-3-7-sonnet-20250219',
          max_tokens: 4000,
          messages: [{ role: 'user', content: promptText + '\n\nOutput ONLY raw JSON with keys: testCases, requirementsList, traceabilityMatrix, changeLog.' }],
        }),
      });

      if (!claudeRes.ok) {
        const err = await claudeRes.text();
        return res.status(claudeRes.status).json({ error: `Anthropic API error: ${err}` });
      }

      const claudeData = await claudeRes.json();
      const text = claudeData.content?.[0]?.text || '';
      const parsed = JSON.parse(extractJson(text));
      return res.json(parsed);
    }

    // Default: Gemini (Server-side @google/genai)
    const ai = getGeminiClient(apiKey);
    const targetModel = modelName || 'gemini-3.8-flash';

    const systemInstruction = `You are a Principal Software Quality Assurance (QA) Architect and Test Engineer.
You analyze user requirements, stories, tickets, or discussions, and produce comprehensive, rigorous, industry-grade test suites.
You MUST provide full coverage across all testing dimensions:
1. Positive (Happy Path, normal workflows, valid data inputs)
2. Negative (Invalid inputs, unauthenticated requests, unauthorized roles, system exceptions)
3. Boundary & Corner Cases (Min/max length, extreme limits, concurrency, multi-step race conditions)
4. Edge Cases (Network timeouts, special characters, zero values, unicode, large payloads)
5. Accessibility & UX (Keyboard navigation, screen readers, contrast, focus indicators)
6. Security & Permissions (Input sanitization, XSS/injection payloads, session hijacking, RBAC)

If 'isIncrementalUpdate' is true and 'previousSuite' is provided:
- Act as the "Brain" with memory: Analyze what changed between previous requirements and current requirements.
- Maintain existing Test Case IDs for unmodified/updated cases.
- Mark newly added test cases as 'diffType: "new"'.
- Mark updated test cases as 'diffType: "modified"' and detail the changes in 'diffSummary'.
- If any existing test case is no longer relevant, mark it as 'diffType: "deprecated"'.
- Keep existing test cases that are still valid with 'diffType: "unchanged"'.
- Provide a clear 'changeLog' summarizing what was adjusted, added, or retired.

Always follow the requested template columns and output strictly valid JSON.`;

    const promptText = buildPrompt({
      requirements,
      scenarioTitle,
      moduleName,
      template,
      knowledgeBase,
      previousSuite,
      isIncrementalUpdate,
    });

    const response = await ai.models.generateContent({
      model: targetModel,
      contents: promptText,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
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
                coveragePercentage: { type: Type.NUMBER },
                assumptions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
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
                  type: { type: Type.STRING },
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
                  steps: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  testData: { type: Type.STRING },
                  expectedResult: { type: Type.STRING },
                  expectation: { type: Type.STRING },
                  status: { type: Type.STRING },
                  mappedRequirementIds: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  diffType: { type: Type.STRING },
                  diffSummary: { type: Type.STRING },
                  customFields: {
                    type: Type.OBJECT,
                    description: 'Key-value pairs matching custom template columns',
                  },
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
                  mappedTestCaseIds: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
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
                  affectedItems: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: ['changeType', 'description'],
              },
            },
          },
          required: ['suiteSummary', 'requirementsList', 'testCases', 'traceabilityMatrix'],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('Model returned an empty response. Please try again.');
    }

    const parsed = JSON.parse(text);
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error generating test cases:', error);
    return res.status(500).json({
      error: error.message || 'An unexpected error occurred during test case generation.',
    });
  }
});

function buildPrompt({
  requirements,
  scenarioTitle,
  moduleName,
  template,
  knowledgeBase,
  previousSuite,
  isIncrementalUpdate,
}: any) {
  let prompt = `REQUIREMENT SPECIFICATION:\n`;
  if (moduleName) prompt += `Module: ${moduleName}\n`;
  if (scenarioTitle) prompt += `Focus Scenario: ${scenarioTitle}\n`;
  prompt += `\n"""\n${requirements}\n"""\n\n`;

  if (knowledgeBase && knowledgeBase.trim()) {
    prompt += `ORGANIZATIONAL KNOWLEDGE BASE & QA GUIDELINES (Learn and adhere to these standards):\n"""\n${knowledgeBase}\n"""\n\n`;
  }

  if (template) {
    prompt += `OUTPUT TEMPLATE SPECIFICATION:\n`;
    prompt += `Template Name: ${template.name || 'Standard'}\n`;
    prompt += `Columns requested: ${JSON.stringify(template.columns || ['id', 'scenario', 'preconditions', 'steps', 'testData', 'expectedResult', 'priority', 'status'])}\n\n`;
  }

  if (isIncrementalUpdate && previousSuite && previousSuite.length > 0) {
    prompt += `INCREMENTAL UPDATE & MEMORY CONTEXT:\n`;
    prompt += `The user already has an existing drafted test suite for this feature. The requirements were recently modified.\n`;
    prompt += `Existing Test Cases to adapt:\n${JSON.stringify(previousSuite, null, 2)}\n\n`;
    prompt += `TASK: Compare the updated requirements against the existing test cases. Preserve existing IDs, update steps where rules changed, add new test cases for new requirements (with diffType: "new"), mark obsolete ones as "deprecated", and describe the differences.\n`;
  } else {
    prompt += `TASK: Analyze the requirement thoroughly. Extract discrete requirement items with IDs (e.g. FR-001, FR-002...).
Generate exhaustive test cases (TC-001, TC-002...) with clear steps, precise test data, and expected results.
Ensure full matrix coverage for Positive, Negative, Boundary, Corner, Accessibility, and Edge cases.\n`;
  }

  return prompt;
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
