import React from 'react';
import { Mic, History, Plus, Bookmark } from 'lucide-react';
import { FeedbackStyle, PitchMode } from '../types';

interface HeaderProps {
  mode?: PitchMode;
  feedbackStyle?: FeedbackStyle;
  round?: 1 | 2;
  onOpenHistory?: () => void;
  onReset?: () => void;
  savedSessionsCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  mode,
  feedbackStyle,
  round,
  onOpenHistory,
  onReset,
  savedSessionsCount = 0,
}) => {
  const getModeLabel = () => {
    switch (mode) {
      case 'startup':
        return 'Startup';
      case 'consulting':
        return 'Consulting';
      case 'elevator':
        return 'Elevator';
      case 'freestyle':
        return 'Freestyle';
      default:
        return null;
    }
  };

  const modeLabel = getModeLabel();

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-zinc-200/80 px-4 py-2.5">
      <div className="max-w-xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#0f1d40] flex items-center justify-center text-white shadow-xs">
            <Mic className="w-3.5 h-3.5 stroke-[2.2]" />
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-zinc-900 tracking-tight">PitchLab</span>
            {round && (
              <>
                <span className="text-zinc-300 font-light">/</span>
                <span className="text-xs text-zinc-500 font-medium">
                  {round === 1 ? 'Round 1' : 'Round 2'}
                </span>
              </>
            )}
            {modeLabel && !round && (
              <>
                <span className="text-zinc-300 font-light">/</span>
                <span className="text-xs text-zinc-500 font-medium">{modeLabel}</span>
              </>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {onOpenHistory && (
            <button
              onClick={onOpenHistory}
              aria-label="View Pitch Library"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 transition-colors border border-transparent hover:border-zinc-200/80"
              title="Open Pitch Library"
            >
              <Bookmark className="w-3.5 h-3.5 text-[#0f1d40]" />
              <span className="hidden xs:inline sm:inline">Pitch Library</span>
              <span className="xs:hidden sm:hidden">Library</span>
              {savedSessionsCount > 0 && (
                <span className="text-[10px] font-semibold bg-zinc-100 text-[#0f1d40] px-1.5 py-0.2 rounded-full border border-zinc-200">
                  {savedSessionsCount}
                </span>
              )}
            </button>
          )}

          {onReset && (
            <button
              onClick={onReset}
              aria-label="New Session"
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
