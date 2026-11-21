import { Plus } from 'lucide-react';

export type AppSection = 'explore' | 'library' | 'history' | 'how-it-works';

interface HeaderProps {
  activeSection: AppSection;
  historyCount: number;
  onNavigate: (section: AppSection) => void;
  onNewTutorial: () => void;
}

export function Header({
  activeSection,
  historyCount,
  onNavigate,
  onNewTutorial,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-[#F9FAFB]/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-[72px] flex items-center justify-between gap-8">
        {/* Zone 1: Brand mark & wordmark */}
        <button
          type="button"
          onClick={onNewTutorial}
          className="inline-flex items-center gap-2.5 font-display text-xl sm:text-2xl font-bold tracking-tight text-slate-900 hover:text-blue-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
        >
          <img
            src="/assets/aistudio/Frame_26_62a7f9bf.png"
            alt=""
            aria-hidden="true"
            className="h-12 w-12 sm:h-14 sm:w-14 object-contain shrink-0 mix-blend-multiply"
          />
          <span>TutAI</span>
        </button>

        {/* Zone 2: Concise single-line navigation links */}
        <nav
          aria-label="Navigazione principale"
          className="hidden md:flex items-center gap-6 text-sm font-medium"
        >
          <button
            type="button"
            onClick={() => onNavigate('explore')}
            className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-t ${
              activeSection === 'explore'
                ? 'border-blue-600 text-slate-900'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Esplora
          </button>
          <button
            type="button"
            onClick={() => onNavigate('library')}
            className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-t ${
              activeSection === 'library'
                ? 'border-blue-600 text-slate-900'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Libreria
          </button>
          <button
            type="button"
            onClick={() => onNavigate('history')}
            className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-t ${
              activeSection === 'history'
                ? 'border-blue-600 text-slate-900'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {historyCount > 0 ? `Cronologia (${historyCount})` : 'Cronologia'}
          </button>
          <button
            type="button"
            onClick={() => onNavigate('how-it-works')}
            className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-t ${
              activeSection === 'how-it-works'
                ? 'border-blue-600 text-slate-900'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Come funziona
          </button>
        </nav>

        {/* Zone 3: Single primary action button */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onNewTutorial}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Nuovo tutorial</span>
          </button>
        </div>
      </div>

      {/* Compact mobile nav bar */}
      <nav
        aria-label="Navigazione mobile"
        className="flex md:hidden items-center justify-around border-t border-slate-200 px-2 py-1.5 text-xs font-medium bg-[#F9FAFB]"
      >
        {(
          [
            ['explore', 'Esplora'],
            ['library', 'Libreria'],
            ['history', historyCount > 0 ? `Cronologia (${historyCount})` : 'Cronologia'],
            ['how-it-works', 'Metodo'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => onNavigate(key)}
            className={`px-2.5 py-1.5 rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              activeSection === key
                ? 'text-blue-700 bg-blue-50 font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {label}
          </button>
        ))}
      </nav>
    </header>
  );
}
