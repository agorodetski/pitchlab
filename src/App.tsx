import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ModeSelector } from './components/ModeSelector';
import { ScenarioCard } from './components/ScenarioCard';
import { AudioRecorderCard } from './components/AudioRecorderCard';
import { EvaluationView } from './components/EvaluationView';
import { ComparisonView } from './components/ComparisonView';
import { HistoryModal } from './components/HistoryModal';
import { DEFAULT_SCENARIOS, getPresets } from './data/presets';
import {
  FeedbackStyle,
  PitchEvaluation,
  PitchMode,
  SavedPitchSession,
  Scenario,
  ScenarioDifficulty,
} from './types';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { postJsonWithTimeout, RequestTimeoutError } from './utils/postJsonWithTimeout';

type FlowStep =
  | 'mode_selection'
  | 'scenario'
  | 'recording_r1'
  | 'analyzing_r1'
  | 'feedback_r1'
  | 'recording_r2'
  | 'analyzing_r2'
  | 'comparison';

const STORAGE_KEY = 'pitchlab_saved_sessions';

export default function App() {
  const [step, setStep] = useState<FlowStep>('mode_selection');
  const [mode, setMode] = useState<PitchMode>('startup');
  const [feedbackStyle, setFeedbackStyle] = useState<FeedbackStyle>('supportive');
  const [difficulty, setDifficulty] = useState<ScenarioDifficulty>('simple');
  const [scenario, setScenario] = useState<Scenario>(() => getPresets('startup', 'simple')[0]);

  // Audio & Evaluation State
  const [audioR1Blob, setAudioR1Blob] = useState<Blob | null>(null);
  const [audioR1Url, setAudioR1Url] = useState<string | null>(null);
  const [evalR1, setEvalR1] = useState<PitchEvaluation | null>(null);

  const [audioR2Blob, setAudioR2Blob] = useState<Blob | null>(null);
  const [audioR2Url, setAudioR2Url] = useState<string | null>(null);
  const [evalR2, setEvalR2] = useState<PitchEvaluation | null>(null);

  // Loading & Error States
  const [isGeneratingScenario, setIsGeneratingScenario] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  // Remembers the last scenario request so the user can retry the AI version after a failure or timeout
  const [scenarioRetry, setScenarioRetry] = useState<{
    industry?: string;
    freestyleDraft?: Partial<Scenario>;
    difficulty?: ScenarioDifficulty;
  } | null>(null);
  const [failedSubmission, setFailedSubmission] = useState<{
    audioBase64: string;
    mimeType: string;
    audioBlob: Blob;
    round: 1 | 2;
  } | null>(null);

  // Pitch Library / Saved Sessions State
  const [savedSessions, setSavedSessions] = useState<SavedPitchSession[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSavedR1, setIsSavedR1] = useState(false);
  const [isSavedR2, setIsSavedR2] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string>(
    () => `pitch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  );

  // Preset index tracker
  const [presetIndex, setPresetIndex] = useState(0);

  // Bring a new notice into view (on phones the page is often scrolled down after tapping a button near the bottom)
  useEffect(() => {
    if (errorMessage) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [errorMessage]);

  // Load saved history on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSavedSessions(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Failed to load pitch history from localStorage:', e);
    }
  }, []);

  // Auto-dismiss toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 3200);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  const handleSaveToLibrary = (round: 1 | 2, notes?: string) => {
    if (!evalR1) return;

    try {
      setSavedSessions((prev) => {
        const existingIdx = prev.findIndex((s) => s.id === currentSessionId);
        let updated: SavedPitchSession[];

        if (existingIdx >= 0) {
          // Update existing saved session
          const existing = prev[existingIdx];
          const updatedSession: SavedPitchSession = {
            ...existing,
            evalR1,
            evalR2: round === 2 && evalR2 ? evalR2 : existing.evalR2,
            userNotes: notes !== undefined ? notes : existing.userNotes,
          };
          updated = [
            updatedSession,
            ...prev.filter((s) => s.id !== currentSessionId),
          ];
        } else {
          // Create new session in library
          const newSession: SavedPitchSession = {
            id: currentSessionId,
            timestamp: Date.now(),
            mode,
            feedbackStyle,
            difficulty: scenario.difficulty || difficulty,
            scenario,
            evalR1,
            evalR2: round === 2 && evalR2 ? evalR2 : null,
            userNotes: notes,
          };
          updated = [newSession, ...prev].slice(0, 30);
        }

        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch (e) {
          console.warn('Failed to persist to localStorage:', e);
        }
        return updated;
      });

      if (round === 1) {
        setIsSavedR1(true);
        showToast('Pitch saved to your Pitch Library!');
      } else {
        setIsSavedR2(true);
        showToast('Complete before-and-after session saved to Pitch Library!');
      }
    } catch (e) {
      console.warn('Failed to save pitch to library:', e);
    }
  };

  const handleDeleteSession = (id: string) => {
    setSavedSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      } catch (e) {
        console.warn('Failed to update localStorage after delete:', e);
      }
      return filtered;
    });
    if (id === currentSessionId) {
      setIsSavedR1(false);
      setIsSavedR2(false);
    }
  };

  const handleUpdateSessionNotes = (id: string, notes: string) => {
    setSavedSessions((prev) => {
      const updated = prev.map((s) => (s.id === id ? { ...s, userNotes: notes } : s));
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to update session note in localStorage:', e);
      }
      return updated;
    });
    showToast('Pitch note updated');
  };

  const handleClearHistory = () => {
    setSavedSessions([]);
    localStorage.removeItem(STORAGE_KEY);
    setIsSavedR1(false);
    setIsSavedR2(false);
    showToast('Pitch Library cleared');
  };

  const handleGenerateScenario = async (
    industry?: string,
    freestyleDraft?: Partial<Scenario>,
    requestedDifficulty?: ScenarioDifficulty
  ) => {
    const activeDifficulty = requestedDifficulty || difficulty;
    setIsGeneratingScenario(true);
    setErrorMessage(null);
    try {
      const data = await postJsonWithTimeout(
        '/api/scenario',
        {
          mode,
          feedbackStyle,
          difficulty: activeDifficulty,
          industry,
          freestyleDraft
        },
        35000
      );
      if (data.success && data.scenario && data.scenario.title) {
        setScenario({ ...data.scenario, difficulty: activeDifficulty });
        setScenarioRetry(null);
        setErrorMessage(null);
        setStep('scenario');
      } else {
        if (mode === 'freestyle' && freestyleDraft?.title) {
          setScenario({
            title: freestyleDraft.title || 'Freestyle Pitch',
            audience: freestyleDraft.audience || (activeDifficulty === 'simple' ? 'Team Lead' : 'Executive Decision Maker'),
            context: freestyleDraft.context || 'Custom scenario defined for your pitch practice.',
            objective: freestyleDraft.objective || 'Present your core argument clearly within 60 seconds.',
            keyConstraint: freestyleDraft.keyConstraint || (activeDifficulty === 'simple' ? 'Listener is busy with other tasks.' : 'Audience is pressed for time and highly analytical.'),
            starterTip: 'Hook the listener with your strongest single metric or insight upfront.',
            customCriteria: freestyleDraft.customCriteria,
            difficulty: activeDifficulty,
          });
        } else {
          const presets = getPresets(mode, activeDifficulty);
          setScenario(presets[0]);
        }
        setScenarioRetry(null);
        setErrorMessage(null);
        setStep('scenario');
      }
    } catch (err: any) {
      console.warn('Using preset or draft scenario fallback:', err);
      setScenarioRetry(null);
      setErrorMessage(null);
      if (mode === 'freestyle' && freestyleDraft?.title) {
        setScenario({
          title: freestyleDraft.title,
          audience: freestyleDraft.audience || (activeDifficulty === 'simple' ? 'Team Lead' : 'Executive Stakeholder'),
          context: freestyleDraft.context || 'Custom user pitch scenario.',
          objective: freestyleDraft.objective || 'Deliver your core proposal in under 60 seconds.',
          keyConstraint: freestyleDraft.keyConstraint || (activeDifficulty === 'simple' ? 'Listener has a busy schedule.' : 'Audience is skeptical of unverified claims.'),
          starterTip: 'Start with the problem cost before presenting your solution.',
          customCriteria: freestyleDraft.customCriteria,
          difficulty: activeDifficulty,
        });
      } else {
        const presets = getPresets(mode, activeDifficulty);
        setScenario(presets[0]);
      }
      setStep('scenario');
    } finally {
      setIsGeneratingScenario(false);
    }
  };

  const handleDirectStartFreestyle = (customScenario: Scenario) => {
    setScenario({ ...customScenario, difficulty: customScenario.difficulty || difficulty });
    setStep('scenario');
  };

  const handleShufflePreset = () => {
    const activeDifficulty = scenario.difficulty || difficulty;
    const presets = getPresets(mode, activeDifficulty);
    const nextIdx = (presetIndex + 1) % presets.length;
    setPresetIndex(nextIdx);
    setScenario(presets[nextIdx]);
  };

  const handleSubmitAudio = async (
    audioBase64: string,
    mimeType: string,
    audioBlob: Blob
  ) => {
    const isRound1 = step === 'recording_r1';
    const currentRound = isRound1 ? 1 : 2;

    if (isRound1) {
      setAudioR1Blob(audioBlob);
      const url = URL.createObjectURL(audioBlob);
      setAudioR1Url(url);
      setStep('analyzing_r1');
    } else {
      setAudioR2Blob(audioBlob);
      const url = URL.createObjectURL(audioBlob);
      setAudioR2Url(url);
      setStep('analyzing_r2');
    }

    setIsEvaluating(true);
    setErrorMessage(null);

    try {
      const data = await postJsonWithTimeout(
        '/api/evaluate',
        {
          audioBase64,
          mimeType,
          scenario,
          feedbackStyle,
          mode,
          round: currentRound,
          followUpQuestion: evalR1?.followUpQuestion,
          previousFeedback: evalR1,
        },
        90000
      );
      if (!data.success || !data.evaluation) {
        throw new Error(data.error || 'The server rejected the audio format. Please try recording again.');
      }

      const evaluation: PitchEvaluation = data.evaluation;
      setFailedSubmission(null);

      if (isRound1) {
        setEvalR1(evaluation);
        setStep('feedback_r1');
      } else {
        setEvalR2(evaluation);
        setStep('comparison');
      }
    } catch (err: any) {
      console.error('Audio evaluation error:', err);
      setFailedSubmission({
        audioBase64,
        mimeType,
        audioBlob,
        round: currentRound,
      });
      setErrorMessage(err.message || 'The server rejected the audio format. Please try recording again.');
      setStep(isRound1 ? 'recording_r1' : 'recording_r2');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleReset = () => {
    if (audioR1Url) URL.revokeObjectURL(audioR1Url);
    if (audioR2Url) URL.revokeObjectURL(audioR2Url);
    setAudioR1Blob(null);
    setAudioR1Url(null);
    setEvalR1(null);
    setAudioR2Blob(null);
    setAudioR2Url(null);
    setEvalR2(null);
    setErrorMessage(null);
    setFailedSubmission(null);
    setScenarioRetry(null);
    setIsSavedR1(false);
    setIsSavedR2(false);
    setDifficulty('simple');
    setCurrentSessionId(`pitch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);
    setStep('mode_selection');
  };

  const handleSelectHistorySession = (session: SavedPitchSession) => {
    setMode(session.mode);
    setFeedbackStyle(session.feedbackStyle);
    if (session.difficulty) {
      setDifficulty(session.difficulty);
    } else if (session.scenario?.difficulty) {
      setDifficulty(session.scenario.difficulty);
    }
    setScenario(session.scenario);
    setEvalR1(session.evalR1);
    setCurrentSessionId(session.id);
    setIsSavedR1(true);

    if (session.evalR2) {
      setEvalR2(session.evalR2);
      setIsSavedR2(true);
      setStep('comparison');
    } else {
      setEvalR2(null);
      setIsSavedR2(false);
      setStep('feedback_r1');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col font-sans">
      {/* Minimal Header */}
      <Header
        mode={mode}
        feedbackStyle={feedbackStyle}
        round={
          step === 'recording_r1' || step === 'analyzing_r1' || step === 'feedback_r1'
            ? 1
            : step === 'recording_r2' || step === 'analyzing_r2' || step === 'comparison'
            ? 2
            : undefined
        }
        onOpenHistory={() => setIsHistoryOpen(true)}
        onReset={step !== 'mode_selection' ? handleReset : undefined}
        savedSessionsCount={savedSessions.length}
      />

      {/* Floating Save Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#0f1d40] text-white px-4 py-2.5 rounded-xl shadow-lg border border-white/10 text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="ml-2 underline text-blue-200 hover:text-white"
          >
            View
          </button>
        </div>
      )}

      {/* Main Content Container */}
      <main className="flex-1 w-full max-w-xl mx-auto px-4 py-5 flex flex-col justify-start">
        {/* Error Notification Banner */}
        {errorMessage && (
          <div className="mb-4 p-3.5 rounded-xl bg-amber-50/90 border border-amber-200/90 text-amber-900 text-xs flex items-start gap-2.5 shadow-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <div className="flex-1 space-y-2">
              <div>
                <span className="font-semibold block text-amber-950">Notice</span>
                <p className="text-amber-800 leading-relaxed mt-0.5">
                  {(() => {
                    const raw = errorMessage;
                    // The recording-specific wording below only applies when an audio submission failed
                    if (!failedSubmission) return raw;
                    try {
                      const jsonMatch = raw.match(/\{[\s\S]*"error"[\s\S]*\}/);
                      if (jsonMatch) {
                        const parsed = JSON.parse(jsonMatch[0]);
                        if (parsed?.error) {
                          const code = parsed.error.code;
                          const status = parsed.error.status;
                          const msg = parsed.error.message || '';
                          if (code === 503 || status === 'UNAVAILABLE' || msg.includes('high demand')) {
                            return 'Google AI servers are temporarily experiencing high demand. Your pitch recording has been saved safely—click the button below to retry evaluation.';
                          }
                          if (code === 429 || status === 'RESOURCE_EXHAUSTED') {
                            return 'The AI service temporarily reached request rate limits. Please wait 5-10 seconds and retry.';
                          }
                          if (msg) return msg;
                        }
                      }
                    } catch {}
                    if (raw.includes('503') || raw.includes('UNAVAILABLE') || raw.includes('high demand')) {
                      return 'Google AI servers are temporarily experiencing high demand. Your pitch recording has been saved safely—click the button below to retry evaluation.';
                    }
                    return raw;
                  })()}
                </p>
              </div>
              {scenarioRetry && !failedSubmission && (
                <button
                  onClick={() => handleGenerateScenario(scenarioRetry.industry, scenarioRetry.freestyleDraft, scenarioRetry.difficulty)}
                  disabled={isGeneratingScenario}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-800 text-white hover:bg-amber-900 active:scale-98 transition shadow-xs cursor-pointer disabled:opacity-60"
                >
                  {isGeneratingScenario ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <span>↻</span> Retry AI Scenario
                    </>
                  )}
                </button>
              )}
              {failedSubmission && (
                <button
                  onClick={() =>
                    handleSubmitAudio(
                      failedSubmission.audioBase64,
                      failedSubmission.mimeType,
                      failedSubmission.audioBlob
                    )
                  }
                  disabled={isEvaluating}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-800 text-white hover:bg-amber-900 active:scale-98 transition shadow-xs cursor-pointer disabled:opacity-60"
                >
                  {isEvaluating ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Evaluating Speech...
                    </>
                  ) : (
                    <>
                      <span>↻</span> Retry Analysis with Saved Audio
                    </>
                  )}
                </button>
              )}
            </div>
            <button
              onClick={() => {
                setErrorMessage(null);
                setFailedSubmission(null);
                setScenarioRetry(null);
              }}
              className="text-amber-500 hover:text-amber-800 font-medium px-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* STEP 1: Format & Persona Selection */}
        {step === 'mode_selection' && (
          <ModeSelector
            selectedMode={mode}
            onSelectMode={(m) => {
              setMode(m);
              setScenario(getPresets(m, difficulty)[0]);
            }}
            selectedStyle={feedbackStyle}
            onSelectStyle={setFeedbackStyle}
            selectedDifficulty={difficulty}
            onSelectDifficulty={(d) => {
              setDifficulty(d);
              setScenario(getPresets(mode, d)[0]);
            }}
            onContinue={handleGenerateScenario}
            onDirectStartFreestyle={handleDirectStartFreestyle}
            isLoading={isGeneratingScenario}
          />
        )}

        {/* STEP 2: Scenario Brief */}
        {step === 'scenario' && (
          <ScenarioCard
            scenario={scenario}
            mode={mode}
            feedbackStyle={feedbackStyle}
            onStartRecording={() => setStep('recording_r1')}
            onRegenerate={() =>
              handleGenerateScenario(
                undefined,
                mode === 'freestyle' ? scenario : undefined,
                scenario.difficulty || difficulty
              )
            }
            onShufflePreset={handleShufflePreset}
            onUpdateScenario={(updated) => {
              setScenario(updated);
              if (mode === 'freestyle') {
                try {
                  localStorage.setItem('pitchlab_freestyle_draft', JSON.stringify({
                    title: updated.title,
                    audience: updated.audience,
                    context: updated.context,
                    objective: updated.objective,
                    constraint: updated.keyConstraint,
                    criteria: updated.customCriteria || '',
                  }));
                } catch {}
              }
            }}
            onBackToConfig={() => setStep('mode_selection')}
            isRegenerating={isGeneratingScenario}
          />
        )}

        {/* STEP 3: Round 1 Recording */}
        {step === 'recording_r1' && (
          <AudioRecorderCard
            scenario={scenario}
            round={1}
            onSubmitAudio={handleSubmitAudio}
            onCancel={() => setStep('scenario')}
            isSubmitting={isEvaluating}
          />
        )}

        {/* STEP 4: Analyzing Round 1 Loading State */}
        {step === 'analyzing_r1' && (
          <div className="my-auto py-20 px-6 text-center space-y-3 max-w-sm mx-auto bg-white border border-zinc-200/90 rounded-2xl shadow-xs">
            <div className="w-6 h-6 border-2 border-zinc-200 border-t-[#0f1d40] rounded-full animate-spin mx-auto" />
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-zinc-900">Evaluating Speech</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Analyzing clarity, framework structure, persuasion, confidence, and pacing markers.
              </p>
            </div>
          </div>
        )}

        {/* STEP 5: Round 1 Scorecard & Follow-Up Trigger */}
        {step === 'feedback_r1' && evalR1 && (
          <EvaluationView
            evaluation={evalR1}
            scenario={scenario}
            mode={mode}
            feedbackStyle={feedbackStyle}
            audioUrl={audioR1Url}
            onProceedToRound2={() => setStep('recording_r2')}
            onReset={handleReset}
            onSaveToLibrary={(notes) => handleSaveToLibrary(1, notes)}
            isSaved={isSavedR1}
            onOpenLibrary={() => setIsHistoryOpen(true)}
          />
        )}

        {/* STEP 6: Round 2 Recording (Follow-up Question) */}
        {step === 'recording_r2' && evalR1 && (
          <AudioRecorderCard
            scenario={scenario}
            round={2}
            followUpQuestion={evalR1.followUpQuestion}
            onSubmitAudio={handleSubmitAudio}
            onCancel={() => setStep('feedback_r1')}
            isSubmitting={isEvaluating}
          />
        )}

        {/* STEP 7: Analyzing Round 2 Loading State */}
        {step === 'analyzing_r2' && (
          <div className="my-auto py-20 px-6 text-center space-y-3 max-w-sm mx-auto bg-white border border-zinc-200/90 rounded-2xl shadow-xs">
            <div className="w-6 h-6 border-2 border-zinc-200 border-t-[#0f1d40] rounded-full animate-spin mx-auto" />
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-zinc-900">Comparing Responses</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Evaluating objection defense and generating before-and-after report.
              </p>
            </div>
          </div>
        )}

        {/* STEP 8: Before & After Comparison View */}
        {step === 'comparison' && evalR1 && evalR2 && (
          <ComparisonView
            scenario={scenario}
            mode={mode}
            feedbackStyle={feedbackStyle}
            evalR1={evalR1}
            evalR2={evalR2}
            audioR1Url={audioR1Url}
            audioR2Url={audioR2Url}
            onReset={handleReset}
            onSaveToLibrary={(notes) => handleSaveToLibrary(2, notes)}
            isSaved={isSavedR2}
            onOpenLibrary={() => setIsHistoryOpen(true)}
          />
        )}
      </main>

      {/* Pitch Library Modal */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        sessions={savedSessions}
        onSelectSession={handleSelectHistorySession}
        onClearHistory={handleClearHistory}
        onDeleteSession={handleDeleteSession}
        onUpdateSessionNotes={handleUpdateSessionNotes}
      />
    </div>
  );
}
