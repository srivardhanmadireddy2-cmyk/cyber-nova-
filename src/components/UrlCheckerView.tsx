import React, { useState } from 'react';
import {
  AlertCircle,
  Globe,
  Info,
  Loader2,
  Lock,
  RotateCcw,
  Search,
} from 'lucide-react';
import { ScanResult } from '../types/cybernova';
import { AnalysisResultPanel } from './AnalysisResultPanel';

interface UrlCheckerViewProps {
  onAnalyzeUrl: (params: {
    url: string;
    isDemoCase?: boolean;
    demoCaseId?: string;
  }) => Promise<ScanResult | null>;
  isAnalyzing: boolean;
}

const SAMPLE_URLS = [
  {
    id: 'url-sample-1',
    label: 'HTTPS Brand Lookalike (.xyz)',
    url: 'https://login.secure-hdfcbank-verify.xyz/netbanking/update-kyc',
    note: 'Uses HTTPS SSL certificate to disguise an unofficial .xyz domain spoofing HDFC Bank',
  },
  {
    id: 'url-sample-2',
    label: 'Raw IPv4 Credential Trap',
    url: 'http://45.133.192.18/onlinesbi/login.php?session=verify',
    note: 'Uses an unencrypted numerical IP address instead of a registered institutional domain',
  },
  {
    id: 'url-sample-3',
    label: 'Leetspeak Homoglyph (paypa1)',
    url: 'https://www.paypa1-account-security.top/signin',
    note: 'Substitutes the number "1" for "l" in PayPal on a high-abuse .top TLD',
  },
  {
    id: 'url-sample-4',
    label: 'URL Shortener Obfuscation',
    url: 'https://bit.ly/3xK9mPq-urgent-refund-claim',
    note: 'Masks the true destination host behind a public URL shortening service',
  },
  {
    id: 'url-sample-5',
    label: 'Official SBI Portal (Benign)',
    url: 'https://www.onlinesbi.sbi/sbijava/retail/html/faq.html',
    note: 'Verified official State Bank of India (.sbi) domain over HTTPS',
  },
];

export const UrlCheckerView: React.FC<UrlCheckerViewProps> = ({
  onAnalyzeUrl,
  isAnalyzing,
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);

  const validateUrlString = (input: string): string | null => {
    const trimmed = input.trim();
    if (!trimmed) {
      return 'Please enter a URL or domain name to inspect.';
    }
    if (trimmed.includes(' ') || (!trimmed.includes('.') && !trimmed.includes('://'))) {
      return 'Invalid URL format. Please enter a valid domain or link (e.g., https://example.com/login).';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateUrlString(urlInput);
    if (err) {
      setValidationError(err);
      return;
    }
    setValidationError(null);
    const res = await onAnalyzeUrl({ url: urlInput.trim() });
    if (res) {
      setResult(res);
    }
  };

  const handleTestPreset = async (preset: (typeof SAMPLE_URLS)[number]) => {
    setUrlInput(preset.url);
    setValidationError(null);
    const res = await onAnalyzeUrl({
      url: preset.url,
      isDemoCase: true,
      demoCaseId: preset.label,
    });
    if (res) {
      setResult(res);
    }
  };

  const handleReset = () => {
    setUrlInput('');
    setValidationError(null);
    setResult(null);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="text-xs font-mono text-teal-400">
          Non-Visiting Structural & Lexical Link Forensics
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
          URL & Phishing Domain Checker
        </h1>
        <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
          Inspect suspicious links safely without visiting or executing them. Cybernova deconstructs the protocol, registrable root domain, subdomain depth, typosquatting homoglyphs, Punycode (`xn--`), raw IP hosts, and URL shorteners.
        </p>
      </div>

      {/* Important Safety & HTTPS Caveat Banner */}
      <div className="bg-[#0E182B] border border-slate-800/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-300">
        <div className="flex items-start gap-3">
          <Lock className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-slate-100">HTTPS Safety Caveat & Heuristic Notice:</strong>{' '}
            Over 80% of modern phishing sites use HTTPS certificates. Cybernova never classifies a URL as safe merely because it uses <code className="text-teal-300">https://</code>. All findings represent a{' '}
            <span className="text-amber-300 font-medium">
              preliminary structural & heuristic assessment
            </span>{' '}
            and submitted URLs are never visited or opened.
          </p>
        </div>
      </div>

      {/* URL Input Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-[#0E182B] border border-slate-800/80 rounded-xl p-6 space-y-5"
      >
        <div className="space-y-2">
          <label
            htmlFor="url-inspector-input"
            className="block text-xs font-semibold text-slate-300"
          >
            Enter Suspicious URL or Domain Name
          </label>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Globe className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="url-inspector-input"
                type="text"
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                placeholder="https://login.secure-hdfcbank-verify.xyz/update-kyc"
                className="w-full pl-10 pr-4 py-2.5 bg-[#070D19] border border-slate-800 focus:border-teal-400 focus:outline-none rounded-lg text-sm text-slate-100 font-mono placeholder:text-slate-500"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="submit"
                disabled={isAnalyzing}
                className="px-5 py-2.5 text-sm font-semibold text-slate-950 bg-teal-400 hover:bg-teal-300 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Inspecting URL...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Analyze URL</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="px-3.5 py-2.5 text-xs font-medium text-slate-300 hover:text-slate-100 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>
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

        {/* Preset URL Examples */}
        <div className="pt-3 border-t border-slate-800/80 space-y-2.5">
          <div className="text-xs text-slate-400">
            Test Sample URLs (Click any sample to inspect immediately):
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {SAMPLE_URLS.map((sample) => (
              <button
                key={sample.id}
                type="button"
                disabled={isAnalyzing}
                onClick={() => handleTestPreset(sample)}
                className="text-left p-3 bg-[#070D19] hover:bg-slate-900 border border-slate-800/90 hover:border-teal-500/40 rounded-lg transition-colors space-y-1 cursor-pointer"
              >
                <div className="text-xs font-semibold text-teal-400">
                  {sample.label}
                </div>
                <div className="text-xs font-mono text-slate-200 truncate">
                  {sample.url}
                </div>
                <div className="text-xs text-slate-400 line-clamp-1">
                  {sample.note}
                </div>
              </button>
            ))}
          </div>
        </div>
      </form>

      {/* Output Result */}
      {result && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-teal-400">
              URL Structural & Heuristic Inspection Report
            </h2>
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-teal-400" />
              <span>Preliminary Heuristic Assessment</span>
            </span>
          </div>
          <AnalysisResultPanel result={result} onReset={handleReset} />
        </section>
      )}
    </div>
  );
};
