import { useState, useRef, useEffect, useCallback } from 'react';

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

export function useAudioRecorder(maxDurationSeconds: number = 60) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('audio/webm');
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [waveformLevels, setWaveformLevels] = useState<number[]>(new Array(16).fill(10));

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Find best supported mimeType on client
  const getSupportedMimeType = useCallback((): string => {
    if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') {
      return 'audio/webm';
    }
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/aac',
      'audio/ogg;codecs=opus',
      'audio/wav'
    ];
    for (const t of types) {
      if (MediaRecorder.isTypeSupported(t)) {
        return t;
      }
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
      mediaRecorderRef.current.stop();
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

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      mediaStreamRef.current = stream;

      // Setup Web Audio Analyser for live visualizer
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
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
      setMimeType(selectedMime || 'audio/webm');

      const options: MediaRecorderOptions = {};
      if (selectedMime) {
        options.mimeType = selectedMime;
      }

      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const detectedType = recorder.mimeType || selectedMime || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: detectedType });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // Convert blob to base64
        const reader = new FileReader();
        reader.onloadend = () => {
          const res = reader.result as string;
          if (res) {
            const base64 = res.includes(',') ? res.split(',')[1] : res;
            setAudioBase64(base64);
          }
        };
        reader.readAsDataURL(blob);
      };

      recorder.start(250); // collect chunks every 250ms
      setIsRecording(true);

      // Start duration counter
      const startTime = Date.now();
      timerIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setDuration(elapsed);

        if (elapsed >= maxDurationSeconds) {
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
