import React, { useState } from 'react';
import {
  Folder,
  FolderOpen,
  FileText,
  Search,
  Plus,
  ChevronRight,
  ChevronDown,
  Layers,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { TestSuite } from '../types';

interface SidebarTreeProps {
  suites: TestSuite[];
  activeSuiteId: string;
  onSelectSuite: (id: string) => void;
  onNewSuite: () => void;
  onDeleteSuite: (id: string) => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const SidebarTree: React.FC<SidebarTreeProps> = ({
  suites,
  activeSuiteId,
  onSelectSuite,
  onNewSuite,
  onDeleteSuite,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});

  const toggleModule = (modName: string) => {
    setOpenModules((prev) => ({
      ...prev,
      [modName]: prev[modName] === false ? true : false,
    }));
  };

  // Group suites by module
  const modulesMap = suites.reduce((acc, suite) => {
    const mod = suite.module || 'General';
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(suite);
    return acc;
  }, {} as Record<string, TestSuite[]>);

  const filteredModules = Object.entries(modulesMap).filter(([mod, items]) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      mod.toLowerCase().includes(query) ||
      items.some(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.scenarioTitle.toLowerCase().includes(query)
      )
    );
  });

  const content = (
    <div className="flex flex-col h-full bg-[#0c0f17] border-r border-[#1a202c] select-none text-slate-300">
      {/* Sidebar Header */}
      <div className="p-3.5 border-b border-[#1a202c]">
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-xs font-bold text-slate-200 tracking-wider uppercase flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            Test management
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={onNewSuite}
              title="Create New Test Scenario / Suite"
              className="p-1 rounded-md bg-[#161c28] hover:bg-[#1f2638] text-indigo-400 border border-[#252f44] transition flex items-center gap-1 text-[11px] px-2 font-medium"
            >
              <Plus className="w-3 h-3" />
              <span>New</span>
            </button>
            {onCloseMobile && (
              <button
                onClick={onCloseMobile}
                className="lg:hidden p-1 rounded-md text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search scenarios or modules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#121622] border border-[#1e2638] rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>
      </div>

      {/* Tree Hierarchy */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 text-xs">
        {filteredModules.length === 0 ? (
          <div className="p-4 text-center text-slate-500 text-xs">
            No scenarios found matching "{searchQuery}"
          </div>
        ) : (
          filteredModules.map(([modName, items]) => {
            const isOpen = openModules[modName] !== false;
            return (
              <div key={modName} className="space-y-0.5">
                {/* Module Folder Row */}
                <button
                  onClick={() => toggleModule(modName)}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-[#141824] text-slate-400 hover:text-slate-200 font-semibold transition group"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    {isOpen ? (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300" />
                    )}
                    {isOpen ? (
                      <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
                    ) : (
                      <Folder className="w-3.5 h-3.5 text-indigo-400/70" />
                    )}
                    <span className="truncate">{modName}</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#161c28] text-slate-400 border border-[#222c40]">
                    {items.length}
                  </span>
                </button>

                {/* Scenarios under Module */}
                {isOpen && (
                  <div className="ml-3 pl-2.5 border-l border-[#1a202c] space-y-1 py-0.5">
                    {items.map((suite) => {
                      const isActive = suite.id === activeSuiteId;
                      const passedCount = suite.testCases.filter((c) => c.status === 'passed').length;
                      const failedCount = suite.testCases.filter((c) => c.status === 'failed').length;

                      return (
                        <div
                          key={suite.id}
                          className={`group/item flex items-center justify-between rounded-lg p-2 transition cursor-pointer border ${
                            isActive
                              ? 'bg-[#151b29] text-white border-indigo-500/50 shadow-sm'
                              : 'text-slate-300 hover:bg-[#121622] border-transparent hover:border-[#1e2638]'
                          }`}
                          onClick={() => {
                            onSelectSuite(suite.id);
                            if (onCloseMobile) onCloseMobile();
                          }}
                        >
                          <div className="flex items-start gap-2 min-w-0 pr-1">
                            <FileText
                              className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                                isActive ? 'text-indigo-400' : 'text-slate-500 group-hover/item:text-slate-300'
                              }`}
                            />
                            <div className="min-w-0">
                              <div
                                className={`text-xs font-medium leading-snug line-clamp-2 ${
                                  isActive ? 'text-white font-semibold' : 'text-slate-300'
                                }`}
                                title={suite.scenarioTitle || suite.name}
                              >
                                {suite.scenarioTitle || suite.name}
                              </div>
                              <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                                <span>{suite.testCases.length} cases</span>
                                <span className="text-slate-600">•</span>
                                <span className="flex items-center gap-0.5 text-emerald-400">
                                  <CheckCircle className="w-2.5 h-2.5" />
                                  {passedCount}
                                </span>
                                {failedCount > 0 && (
                                  <span className="flex items-center gap-0.5 text-rose-400">
                                    <XCircle className="w-2.5 h-2.5" />
                                    {failedCount}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Delete suite button */}
                          {suites.length > 1 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Delete test suite "${suite.name}"?`)) {
                                  onDeleteSuite(suite.id);
                                }
                              }}
                              title="Delete suite"
                              className="opacity-0 group-hover/item:opacity-100 p-1 hover:text-rose-400 text-slate-500 rounded transition"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer System Status */}
      <div className="p-3 border-t border-[#1a202c] bg-[#090c12] text-[11px] text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>Engine Active</span>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">v1.0 RTCM</span>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside className="hidden lg:flex w-72 h-[calc(100vh-53px)] shrink-0">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onCloseMobile}
          ></div>
          <div className="relative w-80 max-w-[85vw] h-full shadow-2xl z-10">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
