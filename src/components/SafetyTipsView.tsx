import React, { useState } from 'react';
import {
  CheckSquare,
  PhoneCall,
  ShieldAlert,
  ShieldCheck,
  Square,
} from 'lucide-react';
import { CYBER_SAFETY_GUIDES } from '../data/demoAndTestCases';

const SELF_AUDIT_ITEMS = [
  'I never enter my UPI PIN when someone claims they are sending me money or a refund.',
  'I inspect the actual root domain (before the first single "/") instead of trusting the HTTPS padlock icon.',
  'I never install remote screen-sharing apps (AnyDesk, TeamViewer, RustDesk) at a caller’s request.',
  'I verify bank KYC or PAN suspension alerts by opening my official banking app directly—never via SMS links.',
  'I have enabled Two-Factor Authentication (2FA) on my primary email and social media accounts.',
  'I know to dial 1930 (National Cyber Crime Helpline) immediately during the "Golden Hour" if financial fraud occurs.',
];

export const SafetyTipsView: React.FC = () => {
  const [checkedIndices, setCheckedIndices] = useState<number[]>([0, 2]);

  const toggleCheck = (idx: number) => {
    setCheckedIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const readinessPct = Math.round(
    (checkedIndices.length / SELF_AUDIT_ITEMS.length) * 100
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="text-xs font-mono text-teal-400">
          Preventive Defense & Incident Response Guide
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
          Cyber Safety Tips & Scam Defense Playbook
        </h1>
        <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
          Automated detection is your first line of defense, while informed human verification is your strongest shield. Use these actionable rules and emergency protocols to stay protected against modern social engineering.
        </p>
      </div>

      {/* 3-Column Core Defense Guides */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {CYBER_SAFETY_GUIDES.map((guide, gIdx) => (
          <div
            key={gIdx}
            className="bg-[#0E182B] border border-slate-800/80 rounded-xl p-6 flex flex-col justify-between space-y-5"
          >
            <div className="space-y-4">
              <div className="space-y-1 border-b border-slate-800/80 pb-3">
                <div className="text-xs font-mono text-teal-400">
                  0{gIdx + 1}. Core Domain
                </div>
                <h2 className="text-base font-bold text-slate-100">
                  {guide.category}
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {guide.summary}
                </p>
              </div>

              <div className="space-y-4">
                {guide.rules.map((rule, rIdx) => (
                  <div key={rIdx} className="space-y-1">
                    <h3 className="text-xs font-semibold text-slate-100 flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                      <span>{rule.title}</span>
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed pl-5">
                      {rule.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Personal Cyber Hygiene Self-Audit + Golden Hour Emergency Protocol */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Interactive Checklist */}
        <div className="lg:col-span-7 bg-[#0E182B] border border-slate-800/80 rounded-xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Interactive Cyber Hygiene Self-Check
              </h2>
              <p className="text-xs text-slate-400">
                Click each habit you actively practice to calculate your personal scam resilience score.
              </p>
            </div>
            <div className="text-right font-mono tabular-nums">
              <div className="text-xs text-slate-400">Resilience Score</div>
              <div className="text-xl font-bold text-teal-400">
                {readinessPct}% ({checkedIndices.length}/{SELF_AUDIT_ITEMS.length})
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            {SELF_AUDIT_ITEMS.map((item, idx) => {
              const isChecked = checkedIndices.includes(idx);
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => toggleCheck(idx)}
                  className={`w-full text-left p-3.5 rounded-lg border transition-colors flex items-start gap-3 cursor-pointer ${
                    isChecked
                      ? 'bg-teal-950/20 border-teal-500/40 text-slate-100'
                      : 'bg-[#070D19] border-slate-800/80 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  {isChecked ? (
                    <CheckSquare className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  )}
                  <span className="text-xs leading-relaxed">{item}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Emergency Response Protocol */}
        <div className="lg:col-span-5 bg-[#0E182B] border border-slate-800/80 rounded-xl p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="space-y-1 border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-2 text-xs text-rose-400 font-mono">
                <ShieldAlert className="w-4 h-4" />
                <span>Golden Hour Emergency Response</span>
              </div>
              <h2 className="text-base font-bold text-slate-100">
                What To Do If You Suspect Fraud
              </h2>
              <p className="text-xs text-slate-400">
                Acting within the first 60 minutes ("Golden Hour") dramatically increases the chance of freezing fraudulent fund transfers.
              </p>
            </div>

            <ol className="space-y-3.5 text-xs text-slate-200">
              <li className="flex items-start gap-3">
                <span className="font-mono text-rose-400 font-bold shrink-0">01.</span>
                <div>
                  <strong className="text-slate-100">Disconnect & Block Immediately:</strong>{' '}
                  If you installed a remote-access app (AnyDesk/TeamViewer), turn off Wi-Fi and Mobile Data immediately (enable Airplane Mode) and uninstall the app.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-mono text-rose-400 font-bold shrink-0">02.</span>
                <div>
                  <strong className="text-slate-100">Freeze Bank Cards & UPI:</strong>{' '}
                  Contact your bank’s official 24x7 fraud hotline to block your debit/credit card, UPI ID, and NetBanking access.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-mono text-rose-400 font-bold shrink-0">03.</span>
                <div>
                  <strong className="text-slate-100">Report to National Cyber Crime Helpline:</strong>{' '}
                  Dial <span className="font-mono text-teal-300 font-bold">1930</span> (India) or file an online complaint at{' '}
                  <span className="font-mono text-teal-300">cybercrime.gov.in</span> so authorities can issue a lien hold on the recipient’s mule account.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-mono text-rose-400 font-bold shrink-0">04.</span>
                <div>
                  <strong className="text-slate-100">Preserve Forensic Evidence:</strong>{' '}
                  Do not delete the scam SMS, WhatsApp chat, URL, or transaction reference number—download a Cybernova Forensic Report for documentation.
                </div>
              </li>
            </ol>
          </div>

          <div className="p-4 bg-[#070D19] border border-slate-800 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <PhoneCall className="w-5 h-5 text-teal-400 shrink-0" />
              <div>
                <div className="text-xs font-semibold text-slate-100">
                  National Cyber Crime Helpline
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  Dial 1930 · cybercrime.gov.in
                </div>
              </div>
            </div>
            <span className="text-xs font-mono text-teal-400">24×7 Toll-Free</span>
          </div>
        </div>
      </div>
    </div>
  );
};
