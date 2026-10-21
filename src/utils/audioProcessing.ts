/**
 * Audio processing utilities for cross-browser recording, decoding,
 * downmixing to mono, resampling to 16 kHz, and encoding as 16-bit PCM WAV.
 */

function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Encodes Float32 mono audio samples into a 16-bit PCM WAV ArrayBuffer.
 */
export function encode16BitPcmWav(samples: Float32Array, sampleRate = 16000): ArrayBuffer {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = samples.length * (bitsPerSample / 8);

  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF Chunk Descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');

  // "fmt " Sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
  view.setUint16(22, numChannels, true); // NumChannels (1 = Mono)
  view.setUint32(24, sampleRate, true); // SampleRate (16000 Hz)
  view.setUint32(28, byteRate, true); // ByteRate
  view.setUint16(32, blockAlign, true); // BlockAlign
  view.setUint16(34, bitsPerSample, true); // BitsPerSample (16-bit)

  // "data" Sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Write PCM audio samples clamped to [-1.0, 1.0]
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return buffer;
}

/**
 * Converts an ArrayBuffer to a standard base64 string safely.
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  const chunkSize = 8192;
  for (let i = 0; i < len; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }
  return btoa(binary);
}

/**
 * Converts a Blob to a base64 string using FileReader.
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const res = reader.result as string;
      if (res) {
        const base64 = res.includes(',') ? res.split(',')[1] : res;
        resolve(base64);
      } else {
        reject(new Error('FileReader produced empty result'));
      }
    };
    reader.onerror = () => reject(reader.error || new Error('FileReader failed'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Decodes recorded audio with AudioContext.decodeAudioData,
 * downmixes to mono and resamples to 16 kHz using an OfflineAudioContext,
 * and encodes it as a 16-bit PCM WAV.
 */
export async function convertTo16kHzMonoWav(
  audioBlob: Blob
): Promise<{ wavBlob: Blob; wavBase64: string }> {
  const arrayBuffer = await audioBlob.arrayBuffer();

  const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtxClass) {
    throw new Error('AudioContext is not supported in this browser.');
  }

  const audioCtx = new AudioCtxClass();
  if (audioCtx.state === 'suspended') {
    try {
      await audioCtx.resume();
    } catch {}
  }

  let audioBuffer: AudioBuffer;
  try {
    // Safari may detach the ArrayBuffer, so pass a clone via slice(0).
    // Support both promise and callback interfaces for Safari compatibility.
    audioBuffer = await new Promise<AudioBuffer>((resolve, reject) => {
      let settled = false;
      try {
        const promise = audioCtx.decodeAudioData(
          arrayBuffer.slice(0),
          (decoded) => {
            if (!settled) {
              settled = true;
              resolve(decoded);
            }
          },
          (err) => {
            if (!settled) {
              settled = true;
              reject(err);
            }
          }
        );
        if (promise && typeof promise.then === 'function') {
          promise
            .then((decoded) => {
              if (!settled) {
                settled = true;
                resolve(decoded);
              }
            })
            .catch((err) => {
              if (!settled) {
                settled = true;
                reject(err);
              }
            });
        }
      } catch (callErr) {
        if (!settled) {
          settled = true;
          reject(callErr);
        }
      }
    });
  } finally {
    audioCtx.close().catch(() => {});
  }

  const targetSampleRate = 16000;
  const targetDuration = Math.max(0.1, audioBuffer.duration);
  const targetFrames = Math.max(1, Math.ceil(targetDuration * targetSampleRate));

  const OfflineCtxClass =
    window.OfflineAudioContext || (window as any).webkitOfflineAudioContext;
  if (!OfflineCtxClass) {
    throw new Error('OfflineAudioContext is not supported in this browser.');
  }

  // OfflineAudioContext with 1 channel automatically downmixes input channels to mono
  // and resamples to targetSampleRate (16 kHz)
  const offlineCtx = new OfflineCtxClass(1, targetFrames, targetSampleRate);
  const source = offlineCtx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(offlineCtx.destination);
  source.start(0);

  const renderedBuffer = await offlineCtx.startRendering();
  const monoSamples = renderedBuffer.getChannelData(0);

  const wavArrayBuffer = encode16BitPcmWav(monoSamples, targetSampleRate);
  const wavBlob = new Blob([wavArrayBuffer], { type: 'audio/wav' });
  const wavBase64 = arrayBufferToBase64(wavArrayBuffer);

  return { wavBlob, wavBase64 };
}
