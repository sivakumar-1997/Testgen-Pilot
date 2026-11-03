import type { IncomingMessage, ServerResponse } from 'http';
import { GoogleGenAI, Type } from '@google/genai';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

    // Handle OpenAI
    if (provider === 'openai') {
      if (!apiKey) return res.status(400).json({ error: 'OpenAI API key is required.' });
      const promptText = buildPrompt({ requirements, scenarioTitle, moduleName, template, knowledgeBase, previousSuite, isIncrementalUpdate });
      const openAiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: modelName || 'gpt-4o',
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: 'You are a principal QA automation and test design architect. Output valid JSON with keys: testCases, requirementsList, traceabilityMatrix, changeLog.' },
            { role: 'user', content: promptText }
          ],
          temperature: 0.2,
        }),
      });
      if (!openAiRes.ok) throw new Error(await openAiRes.text());
      const data = await openAiRes.json();
      return res.status(200).json(JSON.parse(data.choices?.[0]?.message?.content || '{}'));
    }

    // Handle Anthropic Claude
    if (provider === 'anthropic') {
      if (!apiKey) return res.status(400).json({ error: 'Anthropic API key is required.' });
      const promptText = buildPrompt({ requirements, scenarioTitle, moduleName, template, knowledgeBase, previousSuite, isIncrementalUpdate });
      const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({
          model: modelName || 'claude-3-7-sonnet-20250219',
          max_tokens: 4000,
          messages: [{ role: 'user', content: promptText + '\n\nOutput ONLY raw JSON with keys: testCases, requirementsList, traceabilityMatrix, changeLog.' }],
        }),
      });
      if (!claudeRes.ok) throw new Error(await claudeRes.text());
      const data = await claudeRes.json();
      const text = data.content?.[0]?.text || '';
      return res.status(200).json(JSON.parse(extractJson(text)));
    }

    // Default: Gemini
    const geminiKey = apiKey || process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured in Vercel environment.' });
    }

    const ai = new GoogleGenAI({
      apiKey: geminiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });

    const targetModel = modelName || 'gemini-3.8-flash';
    const systemInstruction = `You are a Principal Software Quality Assurance (QA) Architect and Test Engineer.
You analyze user requirements, stories, tickets, or discussions, and produce comprehensive, rigorous, industry-grade test suites with full RTCM coverage.
Output strictly valid JSON with suiteSummary, requirementsList, testCases, and traceabilityMatrix.`;

    const promptText = buildPrompt({ requirements, scenarioTitle, moduleName, template, knowledgeBase, previousSuite, isIncrementalUpdate });

    const response = await ai.models.generateContent({
      model: targetModel,
      contents: promptText,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const text = response.text;
    if (!text) throw new Error('Empty model response.');
    return res.status(200).json(JSON.parse(extractJson(text)));
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Generation failed.' });
  }
}

function buildPrompt({ requirements, scenarioTitle, moduleName, template, knowledgeBase, previousSuite, isIncrementalUpdate }: any) {
  let prompt = `REQUIREMENT SPECIFICATION:\n`;
  if (moduleName) prompt += `Module: ${moduleName}\n`;
  if (scenarioTitle) prompt += `Focus Scenario: ${scenarioTitle}\n`;
  prompt += `\n"""\n${requirements}\n"""\n\n`;

  if (knowledgeBase && knowledgeBase.trim()) {
    prompt += `ORGANIZATIONAL KNOWLEDGE BASE & QA GUIDELINES:\n"""\n${knowledgeBase}\n"""\n\n`;
  }

  if (template) {
    prompt += `OUTPUT TEMPLATE SPECIFICATION:\nColumns requested: ${JSON.stringify(template.columns || ['id', 'scenario', 'preconditions', 'steps', 'testData', 'expectedResult', 'priority', 'status'])}\n\n`;
  }

  if (isIncrementalUpdate && previousSuite && previousSuite.length > 0) {
    prompt += `INCREMENTAL UPDATE & MEMORY CONTEXT:\nExisting Test Cases to adapt:\n${JSON.stringify(previousSuite, null, 2)}\n\nTASK: Update steps, add new test cases with diffType: "new", mark obsolete ones as "deprecated".\n`;
  } else {
    prompt += `TASK: Extract requirement items with IDs (FR-001...). Generate exhaustive test cases (TC-001...) covering Positive, Negative, Boundary, Corner, Accessibility, and Edge cases.\n`;
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
