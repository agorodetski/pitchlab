import React, { useState } from 'react';
import { ArrowRight, Check, Plus, Sparkles, Sliders, Wand2, Play } from 'lucide-react';
import { FeedbackStyle, PitchMode, Scenario } from '../types';

interface ModeSelectorProps {
  selectedMode: PitchMode;
  onSelectMode: (mode: PitchMode) => void;
  selectedStyle: FeedbackStyle;
  onSelectStyle: (style: FeedbackStyle) => void;
  onContinue: (industry?: string, freestyleDraft?: Partial<Scenario>) => void;
  onDirectStartFreestyle?: (scenario: Scenario) => void;
  isLoading?: boolean;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  selectedMode,
  onSelectMode,
  selectedStyle,
  onSelectStyle,
  onContinue,
  onDirectStartFreestyle,
  isLoading = false,
}) => {
  // Preset industry state
  const [industry, setIndustry] = useState<string>('');
  const [isOther, setIsOther] = useState<boolean>(false);
  const [customIndustry, setCustomIndustry] = useState<string>('');

  // Local storage keys
  const DRAFT_KEY = 'pitchlab_freestyle_draft';
  const CUSTOM_SAVED_KEY = 'pitchlab_saved_custom_scenarios';

  // Freestyle custom scenario builder state initialized from localStorage
  const [freestyleTitle, setFreestyleTitle] = useState(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.title || '';
      }
    } catch {}
    return '';
  });

  const [freestyleAudience, setFreestyleAudience] = useState(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.audience || '';
      }
    } catch {}
    return '';
  });

  const [freestyleContext, setFreestyleContext] = useState(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.context || '';
      }
    } catch {}
    return '';
  });

  const [freestyleObjective, setFreestyleObjective] = useState(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.objective || '';
      }
    } catch {}
    return '';
  });

  const [freestyleConstraint, setFreestyleConstraint] = useState(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.constraint || '';
      }
    } catch {}
    return '';
  });

  const [freestyleCriteria, setFreestyleCriteria] = useState(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.criteria || '';
      }
    } catch {}
    return '';
  });

  // User-saved custom scenario templates list
  const [savedCustomScenarios, setSavedCustomScenarios] = useState<Array<{
    id: string;
    label: string;
    scenario: Scenario;
  }>>(() => {
    try {
      const stored = localStorage.getItem(CUSTOM_SAVED_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return [];
  });

  const [hasSavedDraftNotice, setHasSavedDraftNotice] = useState(false);

  // Auto-save draft changes to localStorage so inputs are never lost
  const persistDraft = (overrides?: Partial<{
    title: string;
    audience: string;
    context: string;
    objective: string;
    constraint: string;
    criteria: string;
  }>) => {
    try {
      const payload = {
        title: overrides?.title !== undefined ? overrides.title : freestyleTitle,
        audience: overrides?.audience !== undefined ? overrides.audience : freestyleAudience,
        context: overrides?.context !== undefined ? overrides.context : freestyleContext,
        objective: overrides?.objective !== undefined ? overrides.objective : freestyleObjective,
        constraint: overrides?.constraint !== undefined ? overrides.constraint : freestyleConstraint,
        criteria: overrides?.criteria !== undefined ? overrides.criteria : freestyleCriteria,
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
      setHasSavedDraftNotice(true);
      setTimeout(() => setHasSavedDraftNotice(false), 2000);
    } catch (e) {
      console.warn('Failed to auto-save freestyle draft:', e);
    }
  };

  const handleSaveToCustomScenarios = () => {
    if (!freestyleTitle.trim()) return;
    const newCustom = {
      id: `custom_${Date.now()}`,
      label: freestyleTitle.trim().slice(0, 24) + (freestyleTitle.trim().length > 24 ? '...' : ''),
      scenario: {
        title: freestyleTitle.trim(),
        audience: freestyleAudience.trim() || 'Executive Stakeholder',
        context: freestyleContext.trim() || 'Custom scenario.',
        objective: freestyleObjective.trim() || 'Present your core argument clearly within 60 seconds.',
        keyConstraint: freestyleConstraint.trim() || 'Audience is pressed for time.',
        starterTip: 'Hook the listener with your strongest single metric or insight upfront.',
        customCriteria: freestyleCriteria.trim() || undefined,
      },
    };
    const updated = [newCustom, ...savedCustomScenarios.filter((s) => s.scenario.title !== freestyleTitle.trim())].slice(0, 10);
    setSavedCustomScenarios(updated);
    try {
      localStorage.setItem(CUSTOM_SAVED_KEY, JSON.stringify(updated));
    } catch {}
  };

  const handleDeleteCustomScenario = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedCustomScenarios.filter((s) => s.id !== id);
    setSavedCustomScenarios(updated);
    try {
      localStorage.setItem(CUSTOM_SAVED_KEY, JSON.stringify(updated));
    } catch {}
  };

  const applyCustomSavedScenario = (sc: Scenario) => {
    setFreestyleTitle(sc.title);
    setFreestyleAudience(sc.audience);
    setFreestyleContext(sc.context);
    setFreestyleObjective(sc.objective);
    setFreestyleConstraint(sc.keyConstraint);
    setFreestyleCriteria(sc.customCriteria || '');
    persistDraft({
      title: sc.title,
      audience: sc.audience,
      context: sc.context,
      objective: sc.objective,
      constraint: sc.keyConstraint,
      criteria: sc.customCriteria || '',
    });
  };

  const modes: Array<{
    id: PitchMode;
    title: string;
    description: string;
    context: string;
  }> = [
    {
      id: 'startup',
      title: 'Startup Pitch',
      context: 'Seed / Series A',
      description: 'Hook investors with your problem, traction, unfair advantage, and capital ask in under 60 seconds.',
    },
    {
      id: 'consulting',
      title: 'Consulting Case Answer',
      context: 'McKinsey / BCG / Bain',
      description: 'Deliver a hypothesis-driven MECE structure to diagnose complex strategic problems.',
    },
    {
      id: 'elevator',
      title: 'Elevator Pitch',
      context: 'Executive Encounter',
      description: 'Capture a high-stakes stakeholder’s full attention and secure a follow-up meeting in 45 seconds.',
    },
    {
      id: 'freestyle',
      title: 'Freestyle Pitch',
      context: 'Custom Scenario & Rubric',
      description: 'Input your own pitch topic, target audience, setting, and custom criteria for a tailored evaluation.',
    },
  ];

  const presetIndustries = [
    'AI & SaaS',
    'Fintech',
    'Healthcare',
    'Climate Tech',
    'Enterprise Software',
    'Consumer',
  ];

  const freestyleTemplates = [
    {
      label: 'Internal Proposal',
      title: 'AI Tooling Budget Approval',
      audience: 'VP of Engineering and CFO',
      context: 'Pitching an internal developer platform migration to reduce build bottlenecks and cloud compute overhead.',
      objective: 'Secure approval for a $120k pilot budget and 2 dedicated sprint cycles.',
      constraint: 'CFO is enforcing strict cost freezes across all software tooling this quarter.',
      criteria: 'Quantified ROI within 6 months, clear milestone roadmap, and zero downtime risk.',
    },
    {
      label: 'Job Interview',
      title: 'Executive Role Turnaround Story',
      audience: 'CEO and Lead Board Director',
      context: 'Final interview stage for a VP / Head of Growth position at a high-growth scale-up.',
      objective: 'Deliver your 90-day turnaround strategy to reduce churn and double qualified pipeline.',
      constraint: 'CEO dislikes corporate buzzwords and demands concrete execution specifics.',
      criteria: 'Executive composure, structured 30-60-90 day milestones, and quantified past results.',
    },
    {
      label: 'Strategic Partnership',
      title: 'Enterprise Platform Integration',
      audience: 'Head of Corporate Business Development',
      context: 'Proposing an exclusive co-marketing and native API integration partnership.',
      objective: 'Earn a technical scoping sprint and sign a reciprocal pilot agreement.',
      constraint: 'They have a strong "not-invented-here" bias and protect their enterprise customer base.',
      criteria: 'Mutual retention value, clear competitive moat, and time-to-market advantage.',
    },
    {
      label: 'Sales Demo Hook',
      title: 'Enterprise Cyber Security Pitch',
      audience: 'Chief Information Security Officer (CISO)',
      context: 'You have a 60-second opening in an introductory discovery call with a Fortune 500 account.',
      objective: 'Convince the CISO to commit to a 20-minute architectural deep-dive next Tuesday.',
      constraint: 'They receive dozens of vendor cold emails every week and are extremely protective of their time.',
      criteria: 'Punchy problem hook, quantified industry breach risk, and a low-friction meeting ask.',
    },
  ];

  const applyFreestyleTemplate = (tmpl: (typeof freestyleTemplates)[0]) => {
    setFreestyleTitle(tmpl.title);
    setFreestyleAudience(tmpl.audience);
    setFreestyleContext(tmpl.context);
    setFreestyleObjective(tmpl.objective);
    setFreestyleConstraint(tmpl.constraint);
    setFreestyleCriteria(tmpl.criteria);
    persistDraft({
      title: tmpl.title,
      audience: tmpl.audience,
      context: tmpl.context,
      objective: tmpl.objective,
      constraint: tmpl.constraint,
      criteria: tmpl.criteria,
    });
  };

  const clearFreestyleForm = () => {
    setFreestyleTitle('');
    setFreestyleAudience('');
    setFreestyleContext('');
    setFreestyleObjective('');
    setFreestyleConstraint('');
    setFreestyleCriteria('');
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {}
  };

  const handleSelectPreset = (ind: string) => {
    setIsOther(false);
    if (industry === ind) {
      setIndustry('');
    } else {
      setIndustry(ind);
    }
  };

  const handleToggleOther = () => {
    if (isOther) {
      setIsOther(false);
      setIndustry('');
    } else {
      setIsOther(true);
      setIndustry(customIndustry.trim());
    }
  };

  const handleClearIndustry = () => {
    setIndustry('');
    setIsOther(false);
    setCustomIndustry('');
  };

  // Direct start with custom freestyle scenario
  const handleDirectStart = () => {
    if (!freestyleTitle.trim()) return;

    persistDraft();

    const customScenario: Scenario = {
      title: freestyleTitle.trim(),
      audience: freestyleAudience.trim() || 'Executive Stakeholder',
      context: freestyleContext.trim() || 'Custom user pitch scenario.',
      objective: freestyleObjective.trim() || 'Present your core argument clearly within 60 seconds.',
      keyConstraint: freestyleConstraint.trim() || 'Audience is pressed for time and highly analytical.',
      starterTip: 'Hook the listener with your strongest single metric or insight upfront.',
      customCriteria: freestyleCriteria.trim() || undefined,
    };

    if (onDirectStartFreestyle) {
      onDirectStartFreestyle(customScenario);
    } else {
      onContinue(undefined, customScenario);
    }
  };

  // AI-assisted polish for freestyle scenario
  const handleAIAssistedStart = () => {
    persistDraft();

    const draft: Partial<Scenario> = {
      title: freestyleTitle.trim() || 'Custom Executive Pitch',
      audience: freestyleAudience.trim() || 'Executive Stakeholder',
      context: freestyleContext.trim() || undefined,
      objective: freestyleObjective.trim() || undefined,
      keyConstraint: freestyleConstraint.trim() || undefined,
      customCriteria: freestyleCriteria.trim() || undefined,
    };
    onContinue(undefined, draft);
  };

  const isFreestyleValid = freestyleTitle.trim().length > 0;

  return (
    <div className="w-full max-w-xl mx-auto space-y-6 pt-2 pb-6">
      {/* Intro Header */}
      <div className="space-y-1.5">
        <h1 className="text-xl sm:text-2xl font-semibold text-zinc-900 tracking-tight">
          Pitch Practice Studio
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed">
          Record up to 60 seconds of spoken audio. Receive an objective scorecard across 5 dimensions, a pacing audit, and a rigorous follow-up challenge.
        </p>
      </div>

      {/* 1. Mode Selection */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-zinc-700">
          Format
        </label>
        <div className="space-y-2.5">
          {modes.map((m) => {
            const isSelected = selectedMode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => onSelectMode(m.id)}
                className={`w-full text-left p-3.5 sm:p-4 rounded-xl border transition-all relative ${
                  isSelected
                    ? 'bg-white border-[#0f1d40] ring-1 ring-[#0f1d40] shadow-xs'
                    : 'bg-white border-zinc-200/90 hover:border-zinc-300 shadow-xs text-zinc-600'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-zinc-900">{m.title}</span>
                      <span className="text-[11px] text-zinc-400 font-normal">·</span>
                      <span className="text-[11px] text-zinc-500 font-medium">{m.context}</span>
                    </div>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      {m.description}
                    </p>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                      isSelected
                        ? 'border-[#0f1d40] bg-[#0f1d40] text-white'
                        : 'border-zinc-300 bg-white'
                    }`}
                  >
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Feedback Style Segmented Control */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-zinc-700">
          Critique Style
        </label>
        <div className="grid grid-cols-2 gap-2.5">
          {/* Supportive Mentor */}
          <button
            type="button"
            onClick={() => onSelectStyle('supportive')}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              selectedStyle === 'supportive'
                ? 'bg-white border-[#0f1d40] ring-1 ring-[#0f1d40] shadow-xs'
                : 'bg-white border-zinc-200/90 hover:border-zinc-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-xs text-zinc-900">Supportive Mentor</span>
              {selectedStyle === 'supportive' && (
                <Check className="w-3.5 h-3.5 text-[#0f1d40]" />
              )}
            </div>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Constructive, highlights core strengths, and provides high-leverage delivery tweaks.
            </p>
          </button>

          {/* Tough Investor */}
          <button
            type="button"
            onClick={() => onSelectStyle('tough')}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              selectedStyle === 'tough'
                ? 'bg-white border-[#0f1d40] ring-1 ring-[#0f1d40] shadow-xs'
                : 'bg-white border-zinc-200/90 hover:border-zinc-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-xs text-zinc-900">Tough Investor</span>
              {selectedStyle === 'tough' && (
                <Check className="w-3.5 h-3.5 text-[#0f1d40]" />
              )}
            </div>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Direct, cuts through fluff, and aggressively stress-tests unit economics and assumptions.
            </p>
          </button>
        </div>
      </div>

      {/* 3A. FREESTYLE PITCH BUILDER (When Freestyle is selected) */}
      {selectedMode === 'freestyle' ? (
        <div className="bg-white border border-zinc-200/90 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-[#0f1d40]" />
              <h3 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">
                Custom Scenario & Criteria Builder
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                <Check className="w-3 h-3 text-emerald-600" />
                <span>Auto-saved</span>
              </span>
              {(freestyleTitle || freestyleAudience || freestyleCriteria) && (
                <button
                  type="button"
                  onClick={clearFreestyleForm}
                  className="text-[11px] text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  Clear Form
                </button>
              )}
            </div>
          </div>

          {/* User's Own Saved Scenarios if any exist */}
          {savedCustomScenarios.length > 0 && (
            <div className="space-y-1.5 bg-zinc-50/70 p-3 rounded-xl border border-zinc-200/60">
              <div className="text-[11px] text-zinc-700 font-semibold flex items-center justify-between">
                <span>Your Saved Custom Scenarios:</span>
                <span className="text-[10px] text-zinc-400 font-normal">Stored in browser</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {savedCustomScenarios.map((cs) => (
                  <div
                    key={cs.id}
                    className="inline-flex items-center rounded-lg border border-zinc-200 bg-white hover:border-[#0f1d40] text-zinc-800 text-xs transition-colors overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => applyCustomSavedScenario(cs.scenario)}
                      className="px-2.5 py-1 text-left font-medium hover:text-[#0f1d40]"
                    >
                      {cs.label}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteCustomScenario(cs.id, e)}
                      aria-label="Delete saved custom scenario"
                      className="px-1.5 py-1 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 border-l border-zinc-100"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick-start Templates */}
          <div className="space-y-1.5">
            <div className="text-[11px] text-zinc-500 font-medium">Quick-Start Templates:</div>
            <div className="flex flex-wrap gap-1.5">
              {freestyleTemplates.map((t) => (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => applyFreestyleTemplate(t)}
                  className="text-xs px-2.5 py-1 rounded-lg border border-zinc-200/90 bg-zinc-50 hover:bg-zinc-100 hover:border-zinc-300 text-zinc-700 transition-colors"
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-3 pt-1">
            {/* What you are pitching */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-800 flex items-center justify-between">
                <span>What are you pitching? <span className="text-rose-500">*</span></span>
                <span className="text-[10px] text-zinc-400 font-normal">Topic, product, or idea</span>
              </label>
              <input
                type="text"
                value={freestyleTitle}
                onChange={(e) => {
                  setFreestyleTitle(e.target.value);
                  persistDraft({ title: e.target.value });
                }}
                placeholder="e.g., Enterprise Telemetry Platform, Q3 Marketing Budget, Job Interview Pitch"
                className="w-full bg-zinc-50/50 border border-zinc-200/90 focus:border-[#0f1d40] rounded-xl px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#0f1d40]"
              />
            </div>

            {/* Target Audience */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-800 flex items-center justify-between">
                <span>Who is the Target Audience?</span>
                <span className="text-[10px] text-zinc-400 font-normal">Who you are speaking to</span>
              </label>
              <input
                type="text"
                value={freestyleAudience}
                onChange={(e) => {
                  setFreestyleAudience(e.target.value);
                  persistDraft({ audience: e.target.value });
                }}
                placeholder="e.g., General Partner at Benchmark, Enterprise CIO, Hiring Manager"
                className="w-full bg-zinc-50/50 border border-zinc-200/90 focus:border-[#0f1d40] rounded-xl px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#0f1d40]"
              />
            </div>

            {/* Context & Background */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-800 flex items-center justify-between">
                <span>Context & Situation</span>
                <span className="text-[10px] text-zinc-400 font-normal">Brief background</span>
              </label>
              <textarea
                rows={2}
                value={freestyleContext}
                onChange={(e) => {
                  setFreestyleContext(e.target.value);
                  persistDraft({ context: e.target.value });
                }}
                placeholder="e.g., We have 10 pilot customers with 0% churn, and need approval to expand across all EMEA branches."
                className="w-full bg-zinc-50/50 border border-zinc-200/90 focus:border-[#0f1d40] rounded-xl p-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#0f1d40]"
              />
            </div>

            {/* Core 60s Objective */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-800 flex items-center justify-between">
                <span>Core Objective</span>
                <span className="text-[10px] text-zinc-400 font-normal">What you must achieve in 60s</span>
              </label>
              <input
                type="text"
                value={freestyleObjective}
                onChange={(e) => {
                  setFreestyleObjective(e.target.value);
                  persistDraft({ objective: e.target.value });
                }}
                placeholder="e.g., Secure commitment for a 30-day technical trial on one server cluster."
                className="w-full bg-zinc-50/50 border border-zinc-200/90 focus:border-[#0f1d40] rounded-xl px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#0f1d40]"
              />
            </div>

            {/* Audience Skepticism / Curveball */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-800 flex items-center justify-between">
                <span>Audience Skepticism or Key Constraint</span>
                <span className="text-[10px] text-zinc-400 font-normal">Optional</span>
              </label>
              <input
                type="text"
                value={freestyleConstraint}
                onChange={(e) => {
                  setFreestyleConstraint(e.target.value);
                  persistDraft({ constraint: e.target.value });
                }}
                placeholder="e.g., Buyer is worried about developer downtime and strict GDPR data controls."
                className="w-full bg-zinc-50/50 border border-zinc-200/90 focus:border-[#0f1d40] rounded-xl px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#0f1d40]"
              />
            </div>

            {/* Custom Evaluation Criteria */}
            <div className="space-y-1 bg-blue-50/40 p-3 rounded-xl border border-blue-200/50">
              <label className="text-xs font-semibold text-[#0f1d40] flex items-center justify-between">
                <span>Custom Criteria to Grade Against</span>
                <span className="text-[10px] text-blue-700 font-normal">Rubric Focus</span>
              </label>
              <textarea
                rows={2}
                value={freestyleCriteria}
                onChange={(e) => {
                  setFreestyleCriteria(e.target.value);
                  persistDraft({ criteria: e.target.value });
                }}
                placeholder="e.g., Grade specifically on: ROI quantification, MECE framework clarity, handling of security skepticism, and absence of jargon."
                className="w-full bg-white border border-blue-200 rounded-lg p-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#0f1d40]"
              />
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                PitchLab's AI coach will evaluate your spoken pitch directly against these specific criteria on your scorecard.
              </p>
            </div>

            {/* Save to Custom Scenarios Preset button */}
            {isFreestyleValid && (
              <div className="pt-0.5 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveToCustomScenarios}
                  className="text-xs text-[#0f1d40] hover:text-[#162a5c] font-medium flex items-center gap-1.5 py-1 px-2.5 rounded-lg hover:bg-zinc-100 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Save this scenario as a reusable preset</span>
                </button>
              </div>
            )}
          </div>

          {/* Dual Action Buttons for Freestyle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
            {/* Direct Pitch */}
            <button
              type="button"
              onClick={handleDirectStart}
              disabled={!isFreestyleValid || isLoading}
              className="py-3 px-4 rounded-xl bg-[#0f1d40] hover:bg-[#162a5c] text-white font-medium text-xs flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-40"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Pitch My Scenario</span>
            </button>

            {/* AI Polish */}
            <button
              type="button"
              onClick={handleAIAssistedStart}
              disabled={isLoading}
              className="py-3 px-4 rounded-xl bg-white hover:bg-zinc-50 text-zinc-800 border border-zinc-200 font-medium text-xs flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 border-2 border-zinc-400 border-t-zinc-800 rounded-full animate-spin" />
                  <span>Polishing...</span>
                </div>
              ) : (
                <>
                  <Wand2 className="w-3.5 h-3.5 text-[#0f1d40]" />
                  <span>Polish with AI Coach</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* 3B. Standard Industry Context (For preset modes) */
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-700 flex items-center justify-between">
            <span>Industry Context (Optional)</span>
            {(industry || isOther) && (
              <button
                type="button"
                onClick={handleClearIndustry}
                className="text-[11px] text-zinc-400 hover:text-zinc-600 font-normal"
              >
                Clear
              </button>
            )}
          </label>

          {/* Chips */}
          <div className="flex flex-wrap gap-1.5">
            {presetIndustries.map((ind) => {
              const isIndSelected = !isOther && industry === ind;
              return (
                <button
                  key={ind}
                  type="button"
                  onClick={() => handleSelectPreset(ind)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                    isIndSelected
                      ? 'bg-[#0f1d40] text-white border-[#0f1d40] font-medium'
                      : 'bg-white text-zinc-600 border-zinc-200/90 hover:border-zinc-300 hover:text-zinc-900'
                  }`}
                >
                  {ind}
                </button>
              );
            })}

            {/* Other Chip */}
            <button
              type="button"
              onClick={handleToggleOther}
              className={`text-xs px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 ${
                isOther
                  ? 'bg-[#0f1d40] text-white border-[#0f1d40] font-medium'
                  : 'bg-white text-zinc-600 border-zinc-200/90 hover:border-zinc-300 hover:text-zinc-900'
              }`}
            >
              <span>Other</span>
              {!isOther && <Plus className="w-3 h-3 text-zinc-400" />}
            </button>
          </div>

          {/* Other Write-In Input Field */}
          {isOther && (
            <div className="pt-1">
              <input
                type="text"
                value={customIndustry}
                onChange={(e) => {
                  setCustomIndustry(e.target.value);
                  setIndustry(e.target.value.trim());
                }}
                placeholder="Enter custom industry (e.g., Aerospace, Defense, Real Estate, BioTech...)"
                autoFocus
                className="w-full bg-white border border-[#0f1d40] rounded-xl px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#0f1d40] shadow-xs"
              />
            </div>
          )}
        </div>
      )}

      {/* Primary CTA Button for standard modes */}
      {selectedMode !== 'freestyle' && (
        <div className="pt-2">
          <button
            type="button"
            onClick={() => onContinue(industry)}
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-xl bg-[#0f1d40] hover:bg-[#162a5c] text-white font-medium text-sm flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>Generating scenario...</span>
              </div>
            ) : (
              <>
                <span>Generate Practice Scenario</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
