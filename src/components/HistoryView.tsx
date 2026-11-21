import { ArrowUpRight, Clock, Trash2 } from 'lucide-react';
import type { TutorialItem } from '../types/tutorial.ts';

interface HistoryViewProps {
  items: TutorialItem[];
  onSelectTutorial: (item: TutorialItem) => void;
  onDeleteTutorial: (id: string) => void;
  onStartNew: () => void;
}

export function HistoryView({
  items,
  onSelectTutorial,
  onDeleteTutorial,
  onStartNew,
}: HistoryViewProps) {
  if (items.length === 0) {
    return (
      <section className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-500">
          <Clock className="w-5 h-5" aria-hidden="true" />
        </div>
        <div className="space-y-1.5">
          <h1 className="font-display text-2xl font-bold text-slate-900">
            Nessun tutorial salvato nella cronologia
          </h1>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Ogni tutorial che generi viene salvato automaticamente qui per poterlo rileggere o esportare in qualsiasi momento.
          </p>
        </div>
        <button
          type="button"
          onClick={onStartNew}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
        >
          Crea il tuo primo tutorial
        </button>
      </section>
    );
  }

  return (
    <section className="max-w-4xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
          Cronologia tutorial
        </h1>
        <p className="text-sm text-slate-600">
          Riapri i tutorial generati durante le tue sessioni o rimuovi quelli che non ti servono più.
        </p>
      </div>

      <ul className="space-y-3">
        {items.map((item) => {
          const dateLabel = new Date(item.createdAt).toLocaleDateString('it-IT', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <li
              key={item.id}
              className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="font-medium text-slate-700">
                    {item.script.category}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">{dateLabel}</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">
                    {item.script.steps.length} passaggi
                  </span>
                </div>
                <h2 className="font-display text-lg font-semibold text-slate-900 truncate">
                  {item.script.title}
                </h2>
                <p className="text-xs text-slate-500 truncate">
                  Domanda: “{item.query}”
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onSelectTutorial(item)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <span>Apri tutorial</span>
                  <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteTutorial(item.id)}
                  aria-label={`Elimina tutorial '${item.script.title}'`}
                  className="p-2 text-slate-500 hover:text-red-700 hover:bg-red-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
