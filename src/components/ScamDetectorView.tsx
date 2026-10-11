import React, { useState } from 'react';
import {
  AlertCircle,
  FlaskConical,
  Loader2,
  RotateCcw,
  Shield,
  Sparkles,
} from 'lucide-react';
import { LIVE_DEMO_CASES } from '../data/demoAndTestCases';
import { DemoCase, MessageChannel, ScanResult } from '../types/cybernova';
import { AnalysisResultPanel } from './AnalysisResultPanel';

interface ScamDetectorViewProps {
  onAnalyzeMessage: (params: {
    text: string;
    channel: MessageChannel;
    isDemoCase?: boolean;
    demoCaseId?: string;
  }) => Promise<ScanResult | null>;
  isAnalyzing: boolean;
}

const CHANNELS: MessageChannel[] = [
  'SMS',
  'WhatsApp',
  'Social Media',
  'Payment / UPI Request',
  'General Message',
];

export const ScamDetectorView: React.FC<ScamDetectorViewProps> = ({
  onAnalyzeMessage,
  isAnalyzing,
}) => {
  const [channel, setChannel] = useState<MessageChannel>('SMS');
  const [messageText, setMessageText] = useState('');
  const [activeDemoId, setActiveDemoId] = useState<string | undefined>(undefined);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);

  const handleAnalyzeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = messageText.trim();
    if (!trimmed) {
      setValidationError('Please paste or type a message before clicking Analyze Message.');
      return;
    }
    if (trimmed.length < 6) {
      setValidationError('Please enter a complete message (at least 6 characters) for meaningful multi-signal analysis.');
      return;
    }
    setValidationError(null);
    const scanRes = await onAnalyzeMessage({
      text: trimmed,
      channel,
      isDemoCase: Boolean(activeDemoId),
      demoCaseId: activeDemoId,
    });
    if (scanRes) {
      setResult(scanRes);
    }
  };

  const handleLoadAndRunDemo = async (demo: DemoCase) => {
    const text = demo.payload.text || '';
    const demoChannel = demo.channel || 'SMS';
    setChannel(demoChannel);
    setMessageText(text);
    setActiveDemoId(demo.id);
    setValidationError(null);

    const scanRes = await onAnalyzeMessage({
      text,
      channel: demoChannel,
      isDemoCase: true,
      demoCaseId: demo.code,
    });
    if (scanRes) {
      setResult(scanRes);
    }
  };

  const handleClear = () => {
    setMessageText('');
    setActiveDemoId(undefined);
    setValidationError(null);
    setResult(null);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="text-xs font-mono text-teal-400">
          Multi-Signal Social Engineering & Financial Fraud Inspector
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
          AI Scam & Fraudulent Message Detector
        </h1>
        <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
          Paste suspicious SMS alerts, WhatsApp messages, social media DMs, or UPI payment requests. Our engine correlates urgency threats, credential/OTP harvesting, fake KYC claims, brand impersonation, embedded phishing links, and remote-access traps.
        </p>
      </div>

      {/* Main Input Form */}
      <form
        onSubmit={handleAnalyzeSubmit}
        className="bg-[#0E182B] border border-slate-800/80 rounded-xl p-6 space-y-6"
      >
        {/* Channel Selector */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-300">
            Select Message Source Channel
          </label>
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#070D19] border border-slate-800 rounded-lg w-fit">
            {CHANNELS.map((ch) => (
              <button
                key={ch}
                type="button"
                onClick={() => setChannel(ch)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  channel === ch
                    ? 'bg-teal-400 text-slate-950 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {ch}
              </button>
            ))}
          </div>
        </div>

        {/* Textarea Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="scam-message-input"
              className="text-xs font-semibold text-slate-300"
            >
              Message Content to Inspect
            </label>
            <span className="text-xs font-mono text-slate-500 tabular-nums">
              {messageText.length} chars
            </span>
          </div>

          <textarea
            id="scam-message-input"
            rows={5}
            value={messageText}
            onChange={(e) => {
              setMessageText(e.target.value);
              setActiveDemoId(undefined);
              if (validationError) setValidationError(null);
            }}
            placeholder="Paste SMS, WhatsApp message, job offer, bank KYC notice, or UPI payment request here... (Do NOT enter real personal OTPs or passwords)"
            className="w-full p-4 bg-[#070D19] border border-slate-800 focus:border-teal-400 focus:outline-none rounded-lg text-sm text-slate-100 placeholder:text-slate-500 font-mono leading-relaxed resize-y"
          />

          <p className="text-xs text-slate-400">
            Privacy & Safety Notice: Never enter your real active OTPs, passwords, or PINs. Submitted text is sanitized and never executed.
          </p>
        </div>

        {/* Validation Error */}
        {validationError && (
          <div
            role="alert"
            className="p-3.5 bg-rose-950/40 border border-rose-500/40 rounded-lg flex items-center gap-2.5 text-xs text-rose-300"
          >
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-800/80">
          <button
            type="button"
            onClick={handleClear}
            className="px-4 py-2.5 text-xs font-medium text-slate-300 hover:text-slate-100 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear / Reset Input</span>
          </button>

          <button
            type="submit"
            disabled={isAnalyzing}
            className="px-6 py-2.5 text-sm font-semibold text-slate-950 bg-teal-400 hover:bg-teal-300 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analyzing Multi-Signal Vectors...</span>
              </>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                <span>Analyze Message</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Analysis Result Output */}
      {result && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-teal-400">
            Forensic Analysis Result
          </h2>
          <AnalysisResultPanel result={result} onReset={handleClear} />
        </section>
      )}

      {/* Quick Demo Case Selector (Cases A through F) */}
      <section className="bg-[#0E182B] border border-slate-800/80 rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-teal-400 font-mono">
              <FlaskConical className="w-3.5 h-3.5" />
              <span>One-Click Live Demonstration Presets</span>
            </div>
            <h2 className="text-base font-semibold text-slate-100">
              Try Demo Cases (A – F)
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            Click "Test This Example" to populate and execute immediately
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {LIVE_DEMO_CASES.map((demo) => (
            <div
              key={demo.id}
              className="p-4 bg-[#070D19] border border-slate-800/90 rounded-lg flex flex-col justify-between gap-3"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-teal-400 font-semibold">
                    {demo.code} · {demo.channel}
                  </span>
                  <span
                    className={
                      demo.expectedClassification === 'High Risk'
                        ? 'text-rose-400'
                        : 'text-emerald-400'
                    }
                  >
                    {demo.expectedClassification}
                  </span>
                </div>
                <h3 className="text-xs font-semibold text-slate-100">
                  {demo.title}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2 font-mono">
                  "{demo.payload.text}"
                </p>
              </div>

              <button
                type="button"
                disabled={isAnalyzing}
                onClick={() => handleLoadAndRunDemo(demo)}
                className="w-full py-1.5 px-3 text-xs font-medium text-teal-300 hover:text-slate-950 bg-teal-500/10 hover:bg-teal-400 border border-teal-500/30 rounded-md transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Test This Example</span>
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
