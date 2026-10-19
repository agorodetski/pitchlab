import React, { useState, useRef } from 'react';
import { Mic, Square, Play, Pause, RotateCcw, Send, AlertCircle, ArrowLeft, CheckCircle2, MicOff } from 'lucide-react';
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

export const AudioRecorderCard: React.FC<AudioRecorderCardProps> = ({
  scenario,
  round,
  followUpQuestion,
  onSubmitAudio,
  onCancel,
  isSubmitting = false,
}) => {
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
  } = useAudioRecorder(60);

  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  const remaining = Math.max(0, maxDurationSeconds - duration);
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progressPercentage = (duration / maxDurationSeconds) * 100;

  const togglePlayPreview = () => {
    if (!audioPreviewRef.current) return;
    if (isPlayingPreview) {
      audioPreviewRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      audioPreviewRef.current.play().then(() => {
        setIsPlayingPreview(true);
      }).catch((e) => console.warn('Preview play error:', e));
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

  return (
    <div className="w-full max-w-xl mx-auto space-y-4 pt-1">
      {/* Top Context Cue Card */}
      <div className="bg-white border border-zinc-200/90 rounded-2xl p-4 shadow-xs space-y-1.5">
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span className="font-medium text-zinc-700">
            {round === 1 ? 'Round 1: Initial Presentation' : 'Round 2: Follow-Up Response'}
          </span>
          <span className="font-mono tabular-nums text-zinc-400">60s maximum</span>
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
      <div className="bg-white border border-zinc-200/90 rounded-2xl p-6 sm:p-8 shadow-xs text-center space-y-6">
        {/* Circular Progress & Timer */}
        <div className="relative w-40 h-40 mx-auto flex items-center justify-center">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="44"
              className="text-zinc-100"
              strokeWidth="4"
              stroke="currentColor"
              fill="transparent"
            />
            <circle
              cx="50"
              cy="50"
              r="44"
              className={
                remaining <= 10 && isRecording
                  ? 'text-rose-500 transition-all duration-300'
                  : isRecording
                  ? 'text-[#0f1d40] transition-all duration-300'
                  : 'text-zinc-300'
              }
              strokeWidth="4"
              strokeDasharray={276.46}
              strokeDashoffset={276.46 - (276.46 * progressPercentage) / 100}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
            />
          </svg>

          {/* Central Timer Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span
              className={`font-mono font-semibold tracking-tight tabular-nums ${
                remaining <= 10 && isRecording
                  ? 'text-rose-600 text-3xl'
                  : isRecording
                  ? 'text-zinc-900 text-3xl'
                  : 'text-zinc-800 text-3xl'
              }`}
            >
              {formatTime(isRecording ? remaining : duration > 0 ? duration : 60)}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-medium mt-0.5">
              {isRecording ? 'Remaining' : duration > 0 ? 'Recorded' : 'Max Time'}
            </span>
          </div>
        </div>

        {/* Live Audio Visualizer Equalizer */}
        {isRecording && (
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1.5 h-8">
              {waveformLevels.map((lvl, idx) => (
                <div
                  key={idx}
                  className="w-1 rounded-full bg-[#0f1d40] transition-all duration-75"
                  style={{ height: `${lvl}%` }}
                />
              ))}
            </div>
            <div className="text-[11px] text-zinc-400">Capturing audio...</div>
          </div>
        )}

        {/* Recorded Audio Preview */}
        {audioUrl && !isRecording && (
          <div className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-3.5 max-w-sm mx-auto space-y-2.5">
            <audio
              ref={audioPreviewRef}
              src={audioUrl}
              onTimeUpdate={handleAudioTimeUpdate}
              onEnded={handleAudioEnded}
              className="hidden"
            />
            <div className="flex items-center justify-between text-xs text-zinc-700">
              <span className="flex items-center gap-1.5 font-medium text-zinc-900">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#0f1d40]" />
                Audio recorded ({formatTime(duration)})
              </span>
              <span className="font-mono text-zinc-400 tabular-nums">
                {formatTime(Math.floor(playbackTime))} / {formatTime(duration)}
              </span>
            </div>

            <button
              type="button"
              onClick={togglePlayPreview}
              className="w-full py-2 px-3 rounded-lg bg-white hover:bg-zinc-100 text-zinc-800 font-medium text-xs border border-zinc-200 shadow-xs flex items-center justify-center gap-1.5 transition-colors"
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
                <h4 className="text-xs font-semibold text-zinc-900">
                  Microphone Access Was Denied
                </h4>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  No problem! PitchLab only accesses your microphone while you record your 60-second pitch. To enable real voice coaching, simply allow microphone access in your browser settings:
                </p>
              </div>
            </div>

            {/* Platform Guides */}
            <div className="bg-white/90 rounded-xl p-3 border border-amber-200/60 space-y-2 text-[11px] text-zinc-600">
              <div className="flex items-start gap-2">
                <span className="font-semibold text-zinc-800 shrink-0">iPhone / Safari:</span>
                <span>Tap the "aA" or lock icon in the Safari address bar → Website Settings → Microphone → select <strong>Allow</strong>.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold text-zinc-800 shrink-0">Chrome / Android:</span>
                <span>Tap the lock or tune icon in the address bar → Site Settings → Microphone → set to <strong>Allow</strong>.</span>
              </div>
            </div>

            {/* Friendly Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                type="button"
                onClick={startRecording}
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

        {/* Interactive Controls */}
        <div className="space-y-2 pt-1">
          {!isRecording && !audioUrl && (
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={startRecording}
                className="w-full py-3.5 px-4 rounded-xl bg-[#0f1d40] hover:bg-[#162a5c] text-white font-medium text-sm flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <Mic className="w-4 h-4" />
                <span>Start Recording (60s limit)</span>
              </button>
              <p className="text-[11px] text-zinc-400">
                Microphone permission is requested only when you tap start.
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
                    <span>Analyzing speech...</span>
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
                onClick={resetRecording}
                disabled={isSubmitting}
                className="w-full py-2.5 px-3 rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Re-record Answer</span>
              </button>
            </div>
          )}

          {!isRecording && (
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
