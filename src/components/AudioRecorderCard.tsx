import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Mic,
  Square,
  Play,
  Pause,
  RotateCcw,
  Send,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  MicOff,
  Clock,
  Sliders,
  Sparkles,
  Volume2,
  VolumeX,
  FileText,
  Copy,
  Plus,
  Minus,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { Scenario } from '../types';

interface AudioRecorderCardProps {
  scenario: Scenario;
  round: 1 | 2;
  followUpQuestion?: string;
  onSubmitAudio: (audioBase64: string, mimeType: string, audioBlob: Blob) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const TIMER_PRESETS = [
  { label: '30s', seconds: 30, desc: 'Elevator Hook' },
  { label: '45s', seconds: 45, desc: 'Quick Pitch' },
  { label: '60s', seconds: 60, desc: 'Standard Pitch', isDefault: true },
  { label: '90s', seconds: 90, desc: 'Extended Pitch' },
  { label: '120s', seconds: 120, desc: 'Full Brief' },
];

export const AudioRecorderCard: React.FC<AudioRecorderCardProps> = ({
  scenario,
  round,
  followUpQuestion,
  onSubmitAudio,
  onCancel,
  isSubmitting = false,
}) => {
  // Configurable Timer State (saved in localStorage)
  const [targetDuration, setTargetDuration] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('pitchlab_timer_seconds');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 15 && parsed <= 300) return parsed;
      }
    } catch {}
    return 60; // 60-second default
  });

  const [warningThreshold, setWarningThreshold] = useState<number>(15); // Alert at 15s remaining
  const [autoStopAtLimit, setAutoStopAtLimit] = useState<boolean>(true);
  const [enableLeadIn, setEnableLeadIn] = useState<boolean>(true); // 3-2-1 ready countdown
  const [leadInCount, setLeadInCount] = useState<number | null>(null);
  const [soundCuesEnabled, setSoundCuesEnabled] = useState<boolean>(true);
  const [showTimerSettings, setShowTimerSettings] = useState<boolean>(false);
  const [isCustomDuration, setIsCustomDuration] = useState<boolean>(() => {
    return !TIMER_PRESETS.some((p) => p.seconds === targetDuration);
  });

  // Transcription state (powered by gemini-3.5-transcribe)
  const [transcript, setTranscript] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [transcribeError, setTranscribeError] = useState<string | null>(null);
  const [copiedTranscript, setCopiedTranscript] = useState<boolean>(false);

  // Audio Recorder Hook
  const {
    isRecording,
    duration,
    maxDurationSeconds,
    audioBlob,
    audioUrl,
    audioBase64,
    mimeType,
    error,
    permissionDenied,
    waveformLevels,
    startRecording,
    stopRecording,
    resetRecording,
  } = useAudioRecorder(targetDuration, autoStopAtLimit);

  // Playback state
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const leadInTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warnedRef = useRef<boolean>(false);

  // Remaining time calculation
  const remaining = Math.max(0, targetDuration - duration);
  const progressPercentage = Math.min(100, (duration / targetDuration) * 100);

  // Save targetDuration preference to localStorage
  const handleUpdateDuration = (secs: number) => {
    const clamped = Math.max(15, Math.min(300, secs));
    setTargetDuration(clamped);
    setIsCustomDuration(!TIMER_PRESETS.some((p) => p.seconds === clamped));
    try {
      localStorage.setItem('pitchlab_timer_seconds', clamped.toString());
    } catch {}
  };

  // Web Audio Tone Synthesizer for gentle auditory pacing cues
  const playChime = useCallback((freq = 520, durationMs = 120, type: OscillatorType = 'sine') => {
    if (!soundCuesEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + durationMs / 1000);
    } catch {}
  }, [soundCuesEnabled]);

  // Warning threshold chime trigger
  useEffect(() => {
    if (isRecording) {
      if (remaining <= warningThreshold && remaining > 0 && !warnedRef.current) {
        warnedRef.current = true;
        playChime(660, 150);
      }
    } else {
      warnedRef.current = false;
    }
  }, [isRecording, remaining, warningThreshold, playChime]);

  // Completion chime
  useEffect(() => {
    if (!isRecording && duration >= targetDuration && duration > 0) {
      playChime(440, 200);
    }
  }, [isRecording, duration, targetDuration, playChime]);

  // Time formatting helper (MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Lead-in countdown flow (3... 2... 1... Speak!)
  const handleInitiateRecording = () => {
    if (enableLeadIn) {
      setLeadInCount(3);
      playChime(440, 80);

      leadInTimerRef.current = setTimeout(() => {
        setLeadInCount(2);
        playChime(440, 80);

        leadInTimerRef.current = setTimeout(() => {
          setLeadInCount(1);
          playChime(440, 80);

          leadInTimerRef.current = setTimeout(() => {
            setLeadInCount(null);
            playChime(880, 180);
            startRecording();
          }, 850);
        }, 850);
      }, 850);
    } else {
      startRecording();
    }
  };

  const handleCancelLeadIn = () => {
    if (leadInTimerRef.current) {
      clearTimeout(leadInTimerRef.current);
      leadInTimerRef.current = null;
    }
    setLeadInCount(null);
  };

  // Dynamic extension: +15s buffer on the fly while recording
  const handleExtendDuringRecording = () => {
    const newTarget = targetDuration + 15;
    setTargetDuration(newTarget);
    try {
      localStorage.setItem('pitchlab_timer_seconds', newTarget.toString());
    } catch {}
  };

  // Audio preview playback handlers
  const togglePlayPreview = () => {
    if (!audioPreviewRef.current) return;
    if (isPlayingPreview) {
      audioPreviewRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      audioPreviewRef.current
        .play()
        .then(() => setIsPlayingPreview(true))
        .catch((e) => console.warn('Preview play error:', e));
    }
  };

  const handleAudioTimeUpdate = () => {
    if (audioPreviewRef.current) {
      setPlaybackTime(audioPreviewRef.current.currentTime);
    }
  };

  const handleAudioEnded = () => {
    setIsPlayingPreview(false);
    setPlaybackTime(0);
  };

  // Transcribe audio using gemini-3.5-transcribe
  const handleTranscribeAudio = async () => {
    if (!audioBase64) return;
    setIsTranscribing(true);
    setTranscribeError(null);
    try {
      const res = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64,
          mimeType,
        }),
      });
      const data = await res.json();
      if (data.success && data.transcript) {
        setTranscript(data.transcript);
      } else {
        setTranscribeError(data.error || 'Transcription failed. Please try again.');
      }
    } catch (err: any) {
      setTranscribeError(err.message || 'Network error transcribing audio.');
    } finally {
      setIsTranscribing(false);
    }
  };

  // Reset recording and transcription state
  const handleReset = () => {
    resetRecording();
    setTranscript(null);
    setTranscribeError(null);
    setCopiedTranscript(false);
  };

  // Demo audio fallback
  const handleUseSampleAudio = async () => {
    try {
      const sampleAudioBlob = await createDemoAudioWav(round);
      const reader = new FileReader();
      reader.onloadend = () => {
        const res = reader.result as string;
        const b64 = res.split(',')[1];
        onSubmitAudio(b64, 'audio/wav', sampleAudioBlob);
      };
      reader.readAsDataURL(sampleAudioBlob);
    } catch (err) {
      console.error('Failed to create sample audio:', err);
    }
  };

  // Copy transcript to clipboard
  const handleCopyTranscript = () => {
    if (!transcript) return;
    navigator.clipboard.writeText(transcript);
    setCopiedTranscript(true);
    setTimeout(() => setCopiedTranscript(false), 2000);
  };

  // Calculate Words Per Minute
  const wordCount = transcript ? transcript.trim().split(/\s+/).filter(Boolean).length : 0;
  const estimatedWPM = duration > 0 ? Math.round((wordCount / duration) * 60) : 0;

  // Real-time pacing coaching stage
  const getPacingAdvice = () => {
    if (!isRecording) return null;
    const pct = (remaining / targetDuration) * 100;
    if (pct > 60) {
      return {
        phase: 'Opening Hook (0–40%)',
        cue: 'Lead with the urgent problem, quantified impact, or bold premise.',
        color: 'text-indigo-700 bg-indigo-50 border-indigo-200',
      };
    } else if (pct > 25) {
      return {
        phase: 'Value & Evidence (40–75%)',
        cue: 'Explain your unfair advantage and directly tackle expected skepticism.',
        color: 'text-sky-700 bg-sky-50 border-sky-200',
      };
    } else {
      return {
        phase: 'Closing Ask (<25% left)',
        cue: 'Wrap up now! State your specific call-to-action with firm conviction.',
        color: 'text-amber-800 bg-amber-50 border-amber-300 animate-pulse',
      };
    }
  };

  const pacingInfo = getPacingAdvice();

  return (
    <div className="w-full max-w-xl mx-auto space-y-4 pt-1">
      {/* Top Context Cue Card */}
      <div className="bg-white border border-zinc-200/90 rounded-2xl p-4 shadow-xs space-y-2">
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span className="font-medium text-zinc-700">
            {round === 1 ? 'Round 1: Initial Presentation' : 'Round 2: Follow-Up Response'}
          </span>
          <div className="flex items-center gap-1.5 font-mono text-zinc-500 bg-zinc-100/80 px-2 py-0.5 rounded-md text-[11px]">
            <Clock className="w-3 h-3 text-zinc-400" />
            <span>Target: {targetDuration}s</span>
          </div>
        </div>

        {round === 1 ? (
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">{scenario.title}</h3>
            <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
              <span className="font-medium text-zinc-800">Objective:</span> {scenario.objective}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
              Follow-Up Question
            </span>
            <p className="text-sm font-medium text-zinc-900 leading-snug">
              "{followUpQuestion || 'Defend your core unit economics and customer acquisition cost.'}"
            </p>
          </div>
        )}
      </div>

      {/* Recording Console */}
      <div className="bg-white border border-zinc-200/90 rounded-2xl p-6 sm:p-7 shadow-xs text-center space-y-5">
        {/* TIMER CONFIGURATION PRESET BAR (When not recording and no audio recorded yet) */}
        {!isRecording && !audioUrl && leadInCount === null && (
          <div className="space-y-3 pb-2 border-b border-zinc-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#0f1d40]" />
                Countdown Duration
              </span>
              <button
                type="button"
                onClick={() => setShowTimerSettings(!showTimerSettings)}
                className="text-[11px] font-medium text-zinc-500 hover:text-zinc-800 flex items-center gap-1 py-0.5 px-1.5 rounded hover:bg-zinc-100 transition-colors"
                title="Configure countdown alerts and pacing"
              >
                <Sliders className="w-3 h-3" />
                <span>Timer Options</span>
                {showTimerSettings ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </button>
            </div>

            {/* Quick Preset Buttons */}
            <div className="grid grid-cols-5 gap-1.5">
              {TIMER_PRESETS.map((p) => {
                const isActive = targetDuration === p.seconds && !isCustomDuration;
                return (
                  <button
                    key={p.seconds}
                    type="button"
                    onClick={() => handleUpdateDuration(p.seconds)}
                    className={`py-1.5 px-1 rounded-xl text-xs font-semibold transition-all flex flex-col items-center justify-center border ${
                      isActive
                        ? 'bg-[#0f1d40] text-white border-[#0f1d40] shadow-xs'
                        : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border-zinc-200/80'
                    }`}
                  >
                    <span>{p.label}</span>
                    <span
                      className={`text-[9px] font-normal leading-tight hidden sm:block ${
                        isActive ? 'text-zinc-300' : 'text-zinc-400'
                      }`}
                    >
                      {p.desc}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Collapsible Advanced Timer Settings */}
            {showTimerSettings && (
              <div className="p-3.5 rounded-xl bg-zinc-50/90 border border-zinc-200/90 text-left space-y-3 text-xs">
                {/* Custom Stepper */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-zinc-800">Custom Pitch Duration</div>
                    <div className="text-[11px] text-zinc-500">Choose any time from 15s to 300s</div>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white border border-zinc-200 rounded-lg p-1 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => handleUpdateDuration(targetDuration - 5)}
                      disabled={targetDuration <= 15}
                      className="p-1 text-zinc-600 hover:text-zinc-900 disabled:opacity-30 rounded hover:bg-zinc-100"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono font-semibold tabular-nums px-1 text-zinc-900 w-12 text-center">
                      {targetDuration}s
                    </span>
                    <button
                      type="button"
                      onClick={() => handleUpdateDuration(targetDuration + 5)}
                      disabled={targetDuration >= 300}
                      className="p-1 text-zinc-600 hover:text-zinc-900 disabled:opacity-30 rounded hover:bg-zinc-100"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 3-Second Lead-In Prep */}
                <div className="flex items-center justify-between pt-1 border-t border-zinc-200/60">
                  <div>
                    <div className="font-semibold text-zinc-800">3-2-1 Countdown Prep</div>
                    <div className="text-[11px] text-zinc-500">
                      Take a breath before recording starts
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEnableLeadIn(!enableLeadIn)}
                    className={`w-9 h-5 rounded-full transition-colors relative ${
                      enableLeadIn ? 'bg-[#0f1d40]' : 'bg-zinc-300'
                    }`}
                  >
                    <span
                      className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                        enableLeadIn ? 'translate-x-4' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>

                {/* Warning Alert Threshold */}
                <div className="flex items-center justify-between pt-1 border-t border-zinc-200/60">
                  <div>
                    <div className="font-semibold text-zinc-800">Warning Alert Time</div>
                    <div className="text-[11px] text-zinc-500">Highlight when time is running out</div>
                  </div>
                  <div className="flex items-center gap-1">
                    {[10, 15, 20].map((th) => (
                      <button
                        key={th}
                        type="button"
                        onClick={() => setWarningThreshold(th)}
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                          warningThreshold === th
                            ? 'bg-[#0f1d40] text-white border-[#0f1d40]'
                            : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-100'
                        }`}
                      >
                        {th}s
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sound Cues Toggle */}
                <div className="flex items-center justify-between pt-1 border-t border-zinc-200/60">
                  <div>
                    <div className="font-semibold text-zinc-800">Audio Chimes & Cues</div>
                    <div className="text-[11px] text-zinc-500">
                      Soft tone on 3-2-1 prep and warning zone
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSoundCuesEnabled(!soundCuesEnabled)}
                    className="p-1 rounded text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60 transition-colors"
                  >
                    {soundCuesEnabled ? (
                      <Volume2 className="w-4 h-4 text-[#0f1d40]" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-zinc-400" />
                    )}
                  </button>
                </div>

                {/* Auto-Stop at Limit Toggle */}
                <div className="flex items-center justify-between pt-1 border-t border-zinc-200/60">
                  <div>
                    <div className="font-semibold text-zinc-800">Auto-Stop at 0:00</div>
                    <div className="text-[11px] text-zinc-500">
                      Enforce strict 60s pitch time discipline
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAutoStopAtLimit(!autoStopAtLimit)}
                    className={`w-9 h-5 rounded-full transition-colors relative ${
                      autoStopAtLimit ? 'bg-[#0f1d40]' : 'bg-zinc-300'
                    }`}
                  >
                    <span
                      className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                        autoStopAtLimit ? 'translate-x-4' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3-2-1 LEAD-IN COUNTDOWN MODAL */}
        {leadInCount !== null ? (
          <div className="py-8 space-y-4">
            <div className="w-32 h-32 mx-auto rounded-full bg-indigo-50 border-4 border-[#0f1d40] flex flex-col items-center justify-center animate-pulse">
              <span className="font-mono text-5xl font-black text-[#0f1d40] tabular-nums">
                {leadInCount}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-700 mt-1">
                Get Ready
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-zinc-900">
                Take a deep breath and clear your mind
              </p>
              <p className="text-xs text-zinc-500">Recording will start automatically in {leadInCount}s</p>
            </div>
            <button
              type="button"
              onClick={handleCancelLeadIn}
              className="text-xs text-rose-600 hover:text-rose-800 font-medium py-1 px-3 rounded-lg hover:bg-rose-50 transition-colors"
            >
              Cancel Prep
            </button>
          </div>
        ) : (
          /* CIRCULAR COUNTDOWN TIMER DISPLAY */
          <div className="relative w-44 h-44 mx-auto flex items-center justify-center">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
              {/* Background track */}
              <circle
                cx="50"
                cy="50"
                r="44"
                className="text-zinc-100"
                strokeWidth="4.5"
                stroke="currentColor"
                fill="transparent"
              />
              {/* Animated Progress Arc */}
              <circle
                cx="50"
                cy="50"
                r="44"
                className={`transition-all duration-300 ${
                  isRecording
                    ? remaining <= 8
                      ? 'text-rose-600'
                      : remaining <= warningThreshold
                      ? 'text-amber-500'
                      : 'text-[#0f1d40]'
                    : duration > 0
                    ? 'text-emerald-600'
                    : 'text-zinc-300'
                }`}
                strokeWidth="4.5"
                strokeDasharray={276.46}
                strokeDashoffset={276.46 - (276.46 * progressPercentage) / 100}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
              />
            </svg>

            {/* Central Clock Typography */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span
                className={`font-mono font-bold tracking-tight tabular-nums transition-colors ${
                  isRecording
                    ? remaining <= 8
                      ? 'text-rose-600 text-4xl animate-pulse'
                      : remaining <= warningThreshold
                      ? 'text-amber-600 text-4xl'
                      : 'text-zinc-900 text-4xl'
                    : duration > 0
                    ? 'text-emerald-700 text-3xl'
                    : 'text-zinc-800 text-4xl'
                }`}
              >
                {formatTime(isRecording ? remaining : duration > 0 ? duration : targetDuration)}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold mt-1">
                {isRecording
                  ? remaining <= warningThreshold
                    ? 'Wrap Up!'
                    : 'Remaining'
                  : duration > 0
                  ? 'Recorded'
                  : `${targetDuration}s Countdown`}
              </span>
            </div>
          </div>
        )}

        {/* Real-time Pacing Advice Bar (Active during recording) */}
        {isRecording && pacingInfo && (
          <div className={`p-2.5 rounded-xl border text-xs text-left transition-all ${pacingInfo.color}`}>
            <div className="font-semibold text-[11px] tracking-wide uppercase">
              {pacingInfo.phase}
            </div>
            <div className="font-normal mt-0.5 leading-snug">{pacingInfo.cue}</div>
          </div>
        )}

        {/* Live Audio Visualizer Equalizer */}
        {isRecording && (
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-center gap-1.5 h-8">
              {waveformLevels.map((lvl, idx) => (
                <div
                  key={idx}
                  className={`w-1 rounded-full transition-all duration-75 ${
                    remaining <= warningThreshold ? 'bg-amber-500' : 'bg-[#0f1d40]'
                  }`}
                  style={{ height: `${lvl}%` }}
                />
              ))}
            </div>
            <div className="flex items-center justify-center gap-2 text-[11px] text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>Microphone live • {formatTime(duration)} elapsed</span>
            </div>

            {/* In-Flight +15s Extension Button */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleExtendDuringRecording}
                className="text-[11px] text-zinc-500 hover:text-zinc-800 font-medium py-1 px-2.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 inline-flex items-center gap-1 transition-colors"
                title="Add 15 extra seconds if you need more time to finish"
              >
                <Plus className="w-3 h-3 text-[#0f1d40]" />
                <span>+15s Extra Time</span>
              </button>
            </div>
          </div>
        )}

        {/* Recorded Audio Preview & Playback */}
        {audioUrl && !isRecording && (
          <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-4 max-w-md mx-auto space-y-3.5">
            <audio
              ref={audioPreviewRef}
              src={audioUrl}
              onTimeUpdate={handleAudioTimeUpdate}
              onEnded={handleAudioEnded}
              className="hidden"
            />
            <div className="flex items-center justify-between text-xs text-zinc-700">
              <span className="flex items-center gap-1.5 font-medium text-zinc-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Pitch Recorded ({formatTime(duration)})</span>
              </span>
              <span className="font-mono text-zinc-400 tabular-nums text-xs">
                {formatTime(Math.floor(playbackTime))} / {formatTime(duration)}
              </span>
            </div>

            <button
              type="button"
              onClick={togglePlayPreview}
              className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-zinc-100 text-zinc-800 font-semibold text-xs border border-zinc-200 shadow-2xs flex items-center justify-center gap-1.5 transition-colors"
            >
              {isPlayingPreview ? (
                <>
                  <Pause className="w-3.5 h-3.5 text-[#0f1d40] fill-[#0f1d40]" />
                  <span>Pause playback</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-[#0f1d40] fill-[#0f1d40]" />
                  <span>Listen back</span>
                </>
              )}
            </button>

            {/* INSTANT TRANSCRIPTION SECTION (Gemini 3.5 Transcribe) */}
            <div className="pt-2 border-t border-zinc-200/70 text-left space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-800 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#0f1d40]" />
                  Audio Transcription
                </span>
                {!transcript && !isTranscribing && (
                  <button
                    type="button"
                    onClick={handleTranscribeAudio}
                    className="text-[11px] font-semibold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 py-0.5 px-2 rounded-md bg-indigo-50 border border-indigo-200/70 hover:bg-indigo-100 transition-colors"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Transcribe Audio</span>
                  </button>
                )}
              </div>

              {isTranscribing && (
                <div className="p-3 bg-white rounded-xl border border-zinc-200 flex items-center justify-center gap-2 text-xs text-zinc-600">
                  <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  <span>Transcribing with Gemini 3.5 Transcribe...</span>
                </div>
              )}

              {transcribeError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-600" />
                  <span>{transcribeError}</span>
                </div>
              )}

              {transcript && (
                <div className="bg-white rounded-xl p-3 border border-zinc-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-zinc-500 border-b border-zinc-100 pb-1.5">
                    <span className="font-medium text-zinc-700">
                      {wordCount} words • {estimatedWPM} WPM
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyTranscript}
                      className="text-zinc-500 hover:text-zinc-800 flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedTranscript ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="text-xs text-zinc-800 italic leading-relaxed max-h-32 overflow-y-auto font-sans">
                    "{transcript}"
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Friendly Microphone Permission Denied Notice */}
        {permissionDenied && (
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-left space-y-3 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800 shrink-0 mt-0.5">
                <MicOff className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-zinc-900">Microphone Access Was Denied</h4>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  PitchLab only accesses your microphone while you record your pitch. To practice with real voice recording, simply enable microphone access:
                </p>
              </div>
            </div>

            {/* Platform Guides */}
            <div className="bg-white/90 rounded-xl p-3 border border-amber-200/60 space-y-2 text-[11px] text-zinc-600">
              <div className="flex items-start gap-2">
                <span className="font-semibold text-zinc-800 shrink-0">Safari / iOS:</span>
                <span>Tap the "aA" or lock in the address bar → Website Settings → Microphone → <strong>Allow</strong>.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold text-zinc-800 shrink-0">Chrome / Android:</span>
                <span>Tap the lock/tune icon in the address bar → Site Settings → Microphone → <strong>Allow</strong>.</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                type="button"
                onClick={handleInitiateRecording}
                className="py-2 px-3.5 rounded-xl bg-[#0f1d40] hover:bg-[#162a5c] text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Try Microphone Again</span>
              </button>
              <button
                type="button"
                onClick={handleUseSampleAudio}
                className="py-2 px-3.5 rounded-xl bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-medium border border-zinc-200 transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Continue with Demo Audio</span>
              </button>
            </div>
          </div>
        )}

        {/* General Error Banner */}
        {error && !permissionDenied && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium">
            {error}
          </div>
        )}

        {/* Interactive Action Controls */}
        <div className="space-y-2 pt-1">
          {!isRecording && !audioUrl && leadInCount === null && (
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={handleInitiateRecording}
                className="w-full py-3.5 px-4 rounded-xl bg-[#0f1d40] hover:bg-[#162a5c] text-white font-medium text-sm flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <Mic className="w-4 h-4" />
                <span>Start Recording ({targetDuration}s Countdown)</span>
              </button>
              <p className="text-[11px] text-zinc-400">
                {enableLeadIn
                  ? 'Includes 3-second preparation countdown before microphone starts.'
                  : 'Recording starts immediately upon tapping.'}
              </p>
            </div>
          )}

          {isRecording && (
            <button
              type="button"
              onClick={stopRecording}
              className="w-full py-3.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <Square className="w-4 h-4 fill-white" />
              <span>Stop & Grade Pitch</span>
            </button>
          )}

          {audioUrl && !isRecording && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  if (audioBase64 && audioBlob) {
                    onSubmitAudio(audioBase64, mimeType, audioBlob);
                  }
                }}
                disabled={isSubmitting || !audioBase64}
                className="w-full py-3.5 px-4 rounded-xl bg-[#0f1d40] hover:bg-[#162a5c] text-white font-medium text-sm flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>Analyzing pitch delivery...</span>
                  </div>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit for Evaluation</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleReset}
                disabled={isSubmitting}
                className="w-full py-2.5 px-3 rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Re-record Answer</span>
              </button>
            </div>
          )}

          {!isRecording && leadInCount === null && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="text-xs text-zinc-500 hover:text-zinc-800 transition-colors py-1 flex items-center justify-center gap-1 mx-auto"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Scenario</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Synthetic demo audio generation for browser testing without mic
async function createDemoAudioWav(round: number): Promise<Blob> {
  const sampleRate = 16000;
  const durationSec = 3.5;
  const numSamples = Math.floor(sampleRate * durationSec);
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, numSamples * 2, true);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const freq = 180 + Math.sin(2 * Math.PI * 1.5 * t) * 30;
    const sample = Math.sin(2 * Math.PI * freq * t) * 0.4 * Math.sin(Math.PI * (i / numSamples));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    offset += 2;
  }

  return new Blob([view], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
