import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Download,
  Film,
  Loader2,
  Pause,
  Play,
  RefreshCw,
  Repeat,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { GenerationPhase, TutorialItem } from '../types/tutorial.ts';
import { formatVideoTime } from '../utils/tutorialLogic.ts';
import { StepIcon } from './StepIcon.tsx';

interface VideoStageProps {
  tutorial: TutorialItem;
  phase: GenerationPhase;
  activeStepIndex: number;
  onSelectStep: (index: number) => void;
  onRetryVideo: () => void;
}

const PROGRESS_LABELS: Record<string, string> = {
  analyzing: 'Analizzo la richiesta...',
  storyboarding: 'Creo lo storyboard e i passaggi...',
  rendering_video: 'Renderizzo il video tutorial...',
};

export function VideoStage({
  tutorial,
  phase,
  activeStepIndex,
  onSelectStep,
  onRetryVideo,
}: VideoStageProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Native HTML5 video player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);

  // Interactive Storyboard fallback playback state
  const [storyboardPlaying, setStoryboardPlaying] = useState(false);
  const [storyboardLoop, setStoryboardLoop] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [posterFailed, setPosterFailed] = useState(false);

  const steps = tutorial.script.steps;
  const safeStepIndex = Math.min(Math.max(activeStepIndex, 0), Math.max(steps.length - 1, 0));
  const currentStep = steps[safeStepIndex];

  // Reset player state when switching tutorials
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setTotalDuration(0);
    setStoryboardPlaying(false);
    setPosterFailed(false);
  }, [tutorial.id, tutorial.videoUrl]);

  // Track elapsed loading time during Phase 1 / Phase 2
  useEffect(() => {
    if (phase !== 'analyzing' && phase !== 'storyboarding' && phase !== 'rendering_video') {
      setElapsedSeconds(0);
      return;
    }
    const timer = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [phase]);

  // Auto-advance storyboard mode when user presses Play on storyboard
  useEffect(() => {
    if (!storyboardPlaying || tutorial.videoUrl) return;
    const stepMs = (currentStep?.durationSeconds || 3) * 1000;
    const timer = window.setTimeout(() => {
      if (safeStepIndex < steps.length - 1) {
        onSelectStep(safeStepIndex + 1);
      } else if (storyboardLoop) {
        onSelectStep(0);
      } else {
        setStoryboardPlaying(false);
      }
    }, stepMs);
    return () => window.clearTimeout(timer);
  }, [
    storyboardPlaying,
    safeStepIndex,
    steps.length,
    storyboardLoop,
    currentStep?.durationSeconds,
    tutorial.videoUrl,
    onSelectStep,
  ]);

  const toggleVideoPlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play();
    } else {
      video.pause();
    }
  };

  const handleSeek = (value: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = value;
    setCurrentTime(value);
  };

  const isRenderingVideo =
    phase === 'analyzing' || phase === 'storyboarding' || phase === 'rendering_video' || tutorial.videoStatus === 'generating';

  const aspectClass =
    tutorial.aspectRatio === '9:16'
      ? 'aspect-[9/16] max-w-sm mx-auto'
      : 'aspect-video w-full';

  // 1. Rendering / Progressive Loading State
  if (isRenderingVideo) {
    const activeLabel =
      PROGRESS_LABELS[phase] ?? 'Renderizzo il video tutorial...';
    const stageIndex =
      phase === 'analyzing' ? 0 : phase === 'storyboarding' ? 1 : 2;

    return (
      <div
        data-testid="video-stage-loading"
        className={`${aspectClass} bg-slate-900 text-white rounded-2xl border border-slate-800 overflow-hidden flex flex-col justify-between p-6 sm:p-8`}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-blue-300">
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            <span>Generazione in corso</span>
          </div>
          <span className="font-mono text-xs tabular-nums text-slate-400">
            {formatVideoTime(elapsedSeconds)}
          </span>
        </div>

        <div className="my-auto py-4">
          <p className="font-display text-xl sm:text-2xl font-semibold text-white text-balance">
            {activeLabel}
          </p>
          <p className="mt-2 text-sm text-slate-300 max-w-md">
            {stageIndex < 2
              ? 'Sto preparando la struttura della guida e la regia visiva.'
              : 'Il modello video sta generando le sequenze. Nel frattempo puoi già leggere i passaggi qui accanto.'}
          </p>
        </div>

        <div className="space-y-3">
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-500 rounded-full"
              style={{ width: stageIndex === 0 ? '25%' : stageIndex === 1 ? '55%' : '82%' }}
            />
          </div>
          <ol className="grid grid-cols-3 gap-2 text-xs">
            {[
              'Analizzo la richiesta',
              'Creo lo storyboard',
              'Renderizzo il video',
            ].map((stepLabel, idx) => (
              <li
                key={stepLabel}
                className={`truncate ${
                  idx <= stageIndex ? 'text-slate-100 font-medium' : 'text-slate-500'
                }`}
              >
                {idx + 1}. {stepLabel}
              </li>
            ))}
          </ol>
        </div>
      </div>
    );
  }

  // 2. Native Video Player State (when Veo / Omni returned a real video)
  if (tutorial.videoUrl) {
    const downloadHref = tutorial.videoUrl.startsWith('/api/video/')
      ? `${tutorial.videoUrl}?download=1`
      : tutorial.videoUrl;

    return (
      <div className="space-y-3" data-testid="video-stage-player">
        <div
          className={`${aspectClass} bg-slate-950 rounded-2xl overflow-hidden border border-slate-200 relative group`}
        >
          <video
            ref={videoRef}
            src={tutorial.videoUrl}
            loop={isLooping}
            muted={isMuted}
            playsInline
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
            onLoadedMetadata={(e) => setTotalDuration(e.currentTarget.duration)}
            onClick={toggleVideoPlay}
            className="w-full h-full object-contain cursor-pointer"
          />
        </div>

        {/* Custom Video Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-white border border-slate-200 rounded-xl">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleVideoPlay}
              aria-label={isPlaying ? 'Metti in pausa' : 'Riproduci video'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4" aria-hidden="true" />
                  <span>Pausa</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" aria-hidden="true" />
                  <span>Play</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsLooping((prev) => !prev)}
              aria-pressed={isLooping}
              aria-label="Attiva o disattiva loop"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                isLooping
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              <Repeat className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Loop</span>
            </button>

            <button
              type="button"
              onClick={() => setIsMuted((prev) => !prev)}
              aria-pressed={isMuted}
              aria-label={isMuted ? 'Riattiva audio' : 'Disattiva audio'}
              className="p-2 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Volume2 className="w-4 h-4" aria-hidden="true" />
              )}
            </button>
          </div>

          <div className="flex-1 min-w-[140px] flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={totalDuration || 10}
              step={0.1}
              value={currentTime}
              onChange={(e) => handleSeek(Number(e.target.value))}
              aria-label="Avanzamento video"
              className="w-full accent-blue-600 cursor-pointer"
            />
            <span className="font-mono text-xs tabular-nums text-slate-600 whitespace-nowrap shrink-0">
              {formatVideoTime(currentTime)} / {formatVideoTime(totalDuration)}
            </span>
          </div>

          <a
            href={downloadHref}
            download={`${tutorial.id}.mp4`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Scarica MP4</span>
          </a>
        </div>
      </div>
    );
  }

  // 3. Graceful Fallback / Interactive Illustrated Storyboard Stage
  return (
    <div className="space-y-3" data-testid="video-stage-storyboard">
      {tutorial.videoError && (
        <div
          role="status"
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-900"
        >
          <div className="flex items-start gap-2.5">
            <AlertTriangle
              className="w-4 h-4 text-amber-700 mt-0.5 shrink-0"
              aria-hidden="true"
            />
            <div>
              <p className="font-semibold">
                Video AI non generato — Modalità Storyboard Illustrato attiva
              </p>
              <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                {tutorial.videoError.message}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onRetryVideo}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-900 bg-white border border-amber-300 hover:bg-amber-100 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start sm:self-center"
          >
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Riprova video</span>
          </button>
        </div>
      )}

      <div
        className={`${aspectClass} bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 relative flex flex-col justify-between`}
      >
        {/* Background illustration if curated tutorial */}
        {tutorial.posterImageUrl && !posterFailed ? (
          <>
            <img
              src={tutorial.posterImageUrl}
              alt={tutorial.script.title}
              referrerPolicy="no-referrer"
              onError={() => setPosterFailed(true)}
              className="absolute inset-0 w-full h-full object-cover opacity-35"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/70 to-slate-950/45" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950" />
        )}

        {/* Top Bar inside Stage */}
        <div className="relative z-10 flex items-center justify-between gap-4 px-5 pt-4">
          <span className="text-xs font-medium text-slate-300">
            Storyboard interattivo · Passo {safeStepIndex + 1} di {steps.length}
          </span>
          <span className="font-mono text-xs tabular-nums text-slate-300">
            {currentStep ? `~${currentStep.durationSeconds}s` : ''}
          </span>
        </div>

        {/* Center Active Step Visualization */}
        {currentStep && (
          <div className="relative z-10 px-6 sm:px-10 py-4 my-auto flex flex-col items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-600/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <StepIcon iconKey={currentStep.iconKey} className="w-5 h-5" />
            </div>
            <h3 className="font-display text-xl sm:text-2xl font-semibold text-white text-balance">
              {currentStep.stepNumber}. {currentStep.title}
            </h3>
            <p className="text-sm sm:text-base text-slate-200 max-w-xl leading-relaxed">
              {currentStep.description}
            </p>
            <p className="font-mono text-xs text-slate-400 max-w-xl">
              Scena: {currentStep.visualCue}
            </p>
          </div>
        )}

        {/* Step timeline segments at bottom of stage */}
        <div className="relative z-10 px-5 pb-4 flex items-center gap-1.5">
          {steps.map((step, idx) => (
            <button
              key={step.stepNumber}
              type="button"
              onClick={() => onSelectStep(idx)}
              aria-label={`Vai al passaggio ${step.stepNumber}: ${step.title}`}
              className={`h-1.5 flex-1 rounded-full transition-colors cursor-pointer ${
                idx === safeStepIndex
                  ? 'bg-blue-500'
                  : idx < safeStepIndex
                    ? 'bg-slate-400'
                    : 'bg-slate-700 hover:bg-slate-600'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Storyboard Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-white border border-slate-200 rounded-xl">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setStoryboardPlaying((prev) => !prev)}
            aria-label={
              storyboardPlaying ? 'Pausa sequenza storyboard' : 'Avvia sequenza storyboard'
            }
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            {storyboardPlaying ? (
              <>
                <Pause className="w-4 h-4" aria-hidden="true" />
                <span>Pausa</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" aria-hidden="true" />
                <span>Riproduci sequenza</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setStoryboardLoop((prev) => !prev)}
            aria-pressed={storyboardLoop}
            aria-label="Attiva o disattiva loop storyboard"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              storyboardLoop
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
          >
            <Repeat className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Loop</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={safeStepIndex === 0}
            onClick={() => onSelectStep(safeStepIndex - 1)}
            aria-label="Passaggio precedente"
            className="p-1.5 text-slate-700 hover:bg-slate-100 disabled:opacity-40 border border-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          </button>
          <span className="font-mono text-xs tabular-nums text-slate-600 px-2">
            {String(safeStepIndex + 1).padStart(2, '0')} /{' '}
            {String(steps.length).padStart(2, '0')}
          </span>
          <button
            type="button"
            disabled={safeStepIndex >= steps.length - 1}
            onClick={() => onSelectStep(safeStepIndex + 1)}
            aria-label="Passaggio successivo"
            className="p-1.5 text-slate-700 hover:bg-slate-100 disabled:opacity-40 border border-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {!tutorial.videoError && (
          <button
            type="button"
            onClick={onRetryVideo}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Film className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Genera video AI (Veo)</span>
          </button>
        )}
      </div>
    </div>
  );
}
