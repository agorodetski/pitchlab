import { PitchEvaluation, PitchMode, FeedbackStyle, Scenario } from '../types';

export interface SavedLibraryPitch {
  id: string;
  title: string;
  timestamp: number;
  mode: PitchMode;
  feedbackStyle: FeedbackStyle;
  scenario: Scenario;
  evalR1: PitchEvaluation;
  evalR2?: PitchEvaluation | null;
  audioR1Blob?: Blob | null;
  audioR2Blob?: Blob | null;
  notes?: string;
  tags?: string[];
}

const DB_NAME = 'pitchlab_library_db';
const DB_VERSION = 1;
const STORE_NAME = 'pitches';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const pitchLibrary = {
  async savePitch(pitch: SavedLibraryPitch): Promise<void> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put(pitch);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      // Fallback to localStorage without large binary blobs if IndexedDB is blocked
      console.warn('Falling back to localStorage for pitch metadata:', e);
      try {
        const metaOnly = { ...pitch, audioR1Blob: null, audioR2Blob: null };
        const stored = localStorage.getItem('pitchlab_library_fallback') || '[]';
        const list = JSON.parse(stored);
        const filtered = list.filter((p: any) => p.id !== pitch.id);
        filtered.unshift(metaOnly);
        localStorage.setItem('pitchlab_library_fallback', JSON.stringify(filtered.slice(0, 30)));
      } catch {}
    }
  },

  async getAllPitches(): Promise<SavedLibraryPitch[]> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => {
          const res = req.result || [];
          res.sort((a, b) => b.timestamp - a.timestamp);
          resolve(res);
        };
        req.onerror = () => reject(req.error);
      });
    } catch {
      try {
        const stored = localStorage.getItem('pitchlab_library_fallback') || '[]';
        return JSON.parse(stored);
      } catch {
        return [];
      }
    }
  },

  async deletePitch(id: string): Promise<void> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      try {
        const stored = localStorage.getItem('pitchlab_library_fallback') || '[]';
        const list = JSON.parse(stored);
        const filtered = list.filter((p: any) => p.id !== id);
        localStorage.setItem('pitchlab_library_fallback', JSON.stringify(filtered));
      } catch {}
    }
  },

  async updateNotes(id: string, notes: string): Promise<void> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const getReq = store.get(id);
        getReq.onsuccess = () => {
          if (getReq.result) {
            getReq.result.notes = notes;
            store.put(getReq.result);
          }
        };
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {}
  }
};
