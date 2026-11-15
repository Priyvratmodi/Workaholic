import React, { useState, useEffect } from 'react';
import { AIBoardSummary } from '@workaholic/shared';
import { fetchAIBoardSummary } from '../../api/boards.js';
import { Icon } from '../ui/Icon.js';

interface AISummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardId: string;
  boardTitle: string;
  onCardClick?: (cardId: string) => void;
}

export const AISummaryModal: React.FC<AISummaryModalProps> = ({
  isOpen,
  onClose,
  boardId,
  boardTitle,
  onCardClick,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<AIBoardSummary | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>('Just now');
  const [apiKeyInput, setApiKeyInput] = useState<string>(() => localStorage.getItem('gemini_api_key') || '');
  const [showKeyConfig, setShowKeyConfig] = useState<boolean>(false);

  const loadSummary = async (overrideKey?: string) => {
    try {
      setLoading(true);
      setError(null);
      const keyToUse = overrideKey !== undefined ? overrideKey : (apiKeyInput || localStorage.getItem('gemini_api_key') || undefined);
      const data = await fetchAIBoardSummary(boardId, keyToUse);
      setSummary(data);
      setLastUpdated('Just now');
    } catch (err: any) {
      console.error('Failed to load AI board summary:', err);
      setError(err?.message || 'Unable to generate board summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadSummary();
    }
  }, [isOpen, boardId]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!summary) return;
    const textLines = [
      `📊 Board Summary: ${boardTitle}`,
      `Generated: ${new Date(summary.generatedAt).toLocaleString()}`,
      '',
      `Situation Assessment:`,
      summary.situationAssessment || 'N/A',
      '',
      `Executive Overview:`,
      summary.overviewNarrative,
      '',
      `Key Metrics:`,
      `• Completed: ${summary.doneCount}`,
      `• Blockers: ${summary.blockerCount}`,
      `• Overdue: ${summary.overdueCount}`,
      `• Total Tasks: ${summary.totalCards}`,
    ];

    if (summary.recommendations && summary.recommendations.length > 0) {
      textLines.push('', 'Actionable Recommendations:');
      summary.recommendations.forEach((rec, idx) => {
        textLines.push(`${idx + 1}. ${rec}`);
      });
    }

    if (summary.attentionItems.length > 0) {
      textLines.push('', 'Needs Attention:');
      summary.attentionItems.forEach((item) => {
        textLines.push(`• [${item.badge}] ${item.title}: ${item.details}`);
      });
    }

    if (summary.listBreakdowns.length > 0) {
      textLines.push('', 'By List Breakdown:');
      summary.listBreakdowns.forEach((list) => {
        textLines.push(`• ${list.title} (${list.count} cards): ${list.summary}`);
      });
    }

    navigator.clipboard.writeText(textLines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveKey = () => {
    const trimmed = apiKeyInput.trim();
    localStorage.setItem('gemini_api_key', trimmed);
    setShowKeyConfig(false);
    loadSummary(trimmed);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-summary-title"
      className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 sm:p-6 transition-opacity animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[720px] max-h-[85vh] bg-surface text-text-primary rounded-2xl flex flex-col shadow-2xl border border-border overflow-hidden relative">
        {/* Fixed Header */}
        <header className="px-6 py-4 bg-surface flex items-center justify-between shrink-0 border-b border-border z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 border border-primary/20">
              <Icon name="auto_awesome" size={18} className="text-primary" />
            </div>
            <div className="flex flex-col">
              <h2 id="ai-summary-title" className="text-base sm:text-lg font-bold text-text-primary tracking-tight leading-snug">
                Board summary
              </h2>
              <span className="text-xs text-text-muted">
                {loading
                  ? 'Analyzing board...'
                  : summary?.isAIGenerated
                  ? 'Live Gemini AI Analysis'
                  : `Updated ${lastUpdated}`}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowKeyConfig(!showKeyConfig)}
              className="text-xs px-2.5 py-1 rounded-lg border border-border bg-surface-container hover:bg-surface-container-high text-text-secondary flex items-center gap-1 transition"
              title="Configure API Key"
            >
              <Icon name="security" size={14} className="text-text-muted" />
              <span className="hidden sm:inline">API Key</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-container transition-colors"
              title="Close summary"
              aria-label="Close summary modal"
            >
              <Icon name="close" size={20} />
            </button>
          </div>
        </header>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Key Configuration Drawer/Card */}
          {showKeyConfig && (
            <div className="p-3.5 rounded-xl bg-surface-container border border-border flex flex-col gap-2.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                  <Icon name="security" size={16} className="text-primary" />
                  Gemini API Key
                </span>
                <span className="text-[11px] text-text-muted">
                  Stored securely in your session
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="Enter GEMINI_API_KEY (AIza... or AQ...)"
                  className="flex-1 bg-surface text-text-primary placeholder:text-text-muted text-xs rounded-lg px-3 py-1.5 border border-border focus:border-primary focus:outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={handleSaveKey}
                  className="px-3 py-1.5 rounded-lg bg-primary text-primary-on-primary text-xs font-semibold hover:bg-primary-hover shadow-xs transition"
                >
                  Save & Analyze
                </button>
              </div>
            </div>
          )}

          {/* Loading Skeleton */}
          {loading && (
            <div className="space-y-5 animate-pulse">
              <section className="rounded-2xl p-5 bg-gradient-to-br from-primary/5 via-surface-container to-surface border border-primary/20 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-primary/15 animate-spin flex items-center justify-center">
                    <Icon name="sync" size={16} className="text-primary" />
                  </div>
                  <div className="h-4 bg-primary/20 rounded w-24"></div>
                </div>
                <div className="h-4 bg-surface-container-high rounded w-full"></div>
                <div className="h-4 bg-surface-container-high rounded w-5/6"></div>
                <div className="flex gap-2 pt-2">
                  <div className="h-6 bg-surface-container-high rounded-full w-20"></div>
                  <div className="h-6 bg-surface-container-high rounded-full w-24"></div>
                  <div className="h-6 bg-surface-container-high rounded-full w-24"></div>
                </div>
              </section>

              <section className="rounded-xl p-4 bg-accent-warning/10 border border-accent-warning/30 space-y-2">
                <div className="h-3.5 bg-accent-warning/30 rounded w-32"></div>
                <div className="h-10 bg-surface rounded-lg w-full border border-accent-warning/20"></div>
                <div className="h-10 bg-surface rounded-lg w-full border border-accent-warning/20"></div>
              </section>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 opacity-60">
                <div className="bg-surface rounded-xl p-3.5 border border-border h-28 flex flex-col justify-between">
                  <div className="h-4 bg-surface-container-low rounded w-1/2"></div>
                  <div className="h-8 bg-surface-container rounded border border-border"></div>
                </div>
                <div className="bg-surface rounded-xl p-3.5 border border-border h-28 flex flex-col justify-between">
                  <div className="h-4 bg-surface-container-low rounded w-1/2"></div>
                  <div className="h-8 bg-surface-container rounded border border-border"></div>
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="py-10 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-accent-danger/10 border border-accent-danger/30 flex items-center justify-center text-accent-danger shadow-xs">
                <Icon name="sync_problem" size={32} />
              </div>
              <div className="max-w-sm space-y-1">
                <h3 className="text-base font-bold text-text-primary">Unable to generate summary</h3>
                <p className="text-xs text-text-muted">{error}</p>
              </div>
              <button
                type="button"
                onClick={() => loadSummary()}
                className="mt-2 px-4 py-2 rounded-lg bg-surface text-text-primary border border-border text-xs font-semibold hover:bg-surface-container flex items-center gap-1.5 transition-all shadow-xs"
              >
                <Icon name="refresh" size={16} />
                <span>Retry</span>
              </button>
            </div>
          )}

          {/* Empty Board State */}
          {!loading && !error && summary && summary.totalCards === 0 && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xs">
                <Icon name="task_alt" size={32} />
              </div>
              <div className="max-w-sm space-y-1">
                <h3 className="text-base font-bold text-text-primary">No board activity recorded</h3>
                <p className="text-xs text-text-muted">
                  Add a few cards to get an AI summary and workflow diagnosis.
                </p>
              </div>
            </div>
          )}

          {/* Normal Summary Content */}
          {!loading && !error && summary && summary.totalCards > 0 && (
            <div className="space-y-5">
              {/* Executive Overview Card */}
              <section className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-primary/5 via-surface-container-low to-surface border border-primary/20 shadow-xs">
                <div className="relative flex items-center justify-between gap-2 pb-3.5 mb-3.5 border-b border-border">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary shadow-xs">
                      <Icon name="neurology" size={18} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs uppercase tracking-wider font-bold text-primary">
                        Summary
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-accent-success/15 text-accent-success tracking-wide flex items-center gap-1 border border-accent-success/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-success animate-pulse"></span>
                        {summary.isAIGenerated ? 'Live Gemini AI Analysis' : 'Live Analysis'}
                      </span>
                    </div>
                  </div>

                  {!summary.isAIGenerated && (
                    <button
                      type="button"
                      onClick={() => setShowKeyConfig(true)}
                      className="text-[11px] text-text-muted hover:text-text-primary bg-surface-container px-2 py-0.5 rounded-md border border-border flex items-center gap-1"
                    >
                      <Icon name="security" size={12} />
                      <span>Heuristic Mode (Set Key)</span>
                    </button>
                  )}
                </div>

                {/* Situation Assessment Highlight */}
                {summary.situationAssessment && (
                  <div className="mb-3.5 p-3 rounded-xl bg-primary/10 border border-primary/20 flex items-start gap-2.5">
                    <Icon name="insights" size={18} className="text-primary mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-primary block">
                        Situation Assessment
                      </span>
                      <p className="text-xs sm:text-sm font-semibold text-text-primary mt-0.5 leading-snug">
                        {summary.situationAssessment}
                      </p>
                    </div>
                  </div>
                )}

                {/* Narrative text */}
                <p className="text-sm sm:text-base text-text-primary leading-relaxed font-normal tracking-tight">
                  {summary.overviewNarrative}
                </p>

                {/* Stat pills */}
                <div className="flex flex-wrap items-center gap-2 pt-3.5 mt-3.5">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent-success/15 text-accent-success text-xs font-medium border border-accent-success/30">
                    <Icon name="check_circle" size={14} className="text-accent-success" />
                    <span className="font-semibold">{summary.doneCount} Done</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent-danger/15 text-accent-danger text-xs font-medium border border-accent-danger/30">
                    <Icon name="block" size={14} className="text-accent-danger" />
                    <span className="font-semibold">{summary.blockerCount} Blockers</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent-warning/15 text-accent-warning text-xs font-medium border border-accent-warning/30">
                    <Icon name="person_alert" size={14} className="text-accent-warning" />
                    <span className="font-semibold">{summary.overdueCount} Overdue</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container text-text-primary text-xs font-medium border border-border">
                    <span className="font-semibold">{summary.totalCards} Total Tasks</span>
                  </div>
                </div>
              </section>

              {/* Actionable Next Steps & Recommendations */}
              {summary.recommendations && summary.recommendations.length > 0 && (
                <section className="rounded-xl p-4 bg-surface-container border border-border shadow-xs space-y-2.5">
                  <div className="flex items-center gap-2">
                    <Icon name="task_alt" size={18} className="text-accent-success" />
                    <h3 className="text-xs uppercase font-bold tracking-wider text-text-primary">
                      Actionable Next Steps & Recommendations
                    </h3>
                  </div>
                  <ul className="space-y-1.5 pl-1">
                    {summary.recommendations.map((rec, i) => (
                      <li key={i} className="text-xs text-text-secondary flex items-start gap-2">
                        <span className="text-accent-success font-bold shrink-0">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Needs Attention Section */}
              {summary.attentionItems.length > 0 && (
                <section className="rounded-xl p-4 bg-accent-warning/10 border border-accent-warning/30 shadow-xs">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon name="warning" size={18} className="text-accent-warning" />
                    <h3 className="text-xs uppercase font-bold tracking-wider text-accent-warning">
                      Needs attention
                    </h3>
                  </div>
                  <div className="flex flex-col gap-2.5">
                    {summary.attentionItems.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          if (item.cardId && onCardClick) {
                            onCardClick(item.cardId);
                            onClose();
                          }
                        }}
                        className={`flex items-center justify-between gap-3 p-2.5 rounded-lg bg-surface/90 border border-accent-warning/20 hover:bg-surface transition-colors ${
                          item.cardId && onCardClick ? 'cursor-pointer hover:border-accent-warning/50' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {item.severity === 'high' ? (
                            <span className="relative flex h-2.5 w-2.5 shrink-0">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-danger opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent-danger"></span>
                            </span>
                          ) : (
                            <span className="w-2.5 h-2.5 rounded-full bg-accent-warning shrink-0"></span>
                          )}
                          <span className="text-xs text-text-primary truncate">
                            <strong className="font-semibold text-text-primary">{item.title}: </strong>
                            <span className="text-text-secondary">{item.details}</span>
                          </span>
                        </div>
                        <span
                          className={`shrink-0 px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide border ${
                            item.severity === 'high'
                              ? 'bg-accent-danger/15 text-accent-danger border-accent-danger/30'
                              : 'bg-accent-warning/15 text-accent-warning border-accent-warning/30'
                          }`}
                        >
                          {item.badge}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* By List Breakdown Section */}
              {summary.listBreakdowns.length > 0 && (
                <section className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs uppercase font-bold tracking-wider text-text-muted">
                      By List breakdown
                    </span>
                    <span className="text-xs text-text-muted">
                      {summary.listBreakdowns.length} active swimlanes
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {summary.listBreakdowns.map((list) => (
                      <div
                        key={list.listId}
                        className="bg-surface rounded-xl p-3.5 border border-border shadow-2xs hover:border-primary/40 transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold text-text-primary truncate">
                              {list.title}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-surface-container text-text-secondary text-xs font-semibold border border-border">
                              {list.count}
                            </span>
                          </div>
                          <p className="text-xs text-text-muted line-clamp-1 mt-0.5">
                            {list.summary}
                          </p>
                        </div>

                        {list.cards.length > 0 && (
                          <div className="mt-3 space-y-1.5">
                            {list.cards.map((card) => (
                              <div
                                key={card.id}
                                onClick={() => {
                                  if (onCardClick) {
                                    onCardClick(card.id);
                                    onClose();
                                  }
                                }}
                                className={`flex items-center justify-between p-2 rounded-lg bg-surface-container-low border border-border/60 hover:bg-surface-container transition-colors ${
                                  onCardClick ? 'cursor-pointer' : ''
                                }`}
                              >
                                <span className="text-xs text-text-primary truncate pr-2 font-medium">
                                  {card.title}
                                </span>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {card.tag && (
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                                        card.tagColor === 'red'
                                          ? 'bg-accent-danger/15 text-accent-danger border-accent-danger/30'
                                          : card.tagColor === 'amber'
                                          ? 'bg-accent-warning/15 text-accent-warning border-accent-warning/30'
                                          : card.tagColor === 'green'
                                          ? 'bg-accent-success/15 text-accent-success border-accent-success/30'
                                          : 'bg-surface-container text-text-secondary border-border'
                                      }`}
                                    >
                                      {card.tag}
                                    </span>
                                  )}
                                  {card.isUnassigned ? (
                                    <div
                                      className="w-5 h-5 rounded-full bg-surface-container text-text-muted flex items-center justify-center text-[10px] font-bold border border-border"
                                      title="Unassigned"
                                    >
                                      ?
                                    </div>
                                  ) : (
                                    <div
                                      className="w-5 h-5 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[10px] font-bold"
                                      title={card.assigneeName}
                                    >
                                      {card.assigneeInitials || '•'}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>

        {/* Fixed Footer */}
        <footer className="px-6 py-3.5 bg-surface border-t border-border flex flex-wrap items-center justify-between gap-3 shrink-0 z-10">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-warning opacity-60"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-warning"></span>
            </span>
            <span className="text-xs text-accent-warning font-medium">
              Live Board Synchronization
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              disabled={!summary || loading}
              className="px-3.5 py-1.5 rounded-lg border border-border text-text-primary text-xs font-semibold hover:bg-surface-container flex items-center gap-1.5 transition-colors shadow-2xs disabled:opacity-50"
            >
              <Icon name={copied ? 'check' : 'content_copy'} size={16} className={copied ? 'text-accent-success' : 'text-text-muted'} />
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
            <button
              type="button"
              onClick={() => loadSummary()}
              disabled={loading}
              className="px-3.5 py-1.5 rounded-lg bg-primary text-primary-on-primary text-xs font-semibold hover:bg-primary-hover flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
            >
              <Icon name="refresh" size={16} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};
