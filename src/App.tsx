import { ArrowLeft, AlertCircle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Header, type AppSection } from './components/Header.tsx';
import { HistoryView } from './components/HistoryView.tsx';
import { HowItWorksView } from './components/HowItWorksView.tsx';
import { SearchComposer } from './components/SearchComposer.tsx';
import { ShowcaseGrid } from './components/ShowcaseGrid.tsx';
import { StepGuide } from './components/StepGuide.tsx';
import { VideoStage } from './components/VideoStage.tsx';
import { SHOWCASE_TUTORIALS } from './data/showcaseTutorials.ts';
import type {
  GenerationPhase,
  TutorialItem,
  TutorialScript,
  VideoAspectRatio,
  VideoDuration,
  VideoErrorInfo,
} from './types/tutorial.ts';
import { classifyVideoApiError, validateTutorialQuery } from './utils/tutorialLogic.ts';

const HISTORY_STORAGE_KEY = 'tutai_history_v1';

function loadSavedHistory(): TutorialItem[] {
  try {
    const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Cached /api/video/:id buffers do not survive server restarts, so reset stale videoUrl safely
    return parsed.map((item: TutorialItem) => ({
      ...item,
      videoUrl: null,
      videoStatus: item.videoError ? 'fallback' : 'idle',
    }));
  } catch {
    return [];
  }
}

export default function App() {
  const [activeSection, setActiveSection] = useState<AppSection>('explore');
  const [query, setQuery] = useState('');
  const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>('16:9');
  const [duration, setDuration] = useState<VideoDuration>('10s');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [scriptError, setScriptError] = useState<string | null>(null);

  const [phase, setPhase] = useState<GenerationPhase>('idle');
  const [activeTutorial, setActiveTutorial] = useState<TutorialItem | null>(null);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [history, setHistory] = useState<TutorialItem[]>(() => loadSavedHistory());

  // Persist history cleanly in localStorage
  useEffect(() => {
    try {
      window.localStorage.setItem(
        HISTORY_STORAGE_KEY,
        JSON.stringify(history.slice(0, 15))
      );
    } catch {
      // Ignore storage quota issues
    }
  }, [history]);

  // Support ?autostart=1 to jump straight to a ready showcase tutorial for fast verification
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1' && SHOWCASE_TUTORIALS.length > 0) {
      setActiveTutorial(SHOWCASE_TUTORIALS[0]);
      setPhase('complete');
    }
  }, []);

  const runVideoGeneration = useCallback(async (tutorial: TutorialItem) => {
    setPhase('rendering_video');
    setActiveTutorial((prev) =>
      prev && prev.id === tutorial.id
        ? { ...prev, videoStatus: 'generating', videoError: null }
        : prev
    );

    try {
      const response = await fetch('/api/tutorial/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoPromptEn: tutorial.script.videoPromptEn,
          title: tutorial.script.title,
          aspectRatio: tutorial.aspectRatio,
          duration: tutorial.duration,
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorInfo: VideoErrorInfo =
          payload && typeof payload.message === 'string' && 'isQuotaOrBilling' in payload
            ? (payload as VideoErrorInfo)
            : classifyVideoApiError(
                response.status,
                typeof payload?.error === 'string'
                  ? payload.error
                  : 'Errore durante la generazione video.'
              );

        setActiveTutorial((prev) =>
          prev && prev.id === tutorial.id
            ? { ...prev, videoStatus: 'fallback', videoError: errorInfo }
            : prev
        );
        setPhase('complete');
        return;
      }

      const videoUrl = typeof payload.videoUrl === 'string' ? payload.videoUrl : null;
      if (!videoUrl) {
        throw new Error('Risposta video non valida dal server.');
      }

      setActiveTutorial((prev) =>
        prev && prev.id === tutorial.id
          ? { ...prev, videoUrl, videoStatus: 'ready', videoError: null }
          : prev
      );
      setPhase('complete');
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Impossibile completare la generazione video.';
      const errorInfo = classifyVideoApiError(502, message);
      setActiveTutorial((prev) =>
        prev && prev.id === tutorial.id
          ? { ...prev, videoStatus: 'fallback', videoError: errorInfo }
          : prev
      );
      setPhase('complete');
    }
  }, []);

  const handleGenerateTutorial = async (queryOverride?: string) => {
    const targetQuery = queryOverride ?? query;
    const validation = validateTutorialQuery(targetQuery);

    if (!validation.valid) {
      setValidationError(validation.error ?? 'Inserisci una richiesta valida.');
      return;
    }

    setValidationError(null);
    setScriptError(null);
    setActiveSection('explore');
    setActiveStepIndex(0);
    setCompletedSteps([]);
    setPhase('analyzing');

    // Placeholder item while Phase 1 script is loading
    const tempId = `tut-${Date.now()}`;
    const placeholderItem: TutorialItem = {
      id: tempId,
      query: validation.sanitized,
      createdAt: new Date().toISOString(),
      aspectRatio,
      duration,
      videoUrl: null,
      videoStatus: 'generating',
      videoError: null,
      script: {
        title: validation.sanitized,
        subtitle: 'Sto analizzando la richiesta per strutturare i passaggi chiave...',
        category: 'Preparazione',
        estimatedTime: 'In calcolo',
        difficulty: 'Facile',
        toolsNeeded: [],
        steps: [],
        videoPromptEn: '',
      },
    };
    setActiveTutorial(placeholderItem);

    // Subtle progressive cue from analyzing -> storyboarding while waiting on Gemini Flash
    const storyboardTimer = window.setTimeout(() => {
      setPhase((current) => (current === 'analyzing' ? 'storyboarding' : current));
    }, 900);

    try {
      const scriptRes = await fetch('/api/tutorial/script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: validation.sanitized }),
      });

      window.clearTimeout(storyboardTimer);

      const scriptData = await scriptRes.json().catch(() => ({}));
      if (!scriptRes.ok) {
        throw new Error(
          typeof scriptData.error === 'string'
            ? scriptData.error
            : 'Errore nella creazione della sceneggiatura.'
        );
      }

      const script = scriptData.script as TutorialScript;
      const readyItem: TutorialItem = {
        ...placeholderItem,
        script,
      };

      // Immediately show Phase 1 steps to the user while Phase 2 video renders!
      setActiveTutorial(readyItem);
      setHistory((prev) => [readyItem, ...prev.filter((item) => item.id !== readyItem.id)]);

      await runVideoGeneration(readyItem);
    } catch (err) {
      window.clearTimeout(storyboardTimer);
      const message =
        err instanceof Error
          ? err.message
          : 'Errore durante la comunicazione con il server.';
      setScriptError(message);
      setPhase('error');
      setActiveTutorial(null);
    }
  };

  const handleOpenTutorial = (item: TutorialItem) => {
    setActiveSection('explore');
    setActiveTutorial(item);
    setActiveStepIndex(0);
    setCompletedSteps([]);
    setScriptError(null);
    setValidationError(null);
    setPhase('complete');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNewTutorial = () => {
    setActiveSection('explore');
    setActiveTutorial(null);
    setPhase('idle');
    setScriptError(null);
    setValidationError(null);
    setActiveStepIndex(0);
    setCompletedSteps([]);
  };

  const handleToggleComplete = (stepNumber: number) => {
    setCompletedSteps((prev) =>
      prev.includes(stepNumber)
        ? prev.filter((n) => n !== stepNumber)
        : [...prev, stepNumber]
    );
  };

  const handleDeleteHistoryItem = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
    if (activeTutorial?.id === id) {
      setActiveTutorial(null);
      setPhase('idle');
    }
  };

  const isGenerating =
    phase === 'analyzing' || phase === 'storyboarding' || phase === 'rendering_video';

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB] text-[#111827]">
      <Header
        activeSection={activeSection}
        historyCount={history.length}
        onNavigate={(section) => {
          setActiveSection(section);
          if (section !== 'explore') {
            setScriptError(null);
          }
        }}
        onNewTutorial={handleNewTutorial}
      />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {activeSection === 'library' && (
          <ShowcaseGrid
            tutorials={SHOWCASE_TUTORIALS}
            heading="Libreria tutorial pronti"
            subheading="Esplora guide pratiche curate con storyboard interattivo e prompt pronti per la generazione video Veo."
            onSelectTutorial={handleOpenTutorial}
          />
        )}

        {activeSection === 'history' && (
          <HistoryView
            items={history}
            onSelectTutorial={handleOpenTutorial}
            onDeleteTutorial={handleDeleteHistoryItem}
            onStartNew={handleNewTutorial}
          />
        )}

        {activeSection === 'how-it-works' && (
          <HowItWorksView onTryNow={handleNewTutorial} />
        )}

        {activeSection === 'explore' && !activeTutorial && (
          <div className="space-y-16">
            {/* Centered Hero & Search Stage */}
            <section className="pt-6 sm:pt-12 space-y-8 text-center">
              <div className="space-y-3 max-w-2xl mx-auto">
                <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 text-balance">
                  Impara qualsiasi cosa, un video tutorial alla volta.
                </h1>
                <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
                  Descrivi cosa vuoi fare: TutAI scrive i passaggi chiave con Gemini e genera un video dimostrativo con Veo.
                </p>
              </div>

              <div className="text-left">
                <SearchComposer
                  query={query}
                  aspectRatio={aspectRatio}
                  duration={duration}
                  validationError={validationError}
                  isSubmitting={isGenerating}
                  onQueryChange={(val) => {
                    setQuery(val);
                    if (validationError) setValidationError(null);
                  }}
                  onAspectRatioChange={setAspectRatio}
                  onDurationChange={setDuration}
                  onSubmit={handleGenerateTutorial}
                />
              </div>

              {scriptError && (
                <div
                  role="alert"
                  className="max-w-3xl mx-auto text-left flex items-start gap-3 px-4 py-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-900"
                >
                  <AlertCircle
                    className="w-4 h-4 text-red-700 mt-0.5 shrink-0"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="font-semibold">Impossibile generare la sceneggiatura</p>
                    <p className="text-xs text-red-800 mt-0.5">{scriptError}</p>
                  </div>
                </div>
              )}
            </section>

            {/* Curated Showcase Grid */}
            <ShowcaseGrid
              tutorials={SHOWCASE_TUTORIALS}
              heading="Esempi pronti da esplorare"
              subheading="Apri un tutorial completo per testare la guida interattiva passo-passo o generare la clip video."
              onSelectTutorial={handleOpenTutorial}
            />
          </div>
        )}

        {activeSection === 'explore' && activeTutorial && (
          <div className="space-y-6">
            {/* Breadcrumb back action */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <button
                type="button"
                onClick={handleNewTutorial}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                <span>Torna alla ricerca</span>
              </button>

              <span className="text-xs text-slate-500 truncate max-w-md">
                Richiesta: “{activeTutorial.query}”
              </span>
            </div>

            {/* Responsive 2-column Workspace: Video Stage + Step Guide */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-7 lg:sticky lg:top-24">
                <VideoStage
                  tutorial={activeTutorial}
                  phase={phase}
                  activeStepIndex={activeStepIndex}
                  onSelectStep={setActiveStepIndex}
                  onRetryVideo={() => void runVideoGeneration(activeTutorial)}
                />
              </div>

              <div className="lg:col-span-5">
                {activeTutorial.script.steps.length > 0 ? (
                  <StepGuide
                    tutorial={activeTutorial}
                    activeStepIndex={activeStepIndex}
                    completedSteps={completedSteps}
                    onSelectStep={setActiveStepIndex}
                    onToggleComplete={handleToggleComplete}
                  />
                ) : (
                  <div
                    aria-busy="true"
                    className="space-y-4 p-6 bg-white border border-slate-200 rounded-2xl"
                  >
                    <div className="h-4 w-28 bg-slate-200 rounded animate-pulse" />
                    <div className="h-7 w-3/4 bg-slate-200 rounded animate-pulse" />
                    <div className="h-4 w-full bg-slate-100 rounded animate-pulse" />
                    <div className="space-y-3 pt-4">
                      {[1, 2, 3, 4].map((skeleton) => (
                        <div
                          key={skeleton}
                          className="h-20 bg-slate-100 rounded-xl animate-pulse"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>TutAI · Tutorial pratici con Gemini & Veo</span>
          <span>Sceneggiatura automatica, guida passo-passo e player video integrato</span>
        </div>
      </footer>
    </div>
  );
}
