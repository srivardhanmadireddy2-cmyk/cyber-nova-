import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileJson,
  Info,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { ScanResult } from '../types/cybernova';

interface AnalysisResultPanelProps {
  result: ScanResult;
  onReset?: () => void;
}

export const AnalysisResultPanel: React.FC<AnalysisResultPanelProps> = ({
  result,
  onReset,
}) => {
  const isHigh = result.classification === 'High Risk';
  const isSuspicious = result.classification === 'Suspicious';

  const statusColorText = isHigh
    ? 'text-rose-400'
    : isSuspicious
    ? 'text-amber-400'
    : 'text-emerald-400';

  const statusBorderColor = isHigh
    ? 'border-rose-500/40'
    : isSuspicious
    ? 'border-amber-500/40'
    : 'border-emerald-500/40';

  const statusBarBg = isHigh
    ? 'bg-rose-500'
    : isSuspicious
    ? 'bg-amber-500'
    : 'bg-emerald-500';

  const StatusIcon = isHigh
    ? ShieldAlert
    : isSuspicious
    ? AlertTriangle
    : ShieldCheck;

  // Safely highlight matched excerpts inside the original input text
  const renderHighlightedInput = () => {
    const rawContent =
      result.inputType === 'url'
        ? result.fullInput.url || result.rawInputSummary
        : result.inputType === 'email'
        ? `From: ${result.fullInput.sender || ''}\n${
            result.fullInput.replyTo ? `Reply-To: ${result.fullInput.replyTo}\n` : ''
          }Subject: ${result.fullInput.subject || ''}\n\n${result.fullInput.body || ''}`
        : result.fullInput.text || result.rawInputSummary;

    const excerpts = result.flaggedExcerpts
      .map((e) => e.trim())
      .filter((e) => e.length >= 3)
      .sort((a, b) => b.length - a.length);

    if (excerpts.length === 0) {
      return <span className="text-slate-200 whitespace-pre-wrap break-words">{rawContent}</span>;
    }

    const escaped = excerpts.map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const splitRegex = new RegExp(`(${escaped.join('|')})`, 'gi');
    const parts = rawContent.split(splitRegex);

    return (
      <span className="text-slate-200 whitespace-pre-wrap break-words leading-relaxed">
        {parts.map((part, idx) => {
          const isMatch = excerpts.some(
            (ex) => ex.toLowerCase() === part.toLowerCase()
          );
          if (isMatch) {
            return (
              <mark
                key={idx}
                className="bg-rose-500/25 text-rose-200 border-b border-rose-400/70 px-1 py-0.5 rounded-sm font-medium"
              >
                {part}
              </mark>
            );
          }
          return <React.Fragment key={idx}>{part}</React.Fragment>;
        })}
      </span>
    );
  };

  const handleDownloadTxtReport = () => {
    const lines = [
      '====================================================================',
      'CYBERNOVA — FORENSIC SCAM & PHISHING DETECTION REPORT',
      'Project ID: TRI26158 | Track: Open Innovation',
      '====================================================================',
      `Scan ID:           ${result.id}`,
      `Timestamp:         ${new Date(result.timestamp).toLocaleString()}`,
      `Input Type:        ${result.inputType.toUpperCase()}${result.channel ? ` (${result.channel})` : ''}`,
      `Analysis Engine:   ${result.analysisEngine}`,
      `Demonstration Case:${result.isDemoCase ? ` Yes (${result.demoCaseId || 'Sample'})` : ' Live User Input'}`,
      '--------------------------------------------------------------------',
      `RISK SCORE:        ${result.riskScore} / 100`,
      `CLASSIFICATION:    ${result.classification.toUpperCase()}`,
      `PRIMARY CATEGORY:  ${result.primaryCategory}`,
      `SUMMARY VERDICT:   ${result.summaryVerdict}`,
      '--------------------------------------------------------------------',
      '',
      '1. WHAT WAS DETECTED?',
      result.whatWasDetected,
      '',
      '2. WHY WAS IT FLAGGED?',
      result.whyItWasFlagged,
      ...(result.aiForensicNote
        ? ['', 'AI SEMANTIC FORENSIC SYNTHESIS:', result.aiForensicNote]
        : []),
      '',
      '3. WHICH PARTS OF THE INPUT CAUSED CONCERN?',
      result.flaggedExcerpts.length > 0
        ? result.flaggedExcerpts.map((ex, i) => `   [${i + 1}] "${ex}"`).join('\n')
        : '   None — no high-risk lexical or structural triggers matched.',
      '',
      '4. DETECTED WARNING SIGNS BREAKDOWN:',
      result.signals.length > 0
        ? result.signals
            .map(
              (s, i) =>
                `   ${i + 1}. ${s.title} [Severity: ${s.severity.toUpperCase()} | Weight: +${s.weight}]\n      Category: ${s.category}\n      Explanation: ${s.explanation}\n      Matched: ${s.matchedExcerpts.join(', ') || 'Structural'}`
            )
            .join('\n\n')
        : '   No active warning signs detected.',
      '',
      '5. RECOMMENDED NEXT STEPS:',
      ...result.recommendedSteps.map((step, i) => `   ${i + 1}. ${step}`),
      '',
      '--------------------------------------------------------------------',
      `DISCLAIMER: ${result.disclaimer}`,
      '====================================================================',
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Cybernova-Report-${result.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadJsonReport = () => {
    const blob = new Blob([JSON.stringify(result, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Cybernova-Report-${result.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className={`bg-[#0E182B] border ${statusBorderColor} rounded-xl overflow-hidden transition-opacity duration-150`}
    >
      {/* Top Verdict Banner */}
      <div className="p-6 border-b border-slate-800/80 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono">
            <span>{result.id}</span>
            <span aria-hidden="true">·</span>
            <span>{new Date(result.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            <span aria-hidden="true">·</span>
            <span>{result.analysisEngine}</span>
            {result.isDemoCase && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-teal-400">
                  Demonstration Example (Not Live Threat Intel)
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <StatusIcon className={`w-7 h-7 shrink-0 ${statusColorText}`} />
            <h3 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
              {result.summaryVerdict}
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span>Classification:</span>
            <span className={`font-semibold ${statusColorText}`}>
              {result.classification}
            </span>
            <span aria-hidden="true">·</span>
            <span>Primary Vector:</span>
            <span className="text-slate-200 font-medium">{result.primaryCategory}</span>
            {result.channel && (
              <>
                <span aria-hidden="true">·</span>
                <span>Channel: {result.channel}</span>
              </>
            )}
          </div>
        </div>

        {/* Right Side: Risk Score Meter */}
        <div className="flex items-center gap-6 lg:border-l lg:border-slate-800/80 lg:pl-6 shrink-0">
          <div>
            <div className="text-xs text-slate-400 mb-1">Composite Risk Score</div>
            <div className="flex items-baseline gap-1.5 font-mono tabular-nums">
              <span className={`text-4xl font-bold ${statusColorText}`}>
                {result.riskScore}
              </span>
              <span className="text-sm text-slate-500">/ 100</span>
            </div>
            <div className="w-40 h-2 bg-slate-900 rounded-full overflow-hidden mt-2 border border-slate-800">
              <div
                className={`h-full ${statusBarBg} transition-transform duration-200 origin-left`}
                style={{ transform: `scaleX(${Math.max(0.03, result.riskScore / 100)})` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Explainable 4-Question Forensic Grid */}
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <h4 className="text-xs font-semibold text-teal-400">
              01. What Was Detected?
            </h4>
            <p className="text-sm text-slate-200 leading-relaxed">
              {result.whatWasDetected}
            </p>
          </div>

          <div className="space-y-1.5">
            <h4 className="text-xs font-semibold text-teal-400">
              02. Why Was It Flagged?
            </h4>
            <p className="text-sm text-slate-300 leading-relaxed">
              {result.whyItWasFlagged}
            </p>
          </div>
        </div>

        {result.aiForensicNote && (
          <div className="pt-4 border-t border-slate-800/80 space-y-1.5">
            <h4 className="text-xs font-semibold text-cyan-400">
              AI Semantic Forensic Synthesis
            </h4>
            <p className="text-sm text-slate-200 leading-relaxed">
              {result.aiForensicNote}
            </p>
          </div>
        )}

        {/* 03. Which parts of the input caused concern? (Inline Highlighted Inspector) */}
        <div className="pt-4 border-t border-slate-800/80 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h4 className="text-xs font-semibold text-teal-400">
              03. Which Parts of the Input Caused Concern?
            </h4>
            <span className="text-xs text-slate-400">
              {result.flaggedExcerpts.length > 0
                ? `${result.flaggedExcerpts.length} suspicious phrase${result.flaggedExcerpts.length > 1 ? 's' : ''} highlighted in context`
                : 'Zero suspicious phrases triggered'}
            </span>
          </div>

          <div className="p-4 bg-[#070D19] border border-slate-800/90 rounded-lg font-mono text-xs leading-relaxed">
            {renderHighlightedInput()}
          </div>

          {result.flaggedExcerpts.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 pt-1">
              <span className="text-slate-500">Extracted Trigger Tokens:</span>
              {result.flaggedExcerpts.map((excerpt, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <span aria-hidden="true">·</span>}
                  <code className="text-rose-300 font-mono">{excerpt}</code>
                </React.Fragment>
              ))}
            </div>
          )}
        </div>

        {/* URL Structural Breakdown (When URL or embedded URL is present) */}
        {result.urlBreakdown && (
          <div className="pt-4 border-t border-slate-800/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h4 className="text-xs font-semibold text-teal-400">
                Structural URL & Domain Deconstruction (Non-Visiting Safe Inspection)
              </h4>
              <span className="text-xs text-amber-300 font-mono">
                {result.urlBreakdown.assessmentBasis}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-[#070D19] border border-slate-800/90 rounded-lg text-xs">
              <div>
                <div className="text-slate-500 mb-1">Protocol & SSL</div>
                <div className="font-mono text-slate-200 font-semibold">
                  {result.urlBreakdown.protocol} ({result.urlBreakdown.isHttps ? 'Encrypted' : 'Unencrypted'})
                </div>
              </div>
              <div>
                <div className="text-slate-500 mb-1">Registrable Root Domain</div>
                <div className="font-mono text-teal-300 font-semibold break-all">
                  {result.urlBreakdown.domain}
                </div>
              </div>
              <div>
                <div className="text-slate-500 mb-1">Subdomain Prefix</div>
                <div className="font-mono text-slate-300 break-all">
                  {result.urlBreakdown.subdomain}
                </div>
              </div>
              <div>
                <div className="text-slate-500 mb-1">Top-Level Domain (TLD)</div>
                <div className="font-mono text-slate-200">
                  {result.urlBreakdown.tld} · Entropy {result.urlBreakdown.entropyScore}
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-lg flex items-start gap-3 text-xs text-slate-300">
              <Info className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{result.urlBreakdown.httpsNote}</p>
            </div>
          </div>
        )}

        {/* Email Header Breakdown (When Email input is analyzed) */}
        {result.emailBreakdown && (
          <div className="pt-4 border-t border-slate-800/80 space-y-3">
            <h4 className="text-xs font-semibold text-teal-400">
              Email Header & Sender Identity Inspection
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-[#070D19] border border-slate-800/90 rounded-lg text-xs">
              <div>
                <div className="text-slate-500 mb-1">Claimed Display Name</div>
                <div className="font-medium text-slate-200">
                  {result.emailBreakdown.senderDisplayName}
                </div>
              </div>
              <div>
                <div className="text-slate-500 mb-1">Actual Sender Address</div>
                <div className="font-mono text-teal-300 break-all">
                  {result.emailBreakdown.senderEmail}
                </div>
              </div>
              <div>
                <div className="text-slate-500 mb-1">Originating Domain & Spoof Check</div>
                <div className="font-mono text-slate-200">
                  {result.emailBreakdown.senderDomain} ·{' '}
                  <span
                    className={
                      result.emailBreakdown.displayNameSpoofingDetected ||
                      result.emailBreakdown.freeWebmailOfficialClaim
                        ? 'text-rose-400'
                        : 'text-emerald-400'
                    }
                  >
                    {result.emailBreakdown.displayNameSpoofingDetected
                      ? 'Brand Spoof Detected'
                      : result.emailBreakdown.freeWebmailOfficialClaim
                      ? 'Free Webmail Anomaly'
                      : 'Aligned'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Warning Signs List */}
        <div className="pt-4 border-t border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-teal-400">
              Detected Warning Signs & Rule Breakdown ({result.signals.length})
            </h4>
            <span className="text-xs text-slate-400 font-mono tabular-nums">
              Multi-Signal Weighted Engine
            </span>
          </div>

          {result.signals.length === 0 ? (
            <div className="p-4 bg-[#070D19] border border-slate-800/80 rounded-lg flex items-center gap-3 text-sm text-emerald-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>
                Zero high-risk or suspicious fraud rules were triggered across credential, urgency, payment, or domain checks.
              </span>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80 border border-slate-800/80 rounded-lg bg-[#070D19]">
              {result.signals.map((sig) => {
                const sevColor =
                  sig.severity === 'critical'
                    ? 'text-rose-400'
                    : sig.severity === 'high'
                    ? 'text-amber-400'
                    : 'text-cyan-400';

                return (
                  <div key={sig.id} className="p-4 space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-slate-100">
                        {sig.title}
                      </span>
                      <div className="flex items-center gap-2 text-xs font-mono tabular-nums">
                        <span className="text-slate-400">{sig.category}</span>
                        <span aria-hidden="true">·</span>
                        <span className={`font-semibold uppercase ${sevColor}`}>
                          {sig.severity}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="text-slate-300">+{sig.weight} pts</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {sig.explanation}
                    </p>
                    {sig.matchedExcerpts.length > 0 && (
                      <div className="text-xs text-slate-400 pt-1">
                        <span>Matched in input: </span>
                        {sig.matchedExcerpts.map((ex, i) => (
                          <React.Fragment key={i}>
                            {i > 0 && <span aria-hidden="true"> · </span>}
                            <code className="text-rose-300 font-mono">"{ex}"</code>
                          </React.Fragment>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 04. Recommended Next Steps */}
        <div className="pt-4 border-t border-slate-800/80 space-y-3">
          <h4 className="text-xs font-semibold text-teal-400">
            04. What Should You Do Next? (Recommended Actions)
          </h4>
          <ul className="space-y-2">
            {result.recommendedSteps.map((step, idx) => (
              <li
                key={idx}
                className="flex items-start gap-3 text-sm text-slate-200 leading-relaxed"
              >
                <span className="font-mono text-xs text-teal-400 mt-0.5 shrink-0 tabular-nums">
                  0{idx + 1}.
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer Actions + Honest Accuracy Disclaimer */}
        <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
            {result.disclaimer}
          </p>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleDownloadTxtReport}
              className="px-3.5 py-2 text-xs font-medium text-slate-200 bg-slate-800/90 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-teal-400" />
              <span>Download Report (.TXT)</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadJsonReport}
              className="px-3.5 py-2 text-xs font-medium text-slate-200 bg-slate-800/90 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <FileJson className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export JSON</span>
            </button>
            {onReset && (
              <button
                type="button"
                onClick={onReset}
                className="px-3.5 py-2 text-xs font-medium text-teal-300 hover:text-teal-200 border border-teal-500/30 hover:border-teal-500/60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Clear Result
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
