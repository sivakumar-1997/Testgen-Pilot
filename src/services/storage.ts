import { TestSuite, CustomTemplate, ModelSettings, KnowledgeDocument } from '../types';
import { INITIAL_SUITES, INITIAL_KNOWLEDGE } from '../data/initialData';
import { DEFAULT_TEMPLATES } from '../data/templates';

const STORAGE_KEYS = {
  SUITES: 'testgen_suites_v1',
  ACTIVE_SUITE_ID: 'testgen_active_suite_id_v1',
  TEMPLATES: 'testgen_templates_v1',
  ACTIVE_TEMPLATE_ID: 'testgen_active_template_id_v1',
  MODEL_SETTINGS: 'testgen_model_settings_v1',
  KNOWLEDGE_BASE: 'testgen_knowledge_base_v1',
};

export const getStoredSuites = (): TestSuite[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SUITES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SUITES, JSON.stringify(INITIAL_SUITES));
      return INITIAL_SUITES;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load suites from storage:', e);
    return INITIAL_SUITES;
  }
};

export const saveSuites = (suites: TestSuite[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.SUITES, JSON.stringify(suites));
  } catch (e) {
    console.error('Failed to save suites to storage:', e);
  }
};

export const getActiveSuiteId = (): string => {
  try {
    const id = localStorage.getItem(STORAGE_KEYS.ACTIVE_SUITE_ID);
    return id || INITIAL_SUITES[0].id;
  } catch {
    return INITIAL_SUITES[0].id;
  }
};

export const setActiveSuiteId = (id: string): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_SUITE_ID, id);
  } catch (e) {
    console.error('Failed to save active suite id:', e);
  }
};

export const getStoredTemplates = (): CustomTemplate[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(DEFAULT_TEMPLATES));
      return DEFAULT_TEMPLATES;
    }
    const parsed: CustomTemplate[] = JSON.parse(raw);
    // Ensure all built-in templates exist
    const merged = [...parsed];
    for (const def of DEFAULT_TEMPLATES) {
      if (!merged.some((t) => t.id === def.id)) {
        merged.unshift(def);
      }
    }
    return merged;
  } catch {
    return DEFAULT_TEMPLATES;
  }
};

export const saveTemplates = (templates: CustomTemplate[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
  } catch (e) {
    console.error('Failed to save templates:', e);
  }
};

export const getActiveTemplateId = (): string => {
  try {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_TEMPLATE_ID) || 'screenshot-template';
  } catch {
    return 'screenshot-template';
  }
};

export const setActiveTemplateId = (id: string): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_TEMPLATE_ID, id);
  } catch (e) {
    console.error('Failed to save active template id:', e);
  }
};

export const getModelSettings = (): ModelSettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MODEL_SETTINGS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    provider: 'gemini',
    modelName: 'gemini-3.8-flash',
  };
};

export const saveModelSettings = (settings: ModelSettings): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.MODEL_SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save model settings:', e);
  }
};

export const getKnowledgeBase = (): KnowledgeDocument[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.KNOWLEDGE_BASE);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.KNOWLEDGE_BASE, JSON.stringify(INITIAL_KNOWLEDGE));
      return INITIAL_KNOWLEDGE;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_KNOWLEDGE;
  }
};

export const saveKnowledgeBase = (docs: KnowledgeDocument[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.KNOWLEDGE_BASE, JSON.stringify(docs));
  } catch (e) {
    console.error('Failed to save knowledge base:', e);
  }
};

/**
 * Memory Brain Recall Search
 * Scans all stored suites for overlapping domain keywords (e.g. "shipment", "carrier", "webhook", "auth", "upload", "payment")
 * and extracts matching test cases and past learnings to ground the current test generation.
 */
export const searchHistoricalMemory = (
  queryText: string,
  excludeSuiteId?: string
): import('../types').RecalledMemory[] => {
  if (!queryText || queryText.trim().length < 2) return [];

  const suites = getStoredSuites();
  // Extract search tokens: lowercase, alphanumeric words >= 3 chars
  const stopWords = new Set([
    'the', 'and', 'for', 'that', 'this', 'with', 'from', 'have', 'were', 'will',
    'should', 'must', 'user', 'when', 'then', 'test', 'case', 'suite', 'page'
  ]);
  const rawTokens = queryText.toLowerCase().replace(/[^a-z0-9\s_-]/g, ' ').split(/\s+/);
  const keywords = Array.from(new Set(rawTokens.filter((t) => t.length >= 3 && !stopWords.has(t))));

  if (keywords.length === 0) return [];

  const recalled: import('../types').RecalledMemory[] = [];

  for (const suite of suites) {
    if (excludeSuiteId && suite.id === excludeSuiteId) continue;

    const suiteCorpus = `${suite.name} ${suite.module} ${suite.scenarioTitle} ${suite.requirementsRaw}`.toLowerCase();
    const matched = keywords.filter((kw) => suiteCorpus.includes(kw));

    if (matched.length > 0) {
      // Find matching test cases within this suite
      const matchingCases = suite.testCases.filter((tc) => {
        const tcCorpus = `${tc.scenario} ${tc.scope} ${tc.expectedResult} ${tc.testData} ${tc.preconditions} ${tc.notes || ''}`.toLowerCase();
        return matched.some((kw) => tcCorpus.includes(kw));
      });

      // Extract past learnings from MR analysis or notes
      const pastLearnings: string[] = [];
      if (suite.mrAnalysis?.regressionRisks) {
        pastLearnings.push(...suite.mrAnalysis.regressionRisks);
      }
      if (suite.mrAnalysis?.rootCause) {
        pastLearnings.push(`Root cause lesson: ${suite.mrAnalysis.rootCause}`);
      }
      for (const tc of matchingCases) {
        if (tc.notes) pastLearnings.push(tc.notes);
      }

      if (matchingCases.length > 0 || pastLearnings.length > 0) {
        recalled.push({
          suiteId: suite.id,
          suiteName: suite.name,
          module: suite.module,
          matchedKeywords: matched,
          recalledCasesCount: matchingCases.length,
          historicalCases: matchingCases.map((tc) => ({
            ...tc,
            sourceOrigin: 'historical_memory',
          })),
          pastLearnings: Array.from(new Set(pastLearnings)).slice(0, 5),
        });
      }
    }
  }

  return recalled;
};

