import React, { useMemo, useState } from 'react';
import {
  Download,
  Eye,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import {
  RiskClassification,
  ScanInputType,
  ScanResult,
} from '../types/cybernova';
import { AnalysisResultPanel } from './AnalysisResultPanel';

interface HistoryViewProps {
  history: ScanResult[];
  selectedItem: ScanResult | null;
  onSelectItem: (item: ScanResult | null) => void;
  onDeleteItem: (id: string) => Promise<void>;
  onClearAll: () => Promise<void>;
  onStartNewScan: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  history,
  selectedItem,
  onSelectItem,
  onDeleteItem,
  onClearAll,
  onStartNewScan,
}) => {
  const [riskFilter, setRiskFilter] = useState<'All' | RiskClassification>('All');
  const [typeFilter, setTypeFilter] = useState<'All' | ScanInputType>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      if (riskFilter !== 'All' && item.classification !== riskFilter) {
        return false;
      }
      if (typeFilter !== 'All' && item.inputType !== typeFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesSummary = item.rawInputSummary.toLowerCase().includes(q);
        const matchesCategory = item.primaryCategory.toLowerCase().includes(q);
        const matchesVerdict = item.summaryVerdict.toLowerCase().includes(q);
        const matchesId = item.id.toLowerCase().includes(q);
        return matchesSummary || matchesCategory || matchesVerdict || matchesId;
      }
      return true;
    });
  }, [history, riskFilter, typeFilter, searchQuery]);

  const handleExportCsv = () => {
    const headers = [
      'Scan ID',
      'Timestamp',
      'Input Type',
      'Risk Score',
      'Classification',
      'Category',
      'Short Explanation',
      'Input Summary',
    ];
    const rows = filteredHistory.map((item) => [
      item.id,
      item.timestamp,
      item.inputType,
      String(item.riskScore),
      item.classification,
      item.primaryCategory,
      `"${item.whatWasDetected.replace(/"/g, '""')}"`,
      `"${item.rawInputSummary.replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Cybernova-History-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-mono text-teal-400">
            Persistent Forensic Audit Log
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
            Detection History & Saved Scans
          </h1>
          <p className="text-sm text-slate-300">
            Review past message, URL, and email inspections, filter by threat severity, export reports, or manage saved records.
          </p>
        </div>

        {history.length > 0 && (
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3.5 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-teal-400" />
              <span>Export CSV ({filteredHistory.length})</span>
            </button>

            {!confirmClearAll ? (
              <button
                type="button"
                onClick={() => setConfirmClearAll(true)}
                className="px-3.5 py-2 text-xs font-medium text-rose-300 hover:text-rose-200 bg-rose-950/30 hover:bg-rose-950/60 border border-rose-500/30 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All History</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-rose-950/60 border border-rose-500/50 rounded-lg p-1">
                <button
                  type="button"
                  onClick={async () => {
                    await onClearAll();
                    setConfirmClearAll(false);
                  }}
                  className="px-2.5 py-1 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Confirm Reset to 0
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClearAll(false)}
                  className="px-2 py-1 text-xs text-slate-300 hover:text-white whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected Past Result Inspector Drawer/Panel */}
      {selectedItem && (
        <section className="space-y-3 bg-[#091120] border border-teal-500/40 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-teal-400 font-semibold">
              Inspecting Saved Record: {selectedItem.id}
            </span>
            <button
              type="button"
              onClick={() => onSelectItem(null)}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Close Inspector</span>
            </button>
          </div>
          <AnalysisResultPanel
            result={selectedItem}
            onReset={() => onSelectItem(null)}
          />
        </section>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-[#0E182B] border border-slate-800/80 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Risk Classification Segmented Filter */}
          <div className="flex items-center gap-1 p-1 bg-[#070D19] border border-slate-800 rounded-lg">
            {(['All', 'High Risk', 'Suspicious', 'Low Risk'] as const).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setRiskFilter(level)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  riskFilter === level
                    ? 'bg-teal-400 text-slate-950 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {level}
              </button>
            ))}
          </div>

          {/* Input Type Segmented Filter */}
          <div className="flex items-center gap-1 p-1 bg-[#070D19] border border-slate-800 rounded-lg">
            {(['All', 'message', 'url', 'email'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize whitespace-nowrap shrink-0 cursor-pointer ${
                  typeFilter === t
                    ? 'bg-slate-800 text-teal-300 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t === 'All' ? 'All Types' : t}
              </button>
            ))}
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full lg:w-72">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by keyword, domain, ID..."
            className="w-full pl-9 pr-3 py-2 bg-[#070D19] border border-slate-800 focus:border-teal-400 focus:outline-none rounded-lg text-xs text-slate-200 placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* History Data Table */}
      {history.length === 0 ? (
        <div className="bg-[#0E182B] border border-slate-800/80 rounded-xl p-12 text-center space-y-3">
          <h3 className="text-base font-semibold text-slate-200">
            Your Detection History is Currently Empty (0 Scans)
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            Every scan you perform in the Scam Detector, URL Checker, Email Analyzer, or Live Demo section is automatically saved here with full forensic details.
          </p>
          <button
            type="button"
            onClick={onStartNewScan}
            className="mt-2 px-5 py-2.5 text-xs font-semibold text-slate-950 bg-teal-400 hover:bg-teal-300 rounded-lg transition-colors cursor-pointer"
          >
            Start Your First Scan
          </button>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="bg-[#0E182B] border border-slate-800/80 rounded-xl p-10 text-center space-y-2">
          <p className="text-sm text-slate-300 font-medium">
            No saved records match your current filter criteria
          </p>
          <button
            type="button"
            onClick={() => {
              setRiskFilter('All');
              setTypeFilter('All');
              setSearchQuery('');
            }}
            className="text-xs text-teal-400 hover:text-teal-300 underline cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="bg-[#0E182B] border border-slate-800/80 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-[#070D19] text-slate-400 font-medium">
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Submitted Input & Short Explanation</th>
                  <th className="py-3.5 px-4 text-right">Risk Score</th>
                  <th className="py-3.5 px-4">Classification</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {filteredHistory.map((item) => {
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
                      onClick={() => onSelectItem(item)}
                      className={`hover:bg-slate-800/40 transition-colors cursor-pointer ${
                        selectedItem?.id === item.id ? 'bg-teal-950/20' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-mono tabular-nums text-slate-400 whitespace-nowrap align-top">
                        <div>{new Date(item.timestamp).toLocaleDateString()}</div>
                        <div>
                          {new Date(item.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap align-top">
                        <div className="text-slate-200 font-medium capitalize">
                          {item.inputType}
                        </div>
                        <div className="text-slate-500 font-mono">
                          {item.channel || (item.isDemoCase ? 'Demo' : 'Direct')}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 max-w-md align-top space-y-1">
                        <div className="font-mono text-slate-200 truncate">
                          {item.rawInputSummary}
                        </div>
                        <div className="text-slate-400 line-clamp-2 leading-relaxed">
                          {item.whatWasDetected}
                        </div>
                      </td>

                      <td
                        className={`py-3.5 px-4 text-right font-mono tabular-nums font-bold text-sm align-top whitespace-nowrap ${colorClass}`}
                      >
                        {item.riskScore}/100
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap align-top">
                        <div className={`font-semibold ${colorClass}`}>
                          {item.classification}
                        </div>
                        <div className="text-slate-400">{item.primaryCategory}</div>
                      </td>

                      <td
                        className="py-3.5 px-4 text-right whitespace-nowrap align-top"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => onSelectItem(item)}
                            className="text-teal-400 hover:text-teal-300 inline-flex items-center gap-1 font-medium cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Open</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteItem(item.id)}
                            className="text-slate-400 hover:text-rose-400 inline-flex items-center gap-1 cursor-pointer"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
