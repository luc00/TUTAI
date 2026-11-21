import { ArrowRight, Search, X } from 'lucide-react';
import { FormEvent, useRef } from 'react';
import { QUICK_SUGGESTIONS } from '../data/showcaseTutorials.ts';
import type { VideoAspectRatio, VideoDuration } from '../types/tutorial.ts';

interface SearchComposerProps {
  query: string;
  aspectRatio: VideoAspectRatio;
  duration: VideoDuration;
  validationError: string | null;
  isSubmitting: boolean;
  onQueryChange: (val: string) => void;
  onAspectRatioChange: (ratio: VideoAspectRatio) => void;
  onDurationChange: (dur: VideoDuration) => void;
  onSubmit: (queryOverride?: string) => void;
}

export function SearchComposer({
  query,
  aspectRatio,
  duration,
  validationError,
  isSubmitting,
  onQueryChange,
  onAspectRatioChange,
  onDurationChange,
  onSubmit,
}: SearchComposerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit();
  };

  const handleSuggestionClick = (suggestion: string) => {
    onQueryChange(suggestion);
    onSubmit(suggestion);
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <form
        onSubmit={handleFormSubmit}
        noValidate
        className="bg-white border border-slate-200 rounded-2xl shadow-sm focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-600/10 transition-all"
      >
        <div className="flex items-center gap-3 px-4 pt-3.5 pb-2.5">
          <Search
            className="w-5 h-5 text-slate-400 shrink-0"
            aria-hidden="true"
          />
          <label htmlFor="tutorial-query-input" className="sr-only">
            Cosa vuoi imparare a fare oggi?
          </label>
          <input
            ref={inputRef}
            id="tutorial-query-input"
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Come si fa a..."
            disabled={isSubmitting}
            autoComplete="off"
            className="w-full text-base sm:text-lg text-slate-900 placeholder:text-slate-400 bg-transparent focus:outline-none disabled:opacity-60"
          />
          {query.length > 0 && !isSubmitting && (
            <button
              type="button"
              aria-label="Cancella testo"
              onClick={() => {
                onQueryChange('');
                inputRef.current?.focus();
              }}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 border-t border-slate-100 bg-slate-50/70 rounded-b-2xl">
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
            <div className="flex items-center gap-1.5" role="group" aria-label="Formato video">
              <span className="font-medium text-slate-500">Formato</span>
              <div className="inline-flex items-center p-0.5 bg-slate-200/70 rounded-md">
                {(['16:9', '9:16'] as const).map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => onAspectRatioChange(ratio)}
                    aria-pressed={aspectRatio === ratio}
                    className={`px-2 py-1 text-xs font-mono tabular-nums rounded transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      aspectRatio === ratio
                        ? 'bg-white text-slate-900 shadow-xs font-medium'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-1.5" role="group" aria-label="Durata clip">
              <span className="font-medium text-slate-500">Durata</span>
              <div className="inline-flex items-center p-0.5 bg-slate-200/70 rounded-md">
                {(['6s', '10s'] as const).map((dur) => (
                  <button
                    key={dur}
                    type="button"
                    onClick={() => onDurationChange(dur)}
                    aria-pressed={duration === dur}
                    className={`px-2 py-1 text-xs font-mono tabular-nums rounded transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      duration === dur
                        ? 'bg-white text-slate-900 shadow-xs font-medium'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {dur}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            <span>{isSubmitting ? 'Elaborazione...' : 'Genera tutorial'}</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </form>

      {validationError && (
        <p
          role="alert"
          className="mt-2.5 text-sm text-red-700 font-medium px-1"
        >
          {validationError}
        </p>
      )}

      {/* Clickable Suggestions */}
      <div className="mt-5">
        <p className="text-xs font-medium text-slate-500 mb-2.5">
          Suggerimenti rapidi
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {QUICK_SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSuggestionClick(suggestion)}
              className="group flex items-center justify-between gap-3 px-3.5 py-2.5 text-left text-sm text-slate-700 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 hover:text-slate-900 rounded-xl transition-colors cursor-pointer disabled:opacity-60"
            >
              <span className="truncate">{suggestion}</span>
              <ArrowRight
                className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 shrink-0 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
