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
