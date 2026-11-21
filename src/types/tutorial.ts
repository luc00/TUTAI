export type VideoAspectRatio = '16:9' | '9:16';
export type VideoDuration = '6s' | '10s';

export type StepIconKey =
  | 'prepare'
  | 'hand'
  | 'tool'
  | 'measure'
  | 'heat'
  | 'check'
  | 'finish';

export interface TutorialStep {
  stepNumber: number;
  title: string;
  description: string;
  visualCue: string;
  iconKey: StepIconKey;
  durationSeconds: number;
}

export interface TutorialScript {
  title: string;
  subtitle: string;
  category: string;
  estimatedTime: string;
  difficulty: 'Facile' | 'Media' | 'Avanzata';
  toolsNeeded: string[];
  steps: TutorialStep[];
  videoPromptEn: string;
}

export type VideoStatus =
  | 'idle'
  | 'generating'
  | 'ready'
  | 'fallback';

export interface VideoErrorInfo {
  code: string;
  message: string;
  isQuotaOrBilling: boolean;
  isTimeout: boolean;
}

export interface TutorialItem {
  id: string;
  query: string;
  createdAt: string;
  aspectRatio: VideoAspectRatio;
  duration: VideoDuration;
  script: TutorialScript;
  videoUrl: string | null;
  videoStatus: VideoStatus;
  videoError: VideoErrorInfo | null;
  posterImageUrl?: string;
  isCurated?: boolean;
}

export type GenerationPhase =
  | 'idle'
  | 'analyzing'
  | 'storyboarding'
  | 'rendering_video'
  | 'complete'
  | 'error';
