import React, { useState } from 'react';
import {
  Play,
  Pause,
  Check,
  Share2,
  RotateCcw,
  ArrowUpRight,
  ArrowDownRight,
  Bookmark,
  Edit3,
} from 'lucide-react';
import { FeedbackStyle, PitchEvaluation, PitchMode, Scenario } from '../types';

interface ComparisonViewProps {
  scenario: Scenario;
  mode: PitchMode;
  feedbackStyle: FeedbackStyle;
  evalR1: PitchEvaluation;
  evalR2: PitchEvaluation;
  audioR1Url?: string | null;
  audioR2Url?: string | null;
  onReset: () => void;
  onSaveToLibrary?: (notes?: string) => void;
  isSaved?: boolean;
  onOpenLibrary?: () => void;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({
  scenario,
  mode,
  feedbackStyle,
  evalR1,
  evalR2,
  audioR1Url,
  audioR2Url,
  onReset,
  onSaveToLibrary,
  isSaved = false,
  onOpenLibrary,
}) => {
  const [playingAudio, setPlayingAudio] = useState<'r1' | 'r2' | null>(null);
  const [copied, setCopied] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);

  const audioR1Ref = React.useRef<HTMLAudioElement | null>(null);
  const audioR2Ref = React.useRef<HTMLAudioElement | null>(null);

  const deltaOverall = evalR2.scores.overall - evalR1.scores.overall;

  const togglePlay = (round: 'r1' | 'r2') => {
    if (round === 'r1') {
      if (audioR2Ref.current) audioR2Ref.current.pause();
      if (playingAudio === 'r1') {
        audioR1Ref.current?.pause();
        setPlayingAudio(null);
      } else {
        audioR1Ref.current?.play().then(() => setPlayingAudio('r1')).catch(() => {});
      }
    } else {
      if (audioR1Ref.current) audioR1Ref.current.pause();
      if (playingAudio === 'r2') {
        audioR2Ref.current?.pause();
        setPlayingAudio(null);
      } else {
        audioR2Ref.current?.play().then(() => setPlayingAudio('r2')).catch(() => {});
      }
    }
  };

  const handleSaveClick = () => {
    if (onSaveToLibrary) {
      onSaveToLibrary(noteText.trim() || undefined);
    }
  };

  const dimensions = [
    {
      key: 'clarity' as const,
      label: 'Clarity',
      r1: evalR1.scores.clarity,
      r2: evalR2.scores.clarity,
      f2: evalR2.feedback.clarity,
    },
    {
      key: 'structure' as const,
      label: 'Structure',
      r1: evalR1.scores.structure,
      r2: evalR2.scores.structure,
      f2: evalR2.feedback.structure,
    },
    {
      key: 'persuasiveness' as const,
      label: 'Persuasiveness',
      r1: evalR1.scores.persuasiveness,
      r2: evalR2.scores.persuasiveness,
      f2: evalR2.feedback.persuasiveness,
    },
    {
      key: 'confidence' as const,
      label: 'Confidence',
      r1: evalR1.scores.confidence,
      r2: evalR2.scores.confidence,
      f2: evalR2.feedback.confidence,
    },
    {
      key: 'concision' as const,
      label: 'Concision',
      r1: evalR1.scores.concision,
      r2: evalR2.scores.concision,
      f2: evalR2.feedback.concision,
    },
  ];

  const handleCopyReport = () => {
    const reportText = `PitchLab Practice Session Report
Scenario: ${scenario.title} (${scenario.audience})
Round 1 Overall: ${evalR1.scores.overall.toFixed(1)}/10
Round 2 Overall: ${evalR2.scores.overall.toFixed(1)}/10 (${deltaOverall >= 0 ? `+${deltaOverall.toFixed(1)}` : deltaOverall.toFixed(1)})
Clarity: ${evalR1.scores.clarity} -> ${evalR2.scores.clarity}
Structure: ${evalR1.scores.structure} -> ${evalR2.scores.structure}
Persuasiveness: ${evalR1.scores.persuasiveness} -> ${evalR2.scores.persuasiveness}
Confidence: ${evalR1.scores.confidence} -> ${evalR2.scores.confidence}
Concision: ${evalR1.scores.concision} -> ${evalR2.scores.concision}`;

    navigator.clipboard.writeText(reportText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-4 pt-1 pb-8">
      {/* Hidden audio tags */}
      {audioR1Url && (
        <audio
          ref={audioR1Ref}
          src={audioR1Url}
          onEnded={() => setPlayingAudio(null)}
          className="hidden"
        />
      )}
      {audioR2Url && (
        <audio
          ref={audioR2Ref}
          src={audioR2Url}
          onEnded={() => setPlayingAudio(null)}
          className="hidden"
        />
      )}

      {/* Header Comparison Banner */}
      <div className="bg-white border border-zinc-200/90 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span className="font-medium text-zinc-700">Before & After Evaluation</span>
          <span>{feedbackStyle === 'tough' ? 'Tough Investor Review' : 'Supportive Mentor Review'}</span>
        </div>

        {/* Side by side score hero */}
        <div className="grid grid-cols-2 gap-3 py-1">
          {/* Round 1 */}
          <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/70 space-y-1">
            <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
              Round 1 (Initial Pitch)
            </span>
            <div className="flex items-baseline gap-1 font-mono">
              <span className="text-3xl font-semibold text-zinc-700 tabular-nums">
                {evalR1.scores.overall.toFixed(1)}
              </span>
              <span className="text-zinc-400 text-xs">/ 10</span>
            </div>
            {audioR1Url && (
              <button
                onClick={() => togglePlay('r1')}
                className="mt-2 flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-900 font-medium py-1"
              >
                {playingAudio === 'r1' ? (
                  <>
                    <Pause className="w-3 h-3 text-[#0f1d40] fill-[#0f1d40]" />
                    <span>Pause R1</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 text-[#0f1d40] fill-[#0f1d40]" />
                    <span>Listen to R1</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Round 2 */}
          <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-100 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-[#0f1d40] uppercase tracking-wider">
                Round 2 (Defense)
              </span>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-md flex items-center gap-0.5 ${
                  deltaOverall >= 0
                    ? 'bg-emerald-100/80 text-emerald-800'
                    : 'bg-rose-100/80 text-rose-800'
                }`}
              >
                {deltaOverall >= 0 ? (
                  <ArrowUpRight className="w-3 h-3 text-emerald-700 stroke-[2.5]" />
                ) : (
                  <ArrowDownRight className="w-3 h-3 text-rose-700 stroke-[2.5]" />
                )}
                <span>
                  {deltaOverall >= 0 ? `+${deltaOverall.toFixed(1)}` : deltaOverall.toFixed(1)}
                </span>
              </span>
            </div>

            <div className="flex items-baseline gap-1 font-mono">
              <span className="text-3xl font-semibold text-zinc-900 tabular-nums">
                {evalR2.scores.overall.toFixed(1)}
              </span>
              <span className="text-zinc-400 text-xs">/ 10</span>
            </div>

            {audioR2Url && (
              <button
                onClick={() => togglePlay('r2')}
                className="mt-2 flex items-center gap-1.5 text-xs text-[#0f1d40] hover:text-[#162a5c] font-medium py-1"
              >
                {playingAudio === 'r2' ? (
                  <>
                    <Pause className="w-3 h-3 text-[#0f1d40] fill-[#0f1d40]" />
                    <span>Pause R2</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 text-[#0f1d40] fill-[#0f1d40]" />
                    <span>Listen to R2</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Save to Pitch Library Action in Header */}
        {onSaveToLibrary && (
          <div className="pt-2 border-t border-zinc-100 flex items-center justify-between flex-wrap gap-2">
            <button
              type="button"
              onClick={handleSaveClick}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                isSaved
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-xs'
                  : 'bg-white hover:bg-zinc-50 text-[#0f1d40] border-[#0f1d40]/30 hover:border-[#0f1d40]'
              }`}
            >
              {isSaved ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                  <span>Saved in Pitch Library</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-3.5 h-3.5 text-[#0f1d40]" />
                  <span>Save Practice to Library</span>
                </>
              )}
            </button>

            {isSaved && onOpenLibrary && (
              <button
                type="button"
                onClick={onOpenLibrary}
                className="text-xs text-zinc-500 hover:text-zinc-900 underline underline-offset-2"
              >
                Open Pitch Library
              </button>
            )}
          </div>
        )}
      </div>

      {/* Coach Analysis Summary */}
      {evalR2.round2Comparison && (
        <div className="bg-white border border-zinc-200/90 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="text-xs font-semibold text-zinc-900">
            Coach's Objection Defense Analysis
          </div>
          <p className="text-xs text-zinc-600 leading-relaxed font-normal">
            {evalR2.round2Comparison.improvementSummary}
          </p>

          {evalR2.round2Comparison.keyWins && evalR2.round2Comparison.keyWins.length > 0 && (
            <div className="pt-2 space-y-1">
              <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
                Key Improvements:
              </span>
              <ul className="space-y-1">
                {evalR2.round2Comparison.keyWins.map((win, idx) => (
                  <li key={idx} className="text-xs text-zinc-700 flex items-start gap-1.5">
                    <span className="text-[#0f1d40] font-bold">·</span>
                    <span>{win}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Dimension Breakdown Table */}
      <div className="bg-white border border-zinc-200/90 rounded-2xl p-5 shadow-xs space-y-3">
        <div className="text-xs font-semibold text-zinc-900">
          Criteria Delta Breakdown
        </div>

        <div className="space-y-3 divide-y divide-zinc-100">
          {dimensions.map((d, idx) => {
            const diff = d.r2 - d.r1;
            return (
              <div key={d.key} className={idx > 0 ? 'pt-3 space-y-1' : 'space-y-1'}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-zinc-900">{d.label}</span>
                  <div className="flex items-center gap-2 font-mono tabular-nums text-xs">
                    <span className="text-zinc-400">{d.r1}</span>
                    <span className="text-zinc-300">→</span>
                    <span className="font-medium text-zinc-900">{d.r2}</span>
                    <span
                      className={`text-[11px] font-semibold ${
                        diff > 0
                          ? 'text-emerald-700'
                          : diff < 0
                          ? 'text-rose-700'
                          : 'text-zinc-400'
                      }`}
                    >
                      {diff > 0 ? `+${diff}` : diff < 0 ? `${diff}` : '0'}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-zinc-500 leading-relaxed font-normal">
                  {d.f2}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom Criteria Breakdown (if scenario or feedback has customCriteria) */}
      {(scenario.customCriteria || evalR1.feedback.customCriteria || evalR2.feedback.customCriteria) && (
        <div className="bg-white border border-zinc-200/90 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#0f1d40] uppercase tracking-wider">
              Custom Criteria Defense
            </span>
            <span className="text-[10px] text-zinc-400 font-normal">Your Specific Rubric</span>
          </div>

          {scenario.customCriteria && (
            <p className="text-xs text-zinc-600 font-normal bg-zinc-50 p-2.5 rounded-lg border border-zinc-200/60">
              <span className="font-semibold text-zinc-800">Target Standard: </span>
              {scenario.customCriteria}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {evalR1.feedback.customCriteria && (
              <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200/70 space-y-1">
                <span className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider">
                  Round 1 Assessment
                </span>
                <p className="text-xs text-zinc-700 leading-relaxed font-normal">
                  {evalR1.feedback.customCriteria}
                </p>
              </div>
            )}
            {evalR2.feedback.customCriteria && (
              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200/60 space-y-1">
                <span className="text-[10px] uppercase font-semibold text-[#0f1d40] tracking-wider">
                  Round 2 Defense Assessment
                </span>
                <p className="text-xs text-[#0f1d40] leading-relaxed font-medium">
                  {evalR2.feedback.customCriteria}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="space-y-2 pt-1">
        {/* Optional Add Note Field */}
        {!isSaved && onSaveToLibrary && (
          <div className="bg-white border border-zinc-200/90 rounded-2xl p-3.5 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-900">Pitch Library Notes</span>
              {!showNoteInput && (
                <button
                  type="button"
                  onClick={() => setShowNoteInput(true)}
                  className="text-xs text-[#0f1d40] hover:underline flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Add note</span>
                </button>
              )}
            </div>
            {showNoteInput && (
              <input
                type="text"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Key takeaways or focus areas for future pitches..."
                className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#0f1d40]"
              />
            )}
          </div>
        )}

        {/* Save to Pitch Library Button */}
        {onSaveToLibrary && (
          <button
            type="button"
            onClick={handleSaveClick}
            className={`w-full py-3 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all shadow-xs ${
              isSaved
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-white hover:bg-zinc-50 text-[#0f1d40] border-[#0f1d40]/40 hover:border-[#0f1d40]'
            }`}
          >
            {isSaved ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                <span>Saved to Pitch Library</span>
              </>
            ) : (
              <>
                <Bookmark className="w-3.5 h-3.5 text-[#0f1d40]" />
                <span>Save Practice to Pitch Library</span>
              </>
            )}
          </button>
        )}

        <button
          type="button"
          onClick={handleCopyReport}
          className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-50 text-zinc-800 font-medium text-xs flex items-center justify-center gap-2 border border-zinc-200/90 shadow-xs transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-[#0f1d40]" /> : <Share2 className="w-3.5 h-3.5 text-zinc-500" />}
          <span>{copied ? 'Copied report to clipboard' : 'Copy summary report'}</span>
        </button>

        <button
          type="button"
          onClick={onReset}
          className="w-full py-3.5 px-4 rounded-xl bg-[#0f1d40] hover:bg-[#162a5c] text-white font-medium text-sm flex items-center justify-center gap-2 shadow-xs transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Practice Another Scenario</span>
        </button>
      </div>
    </div>
  );
};
