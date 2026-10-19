import React, { useState } from 'react';
import {
  X,
  Trash2,
  Bookmark,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Award,
  Sparkles,
  TrendingUp,
  Edit3,
  Check,
} from 'lucide-react';
import { PitchMode, SavedPitchSession } from '../types';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: SavedPitchSession[];
  onSelectSession: (session: SavedPitchSession) => void;
  onClearHistory: () => void;
  onDeleteSession?: (id: string) => void;
  onUpdateSessionNotes?: (id: string, notes: string) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  sessions,
  onSelectSession,
  onClearHistory,
  onDeleteSession,
  onUpdateSessionNotes,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | PitchMode>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');

  if (!isOpen) return null;

  // Filter sessions
  const filteredSessions = sessions.filter((s) => {
    const matchesMode = filterMode === 'all' || s.mode === filterMode;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      s.scenario.title.toLowerCase().includes(query) ||
      s.scenario.audience.toLowerCase().includes(query) ||
      (s.userNotes && s.userNotes.toLowerCase().includes(query));
    return matchesMode && matchesSearch;
  });

  // Calculate library statistics
  const totalSessions = sessions.length;
  const avgScore =
    totalSessions > 0
      ? (
          sessions.reduce((acc, s) => acc + (s.evalR2?.scores.overall ?? s.evalR1.scores.overall), 0) /
          totalSessions
        ).toFixed(1)
      : '0.0';

  const bestScore =
    totalSessions > 0
      ? Math.max(
          ...sessions.map((s) => s.evalR2?.scores.overall ?? s.evalR1.scores.overall)
        ).toFixed(1)
      : '0.0';

  const handleStartEditNotes = (session: SavedPitchSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingNotesId(session.id);
    setNoteDraft(session.userNotes || '');
  };

  const handleSaveNotes = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onUpdateSessionNotes) {
      onUpdateSessionNotes(id, noteDraft.trim());
    }
    setEditingNotesId(null);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDeleteSession) {
      onDeleteSession(id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-900/30 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white border border-zinc-200/90 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-100 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#0f1d40] flex items-center justify-center text-white shadow-xs">
                <Bookmark className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm sm:text-base text-zinc-900">Pitch Library</h3>
                <p className="text-xs text-zinc-500">Stored practice pitches & scorecard records</p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close Pitch Library"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Metrics Bar if pitches exist */}
          {totalSessions > 0 && (
            <div className="grid grid-cols-3 gap-2 pt-1 text-center bg-zinc-50 p-2.5 rounded-xl border border-zinc-200/60">
              <div>
                <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-medium">
                  Stored Pitches
                </div>
                <div className="text-sm font-semibold text-zinc-900 font-mono">{totalSessions}</div>
              </div>
              <div>
                <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-medium">
                  Average Score
                </div>
                <div className="text-sm font-semibold text-[#0f1d40] font-mono">{avgScore} / 10</div>
              </div>
              <div>
                <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-medium">
                  Top Score
                </div>
                <div className="text-sm font-semibold text-emerald-700 font-mono">{bestScore} / 10</div>
              </div>
            </div>
          )}

          {/* Search & Mode Filters */}
          {totalSessions > 0 && (
            <div className="space-y-2 pt-0.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search pitches by title, audience, or notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200/90 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#0f1d40]"
                />
              </div>

              <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                {(['all', 'startup', 'consulting', 'elevator', 'freestyle'] as const).map((m) => {
                  const isSelected = filterMode === m;
                  const label =
                    m === 'all'
                      ? 'All'
                      : m === 'startup'
                      ? 'Startup'
                      : m === 'consulting'
                      ? 'Consulting'
                      : m === 'elevator'
                      ? 'Elevator'
                      : 'Freestyle';
                  return (
                    <button
                      key={m}
                      onClick={() => setFilterMode(m)}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-all shrink-0 ${
                        isSelected
                          ? 'bg-[#0f1d40] text-white border-[#0f1d40] font-medium'
                          : 'bg-white text-zinc-600 border-zinc-200/80 hover:border-zinc-300'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sessions List */}
        <div className="p-4 overflow-y-auto space-y-2.5 flex-1">
          {totalSessions === 0 ? (
            <div className="text-center py-12 px-4 space-y-2 text-zinc-400">
              <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400">
                <Bookmark className="w-5 h-5" />
              </div>
              <div className="text-xs font-semibold text-zinc-700">Your Pitch Library is empty</div>
              <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
                Practice any pitch and tap <strong>"Save to Pitch Library"</strong> on your scorecard to store your practice sessions and track your growth over time.
              </p>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="text-center py-10 text-zinc-400 text-xs">
              No pitches matched your search filter.
            </div>
          ) : (
            filteredSessions.map((s) => {
              const dateStr = new Date(s.timestamp).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });
              const r1Score = s.evalR1.scores.overall;
              const r2Score = s.evalR2?.scores.overall;
              const isExpanded = expandedId === s.id;
              const isEditingNotes = editingNotesId === s.id;
              const delta = r2Score !== undefined ? r2Score - r1Score : null;

              return (
                <div
                  key={s.id}
                  className="bg-white border border-zinc-200/80 hover:border-zinc-300 rounded-xl p-3.5 transition-all shadow-xs space-y-2"
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-[11px] text-zinc-400 flex-wrap">
                        <span className="capitalize text-zinc-700 font-semibold bg-zinc-100 px-1.5 py-0.5 rounded text-[10px]">
                          {s.mode}
                        </span>
                        <span>·</span>
                        <span>{dateStr}</span>
                        <span>·</span>
                        <span className="text-zinc-500">
                          {s.feedbackStyle === 'tough' ? 'Tough Investor' : 'Mentor'}
                        </span>
                      </div>

                      <h4 className="text-xs font-semibold text-zinc-900 truncate">
                        {s.scenario.title}
                      </h4>
                      <p className="text-[11px] text-zinc-500 line-clamp-1">{s.scenario.audience}</p>
                    </div>

                    {/* Score Badges */}
                    <div className="text-right shrink-0">
                      <div className="flex items-baseline justify-end gap-1 font-mono">
                        <span className="text-sm font-semibold text-zinc-900 tabular-nums">
                          {r1Score.toFixed(1)}
                        </span>
                        {r2Score !== undefined && (
                          <>
                            <span className="text-xs text-zinc-400">→</span>
                            <span className="text-sm font-semibold text-[#0f1d40] tabular-nums">
                              {r2Score.toFixed(1)}
                            </span>
                          </>
                        )}
                        <span className="text-[10px] text-zinc-400">/ 10</span>
                      </div>
                      {delta !== null && (
                        <div
                          className={`text-[10px] font-semibold ${
                            delta > 0
                              ? 'text-emerald-700'
                              : delta < 0
                              ? 'text-rose-700'
                              : 'text-zinc-400'
                          }`}
                        >
                          {delta > 0 ? `+${delta.toFixed(1)} gain` : delta < 0 ? `${delta.toFixed(1)}` : 'No delta'}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Personal Note if exists or when editing */}
                  {isEditingNotes ? (
                    <div className="pt-1.5 space-y-1.5 border-t border-zinc-100">
                      <textarea
                        rows={2}
                        value={noteDraft}
                        onChange={(e) => setNoteDraft(e.target.value)}
                        placeholder="Add personal notes or takeaways from this practice..."
                        className="w-full bg-zinc-50 border border-zinc-300 rounded-lg p-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#0f1d40]"
                        autoFocus
                      />
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingNotesId(null);
                          }}
                          className="px-2 py-1 text-xs text-zinc-500 hover:text-zinc-700"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={(e) => handleSaveNotes(s.id, e)}
                          className="px-2.5 py-1 text-xs bg-[#0f1d40] text-white rounded-md font-medium flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          <span>Save Note</span>
                        </button>
                      </div>
                    </div>
                  ) : s.userNotes ? (
                    <div className="pt-1 text-[11px] bg-zinc-50/80 p-2 rounded-lg border border-zinc-200/60 text-zinc-700 flex items-start justify-between gap-2">
                      <div className="flex-1 italic">"{s.userNotes}"</div>
                      <button
                        onClick={(e) => handleStartEditNotes(s, e)}
                        className="text-zinc-400 hover:text-zinc-700 p-0.5"
                        title="Edit Note"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                    </div>
                  ) : null}

                  {/* Expandable Breakdown Drawer */}
                  {isExpanded && (
                    <div className="pt-2 border-t border-zinc-100 space-y-2 text-xs">
                      <div className="grid grid-cols-2 gap-2 text-[11px] bg-zinc-50 p-2.5 rounded-lg border border-zinc-200/60">
                        <div>
                          <span className="text-zinc-400">Clarity:</span>{' '}
                          <span className="font-semibold text-zinc-800">{s.evalR1.scores.clarity}/10</span>
                        </div>
                        <div>
                          <span className="text-zinc-400">Structure:</span>{' '}
                          <span className="font-semibold text-zinc-800">{s.evalR1.scores.structure}/10</span>
                        </div>
                        <div>
                          <span className="text-zinc-400">Persuasiveness:</span>{' '}
                          <span className="font-semibold text-zinc-800">{s.evalR1.scores.persuasiveness}/10</span>
                        </div>
                        <div>
                          <span className="text-zinc-400">Confidence:</span>{' '}
                          <span className="font-semibold text-zinc-800">{s.evalR1.scores.confidence}/10</span>
                        </div>
                        <div>
                          <span className="text-zinc-400">Concision:</span>{' '}
                          <span className="font-semibold text-zinc-800">{s.evalR1.scores.concision}/10</span>
                        </div>
                        <div>
                          <span className="text-zinc-400">Rounds:</span>{' '}
                          <span className="font-semibold text-zinc-800">{s.evalR2 ? '2 (with comparison)' : '1 round'}</span>
                        </div>
                      </div>

                      {s.evalR1.followUpQuestion && (
                        <div className="text-[11px] text-zinc-600 bg-blue-50/60 p-2 rounded-lg border border-blue-100/70">
                          <span className="font-semibold text-[#0f1d40]">Follow-Up Challenge: </span>
                          "{s.evalR1.followUpQuestion}"
                        </div>
                      )}

                      {s.scenario.customCriteria && (
                        <div className="text-[11px] text-zinc-600 bg-blue-50/50 p-2 rounded-lg border border-blue-100/70">
                          <span className="font-semibold text-[#0f1d40]">Custom Criteria: </span>
                          "{s.scenario.customCriteria}"
                        </div>
                      )}
                    </div>
                  )}

                  {/* Card Actions */}
                  <div className="flex items-center justify-between pt-1 border-t border-zinc-100/80 text-xs">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : s.id)}
                      className="text-[11px] text-zinc-500 hover:text-zinc-800 flex items-center gap-1 py-1"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-3 h-3" />
                          <span>Hide details</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3 h-3" />
                          <span>View breakdown</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-2">
                      {!s.userNotes && !isEditingNotes && (
                        <button
                          onClick={(e) => handleStartEditNotes(s, e)}
                          className="text-[11px] text-zinc-400 hover:text-zinc-700 py-1"
                        >
                          + Add note
                        </button>
                      )}

                      {onDeleteSession && (
                        <button
                          onClick={(e) => handleDelete(s.id, e)}
                          className="text-zinc-400 hover:text-rose-600 p-1"
                          title="Delete from library"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => {
                          onSelectSession(s);
                          onClose();
                        }}
                        className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-[#0f1d40] hover:text-white text-zinc-800 text-[11px] font-medium flex items-center gap-1 transition-colors"
                      >
                        <span>Review Pitch</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 border-t border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          {totalSessions > 0 ? (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to clear your entire Pitch Library?')) {
                  onClearHistory();
                }
              }}
              className="flex items-center gap-1 text-xs text-zinc-400 hover:text-rose-600 px-2 py-1 rounded-md transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear Library</span>
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#0f1d40] hover:bg-[#162a5c] text-xs font-medium text-white transition-colors shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
