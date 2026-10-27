export type PitchMode = 'startup' | 'consulting' | 'elevator' | 'freestyle';
export type FeedbackStyle = 'supportive' | 'tough';
export type ScenarioDifficulty = 'simple' | 'medium' | 'complex';

export interface Scenario {
  title: string;
  audience: string;
  context: string;
  objective: string;
  keyConstraint: string;
  starterTip?: string;
  customCriteria?: string;
  difficulty?: ScenarioDifficulty;
}

export interface EvaluationScores {
  clarity: number;
  structure: number;
  persuasiveness: number;
  confidence: number;
  concision: number;
  overall: number;
}

export interface EvaluationFeedback {
  clarity: string;
  structure: string;
  persuasiveness: string;
  confidence: string;
  concision: string;
  customCriteria?: string;
}

export interface Round2Comparison {
  improvementSummary: string;
  keyWins: string[];
  remainingRefinements: string[];
  scoreDeltas: {
    clarity: number;
    structure: number;
    persuasiveness: number;
    confidence: number;
    concision: number;
    overall: number;
  };
}

export interface PitchEvaluation {
  transcript: string;
  scores: EvaluationScores;
  feedback: EvaluationFeedback;
  fillerWordsAndPacing: string[];
  followUpQuestion: string;
  round2Comparison?: Round2Comparison | null;
}

export interface SavedPitchSession {
  id: string;
  timestamp: number;
  mode: PitchMode;
  feedbackStyle: FeedbackStyle;
  difficulty?: ScenarioDifficulty;
  scenario: Scenario;
  evalR1: PitchEvaluation;
  evalR2?: PitchEvaluation | null;
  customTitle?: string;
  userNotes?: string;
  tags?: string[];
}
