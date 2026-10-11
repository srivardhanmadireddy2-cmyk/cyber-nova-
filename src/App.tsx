/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  History,
  Info,
  LayoutDashboard,
  Link2,
  Mail,
  Menu,
  MessageSquareWarning,
  PlusCircle,
  X,
} from 'lucide-react';
import { AboutProjectView } from './components/AboutProjectView';
import { DashboardView } from './components/DashboardView';
import { EmailAnalyzerView } from './components/EmailAnalyzerView';
import { HistoryView } from './components/HistoryView';
import { SafetyTipsView } from './components/SafetyTipsView';
import { ScamDetectorView } from './components/ScamDetectorView';
import { UrlCheckerView } from './components/UrlCheckerView';
import {
  analyzeEmailInput,
  analyzeMessageInput,
  analyzeUrlInput,
} from './engine/detectionEngine';
import {
  DashboardStats,
  DemoCase,
  MessageChannel,
  ScanResult,
  TestCaseSpec,
} from './types/cybernova';

type PageId =
  | 'dashboard'
  | 'scam-detector'
  | 'url-checker'
  | 'email-analyzer'
  | 'history'
  | 'safety-tips'
  | 'about';

const LOCAL_STORAGE_KEY = 'cybernova_tri26158_scan_history_v1';

const NAV_ITEMS: { id: PageId; label: string; shortLabel: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Dashboard', shortLabel: 'Dashboard', icon: LayoutDashboard },
  { id: 'scam-detector', label: 'Scam Detector', shortLabel: 'Scam Detector', icon: MessageSquareWarning },
  { id: 'url-checker', label: 'URL & Phishing Checker', shortLabel: 'URL Checker', icon: Link2 },
  { id: 'email-analyzer', label: 'Email & Message Analyzer', shortLabel: 'Email Analyzer', icon: Mail },
  { id: 'history', label: 'Detection History', shortLabel: 'History', icon: History },
  { id: 'safety-tips', label: 'Cyber Safety Tips', shortLabel: 'Safety Tips', icon: BookOpen },
  { id: 'about', label: 'About the Project', shortLabel: 'About Project', icon: Info },
];

export default function App() {
  const [activePage, setActivePage] = useState<PageId>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [history, setHistory] = useState<ScanResult[]>([]);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<ScanResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Load initial scan history from backend (or localStorage fallback)
  useEffect(() => {
    let mounted = true;
    async function loadHistory() {
      try {
        const res = await fetch('/api/history');
        if (res.ok) {
          const data = await res.json();
          if (mounted && Array.isArray(data.scans)) {
            setHistory(data.scans);
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data.scans));
            return;
          }
        }
      } catch {
        // Fallback to localStorage if offline
      }
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved && mounted) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setHistory(parsed);
          }
        }
      } catch {
        // Ignore storage errors
      }
    }
    loadHistory();
    return () => {
      mounted = false;
    };
  }, []);

  const recordScanResult = useCallback((newResult: ScanResult) => {
    setHistory((prev) => {
      const updated = [newResult, ...prev.filter((item) => item.id !== newResult.id)].slice(
        0,
        250
      );
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore quota errors
      }
      return updated;
    });
  }, []);

  // 1. Analyze Message Handler
  const handleAnalyzeMessage = useCallback(
    async (params: {
      text: string;
      channel: MessageChannel;
      isDemoCase?: boolean;
      demoCaseId?: string;
    }): Promise<ScanResult | null> => {
      setIsAnalyzing(true);
      try {
        const response = await fetch('/api/analyze/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        });
        if (response.ok) {
          const data = await response.json();
          if (data.result) {
            recordScanResult(data.result);
            return data.result;
          }
        }
      } catch {
        // Fallback to client-side deterministic engine if server is unreachable
      } finally {
        setIsAnalyzing(false);
      }

      const fallback = analyzeMessageInput(params);
      recordScanResult(fallback);
      return fallback;
    },
    [recordScanResult]
  );

  // 2. Analyze URL Handler
  const handleAnalyzeUrl = useCallback(
    async (params: {
      url: string;
      isDemoCase?: boolean;
      demoCaseId?: string;
    }): Promise<ScanResult | null> => {
      setIsAnalyzing(true);
      try {
        const response = await fetch('/api/analyze/url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        });
        if (response.ok) {
          const data = await response.json();
          if (data.result) {
            recordScanResult(data.result);
            return data.result;
          }
        }
      } catch {
        // Fallback to client-side deterministic engine
      } finally {
        setIsAnalyzing(false);
      }

      const fallback = analyzeUrlInput(params);
      recordScanResult(fallback);
      return fallback;
    },
    [recordScanResult]
  );

  // 3. Analyze Email Handler
  const handleAnalyzeEmail = useCallback(
    async (params: {
      sender: string;
      replyTo?: string;
      subject: string;
      body: string;
      isDemoCase?: boolean;
      demoCaseId?: string;
    }): Promise<ScanResult | null> => {
      setIsAnalyzing(true);
      try {
        const response = await fetch('/api/analyze/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        });
        if (response.ok) {
          const data = await response.json();
          if (data.result) {
            recordScanResult(data.result);
            return data.result;
          }
        }
      } catch {
        // Fallback to client-side deterministic engine
      } finally {
        setIsAnalyzing(false);
      }

      const fallback = analyzeEmailInput(params);
      recordScanResult(fallback);
      return fallback;
    },
    [recordScanResult]
  );

  // 4. Run Demo Case Handler
  const handleRunDemoCase = useCallback(
    async (demo: DemoCase): Promise<ScanResult | null> => {
      if (demo.inputType === 'url' && demo.payload.url) {
        return handleAnalyzeUrl({
          url: demo.payload.url,
          isDemoCase: true,
          demoCaseId: demo.code,
        });
      }
      if (demo.inputType === 'email' && demo.payload.body) {
        return handleAnalyzeEmail({
          sender: demo.payload.sender || 'unknown@sender.org',
          replyTo: demo.payload.replyTo,
          subject: demo.payload.subject || '(No Subject)',
          body: demo.payload.body,
          isDemoCase: true,
          demoCaseId: demo.code,
        });
      }
      return handleAnalyzeMessage({
        text: demo.payload.text || '',
        channel: demo.channel || 'SMS',
        isDemoCase: true,
        demoCaseId: demo.code,
      });
    },
    [handleAnalyzeEmail, handleAnalyzeMessage, handleAnalyzeUrl]
  );

  // 5. Run Test Case Spec Handler (from About the Project page)
  const handleExecuteTestCase = useCallback(
    async (tc: TestCaseSpec): Promise<ScanResult | null> => {
      if (tc.inputType === 'url' && tc.payload.url) {
        return handleAnalyzeUrl({
          url: tc.payload.url,
          isDemoCase: true,
          demoCaseId: tc.id,
        });
      }
      if (tc.inputType === 'email' && tc.payload.body) {
        return handleAnalyzeEmail({
          sender: tc.payload.sender || 'unknown@sender.org',
          replyTo: tc.payload.replyTo,
          subject: tc.payload.subject || '(No Subject)',
          body: tc.payload.body,
          isDemoCase: true,
          demoCaseId: tc.id,
        });
      }
      return handleAnalyzeMessage({
        text: tc.payload.text || '',
        channel: tc.channel || 'SMS',
        isDemoCase: true,
        demoCaseId: tc.id,
      });
    },
    [handleAnalyzeEmail, handleAnalyzeMessage, handleAnalyzeUrl]
  );

  // 6. Delete Single History Record
  const handleDeleteHistoryItem = useCallback(
    async (id: string) => {
      setHistory((prev) => {
        const updated = prev.filter((item) => item.id !== id);
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
        } catch {
          // Ignore
        }
        return updated;
      });
      if (selectedHistoryItem?.id === id) {
        setSelectedHistoryItem(null);
      }
      try {
        await fetch(`/api/history/${encodeURIComponent(id)}`, { method: 'DELETE' });
      } catch {
        // Ignore network error
      }
    },
    [selectedHistoryItem]
  );

  // 7. Clear All History
  const handleClearAllHistory = useCallback(async () => {
    setHistory([]);
    setSelectedHistoryItem(null);
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      await fetch('/api/history', { method: 'DELETE' });
    } catch {
      // Ignore
    }
  }, []);

  // Compute Live Dashboard Statistics from Actual Application State
  const dashboardStats = useMemo<DashboardStats>(() => {
    const totalScans = history.length;
    let lowRiskCount = 0;
    let suspiciousCount = 0;
    let highRiskCount = 0;
    let scoreSum = 0;
    const categoryCounts: Record<string, number> = {};
    const inputTypeCounts = { message: 0, url: 0, email: 0 };

    for (const item of history) {
      scoreSum += item.riskScore;
      if (item.classification === 'Low Risk') lowRiskCount++;
      else if (item.classification === 'Suspicious') suspiciousCount++;
      else if (item.classification === 'High Risk') highRiskCount++;

      categoryCounts[item.primaryCategory] =
        (categoryCounts[item.primaryCategory] || 0) + 1;

      if (item.inputType === 'message') inputTypeCounts.message++;
      else if (item.inputType === 'url') inputTypeCounts.url++;
      else if (item.inputType === 'email') inputTypeCounts.email++;
    }

    const averageRiskScore =
      totalScans > 0 ? Math.round(scoreSum / totalScans) : 0;

    return {
      totalScans,
      lowRiskCount,
      suspiciousCount,
      highRiskCount,
      averageRiskScore,
      categoryCounts,
      inputTypeCounts,
    };
  }, [history]);

  const navigateTo = (page: PageId) => {
    setActivePage(page);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#070D19] text-slate-100 flex flex-col">
      {/* Top Bar Contract: Strictly 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-30 bg-[#070D19]/95 backdrop-blur border-b border-slate-800/80 px-6 py-3.5 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#dashboard"
          onClick={(e) => {
            e.preventDefault();
            navigateTo('dashboard');
          }}
          className="text-xl font-bold tracking-tight text-teal-400 font-display whitespace-nowrap shrink-0"
        >
          Cybernova
        </a>

        {/* Zone 2: 5 concise single-line text navigation links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-300">
          <a
            href="#dashboard"
            onClick={(e) => {
              e.preventDefault();
              navigateTo('dashboard');
            }}
            className={`hover:text-teal-300 transition-colors whitespace-nowrap shrink-0 ${
              activePage === 'dashboard' ? 'text-teal-400 underline underline-offset-8' : ''
            }`}
          >
            Dashboard
          </a>
          <a
            href="#scam-detector"
            onClick={(e) => {
              e.preventDefault();
              navigateTo('scam-detector');
            }}
            className={`hover:text-teal-300 transition-colors whitespace-nowrap shrink-0 ${
              activePage === 'scam-detector' ? 'text-teal-400 underline underline-offset-8' : ''
            }`}
          >
            Scam Detector
          </a>
          <a
            href="#url-checker"
            onClick={(e) => {
              e.preventDefault();
              navigateTo('url-checker');
            }}
            className={`hover:text-teal-300 transition-colors whitespace-nowrap shrink-0 ${
              activePage === 'url-checker' ? 'text-teal-400 underline underline-offset-8' : ''
            }`}
          >
            URL Checker
          </a>
          <a
            href="#email-analyzer"
            onClick={(e) => {
              e.preventDefault();
              navigateTo('email-analyzer');
            }}
            className={`hover:text-teal-300 transition-colors whitespace-nowrap shrink-0 ${
              activePage === 'email-analyzer' ? 'text-teal-400 underline underline-offset-8' : ''
            }`}
          >
            Email Analyzer
          </a>
          <a
            href="#history"
            onClick={(e) => {
              e.preventDefault();
              navigateTo('history');
            }}
            className={`hover:text-teal-300 transition-colors whitespace-nowrap shrink-0 ${
              activePage === 'history' ? 'text-teal-400 underline underline-offset-8' : ''
            }`}
          >
            History ({history.length})
          </a>
        </nav>

        {/* Zone 3: 1 primary action (plus mobile menu toggle on small screens) */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => navigateTo('scam-detector')}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-teal-400 hover:bg-teal-300 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Start New Scan</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle Navigation Menu"
            className="lg:hidden p-2 text-slate-300 hover:text-white bg-slate-800/80 rounded-lg border border-slate-700 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#0E182B] border-b border-slate-800 px-6 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigateTo(item.id)}
                className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-teal-500/15 text-teal-300 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 text-teal-400" />
                  <span>{item.label}</span>
                </span>
                {item.id === 'history' && (
                  <span className="font-mono tabular-nums text-slate-400">
                    {history.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Workspace Layout: Sidebar + Main Viewport */}
      <div className="flex-1 flex">
        {/* Desktop Sidebar Navigation (260px width) */}
        <aside className="hidden lg:flex w-64 shrink-0 bg-[#0A1222] border-r border-slate-800/80 flex-col justify-between p-5">
          <div className="space-y-6">
            <div className="space-y-1 px-2">
              <div className="text-xs font-mono text-teal-400">
                Project ID: TRI26158
              </div>
              <div className="text-xs text-slate-400">
                Track: Open Innovation
              </div>
            </div>

            <nav className="space-y-1" aria-label="Sidebar Navigation">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigateTo(item.id)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-teal-400/15 text-teal-300 border border-teal-500/30 font-semibold'
                        : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800/50 border border-transparent'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-teal-400' : 'text-slate-400'
                        }`}
                      />
                      <span>{item.label}</span>
                    </span>
                    {item.id === 'history' && (
                      <span className="font-mono tabular-nums text-xs text-slate-400">
                        {history.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Quiet Sidebar Footer Metadata */}
          <div className="p-3.5 bg-[#070D19] border border-slate-800/80 rounded-lg space-y-2 text-xs text-slate-400">
            <div className="font-semibold text-slate-200">
              Live Session Summary
            </div>
            <div className="flex justify-between font-mono tabular-nums">
              <span>Scans Run:</span>
              <span className="text-slate-200">{dashboardStats.totalScans}</span>
            </div>
            <div className="flex justify-between font-mono tabular-nums">
              <span>High Risk:</span>
              <span className="text-rose-400">{dashboardStats.highRiskCount}</span>
            </div>
            <div className="flex justify-between font-mono tabular-nums">
              <span>Safe / Low:</span>
              <span className="text-emerald-400">{dashboardStats.lowRiskCount}</span>
            </div>
          </div>
        </aside>

        {/* Main Content Viewport */}
        <main className="flex-1 min-w-0 p-6 sm:p-8 lg:p-10 max-w-7xl mx-auto w-full">
          {activePage === 'dashboard' && (
            <DashboardView
              stats={dashboardStats}
              history={history}
              isAnalyzing={isAnalyzing}
              onStartNewScan={() => navigateTo('scam-detector')}
              onNavigate={(page) => navigateTo(page as PageId)}
              onRunDemoCase={handleRunDemoCase}
              onSelectHistoryItem={(item) => {
                setSelectedHistoryItem(item);
                navigateTo('history');
              }}
            />
          )}

          {activePage === 'scam-detector' && (
            <ScamDetectorView
              onAnalyzeMessage={handleAnalyzeMessage}
              isAnalyzing={isAnalyzing}
            />
          )}

          {activePage === 'url-checker' && (
            <UrlCheckerView
              onAnalyzeUrl={handleAnalyzeUrl}
              isAnalyzing={isAnalyzing}
            />
          )}

          {activePage === 'email-analyzer' && (
            <EmailAnalyzerView
              onAnalyzeEmail={handleAnalyzeEmail}
              isAnalyzing={isAnalyzing}
            />
          )}

          {activePage === 'history' && (
            <HistoryView
              history={history}
              selectedItem={selectedHistoryItem}
              onSelectItem={setSelectedHistoryItem}
              onDeleteItem={handleDeleteHistoryItem}
              onClearAll={handleClearAllHistory}
              onStartNewScan={() => navigateTo('scam-detector')}
            />
          )}

          {activePage === 'safety-tips' && <SafetyTipsView />}

          {activePage === 'about' && (
            <AboutProjectView
              onExecuteTestCase={handleExecuteTestCase}
              isAnalyzing={isAnalyzing}
            />
          )}
        </main>
      </div>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-800/80 bg-[#070D19] px-6 py-4 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          Cybernova · Project ID: TRI26158 · Track: Open Innovation · AI-Powered Detection of Cybercrime and Online Scams
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigateTo('safety-tips')}
            className="hover:text-teal-300 transition-colors cursor-pointer"
          >
            Safety Playbook
          </button>
          <span aria-hidden="true">·</span>
          <button
            type="button"
            onClick={() => navigateTo('about')}
            className="hover:text-teal-300 transition-colors cursor-pointer"
          >
            Test Cases & Judge Pitch
          </button>
        </div>
      </footer>
    </div>
  );
}
