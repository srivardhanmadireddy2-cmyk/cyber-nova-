import React, { useState } from 'react';
import {
  CheckCircle2,
  Code2,
  Cpu,
  FlaskConical,
  Mic,
  Play,
  Terminal,
} from 'lucide-react';
import { VERIFIED_TEST_CASES } from '../data/demoAndTestCases';
import { ScanResult, TestCaseSpec } from '../types/cybernova';
import { AnalysisResultPanel } from './AnalysisResultPanel';
import { ProjectZipDriveCard } from './ProjectZipDriveCard';

interface AboutProjectViewProps {
  onExecuteTestCase: (tc: TestCaseSpec) => Promise<ScanResult | null>;
  isAnalyzing: boolean;
}

export const AboutProjectView: React.FC<AboutProjectViewProps> = ({
  onExecuteTestCase,
  isAnalyzing,
}) => {
  const [testResultsMap, setTestResultsMap] = useState<Record<string, ScanResult>>({});
  const [selectedTestResult, setSelectedTestResult] = useState<ScanResult | null>(null);
  const [runningTcId, setRunningTcId] = useState<string | null>(null);
  const [isRunningBatch, setIsRunningBatch] = useState(false);

  const handleRunSingleTest = async (tc: TestCaseSpec) => {
    setRunningTcId(tc.id);
    const res = await onExecuteTestCase(tc);
    setRunningTcId(null);
    if (res) {
      setTestResultsMap((prev) => ({ ...prev, [tc.id]: res }));
      setSelectedTestResult(res);
    }
  };

  const handleRunAllTests = async () => {
    setIsRunningBatch(true);
    for (const tc of VERIFIED_TEST_CASES) {
      setRunningTcId(tc.id);
      const res = await onExecuteTestCase(tc);
      if (res) {
        setTestResultsMap((prev) => ({ ...prev, [tc.id]: res }));
      }
    }
    setRunningTcId(null);
    setIsRunningBatch(false);
  };

  return (
    <div className="space-y-8">
      {/* Project Header Banner */}
      <section className="bg-[#0E182B] border border-slate-800/80 rounded-xl p-6 sm:p-8 space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-teal-400">
          <span>Project Name: Cybernova</span>
          <span aria-hidden="true">·</span>
          <span>Project ID: TRI26158</span>
          <span aria-hidden="true">·</span>
          <span>Track: Open Innovation</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
          About Cybernova: AI-Powered Detection of Cybercrime & Online Scams
        </h1>

        <p className="text-sm text-slate-300 leading-relaxed max-w-4xl">
          Cybernova is an interactive, explainable cybersecurity decision-support platform built to combat SMS/WhatsApp smishing, deceptive phishing URLs, spoofed emails, and UPI/online financial scams. Rather than operating as an opaque "black box," Cybernova highlights the exact phrases and domain anomalies that triggered an alert and explains what the user should do next.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-3 border-t border-slate-800/80 text-xs">
          <div>
            <div className="text-slate-500">Frontend Stack</div>
            <div className="text-slate-200 font-semibold mt-0.5">
              React 19 + TypeScript + Tailwind CSS
            </div>
          </div>
          <div>
            <div className="text-slate-500">Backend & Persistence</div>
            <div className="text-slate-200 font-semibold mt-0.5">
              Node.js Express API + Persistent JSON/Local Store
            </div>
          </div>
          <div>
            <div className="text-slate-500">AI & Heuristic Engine</div>
            <div className="text-slate-200 font-semibold mt-0.5">
              Multi-Signal Rule Engine + Server-Side Gemini AI
            </div>
          </div>
          <div>
            <div className="text-slate-500">Core Inspection Modes</div>
            <div className="text-slate-200 font-semibold mt-0.5">
              Messages · Non-Visiting URLs · Email Headers
            </div>
          </div>
        </div>
      </section>

      {/* Project ZIP Download & Google Drive Upload Card */}
      <ProjectZipDriveCard />

      {/* Two-Minute Judge Presentation Script */}
      <section className="bg-[#0E182B] border border-slate-800/80 rounded-xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-teal-400">
              <Mic className="w-4 h-4" />
              <span>Faculty & Judge Demonstration Guide</span>
            </div>
            <h2 className="text-lg font-bold text-slate-100">
              Two-Minute Presentation Script for Judges
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Estimated Speaking Time: 120 Seconds
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-[#070D19] border border-slate-800/80 rounded-lg space-y-2">
            <div className="font-mono text-teal-400 font-semibold">
              00:00 – 00:30 · Problem & Hook
            </div>
            <p className="text-slate-200 leading-relaxed">
              "Good morning/afternoon respected judges. We are presenting <strong>Cybernova (Project ID: TRI26158)</strong> under the <strong>Open Innovation</strong> track. Today, online fraud has evolved beyond simple spam: attackers use HTTPS-enabled lookalike domains, fake bank KYC threats, and UPI collect requests that trick citizens in seconds. Traditional spam filters simply block or allow without teaching the user why. Cybernova solves this with an explainable, multi-signal AI and heuristic detection platform."
            </p>
          </div>

          <div className="p-4 bg-[#070D19] border border-slate-800/80 rounded-lg space-y-2">
            <div className="font-mono text-teal-400 font-semibold">
              00:30 – 01:05 · Live Multi-Signal Demonstration
            </div>
            <p className="text-slate-200 leading-relaxed">
              "Look at our live Dashboard—all counters start at zero using real application state. When I click <strong>Case A (Fake Bank KYC)</strong>, Cybernova does not rely on a single keyword. It correlates four independent signals: brand impersonation, a 24-hour suspension threat, an unofficial <code>.xyz</code> link, and an OTP request, scoring it <strong>High Risk</strong> and highlighting the exact trigger phrases inline. Conversely, when I test <strong>Case F (a real HDFC debit alert)</strong>, even though it contains the words 'HDFC', 'UPI', and 'OTP', our protective context dampener recognizes 'Never share your OTP' and classifies it as <strong>Low Risk</strong>."
            </p>
          </div>

          <div className="p-4 bg-[#070D19] border border-slate-800/80 rounded-lg space-y-2">
            <div className="font-mono text-teal-400 font-semibold">
              01:05 – 01:35 · Non-Visiting URL & Email Forensics
            </div>
            <p className="text-slate-200 leading-relaxed">
              "In our <strong>URL & Phishing Checker</strong>, we safely deconstruct links without ever visiting them. Notice how we flag <code>https://indiapost-parcel-claim.top</code>—demonstrating that an HTTPS padlock never guarantees a domain is legitimate. In our <strong>Email Analyzer</strong>, we detect display-name spoofing where a sender claims to be 'HDFC Bank Security' while originating from a personal <code>@gmail.com</code> address."
            </p>
          </div>

          <div className="p-4 bg-[#070D19] border border-slate-800/80 rounded-lg space-y-2">
            <div className="font-mono text-teal-400 font-semibold">
              01:35 – 02:00 · Architecture & Impact
            </div>
            <p className="text-slate-200 leading-relaxed">
              "Technically, Cybernova pairs a fast deterministic multi-signal heuristic engine with server-side Gemini AI semantic analysis, keeping API keys strictly on the backend. Every scan can be exported as a forensic report for cybercrime reporting (1930). We are ready to test any live message or URL from the panel!"
            </p>
          </div>
        </div>
      </section>

      {/* Interactive 12 Verified Test Cases Suite */}
      <section className="bg-[#0E182B] border border-slate-800/80 rounded-xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-teal-400">
              <FlaskConical className="w-4 h-4" />
              <span>Automated Quality Assurance & Evaluation Suite</span>
            </div>
            <h2 className="text-lg font-bold text-slate-100">
              12 Verified Test Cases with Expected vs. Live Results
            </h2>
            <p className="text-xs text-slate-400">
              Click "Run Test" on any case—or run all 12 in batch—to verify live classification accuracy against expected thresholds.
            </p>
          </div>

          <button
            type="button"
            disabled={isAnalyzing || isRunningBatch}
            onClick={handleRunAllTests}
            className="px-4 py-2.5 text-xs font-semibold text-slate-950 bg-teal-400 hover:bg-teal-300 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>
              {isRunningBatch
                ? 'Running Batch Verification...'
                : 'Execute All 12 Test Cases'}
            </span>
          </button>
        </div>

        <div className="overflow-x-auto border border-slate-800/80 rounded-lg">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-[#070D19] text-slate-400 font-medium">
                <th className="py-3 px-3">ID</th>
                <th className="py-3 px-3">Test Case & Input Summary</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Expected Result</th>
                <th className="py-3 px-3">Live Actual Result</th>
                <th className="py-3 px-3 text-right">Execute</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 bg-[#070D19]/60">
              {VERIFIED_TEST_CASES.map((tc) => {
                const actual = testResultsMap[tc.id];
                const isRunning = runningTcId === tc.id;
                const passed =
                  actual && actual.classification === tc.expectedClassification;

                return (
                  <tr key={tc.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3 font-mono text-teal-400 font-semibold whitespace-nowrap align-top">
                      {tc.id}
                    </td>
                    <td className="py-3 px-3 max-w-md align-top space-y-1">
                      <div className="font-semibold text-slate-100">{tc.name}</div>
                      <div className="font-mono text-slate-400 truncate">
                        {tc.inputSummary}
                      </div>
                      <div className="text-slate-500">
                        Indicators: {tc.keyIndicators.join(' · ')}
                      </div>
                    </td>
                    <td className="py-3 px-3 capitalize text-slate-300 whitespace-nowrap align-top">
                      {tc.inputType}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap align-top font-mono tabular-nums">
                      <div
                        className={
                          tc.expectedClassification === 'High Risk'
                            ? 'text-rose-400 font-semibold'
                            : 'text-emerald-400 font-semibold'
                        }
                      >
                        {tc.expectedClassification}
                      </div>
                      <div className="text-slate-400">
                        Score {tc.expectedMinScore}–{tc.expectedMaxScore}
                      </div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap align-top font-mono tabular-nums">
                      {!actual ? (
                        <span className="text-slate-500">Not run yet</span>
                      ) : (
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2
                              className={`w-3.5 h-3.5 ${
                                passed ? 'text-emerald-400' : 'text-amber-400'
                              }`}
                            />
                            <span className="text-slate-100 font-bold">
                              {actual.riskScore}/100 ({actual.classification})
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedTestResult(actual)}
                            className="text-teal-400 hover:underline cursor-pointer"
                          >
                            View Forensic Output
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap align-top">
                      <button
                        type="button"
                        disabled={isAnalyzing}
                        onClick={() => handleRunSingleTest(tc)}
                        className="px-3 py-1.5 text-xs font-medium text-teal-300 hover:text-slate-950 bg-teal-500/10 hover:bg-teal-400 border border-teal-500/30 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        {isRunning ? 'Running...' : 'Run Test'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {selectedTestResult && (
          <div className="pt-4 border-t border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-teal-400">
                Inspecting Test Case Output ({selectedTestResult.id})
              </span>
              <button
                type="button"
                onClick={() => setSelectedTestResult(null)}
                className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                Close Output
              </button>
            </div>
            <AnalysisResultPanel
              result={selectedTestResult}
              onReset={() => setSelectedTestResult(null)}
            />
          </div>
        )}
      </section>

      {/* Algorithm Architecture, Setup Instructions & Honest Limitations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Detection Algorithm & Setup */}
        <section className="bg-[#0E182B] border border-slate-800/80 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono text-teal-400">
            <Cpu className="w-4 h-4" />
            <span>Detection Algorithm & Local Setup</span>
          </div>
          <h2 className="text-base font-bold text-slate-100">
            How the Hybrid Scoring Algorithm Works
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Each input is evaluated against weighted multi-signal patterns: Credential Harvesting (+42), Remote Access/APK requests (+45), Lookalike Brand Spoofing (+46), Raw IP Host (+45), Payment/Refund Traps (+32), Fake KYC (+30), and Coercive Urgency (+26). When 2 or 3+ distinct threat categories co-occur, a correlation bonus (+10 to +18) is applied. Protective context dampeners prevent benign bank alerts from triggering false alarms.
          </p>

          <div className="pt-3 border-t border-slate-800/80 space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-teal-400">
              <Terminal className="w-4 h-4" />
              <span>Setup & Run Instructions</span>
            </div>
            <pre className="p-3.5 bg-[#070D19] border border-slate-800 rounded-lg text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed">
{`# 1. Install dependencies
npm install

# 2. Configure environment variables (.env)
GEMINI_API_KEY="your_api_key_here"

# 3. Start full-stack Express + Vite server (Port 3000)
npm run dev`}
            </pre>
          </div>
        </section>

        {/* Honest Limitations & Future Scope */}
        <section className="bg-[#0E182B] border border-slate-800/80 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
            <Code2 className="w-4 h-4" />
            <span>Transparency, Limitations & Future Scope</span>
          </div>
          <h2 className="text-base font-bold text-slate-100">
            Current Limitations & Future Enhancements
          </h2>

          <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
            <div>
              <strong className="text-slate-100">1. Non-Visiting URL Heuristic Scope:</strong>{' '}
              To guarantee user safety and prevent IP leakage or drive-by malware execution, Cybernova does not visit or unroll shortened URLs (`bit.ly`) over the live network. URL verdicts are clearly labeled as preliminary structural and lexical assessments.
            </div>
            <div>
              <strong className="text-slate-100">2. False Positives & False Negatives:</strong>{' '}
              Novel social-engineering scripts written without urgency, links, or payment keywords may score lower, while unusually phrased promotional messages may score as Suspicious. Cybernova is designed as an explainable decision-support assistant, never claiming 100% accuracy.
            </div>
            <div>
              <strong className="text-slate-100">3. Future Roadmap:</strong>{' '}
              Integration with live WHOIS domain age lookup (flagging domains registered &lt; 7 days ago), OCR screenshot analysis for QR code / WhatsApp image scams, and multilingual regional language support (Hindi, Telugu, Tamil).
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
