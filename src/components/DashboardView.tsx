import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Eye,
  FlaskConical,
  Link2,
  Mail,
  MessageSquareWarning,
  Play,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { LIVE_DEMO_CASES } from '../data/demoAndTestCases';
import {
  DashboardStats,
  DemoCase,
  ScanResult,
} from '../types/cybernova';
import { AnalysisResultPanel } from './AnalysisResultPanel';
import { ProjectZipDriveCard } from './ProjectZipDriveCard';

interface DashboardViewProps {
  stats: DashboardStats;
  history: ScanResult[];
  isAnalyzing: boolean;
  onStartNewScan: () => void;
  onNavigate: (page: string) => void;
  onRunDemoCase: (demoCase: DemoCase) => Promise<ScanResult | null>;
  onSelectHistoryItem: (item: ScanResult) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  history,
  isAnalyzing,
  onStartNewScan,
  onNavigate,
  onRunDemoCase,
  onSelectHistoryItem,
}) => {
  const [activeDemoResult, setActiveDemoResult] = useState<ScanResult | null>(null);
  const [runningDemoId, setRunningDemoId] = useState<string | null>(null);

  const handleTestDemo = async (demo: DemoCase) => {
    setRunningDemoId(demo.id);
    const res = await onRunDemoCase(demo);
    setRunningDemoId(null);
    if (res) {
      setActiveDemoResult(res);
    }
  };

  const total = stats.totalScans;
  const lowPct = total > 0 ? Math.round((stats.lowRiskCount / total) * 100) : 0;
  const suspPct = total > 0 ? Math.round((stats.suspiciousCount / total) * 100) : 0;
  const highPct =
    total > 0 ? Math.max(0, 100 - lowPct - suspPct) : 0;

  const sortedCategories = Object.entries(stats.categoryCounts).sort(
    (a, b) => b[1] - a[1]
  );

  return (
    <div className="space-y-8">
      {/* Hero Workspace Banner */}
      <section className="bg-[#0E182B] border border-slate-800/80 rounded-xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2 text-xs text-teal-400 font-mono">
            <span>Project ID: TRI26158</span>
            <span aria-hidden="true">·</span>
            <span>Track: Open Innovation</span>
            <span aria-hidden="true">·</span>
            <span>Hybrid Heuristic + Gemini AI Engine</span>
          </div>
          <h1
            className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight"
            style={{ textWrap: 'balance' }}
          >
            AI-Powered Detection of Cybercrime and Online Scams
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Inspect suspicious SMS/WhatsApp messages, deceptive URLs, and spoofed emails using multi-signal threat correlation and explainable risk scoring. Statistics below track live scans performed in this workspace.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onStartNewScan}
            className="px-5 py-2.5 text-sm font-semibold text-slate-950 bg-teal-400 hover:bg-teal-300 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>Start New Scan</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onNavigate('url-checker')}
            className="px-4 py-2.5 text-sm font-medium text-slate-200 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Inspect URL
          </button>
        </div>
      </section>

      {/* Project ZIP Download & Google Drive Upload Card */}
      <ProjectZipDriveCard />

      {/* 4-Column Live Telemetry KPI Strip (Starts at 0, updates dynamically) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0E182B] border border-slate-800/80 rounded-xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Scans Performed</span>
            <span className="font-mono text-teal-400">Live Counter</span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold font-mono tabular-nums text-slate-100">
              {stats.totalScans}
            </span>
            <span className="text-xs text-slate-400 font-mono tabular-nums">
              Avg Score: {stats.averageRiskScore}/100
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-400 font-mono">
            <span>Msg: {stats.inputTypeCounts.message}</span>
            <span aria-hidden="true"> · </span>
            <span>URL: {stats.inputTypeCounts.url}</span>
            <span aria-hidden="true"> · </span>
            <span>Email: {stats.inputTypeCounts.email}</span>
          </div>
        </div>

        <div className="bg-[#0E182B] border border-slate-800/80 rounded-xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Safe / Low Risk</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold font-mono tabular-nums text-emerald-400">
              {stats.lowRiskCount}
            </span>
            <span className="text-xs text-slate-400 font-mono tabular-nums">
              {lowPct}% of total
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Score 0–27 · Benign or verified alerts
          </div>
        </div>

        <div className="bg-[#0E182B] border border-slate-800/80 rounded-xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Suspicious Detections</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold font-mono tabular-nums text-amber-400">
              {stats.suspiciousCount}
            </span>
            <span className="text-xs text-slate-400 font-mono tabular-nums">
              {suspPct}% of total
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Score 28–59 · Caution & verification advised
          </div>
        </div>

        <div className="bg-[#0E182B] border border-slate-800/80 rounded-xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>High-Risk Detections</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold font-mono tabular-nums text-rose-400">
              {stats.highRiskCount}
            </span>
            <span className="text-xs text-slate-400 font-mono tabular-nums">
              {highPct}% of total
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Score 60–100 · Multi-signal scam indicators
          </div>
        </div>
      </section>

      {/* Risk Distribution Chart & Common Scam Categories */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Risk Distribution Visual Chart */}
        <div className="lg:col-span-6 bg-[#0E182B] border border-slate-800/80 rounded-xl p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-100">
                Risk Distribution Analysis
              </h2>
              <span className="text-xs font-mono text-slate-400 tabular-nums">
                {total} Scan{total === 1 ? '' : 's'} Recorded
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Proportional breakdown of evaluated inputs across Low Risk, Suspicious, and High Risk classifications.
            </p>
          </div>

          {total === 0 ? (
            <div className="py-8 px-4 bg-[#070D19] border border-slate-800/80 rounded-lg text-center space-y-3">
              <p className="text-sm text-slate-300 font-medium">
                Zero scans performed yet
              </p>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                All dashboard counters start at zero using real application state. Click any of the 6 Live Demo Cases below or start a custom scan to watch the risk distribution update in real time.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Stacked Horizontal Bar */}
              <div className="w-full h-5 bg-[#070D19] rounded-lg overflow-hidden flex border border-slate-800">
                {stats.lowRiskCount > 0 && (
                  <div
                    style={{ width: `${lowPct}%` }}
                    className="bg-emerald-500 h-full transition-all duration-200"
                    title={`Low Risk: ${stats.lowRiskCount} (${lowPct}%)`}
                  />
                )}
                {stats.suspiciousCount > 0 && (
                  <div
                    style={{ width: `${suspPct}%` }}
                    className="bg-amber-500 h-full transition-all duration-200"
                    title={`Suspicious: ${stats.suspiciousCount} (${suspPct}%)`}
                  />
                )}
                {stats.highRiskCount > 0 && (
                  <div
                    style={{ width: `${highPct}%` }}
                    className="bg-rose-500 h-full transition-all duration-200"
                    title={`High Risk: ${stats.highRiskCount} (${highPct}%)`}
                  />
                )}
              </div>

              {/* Individual Metric Bars */}
              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <div className="flex justify-between font-mono tabular-nums">
                    <span className="text-emerald-400 font-medium">
                      Low Risk (0–27)
                    </span>
                    <span className="text-slate-300">
                      {stats.lowRiskCount} scans · {lowPct}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#070D19] rounded overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full"
                      style={{ width: `${lowPct}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between font-mono tabular-nums">
                    <span className="text-amber-400 font-medium">
                      Suspicious (28–59)
                    </span>
                    <span className="text-slate-300">
                      {stats.suspiciousCount} scans · {suspPct}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#070D19] rounded overflow-hidden">
                    <div
                      className="bg-amber-500 h-full"
                      style={{ width: `${suspPct}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between font-mono tabular-nums">
                    <span className="text-rose-400 font-medium">
                      High Risk (60–100)
                    </span>
                    <span className="text-slate-300">
                      {stats.highRiskCount} scans · {highPct}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#070D19] rounded overflow-hidden">
                    <div
                      className="bg-rose-500 h-full"
                      style={{ width: `${highPct}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Scoring Thresholds: Low (0–27) · Suspicious (28–59) · High (60–100)</span>
          </div>
        </div>

        {/* Common Scam Categories Breakdown */}
        <div className="lg:col-span-6 bg-[#0E182B] border border-slate-800/80 rounded-xl p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-100">
                Detected Scam Categories
              </h2>
              <span className="text-xs font-mono text-teal-400">
                Taxonomy Breakdown
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Primary threat classifications identified across completed inspections.
            </p>
          </div>

          {sortedCategories.length === 0 ? (
            <div className="space-y-2.5 text-xs">
              <div className="text-slate-400 pb-1">
                Active Threat Categories Monitored by Engine (0 scans logged so far):
              </div>
              {[
                'Bank & KYC Fraud (OTP / PAN Suspension)',
                'Phishing & Credential Harvesting (Lookalike Domains)',
                'Delivery & Logistics Scam (India Post / Courier Fees)',
                'Recruitment & Job Scam (Prepaid Tasks / Registration Deposit)',
                'Investment & Crypto Fraud (Guaranteed VIP Returns)',
                'Tech Support & Remote Access (AnyDesk / APK Sideloading)',
              ].map((cat, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-1.5 border-b border-slate-800/60 text-slate-300"
                >
                  <span>{cat}</span>
                  <span className="font-mono tabular-nums text-slate-500">0</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {sortedCategories.slice(0, 6).map(([category, count]) => {
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                const isBenign = category === 'Benign / Legitimate Communication';
                return (
                  <div key={category} className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-200 font-medium">{category}</span>
                      <span className="font-mono tabular-nums text-slate-400">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[#070D19] rounded overflow-hidden">
                      <div
                        className={`h-full ${
                          isBenign ? 'bg-emerald-500/80' : 'bg-teal-400'
                        }`}
                        style={{ width: `${Math.max(4, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Multi-signal correlation prevents single-keyword false alarms</span>
          </div>
        </div>
      </section>

      {/* Dedicated Live Demonstration Mode ("Try Demo Cases A – F") */}
      <section className="bg-[#0E182B] border border-slate-800/80 rounded-xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800/80 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-teal-400 font-mono">
              <FlaskConical className="w-4 h-4" />
              <span>Interactive Presentation & Faculty Evaluation Sandbox</span>
            </div>
            <h2 className="text-lg font-bold text-slate-100">
              Try Live Demonstration Cases (Examples A – F)
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            Note: Curated demonstration cases — not live threat-intelligence feeds
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {LIVE_DEMO_CASES.map((demo) => {
            const isExpectedHigh = demo.expectedClassification === 'High Risk';
            const isRunningThis = runningDemoId === demo.id;

            return (
              <div
                key={demo.id}
                className="bg-[#070D19] border border-slate-800/90 hover:border-slate-700 rounded-lg p-4 flex flex-col justify-between gap-4 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-teal-400 font-semibold">
                      {demo.code} · {demo.channel}
                    </span>
                    <span
                      className={
                        isExpectedHigh ? 'text-rose-400' : 'text-emerald-400'
                      }
                    >
                      Expected: {demo.expectedClassification}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-slate-100">
                    {demo.title}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-3 font-mono bg-[#0E182B] p-2.5 rounded border border-slate-800/80">
                    "{demo.payload.text}"
                  </p>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    {demo.teachingPoint}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={isAnalyzing}
                  onClick={() => handleTestDemo(demo)}
                  className="w-full py-2 px-3 text-xs font-semibold text-slate-950 bg-teal-400 hover:bg-teal-300 disabled:opacity-50 rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>
                    {isRunningThis ? 'Analyzing Demo Case...' : 'Test This Example'}
                  </span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Inline Live Result Display when a Demo Case is clicked */}
        {activeDemoResult && (
          <div className="pt-4 border-t border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider">
                Live Demo Analysis Output
              </span>
              <button
                type="button"
                onClick={() => setActiveDemoResult(null)}
                className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                Dismiss Output
              </button>
            </div>
            <AnalysisResultPanel
              result={activeDemoResult}
              onReset={() => setActiveDemoResult(null)}
            />
          </div>
        )}
      </section>

      {/* Recent Scan History Table */}
      <section className="bg-[#0E182B] border border-slate-800/80 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-100">
              Recent Scan History
            </h2>
            <p className="text-xs text-slate-400">
              Latest evaluations performed in this workspace. Click any row to inspect the full forensic report.
            </p>
          </div>
          {history.length > 0 && (
            <button
              type="button"
              onClick={() => onNavigate('history')}
              className="text-xs font-medium text-teal-400 hover:text-teal-300 flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>View All ({history.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="py-10 px-4 bg-[#070D19] border border-slate-800/80 rounded-lg text-center space-y-3">
            <p className="text-sm text-slate-300 font-medium">
              No scan history recorded yet
            </p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Run your first message, URL, or email check—or click "Test This Example" on any demo case above—to populate the forensic log.
            </p>
            <button
              type="button"
              onClick={onStartNewScan}
              className="mt-1 px-4 py-2 text-xs font-semibold text-slate-950 bg-teal-400 hover:bg-teal-300 rounded-lg transition-colors cursor-pointer"
            >
              Run First Scan
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-800/80 rounded-lg">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-[#070D19] text-slate-400 font-medium">
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Input Excerpt</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Score</th>
                  <th className="py-3 px-4">Classification</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 bg-[#070D19]/60">
                {history.slice(0, 6).map((item) => {
                  const isHigh = item.classification === 'High Risk';
                  const isSusp = item.classification === 'Suspicious';
                  const colorClass = isHigh
                    ? 'text-rose-400'
                    : isSusp
                    ? 'text-amber-400'
                    : 'text-emerald-400';

                  return (
                    <tr
                      key={item.id}
                      onClick={() => onSelectHistoryItem(item)}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4 font-mono tabular-nums text-slate-400 whitespace-nowrap">
                        {new Date(item.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-300 capitalize">
                        {item.inputType}
                        {item.isDemoCase ? ' · Demo' : ''}
                      </td>
                      <td className="py-3 px-4 text-slate-200 max-w-xs truncate font-mono">
                        {item.rawInputSummary}
                      </td>
                      <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                        {item.primaryCategory}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-mono tabular-nums font-bold ${colorClass}`}
                      >
                        {item.riskScore}/100
                      </td>
                      <td className={`py-3 px-4 font-semibold whitespace-nowrap ${colorClass}`}>
                        {item.classification}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectHistoryItem(item);
                          }}
                          className="text-teal-400 hover:text-teal-300 inline-flex items-center gap-1 font-medium cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* "How It Works" Detection Pipeline Section */}
      <section className="bg-[#0E182B] border border-slate-800/80 rounded-xl p-6 space-y-5">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-slate-100">
            How the Cybernova Detection Pipeline Works
          </h2>
          <p className="text-xs text-slate-400">
            Four-stage explainable architecture combining deterministic cybersecurity heuristics with LLM semantic analysis.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-[#070D19] border border-slate-800/80 rounded-lg space-y-2">
            <div className="text-xs font-mono text-teal-400 font-semibold">
              01. Sanitization & Parsing
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Extracts embedded URLs, normalizes leetspeak homoglyphs (`paypa1` → `paypal`), and parses email sender headers without executing or visiting untrusted payloads.
            </p>
          </div>

          <div className="p-4 bg-[#070D19] border border-slate-800/80 rounded-lg space-y-2">
            <div className="text-xs font-mono text-teal-400 font-semibold">
              02. Multi-Signal Heuristics
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Evaluates 10+ threat dimensions (urgency, OTP harvesting, KYC threats, upfront fee traps, remote APK requests) plus protective context dampeners to prevent single-word false alarms.
            </p>
          </div>

          <div className="p-4 bg-[#070D19] border border-slate-800/80 rounded-lg space-y-2">
            <div className="text-xs font-mono text-teal-400 font-semibold">
              03. Domain & URL Forensics
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Inspects registrable root domains vs. deceptive subdomains, flags raw IPs, Punycode (`xn--`), URL shorteners, high-abuse TLDs (`.xyz`, `.top`), and calculates Shannon entropy.
            </p>
          </div>

          <div className="p-4 bg-[#070D19] border border-slate-800/80 rounded-lg space-y-2">
            <div className="text-xs font-mono text-teal-400 font-semibold">
              04. Explainable Verdict
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Synthesizes heuristic weights with server-side Gemini AI semantic analysis to highlight exact suspicious phrases and generate actionable safety steps.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
