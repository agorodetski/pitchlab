import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Play,
  Pause,
  Clock,
  RotateCcw,
  Bookmark,
  Check,
  Edit3,
} from 'lucide-react';
import { FeedbackStyle, PitchEvaluation, PitchMode, Scenario } from '../types';

interface EvaluationViewProps {
  evaluation: PitchEvaluation;
  scenario: Scenario;
  mode: PitchMode;
  feedbackStyle: FeedbackStyle;
  audioUrl?: string | null;
  onProceedToRound2: () => void;
  onReset: () => void;
  onSaveToLibrary?: (notes?: string) => void;
  isSaved?: boolean;
  onOpenLibrary?: () => void;
}

export const EvaluationView: React.FC<EvaluationViewProps> = ({
  evaluation,
  scenario,
  mode,
  feedbackStyle,
  audioUrl,
  onProceedToRound2,
  onReset,
  onSaveToLibrary,
  isSaved = false,
  onOpenLibrary,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showFullTranscript, setShowFullTranscript] = useState(false);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState('');
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play().then(() => setIsPlayingAudio(true)).catch(() => {});
    }
  };

  const handleSaveClick = () => {
    if (onSaveToLibrary) {
      onSaveToLibrary(noteText.trim() || undefined);
    }
  };

  const scoreDimensions = [
    {
      key: 'clarity' as const,
      label: 'Clarity',
      score: evaluation.scores.clarity,
      feedback: evaluation.feedback.clarity,
    },
    {
      key: 'structure' as const,
      label: 'Structure',
      score: evaluation.scores.structure,
      feedback: evaluation.feedback.structure,
    },
    {
      key: 'persuasiveness' as const,
      label: 'Persuasiveness',
      score: evaluation.scores.persuasiveness,
      feedback: evaluation.feedback.persuasiveness,
    },
    {
      key: 'confidence' as const,
      label: 'Confidence',
      score: evaluation.scores.confidence,
      feedback: evaluation.feedback.confidence,
    },
    {
      key: 'concision' as const,
      label: 'Concision',
      score: evaluation.scores.concision,
      feedback: evaluation.feedback.concision,
    },
  ];

  const getQualitativeRating = (score: number) => {
    if (score >= 8.5) return 'Executive Ready';
    if (score >= 7.0) return 'Solid Foundation';
    if (score >= 5.5) return 'Promising with Structural Flaws';
    return 'Needs Core Restructuring';
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-4 pt-1 pb-8">
      {/* Overall Score Header */}
      <div className="bg-white border border-zinc-200/90 rounded-2xl p-6 shadow-xs space-y-3">
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span className="font-medium text-zinc-700">Evaluation Scorecard</span>
          <span>{feedbackStyle === 'tough' ? 'Tough Investor Review' : 'Supportive Mentor Review'}</span>
        </div>

        <div className="flex items-baseline gap-2 pt-1">
          <span className="text-4xl sm:text-5xl font-semibold text-zinc-900 tracking-tight tabular-nums">
            {evaluation.scores.overall.toFixed(1)}
          </span>
          <span className="text-zinc-400 font-mono text-base">/ 10</span>
          <span className="ml-auto text-xs font-medium text-[#0f1d40] bg-blue-50/70 border border-blue-100 px-2.5 py-1 rounded-lg">
            {getQualitativeRating(evaluation.scores.overall)}
          </span>
        </div>

        {/* Audio Recording & Save to Library Bar */}
        <div className="pt-3 border-t border-zinc-100 flex items-center justify-between flex-wrap gap-2">
          {audioUrl ? (
            <div className="flex items-center gap-2">
              <audio
                ref={audioRef}
                src={audioUrl}
                onEnded={() => setIsPlayingAudio(false)}
                className="hidden"
              />
              <button
                onClick={toggleAudio}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-50 hover:bg-zinc-100 text-xs font-medium text-zinc-700 border border-zinc-200/80 transition-colors"
              >
                {isPlayingAudio ? (
                  <>
                    <Pause className="w-3.5 h-3.5 text-[#0f1d40] fill-[#0f1d40]" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 text-[#0f1d40] fill-[#0f1d40]" />
                    <span>Listen back</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div />
          )}

          {/* Save to Pitch Library Action */}
          {onSaveToLibrary && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveClick}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  isSaved
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-xs'
                    : 'bg-white hover:bg-zinc-50 text-[#0f1d40] border-[#0f1d40]/30 hover:border-[#0f1d40]'
                }`}
                title={isSaved ? 'Saved in Pitch Library' : 'Save this practice pitch to your library'}
              >
                {isSaved ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                    <span>Saved in Pitch Library</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="w-3.5 h-3.5 text-[#0f1d40]" />
                    <span>Save to Pitch Library</span>
                  </>
                )}
              </button>
              {isSaved && onOpenLibrary && (
                <button
                  type="button"
                  onClick={onOpenLibrary}
                  className="text-xs text-zinc-500 hover:text-zinc-900 underline underline-offset-2"
                >
                  View Library
                </button>
              )}
            </div>
          )}
        </div>

        {/* Optional Add Practice Note toggle */}
        {!isSaved && onSaveToLibrary && (
          <div className="pt-1">
            {showNoteInput ? (
              <div className="space-y-1.5 pt-1">
                <input
                  type="text"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Optional note for your library (e.g. Lead with traction next time)..."
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#0f1d40]"
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowNoteInput(true)}
                className="text-[11px] text-zinc-400 hover:text-zinc-600 flex items-center gap-1"
              >
                <Edit3 className="w-3 h-3" />
                <span>Add note before saving</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* 5 Core Evaluation Dimensions */}
      <div className="bg-white border border-zinc-200/90 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="text-xs font-semibold text-zinc-900">
          Core Criteria Breakdown
        </div>

        <div className="space-y-4 divide-y divide-zinc-100">
          {scoreDimensions.map((dim, idx) => (
            <div key={dim.key} className={idx > 0 ? 'pt-4 space-y-1.5' : 'space-y-1.5'}>
              <div className="flex items-center justify-between">
                <span className="font-medium text-xs text-zinc-900">{dim.label}</span>
                <span className="font-mono text-xs font-semibold text-zinc-700 tabular-nums">
                  {dim.score} / 10
                </span>
              </div>

              {/* Minimalist Progress Bar in Navy */}
              <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#0f1d40] rounded-full transition-all duration-500"
                  style={{ width: `${(dim.score / 10) * 100}%` }}
                />
              </div>

              {/* Feedback sentence */}
              <p className="text-xs text-zinc-500 leading-relaxed font-normal pt-0.5">
                {dim.feedback}
              </p>
            </div>
          ))}
        </div>

        {/* Custom Criteria Assessment */}
        {(scenario.customCriteria || evaluation.feedback.customCriteria) && (
          <div className="mt-4 pt-3.5 border-t border-zinc-100 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#0f1d40] uppercase tracking-wider">
                Custom Criteria Evaluation
              </span>
              <span className="text-[10px] text-zinc-400 font-normal">Your Specific Rubric</span>
            </div>
            {scenario.customCriteria && (
              <p className="text-xs text-zinc-500 font-normal">
                <span className="font-medium text-zinc-700">Specified: </span>
                {scenario.customCriteria}
              </p>
            )}
            {evaluation.feedback.customCriteria && (
              <div className="p-2.5 rounded-lg bg-blue-50/60 border border-blue-200/60 text-xs text-[#0f1d40] font-medium leading-relaxed">
                {evaluation.feedback.customCriteria}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pacing & Filler Words */}
      <div className="bg-white border border-zinc-200/90 rounded-2xl p-5 shadow-xs space-y-2.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-900">
          <Clock className="w-3.5 h-3.5 text-zinc-500" />
          <span>Filler Words & Pacing Observations</span>
        </div>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {evaluation.fillerWordsAndPacing && evaluation.fillerWordsAndPacing.length > 0 ? (
            evaluation.fillerWordsAndPacing.map((item, idx) => (
              <span
                key={idx}
                className="text-xs px-2.5 py-1 rounded-lg bg-zinc-50 text-zinc-700 border border-zinc-200/80 font-normal"
              >
                {item}
              </span>
            ))
          ) : (
            <span className="text-xs text-zinc-400 italic">
              Clean pacing detected with no obvious filler words.
            </span>
          )}
        </div>
      </div>

      {/* Transcript Collapsible */}
      <div className="bg-white border border-zinc-200/90 rounded-2xl p-4 shadow-xs space-y-2">
        <button
          onClick={() => setShowFullTranscript(!showFullTranscript)}
          className="w-full flex items-center justify-between text-left text-xs font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
        >
          <span>Speech Transcription</span>
          {showFullTranscript ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showFullTranscript && (
          <div className="pt-2 text-xs text-zinc-600 leading-relaxed bg-zinc-50 p-3 rounded-xl border border-zinc-200/70 font-mono">
            {evaluation.transcript || 'No audible speech detected.'}
          </div>
        )}
      </div>

      {/* THE TOUGH FOLLOW-UP QUESTION - Rich Navy Container */}
      <div className="bg-[#0b1633] border border-[#162a5c] text-white rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="space-y-1.5">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-blue-200/80">
            Follow-Up Challenge
          </span>
          <p className="text-base sm:text-lg font-medium text-white leading-snug">
            "{evaluation.followUpQuestion}"
          </p>
          <p className="text-xs text-blue-200/70 leading-relaxed pt-1">
            Test how effectively you defend against this pushback. Record a 60-second follow-up response to see your before-and-after comparison.
          </p>
        </div>

        <button
          type="button"
          onClick={onProceedToRound2}
          className="w-full py-3 px-4 rounded-xl bg-white hover:bg-zinc-100 text-[#0f1d40] font-semibold text-sm flex items-center justify-center gap-2 transition-colors shadow-xs"
        >
          <span>Record Follow-Up Answer (60s)</span>
          <ArrowRight className="w-4 h-4 text-[#0f1d40]" />
        </button>
      </div>

      {/* Reset Session */}
      <div className="text-center pt-1">
        <button
          type="button"
          onClick={onReset}
          className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors py-1 flex items-center justify-center gap-1 mx-auto"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Start New Pitch Practice</span>
        </button>
      </div>
    </div>
  );
};
