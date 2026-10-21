import { useState, useRef, useEffect, useCallback } from 'react';
import { convertTo16kHzMonoWav, blobToBase64 } from '../utils/audioProcessing';

export interface AudioRecorderState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number; // in seconds
  audioBlob: Blob | null;
  audioUrl: string | null;
  audioBase64: string | null;
  mimeType: string;
  error: string | null;
  permissionDenied: boolean;
  waveformLevels: number[];
}

export function useAudioRecorder(maxDurationSeconds: number = 60, autoStopAtLimit: boolean = true) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('audio/wav');
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [waveformLevels, setWaveformLevels] = useState<number[]>(new Array(16).fill(10));

  const maxDurationRef = useRef(maxDurationSeconds);
  maxDurationRef.current = maxDurationSeconds;

  const autoStopRef = useRef(autoStopAtLimit);
  autoStopRef.current = autoStopAtLimit;

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Find best supported mimeType on client across Safari, Chrome, Android, iOS
  const getSupportedMimeType = useCallback((): string => {
    if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') {
      return '';
    }
    if (typeof MediaRecorder.isTypeSupported !== 'function') {
      return '';
    }
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/mp4;codecs=mp4a.40.2',
      'audio/aac',
      'audio/ogg;codecs=opus',
      'audio/wav',
    ];
    for (const t of types) {
      try {
        if (MediaRecorder.isTypeSupported(t)) {
          return t;
        }
      } catch {}
    }
    return '';
  }, []);

  const cleanupAudio = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setWaveformLevels(new Array(16).fill(10));
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        if (mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.requestData();
        }
      } catch {}
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    setIsRecording(false);
    cleanupAudio();
  }, [cleanupAudio]);

  const startRecording = useCallback(async () => {
    setError(null);
    setPermissionDenied(false);
    setAudioBlob(null);
    setAudioUrl(null);
    setAudioBase64(null);
    setDuration(0);
    chunksRef.current = [];

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Audio recording is not supported in this browser environment.');
      }

      // iOS Safari and Android Chrome audio stream retrieval with fallback
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
      } catch (constraintErr) {
        console.warn('getUserMedia with constraints failed, falling back to basic audio:', constraintErr);
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      mediaStreamRef.current = stream;

      // Setup Web Audio Analyser for live visualizer
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          if (audioCtx.state === 'suspended') {
            try {
              await audioCtx.resume();
            } catch {}
          }
          audioContextRef.current = audioCtx;
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);
          analyserRef.current = analyser;

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateWaveform = () => {
            if (!analyserRef.current) return;
            analyserRef.current.getByteFrequencyData(dataArray);
            
            // Sample 16 discrete bars normalized between 8% and 95%
            const bars: number[] = [];
            const step = Math.max(1, Math.floor(dataArray.length / 16));
            for (let i = 0; i < 16; i++) {
              const val = dataArray[i * step] || 0;
              const percent = Math.min(95, Math.max(8, (val / 255) * 100));
              bars.push(percent);
            }
            setWaveformLevels(bars);
            animFrameRef.current = requestAnimationFrame(updateWaveform);
          };
          animFrameRef.current = requestAnimationFrame(updateWaveform);
        }
      } catch (audioErr) {
        console.warn('AudioContext visualization setup non-fatal failure:', audioErr);
      }

      const selectedMime = getSupportedMimeType();
      let recorder: MediaRecorder;
      try {
        recorder = selectedMime
          ? new MediaRecorder(stream, { mimeType: selectedMime })
          : new MediaRecorder(stream);
      } catch (optionsErr) {
        console.warn('MediaRecorder with mimeType option failed, falling back to default constructor:', optionsErr);
        recorder = new MediaRecorder(stream);
      }
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const detectedType = recorder.mimeType || selectedMime || 'audio/webm';
        const originalBlob = new Blob(chunksRef.current, { type: detectedType });

        // Keep the original recording for playback in the app
        setAudioBlob(originalBlob);
        const originalUrl = URL.createObjectURL(originalBlob);
        setAudioUrl(originalUrl);

        // Decode with AudioContext, downmix to mono, resample to 16 kHz with OfflineAudioContext, and encode to 16-bit PCM WAV
        try {
          const { wavBase64 } = await convertTo16kHzMonoWav(originalBlob);
          setAudioBase64(wavBase64);
          setMimeType('audio/wav');
        } catch (conversionErr) {
          console.warn('Audio decoding / WAV conversion failed, falling back to original audio:', conversionErr);
          // If decoding fails, fall back to sending original audio
          try {
            const fallbackBase64 = await blobToBase64(originalBlob);
            setAudioBase64(fallbackBase64);
            setMimeType(detectedType);
          } catch (readErr) {
            console.error('Failed to read fallback audio blob:', readErr);
            setError('Failed to process recorded audio. Please try recording again.');
          }
        }
      };

      try {
        recorder.start(1000); // 1-second chunks for mobile stability
      } catch {
        recorder.start();
      }
      setIsRecording(true);

      // Start duration counter
      const startTime = Date.now();
      timerIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setDuration(elapsed);

        if (autoStopRef.current && elapsed >= maxDurationRef.current) {
          stopRecording();
        }
      }, 200);

    } catch (err: any) {
      console.error('Microphone error:', err);
      cleanupAudio();
      setIsRecording(false);

      if (
        err.name === 'NotAllowedError' ||
        err.name === 'PermissionDeniedError' ||
        err.message?.includes('denied') ||
        err.message?.includes('Permission')
      ) {
        setPermissionDenied(true);
        setError('Microphone permission was denied. Please allow microphone access to practice pitching.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('No microphone found on your device. Please plug in a microphone or headset.');
      } else {
        setError(err.message || 'Unable to access microphone.');
      }
    }
  }, [cleanupAudio, getSupportedMimeType, maxDurationSeconds, stopRecording]);

  const resetRecording = useCallback(() => {
    stopRecording();
    setAudioBlob(null);
    setAudioUrl(null);
    setAudioBase64(null);
    setDuration(0);
    setError(null);
    setPermissionDenied(false);
  }, [stopRecording]);

  useEffect(() => {
    return () => {
      cleanupAudio();
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [cleanupAudio, audioUrl]);

  return {
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
  };
}
