import { Check, ChevronDown, Copy, Download } from 'lucide-react';
import { useState } from 'react';
import type { TutorialItem } from '../types/tutorial.ts';
import { formatTutorialMarkdown } from '../utils/tutorialLogic.ts';
import { StepIcon } from './StepIcon.tsx';

interface StepGuideProps {
  tutorial: TutorialItem;
  activeStepIndex: number;
  completedSteps: number[];
  onSelectStep: (index: number) => void;
  onToggleComplete: (stepNumber: number) => void;
}

export function StepGuide({
  tutorial,
  activeStepIndex,
  completedSteps,
  onSelectStep,
  onToggleComplete,
}: StepGuideProps) {
  const [promptOpen, setPromptOpen] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedGuide, setCopiedGuide] = useState(false);

  const { script } = tutorial;

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(script.videoPromptEn);
      setCopiedPrompt(true);
      window.setTimeout(() => setCopiedPrompt(false), 2000);
    } catch {
      // Ignore clipboard permission errors in headless contexts
    }
  };

  const handleCopyGuide = async () => {
    try {
      await navigator.clipboard.writeText(formatTutorialMarkdown(tutorial));
      setCopiedGuide(true);
      window.setTimeout(() => setCopiedGuide(false), 2000);
    } catch {
      // Ignore clipboard permission errors
    }
  };

  const handleDownloadMarkdown = () => {
    const content = formatTutorialMarkdown(tutorial);
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${tutorial.id}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <section aria-label="Guida testuale passo-passo" className="space-y-6">
      {/* Unboxed editorial metadata line */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="font-medium text-slate-700">{script.category}</span>
          <span aria-hidden="true">·</span>
          <span>Difficoltà: {script.difficulty}</span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">Tempo: {script.estimatedTime}</span>
        </div>

        <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight text-balance">
          {script.title}
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          {script.subtitle}
        </p>
      </div>

      {/* Tools / Materials needed */}
      {script.toolsNeeded.length > 0 && (
        <div className="pt-4 border-t border-slate-200">
          <h2 className="text-xs font-semibold text-slate-500 mb-2">
            Occorrente necessario
          </h2>
          <p className="text-sm text-slate-800 leading-relaxed">
            {script.toolsNeeded.join(' · ')}
          </p>
        </div>
      )}

      {/* Numbered Steps List */}
      <div className="pt-4 border-t border-slate-200 space-y-3">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-lg font-semibold text-slate-900">
            Passaggi chiave
          </h2>
          <span className="font-mono text-xs tabular-nums text-slate-500">
            {completedSteps.length}/{script.steps.length} completati
          </span>
        </div>

        <ol className="space-y-2.5">
          {script.steps.map((step, idx) => {
            const isActive = idx === activeStepIndex;
            const isDone = completedSteps.includes(step.stepNumber);

            return (
              <li
                key={step.stepNumber}
                className={`rounded-xl border transition-colors ${
                  isActive
                    ? 'bg-white border-blue-600 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3.5 p-4">
                  <button
                    type="button"
                    onClick={() => onToggleComplete(step.stepNumber)}
                    aria-pressed={isDone}
                    aria-label={`Segna passaggio ${step.stepNumber} come completato`}
                    className={`mt-0.5 w-6 h-6 rounded-md border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                      isDone
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'bg-slate-50 border-slate-300 text-transparent hover:border-blue-500'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectStep(idx)}
                    className="flex-1 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
                  >
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                      <span className="font-mono tabular-nums font-medium text-blue-700">
                        {String(step.stepNumber).padStart(2, '0')}
                      </span>
                      <StepIcon iconKey={step.iconKey} className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-semibold text-sm text-slate-900">
                        {step.title}
                      </span>
                    </div>
                    <p
                      className={`text-sm leading-relaxed ${
                        isDone ? 'text-slate-400 line-through' : 'text-slate-600'
                      }`}
                    >
                      {step.description}
                    </p>
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Actions & Prompt Inspector */}
      <div className="pt-4 border-t border-slate-200 space-y-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleDownloadMarkdown}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Scarica guida (.md)</span>
          </button>

          <button
            type="button"
            onClick={handleCopyGuide}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Copy className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{copiedGuide ? 'Guida copiata' : 'Copia guida'}</span>
          </button>
        </div>

        <button
          type="button"
          aria-expanded={promptOpen}
          onClick={() => setPromptOpen((prev) => !prev)}
          className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
        >
          <span>Prompt visivo Veo (EN)</span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform ${
              promptOpen ? 'rotate-180' : ''
            }`}
            aria-hidden="true"
          />
        </button>

        {promptOpen && (
          <div className="p-4 bg-slate-100 border border-slate-200 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-slate-600">
                Prompt ottimizzato per il modello text-to-video
              </span>
              <button
                type="button"
                onClick={handleCopyPrompt}
                className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-800 cursor-pointer"
              >
                <Copy className="w-3 h-3" aria-hidden="true" />
                <span>{copiedPrompt ? 'Copiato' : 'Copia prompt'}</span>
              </button>
            </div>
            <p className="font-mono text-xs text-slate-800 leading-relaxed">
              {script.videoPromptEn}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
