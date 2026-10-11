import React, { useState } from 'react';
import {
  AlertCircle,
  Loader2,
  MailCheck,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { ScanResult } from '../types/cybernova';
import { AnalysisResultPanel } from './AnalysisResultPanel';

interface EmailAnalyzerViewProps {
  onAnalyzeEmail: (params: {
    sender: string;
    replyTo?: string;
    subject: string;
    body: string;
    isDemoCase?: boolean;
    demoCaseId?: string;
  }) => Promise<ScanResult | null>;
  isAnalyzing: boolean;
}

const EMAIL_PRESETS = [
  {
    id: 'email-preset-1',
    label: 'Spoofed Bank KYC & Credential Trap',
    sender: 'HDFC Bank Security <alert.verify88@gmail.com>',
    replyTo: 'collect-credentials@steal-data.xyz',
    subject: 'URGENT: Unauthorized Login Attempt - Verify Account Immediately',
    body: 'Dear Valued Customer,\n\nWe detected an unauthorized login attempt on your HDFC NetBanking profile today. Your account has been temporarily restricted.\n\nPlease click https://hdfcbank-verify-portal.top/login within 6 hours and submit your 6-digit OTP and NetBanking password to restore full access, otherwise your account will be permanently frozen.',
  },
  {
    id: 'email-preset-2',
    label: 'Fake Customs Duty & Parcel Hold Email',
    sender: 'DHL Express Customs Desk <customs.clearance.india@outlook.com>',
    replyTo: '',
    subject: 'Action Required Immediately: International Shipment #DHL99201 Seized',
    body: 'Attention Consignee,\n\nYour international parcel #DHL99201 is held at customs clearance due to unpaid customs duty and incomplete KYC details. Pay the clearance charge of Rs. 1,850 immediately via http://dhl-india-customs-pay.xyz/release within 24 hours to avoid legal action.',
  },
  {
    id: 'email-preset-3',
    label: 'Legitimate Faculty Evaluation Email (Benign)',
    sender: 'Prof. R. Subramanian <hod.cse@college.edu.in>',
    replyTo: 'hod.cse@college.edu.in',
    subject: 'Schedule for Open Innovation Track (TRI26158) Final Evaluation',
    body: 'Dear Team Cybernova,\n\nPlease note that the faculty panel evaluation for Track: Open Innovation (Project ID: TRI26158) is scheduled for Friday at 2:00 PM in the Main Auditorium. Please bring your laptop and ensure your live software prototype and test cases are ready for demonstration.\n\nBest regards,\nDepartment of Computer Science',
  },
];

export const EmailAnalyzerView: React.FC<EmailAnalyzerViewProps> = ({
  onAnalyzeEmail,
  isAnalyzing,
}) => {
  const [sender, setSender] = useState('');
  const [replyTo, setReplyTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sender.trim() && !subject.trim() && !body.trim()) {
      setValidationError('Please enter sender, subject, and email body content to analyze.');
      return;
    }
    if (!body.trim()) {
      setValidationError('Please paste the email message body to perform forensic inspection.');
      return;
    }
    setValidationError(null);
    const res = await onAnalyzeEmail({
      sender: sender.trim() || 'unknown@sender.org',
      replyTo: replyTo.trim() || undefined,
      subject: subject.trim() || '(No Subject)',
      body: body.trim(),
    });
    if (res) {
      setResult(res);
    }
  };

  const handleRunPreset = async (preset: (typeof EMAIL_PRESETS)[number]) => {
    setSender(preset.sender);
    setReplyTo(preset.replyTo);
    setSubject(preset.subject);
    setBody(preset.body);
    setValidationError(null);

    const res = await onAnalyzeEmail({
      sender: preset.sender,
      replyTo: preset.replyTo || undefined,
      subject: preset.subject,
      body: preset.body,
      isDemoCase: true,
      demoCaseId: preset.label,
    });
    if (res) {
      setResult(res);
    }
  };

  const handleClear = () => {
    setSender('');
    setReplyTo('');
    setSubject('');
    setBody('');
    setValidationError(null);
    setResult(null);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="text-xs font-mono text-teal-400">
          Header Identity, Display-Name Spoofing & Body Link Inspector
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
          Email & Phishing Message Analyzer
        </h1>
        <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
          Inspect complete email headers and bodies. Cybernova checks whether the sender’s display name contradicts the actual originating domain (e.g., claiming to be a bank while sending from <code className="text-teal-300">@gmail.com</code>), detects Reply-To redirection, and scans embedded URLs.
        </p>
      </div>

      {/* Email Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-[#0E182B] border border-slate-800/80 rounded-xl p-6 space-y-5"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label
              htmlFor="email-sender-input"
              className="block text-xs font-semibold text-slate-300"
            >
              Sender Name & Email Address (From)
            </label>
            <input
              id="email-sender-input"
              type="text"
              value={sender}
              onChange={(e) => {
                setSender(e.target.value);
                if (validationError) setValidationError(null);
              }}
              placeholder="e.g., HDFC Bank Security <alert.verify88@gmail.com>"
              className="w-full px-3.5 py-2.5 bg-[#070D19] border border-slate-800 focus:border-teal-400 focus:outline-none rounded-lg text-xs text-slate-100 font-mono placeholder:text-slate-500"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="email-replyto-input"
              className="block text-xs font-semibold text-slate-300"
            >
              Reply-To Address (Optional — detects BEC redirection)
            </label>
            <input
              id="email-replyto-input"
              type="text"
              value={replyTo}
              onChange={(e) => setReplyTo(e.target.value)}
              placeholder="e.g., collect-credentials@steal-data.xyz"
              className="w-full px-3.5 py-2.5 bg-[#070D19] border border-slate-800 focus:border-teal-400 focus:outline-none rounded-lg text-xs text-slate-100 font-mono placeholder:text-slate-500"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="email-subject-input"
            className="block text-xs font-semibold text-slate-300"
          >
            Email Subject Line
          </label>
          <input
            id="email-subject-input"
            type="text"
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value);
              if (validationError) setValidationError(null);
            }}
            placeholder="e.g., URGENT: Unauthorized Login Attempt - Verify Account Immediately"
            className="w-full px-3.5 py-2.5 bg-[#070D19] border border-slate-800 focus:border-teal-400 focus:outline-none rounded-lg text-sm text-slate-100 placeholder:text-slate-500"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="email-body-input"
            className="block text-xs font-semibold text-slate-300"
          >
            Email Message Body
          </label>
          <textarea
            id="email-body-input"
            rows={6}
            value={body}
            onChange={(e) => {
              setBody(e.target.value);
              if (validationError) setValidationError(null);
            }}
            placeholder="Paste the full email body content here..."
            className="w-full p-4 bg-[#070D19] border border-slate-800 focus:border-teal-400 focus:outline-none rounded-lg text-sm text-slate-100 font-mono placeholder:text-slate-500 leading-relaxed resize-y"
          />
        </div>

        {validationError && (
          <div
            role="alert"
            className="p-3.5 bg-rose-950/40 border border-rose-500/40 rounded-lg flex items-center gap-2.5 text-xs text-rose-300"
          >
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-800/80">
          <button
            type="button"
            onClick={handleClear}
            className="px-4 py-2.5 text-xs font-medium text-slate-300 hover:text-slate-100 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear Fields</span>
          </button>

          <button
            type="submit"
            disabled={isAnalyzing}
            className="px-6 py-2.5 text-sm font-semibold text-slate-950 bg-teal-400 hover:bg-teal-300 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Inspecting Email Headers & Body...</span>
              </>
            ) : (
              <>
                <MailCheck className="w-4 h-4" />
                <span>Analyze Email</span>
              </>
            )}
          </button>
        </div>

        {/* Preset Email Cases */}
        <div className="pt-4 border-t border-slate-800/80 space-y-2.5">
          <div className="text-xs text-slate-400">
            One-Click Email Presets (Test spoofed vs. legitimate email headers):
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {EMAIL_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                disabled={isAnalyzing}
                onClick={() => handleRunPreset(preset)}
                className="text-left p-3.5 bg-[#070D19] hover:bg-slate-900 border border-slate-800/90 hover:border-teal-500/40 rounded-lg transition-colors space-y-1.5 cursor-pointer"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-teal-400">
                  <span>{preset.label}</span>
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                </div>
                <div className="text-xs font-mono text-slate-300 truncate">
                  {preset.sender}
                </div>
                <div className="text-xs text-slate-400 truncate">
                  Subject: {preset.subject}
                </div>
              </button>
            ))}
          </div>
        </div>
      </form>

      {/* Email Analysis Result */}
      {result && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-teal-400">
            Email Forensic Analysis Output
          </h2>
          <AnalysisResultPanel result={result} onReset={handleClear} />
        </section>
      )}
    </div>
  );
};
