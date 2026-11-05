/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  TestSuite,
  CustomTemplate,
  ModelSettings,
  KnowledgeDocument,
  TestCase,
  TestSuiteVersion,
  TicketPlatform,
  TesterQuestion,
} from './types';
import {
  getStoredSuites,
  saveSuites,
  getActiveSuiteId,
  setActiveSuiteId as saveActiveSuiteId,
  getStoredTemplates,
  saveTemplates,
  getActiveTemplateId,
  setActiveTemplateId as saveActiveTemplateId,
  getModelSettings,
  saveModelSettings,
  getKnowledgeBase,
  saveKnowledgeBase,
} from './services/storage';
import { initAuth } from './services/googleWorkspace';
import { Header, AppTab } from './components/Header';
import { SidebarTree } from './components/SidebarTree';
import { TestCaseTable } from './components/TestCaseTable';
import { TraceabilityMatrixView } from './components/TraceabilityMatrixView';
import { MRAnalysisCard } from './components/MRAnalysisCard';
import { TesterQuestionsCard } from './components/TesterQuestionsCard';
import { MemoryBrainCard } from './components/MemoryBrainCard';
import { RequirementsEditorModal } from './components/RequirementsEditorModal';
import { ImportTestCasesModal } from './components/ImportTestCasesModal';
import { ExportModal } from './components/ExportModal';
import { ModelSettingsModal } from './components/ModelSettingsModal';
import { KnowledgeBaseModal } from './components/KnowledgeBaseModal';
import { CustomTemplateModal } from './components/CustomTemplateModal';
import { DiffTimelineModal } from './components/DiffTimelineModal';
import { DeployConfigModal } from './components/DeployConfigModal';
import { Zap, AlertCircle, X } from 'lucide-react';

export default function App() {
  const [suites, setSuites] = useState<TestSuite[]>(getStoredSuites);
  const [activeSuiteId, setActiveSuiteId] = useState<string>(getActiveSuiteId);
  const [templates, setTemplates] = useState<CustomTemplate[]>(getStoredTemplates);
  const [activeTemplateId, setActiveTemplateId] = useState<string>(getActiveTemplateId);
  const [modelSettings, setModelSettings] = useState<ModelSettings>(getModelSettings);
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeDocument[]>(getKnowledgeBase);
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>('test-cases');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [failoverToast, setFailoverToast] = useState<string | null>(null);

  // Modal open states
  const [isRequirementsModalOpen, setIsRequirementsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isModelSettingsOpen, setIsModelSettingsOpen] = useState(false);
  const [isKnowledgeBaseOpen, setIsKnowledgeBaseOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isDeployConfigOpen, setIsDeployConfigOpen] = useState(false);

  // Initialize Firebase Auth listener for Google Workspace
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser) => {
        setUser(currentUser);
      },
      () => {
        setUser(null);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Save changes to persistence
  useEffect(() => {
    saveSuites(suites);
  }, [suites]);

  useEffect(() => {
    saveActiveSuiteId(activeSuiteId);
  }, [activeSuiteId]);

  useEffect(() => {
    saveTemplates(templates);
  }, [templates]);

  useEffect(() => {
    saveActiveTemplateId(activeTemplateId);
  }, [activeTemplateId]);

  useEffect(() => {
    saveModelSettings(modelSettings);
  }, [modelSettings]);

  useEffect(() => {
    saveKnowledgeBase(knowledgeBase);
  }, [knowledgeBase]);

  // Current active suite & template
  const activeSuite = suites.find((s) => s.id === activeSuiteId) || suites[0];
  const activeTemplate = templates.find((t) => t.id === activeTemplateId) || templates[0];

  // Update active suite helper
  const updateCurrentSuite = (updater: (suite: TestSuite) => TestSuite) => {
    setSuites((prev) =>
      prev.map((s) => {
        if (s.id === activeSuite.id) {
          const updated = updater(s);
          return { ...updated, updatedAt: new Date().toISOString() };
        }
        return s;
      })
    );
  };

  // Add new test case to current suite
  const handleAddTestCase = () => {
    const nextOrder = activeSuite.testCases.length + 1;
    const newCase: TestCase = {
      id: `TC-${String(nextOrder).padStart(3, '0')}`,
      order: nextOrder,
      scenario: 'New Test Scenario',
      scope: 'Execute newly added user verification',
      category: 'positive',
      priority: 'high',
      preconditions: 'System ready',
      steps: ['Perform action', 'Verify result'],
      testData: 'Valid input',
      expectedResult: 'System behaves as expected',
      expectation: 'Action succeeds without error',
      status: 'pending',
      mappedRequirementIds: activeSuite.requirementsList[0] ? [activeSuite.requirementsList[0].reqId] : [],
      diffType: 'new',
    };

    updateCurrentSuite((s) => ({
      ...s,
      testCases: [...s.testCases, newCase],
    }));
  };

  // Update test case
  const handleUpdateTestCase = (updatedCase: TestCase) => {
    updateCurrentSuite((s) => ({
      ...s,
      testCases: s.testCases.map((tc) => (tc.id === updatedCase.id ? updatedCase : tc)),
    }));
  };

  // Delete test case
  const handleDeleteTestCase = (id: string) => {
    updateCurrentSuite((s) => ({
      ...s,
      testCases: s.testCases.filter((tc) => tc.id !== id),
    }));
  };

  // Duplicate test case
  const handleDuplicateTestCase = (tc: TestCase) => {
    const nextOrder = activeSuite.testCases.length + 1;
    const duplicated: TestCase = {
      ...tc,
      id: `TC-${String(nextOrder).padStart(3, '0')}`,
      order: nextOrder,
      scenario: `${tc.scenario} (Copy)`,
      status: 'pending',
      diffType: 'new',
    };

    updateCurrentSuite((s) => ({
      ...s,
      testCases: [...s.testCases, duplicated],
    }));
  };

  // Create new suite
  const handleNewSuite = () => {
    const id = `suite-${Date.now()}`;
    const newSuite: TestSuite = {
      id,
      name: 'New Test Scenario',
      module: 'General',
      scenarioTitle: 'User Story Verification',
      version: 1,
      requirementsRaw: '',
      requirementsList: [],
      testCases: [],
      traceabilityMatrix: [],
      templateId: activeTemplateId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      history: [],
    };

    setSuites((prev) => [newSuite, ...prev]);
    setActiveSuiteId(id);
    setIsRequirementsModalOpen(true);
  };

  // Delete suite
  const handleDeleteSuite = (id: string) => {
    const remaining = suites.filter((s) => s.id !== id);
    if (remaining.length > 0) {
      setSuites(remaining);
      setActiveSuiteId(remaining[0].id);
    }
  };

  // Import external test suite
  const handleImportComplete = (importedSuite: TestSuite) => {
    setSuites((prev) => [importedSuite, ...prev]);
    setActiveSuiteId(importedSuite.id);
  };

  // AI Generation & Brain Incremental Diff Execution
  const handleGenerate = async ({
    requirements,
    scenarioTitle,
    moduleName,
    ticketPlatform,
    ticketKey,
    historicalContext,
    isIncrementalUpdate,
  }: {
    requirements: string;
    scenarioTitle: string;
    moduleName: string;
    ticketPlatform?: TicketPlatform;
    ticketKey?: string;
    historicalContext?: string;
    isIncrementalUpdate: boolean;
  }) => {
    const activeKnowledgeText = knowledgeBase
      .filter((k) => k.isActive)
      .map((k) => `[${k.name}]\n${k.content}`)
      .join('\n\n---\n\n');

    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requirements,
        scenarioTitle,
        moduleName,
        ticketPlatform,
        ticketKey,
        template: activeTemplate,
        knowledgeBase: activeKnowledgeText,
        previousSuite: isIncrementalUpdate ? activeSuite.testCases : undefined,
        historicalContext,
        isIncrementalUpdate,
        modelConfig: modelSettings,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || `Generation failed with status ${response.status}`);
    }

    const data = await response.json();

    if (data.failoverNotice) {
      setFailoverToast(data.failoverNotice);
      setTimeout(() => setFailoverToast(null), 8000);
    }

    // Create history checkpoint
    const currentVersion: TestSuiteVersion = {
      version: activeSuite.version,
      timestamp: new Date().toISOString(),
      requirementsRaw: activeSuite.requirementsRaw,
      changeSummary: isIncrementalUpdate
        ? `Incremental adaptation based on modified requirements (${data.changeLog?.length || 0} change points).`
        : 'Fresh AI Generation suite baseline.',
      testCases: [...activeSuite.testCases],
    };

    const newVersion = isIncrementalUpdate ? activeSuite.version + 1 : 1;

    updateCurrentSuite((s) => ({
      ...s,
      name: scenarioTitle,
      scenarioTitle,
      module: moduleName,
      ticketPlatform: ticketPlatform || s.ticketPlatform,
      ticketKey: ticketKey || s.ticketKey,
      version: newVersion,
      requirementsRaw: requirements,
      requirementsList: data.requirementsList || s.requirementsList,
      testCases: data.testCases || s.testCases,
      traceabilityMatrix: data.traceabilityMatrix || s.traceabilityMatrix,
      suiteSummary: data.suiteSummary,
      mrAnalysis: data.mrAnalysis || s.mrAnalysis,
      testerQuestions: data.testerQuestions || s.testerQuestions,
      history: isIncrementalUpdate ? [currentVersion, ...(s.history || [])] : [currentVersion],
    }));
  };

  // Restore historical version
  const handleRestoreVersion = (version: TestSuiteVersion) => {
    updateCurrentSuite((s) => ({
      ...s,
      version: version.version,
      requirementsRaw: version.requirementsRaw,
      testCases: version.testCases,
    }));
    setIsHistoryModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] text-[#e2e8f0] flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* Top Application Header */}
      <Header
        activeSuite={activeSuite}
        modelSettings={modelSettings}
        user={user}
        onOpenRequirementsModal={() => setIsRequirementsModalOpen(true)}
        onOpenModelSettings={() => setIsModelSettingsOpen(true)}
        onOpenKnowledgeBase={() => setIsKnowledgeBaseOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenTemplateModal={() => setIsTemplateModalOpen(true)}
        onOpenHistoryModal={() => setIsHistoryModalOpen(true)}
        onOpenDeployConfig={() => setIsDeployConfigOpen(true)}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
      />

      {/* Auto-Failover Notification Banner */}
      {failoverToast && (
        <div className="bg-amber-950/80 border-b border-amber-500/40 px-4 py-2 flex items-center justify-between text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Auto-Failover Triggered:</strong> {failoverToast}
            </span>
          </div>
          <button
            onClick={() => setFailoverToast(null)}
            className="p-1 text-amber-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar Tree (Desktop & Responsive Drawer) */}
        <SidebarTree
          suites={suites}
          activeSuiteId={activeSuite.id}
          onSelectSuite={(id) => setActiveSuiteId(id)}
          onNewSuite={handleNewSuite}
          onDeleteSuite={handleDeleteSuite}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Center / Right Content Panel */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#0b0e14]">
          {activeTab === 'test-cases' && (
            <TestCaseTable
              suite={activeSuite}
              template={activeTemplate}
              onUpdateTestCase={handleUpdateTestCase}
              onAddTestCase={handleAddTestCase}
              onDeleteTestCase={handleDeleteTestCase}
              onDuplicateTestCase={handleDuplicateTestCase}
              onOpenRequirementsModal={() => setIsRequirementsModalOpen(true)}
              onOpenTemplateModal={() => setIsTemplateModalOpen(true)}
            />
          )}

          {activeTab === 'mr-analysis' && (
            <MRAnalysisCard
              suite={activeSuite}
              onOpenRequirementsModal={() => setIsRequirementsModalOpen(true)}
            />
          )}

          {activeTab === 'tester-questions' && (
            <TesterQuestionsCard
              suite={activeSuite}
              onUpdateQuestion={(updated) =>
                updateCurrentSuite((s) => ({ ...s, testerQuestions: updated }))
              }
              onOpenRequirementsModal={() => setIsRequirementsModalOpen(true)}
            />
          )}

          {activeTab === 'memory-brain' && (
            <MemoryBrainCard
              suite={activeSuite}
              allSuites={suites}
              onMergeCases={(cases) =>
                updateCurrentSuite((s) => ({ ...s, testCases: [...s.testCases, ...cases] }))
              }
              onOpenImportModal={() => setIsImportModalOpen(true)}
              onOpenRequirementsModal={() => setIsRequirementsModalOpen(true)}
            />
          )}

          {activeTab === 'traceability-matrix' && (
            <TraceabilityMatrixView
              suite={activeSuite}
              onSelectTestCase={(tc) => {
                setActiveTab('test-cases');
              }}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      {isRequirementsModalOpen && (
        <RequirementsEditorModal
          suite={activeSuite}
          modelSettings={modelSettings}
          template={activeTemplate}
          knowledgeBase={knowledgeBase}
          onGenerate={handleGenerate}
          onClose={() => setIsRequirementsModalOpen(false)}
        />
      )}

      {isImportModalOpen && (
        <ImportTestCasesModal
          onImportComplete={handleImportComplete}
          onClose={() => setIsImportModalOpen(false)}
        />
      )}

      {isExportModalOpen && (
        <ExportModal
          suite={activeSuite}
          template={activeTemplate}
          user={user}
          onClose={() => setIsExportModalOpen(false)}
        />
      )}

      {isModelSettingsOpen && (
        <ModelSettingsModal
          settings={modelSettings}
          onSave={(newSettings) => setModelSettings(newSettings)}
          onClose={() => setIsModelSettingsOpen(false)}
        />
      )}

      {isKnowledgeBaseOpen && (
        <KnowledgeBaseModal
          knowledgeBase={knowledgeBase}
          onSaveKnowledgeBase={(newDocs) => setKnowledgeBase(newDocs)}
          onClose={() => setIsKnowledgeBaseOpen(false)}
        />
      )}

      {isTemplateModalOpen && (
        <CustomTemplateModal
          templates={templates}
          activeTemplateId={activeTemplateId}
          onSelectTemplate={(id) => setActiveTemplateId(id)}
          onSaveTemplates={(newTemplates) => setTemplates(newTemplates)}
          onClose={() => setIsTemplateModalOpen(false)}
        />
      )}

      {isHistoryModalOpen && (
        <DiffTimelineModal
          suite={activeSuite}
          onRestoreVersion={handleRestoreVersion}
          onClose={() => setIsHistoryModalOpen(false)}
        />
      )}

      {isDeployConfigOpen && (
        <DeployConfigModal
          activeSuite={activeSuite}
          onClose={() => setIsDeployConfigOpen(false)}
        />
      )}
    </div>
  );
}
