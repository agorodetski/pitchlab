import React, { useState, useEffect } from 'react';
import { RefreshCw, Mic, Edit2, Check, ArrowLeft, HelpCircle, MessageSquare, Send, ChevronDown, ChevronUp } from 'lucide-react';
import { FeedbackStyle, PitchMode, Scenario } from '../types';
import { postJsonWithTimeout } from '../utils/postJsonWithTimeout';

interface ScenarioCardProps {
  scenario: Scenario;
  mode: PitchMode;
  feedbackStyle: FeedbackStyle;
  onStartRecording: () => void;
  onRegenerate: () => void;
  onShufflePreset: () => void;
  onUpdateScenario: (updated: Scenario) => void;
  onBackToConfig: () => void;
  isRegenerating?: boolean;
}

export const ScenarioCard: React.FC<ScenarioCardProps> = ({
  scenario,
  mode,
  feedbackStyle,
  onStartRecording,
  onRegenerate,
  onShufflePreset,
  onUpdateScenario,
  onBackToConfig,
  isRegenerating = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(scenario.title);
  const [draftAudience, setDraftAudience] = useState(scenario.audience);
  const [draftContext, setDraftContext] = useState(scenario.context);
  const [draftObjective, setDraftObjective] = useState(scenario.objective);
  const [draftConstraint, setDraftConstraint] = useState(scenario.keyConstraint);
  const [draftCustomCriteria, setDraftCustomCriteria] = useState(scenario.customCriteria || '');

  // Clarifying Question State (1 Question per scenario)
  const [isQuestionOpen, setIsQuestionOpen] = useState(false);
  const [questionText, setQuestionText] = useState('');
  const [askedQuestion, setAskedQuestion] = useState<string | null>(null);
  const [questionAnswer, setQuestionAnswer] = useState<string | null>(null);
  const [isAsking, setIsAsking] = useState(false);
  const [questionError, setQuestionError] = useState<string | null>(null);

  // Reset question state when scenario changes
  useEffect(() => {
    setQuestionAnswer(null);
    setAskedQuestion(null);
    setQuestionText('');
    setIsQuestionOpen(false);
    setQuestionError(null);
    if (!isEditing) {
      setDraftTitle(scenario.title);
      setDraftAudience(scenario.audience);
      setDraftContext(scenario.context);
      setDraftObjective(scenario.objective);
      setDraftConstraint(scenario.keyConstraint);
      setDraftCustomCriteria(scenario.customCriteria || '');
    }
  }, [scenario.title, scenario.audience, scenario.objective]);

  const handleSaveEdit = () => {
    const updated: Scenario = {
      ...scenario,
      title: draftTitle.trim() || scenario.title,
      audience: draftAudience.trim() || scenario.audience,
      context: draftContext.trim() || scenario.context,
      objective: draftObjective.trim() || scenario.objective,
      keyConstraint: draftConstraint.trim() || scenario.keyConstraint,
      customCriteria: draftCustomCriteria.trim() || undefined,
    };
    onUpdateScenario(updated);
    setIsEditing(false);
  };

  const handleProceedToRecording = () => {
    if (isEditing) {
      const updated: Scenario = {
        ...scenario,
        title: draftTitle.trim() || scenario.title,
        audience: draftAudience.trim() || scenario.audience,
        context: draftContext.trim() || scenario.context,
        objective: draftObjective.trim() || scenario.objective,
        keyConstraint: draftConstraint.trim() || scenario.keyConstraint,
        customCriteria: draftCustomCriteria.trim() || undefined,
      };
      onUpdateScenario(updated);
      setIsEditing(false);
    }
    onStartRecording();
  };

  const handleAskQuestion = async (textToAsk?: string) => {
    const q = (textToAsk || questionText).trim();
    if (!q || isAsking) return;

    setIsAsking(true);
    setQuestionError(null);

    const activeScenario: Scenario = isEditing
      ? {
          ...scenario,
          title: draftTitle.trim() || scenario.title,
          audience: draftAudience.trim() || scenario.audience,
          context: draftContext.trim() || scenario.context,
          objective: draftObjective.trim() || scenario.objective,
          keyConstraint: draftConstraint.trim() || scenario.keyConstraint,
          customCriteria: draftCustomCriteria.trim() || undefined,
        }
      : scenario;

    try {
      const data = await postJsonWithTimeout(
        '/api/scenario-question',
        {
          scenario: activeScenario,
          question: q,
          mode,
          feedbackStyle,
        },
        25000
      );
      if (!data.success || !data.answer) {
        throw new Error(data.error || 'Failed to get answer. Please try again.');
      }

      setAskedQuestion(q);
      setQuestionAnswer(data.answer);
      setQuestionText('');
    } catch (err: any) {
      console.error('Error asking scenario question:', err);
      setQuestionError(err.message || 'Unable to answer question right now.');
    } finally {
      setIsAsking(false);
    }
  };

  const getFormatLabel = () => {
    switch (mode) {
      case 'startup':
        return 'Startup Pitch';
      case 'consulting':
        return 'Consulting Case';
      case 'elevator':
        return 'Elevator Pitch';
      case 'freestyle':
        return 'Freestyle Pitch';
    }
  };

  const sampleQuestions = [
    'What metric will convince this audience most?',
    'How should I structure the opening 10 seconds?',
    'What is their biggest unspoken hesitation?',
  ];

  return (
    <div className="w-full max-w-xl mx-auto space-y-4 pt-1 pb-6">
      {/* Top Breadcrumb & Metadata */}
      <div className="flex items-center justify-between px-0.5">
        <button
          onClick={onBackToConfig}
          className="text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Setup</span>
        </button>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span>{getFormatLabel()}</span>
          <span>·</span>
          <span>{feedbackStyle === 'tough' ? 'Tough Investor' : 'Supportive Mentor'}</span>
        </div>
      </div>

      {/* Main Scenario Container */}
      <div className="bg-white border border-zinc-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
        {/* Title and Edit Trigger */}
        <div className="flex items-start justify-between gap-3 border-b border-zinc-100 pb-4">
          <div className="space-y-1 flex-1">
            <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
              Assigned Scenario
            </span>
            {isEditing ? (
              <input
                type="text"
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-2.5 py-1.5 text-base font-semibold text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#0f1d40]"
              />
            ) : (
              <h2 className="text-lg sm:text-xl font-semibold text-zinc-900 tracking-tight">
                {scenario.title}
              </h2>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isEditing && (
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-2.5 py-1 text-xs font-semibold text-white bg-[#0f1d40] hover:bg-[#162a5c] rounded-lg flex items-center gap-1 shadow-xs transition-colors"
                title="Save changes to scenario"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            )}
            <button
              onClick={() => {
                if (isEditing) {
                  handleSaveEdit();
                } else {
                  setDraftTitle(scenario.title);
                  setDraftAudience(scenario.audience);
                  setDraftContext(scenario.context);
                  setDraftObjective(scenario.objective);
                  setDraftConstraint(scenario.keyConstraint);
                  setDraftCustomCriteria(scenario.customCriteria || '');
                  setIsEditing(true);
                }
              }}
              aria-label={isEditing ? 'Save' : 'Edit Scenario'}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors shrink-0"
              title={isEditing ? 'Save' : 'Edit Scenario'}
            >
              {isEditing ? <Check className="w-4 h-4 text-[#0f1d40]" /> : <Edit2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Audience */}
        <div className="space-y-1">
          <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
            Target Audience
          </div>
          {isEditing ? (
            <input
              type="text"
              value={draftAudience}
              onChange={(e) => setDraftAudience(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-2.5 py-1 text-xs text-zinc-900"
            />
          ) : (
            <div className="text-sm font-medium text-zinc-900">{scenario.audience}</div>
          )}
        </div>

        {/* Context */}
        <div className="space-y-1">
          <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
            Context
          </div>
          {isEditing ? (
            <textarea
              rows={2}
              value={draftContext}
              onChange={(e) => setDraftContext(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-300 rounded-lg p-2 text-xs text-zinc-900"
            />
          ) : (
            <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">{scenario.context}</p>
          )}
        </div>

        {/* Objective */}
        <div className="space-y-1 bg-zinc-50/70 border border-zinc-200/70 p-3.5 rounded-xl">
          <div className="text-[11px] font-semibold text-zinc-900 uppercase tracking-wider">
            Your Objective (60s Limit)
          </div>
          {isEditing ? (
            <textarea
              rows={2}
              value={draftObjective}
              onChange={(e) => setDraftObjective(e.target.value)}
              className="w-full bg-white border border-zinc-300 rounded-lg p-2 text-xs text-zinc-900"
            />
          ) : (
            <p className="text-xs sm:text-sm text-zinc-800 leading-relaxed font-normal">
              {scenario.objective}
            </p>
          )}
        </div>

        {/* Skepticism / Curveball */}
        <div className="space-y-1 border border-zinc-200/70 p-3.5 rounded-xl">
          <div className="text-[11px] font-semibold text-zinc-900 uppercase tracking-wider">
            Audience Skepticism / Constraint
          </div>
          {isEditing ? (
            <textarea
              rows={2}
              value={draftConstraint}
              onChange={(e) => setDraftConstraint(e.target.value)}
              className="w-full bg-white border border-zinc-300 rounded-lg p-2 text-xs text-zinc-900"
            />
          ) : (
            <p className="text-xs text-zinc-600 leading-relaxed">{scenario.keyConstraint}</p>
          )}
        </div>

        {/* Custom Evaluation Criteria */}
        {(scenario.customCriteria || isEditing) && (
          <div className="space-y-1 bg-blue-50/50 border border-blue-200/60 p-3.5 rounded-xl">
            <div className="text-[11px] font-semibold text-[#0f1d40] uppercase tracking-wider flex items-center justify-between">
              <span>Custom Evaluation Criteria</span>
              <span className="text-[10px] text-zinc-400 font-normal">Scorecard will grade this</span>
            </div>
            {isEditing ? (
              <textarea
                rows={2}
                value={draftCustomCriteria}
                onChange={(e) => setDraftCustomCriteria(e.target.value)}
                placeholder="Enter specific criteria or focus points you want evaluated..."
                className="w-full bg-white border border-blue-200 rounded-lg p-2 text-xs text-zinc-900 placeholder:text-zinc-400"
              />
            ) : (
              <p className="text-xs sm:text-sm text-zinc-800 leading-relaxed">
                {scenario.customCriteria}
              </p>
            )}
          </div>
        )}

        {/* Tip */}
        {scenario.starterTip && !isEditing && (
          <div className="text-xs text-zinc-500 bg-zinc-50 px-3 py-2.5 rounded-xl border border-zinc-200/60 leading-relaxed">
            <span className="font-semibold text-zinc-700">Recommended approach: </span>
            {scenario.starterTip}
          </div>
        )}

        {/* ASK ONE QUESTION SECTION */}
        <div className="pt-2 border-t border-zinc-100 space-y-2.5">
          {/* Button to toggle or show question section */}
          {!questionAnswer ? (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setIsQuestionOpen(!isQuestionOpen)}
                className="w-full py-2 px-3 rounded-lg bg-zinc-50 hover:bg-zinc-100 text-zinc-700 font-medium text-xs flex items-center justify-between border border-zinc-200/90 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-[#0f1d40]" />
                  <span>Ask a clarifying question about this scenario (1 limit)</span>
                </span>
                {isQuestionOpen ? (
                  <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                )}
              </button>

              {/* Expandable Question Input Area */}
              {isQuestionOpen && (
                <div className="p-3 bg-zinc-50/70 border border-zinc-200 rounded-xl space-y-2.5">
                  <div className="text-[11px] text-zinc-500">
                    Need clarity on how to position your answer? Ask one question before you hit record:
                  </div>

                  {/* Sample Question Chips */}
                  <div className="flex flex-wrap gap-1">
                    {sampleQuestions.map((sq, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setQuestionText(sq);
                          handleAskQuestion(sq);
                        }}
                        disabled={isAsking}
                        className="text-[10px] text-left px-2 py-1 bg-white hover:bg-zinc-100 text-zinc-600 border border-zinc-200 rounded-md transition-colors disabled:opacity-50"
                      >
                        {sq}
                      </button>
                    ))}
                  </div>

                  {/* Custom Write-In Input */}
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={questionText}
                      onChange={(e) => setQuestionText(e.target.value)}
                      placeholder="Type your question..."
                      disabled={isAsking}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAskQuestion();
                        }
                      }}
                      className="flex-1 bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#0f1d40] disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => handleAskQuestion()}
                      disabled={isAsking || !questionText.trim()}
                      className="px-3 py-1.5 rounded-lg bg-[#0f1d40] hover:bg-[#162a5c] text-white text-xs font-medium flex items-center gap-1 transition-colors disabled:opacity-50 shrink-0"
                    >
                      {isAsking ? (
                        <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Send className="w-3 h-3" />
                      )}
                      <span>Ask</span>
                    </button>
                  </div>

                  {questionError && (
                    <div className="text-[11px] text-rose-600 font-medium">
                      {questionError}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Answered Question Display Card */
            <div className="p-3.5 bg-blue-50/50 border border-blue-100 rounded-xl space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-[#0f1d40]">Clarification Answered</span>
                <span className="text-zinc-400">1 of 1 Question Asked</span>
              </div>
              <div className="font-medium text-zinc-800 italic">
                "{askedQuestion}"
              </div>
              <p className="text-zinc-600 leading-relaxed pt-1 border-t border-blue-100/80">
                {questionAnswer}
              </p>
            </div>
          )}
        </div>

        {/* Scenario Controls */}
        <div className="flex items-center gap-2 pt-1 border-t border-zinc-100">
          <button
            type="button"
            onClick={onRegenerate}
            disabled={isRegenerating || isEditing}
            className="flex-1 py-2 px-3 rounded-lg bg-zinc-50 hover:bg-zinc-100 text-zinc-700 font-medium text-xs flex items-center justify-center gap-1.5 border border-zinc-200/80 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-zinc-500 ${isRegenerating ? 'animate-spin' : ''}`} />
            <span>{isRegenerating ? 'Generating...' : 'Regenerate Scenario'}</span>
          </button>

          <button
            type="button"
            onClick={onShufflePreset}
            disabled={isRegenerating || isEditing}
            className="py-2 px-3 rounded-lg bg-zinc-50 hover:bg-zinc-100 text-zinc-700 font-medium text-xs flex items-center justify-center border border-zinc-200/80 transition-colors"
          >
            <span>Preset List</span>
          </button>
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="pt-1">
        <button
          type="button"
          onClick={handleProceedToRecording}
          className="w-full py-3.5 px-4 rounded-xl bg-[#0f1d40] hover:bg-[#162a5c] text-white font-medium text-sm flex items-center justify-center gap-2 shadow-xs transition-colors"
        >
          <Mic className="w-4 h-4" />
          <span>Proceed to Recorder (60s)</span>
        </button>
      </div>
    </div>
  );
};
