import { ArrowUpRight, Film } from 'lucide-react';
import { useState } from 'react';
import type { TutorialItem } from '../types/tutorial.ts';

interface ShowcaseGridProps {
  tutorials: TutorialItem[];
  heading: string;
  subheading?: string;
  onSelectTutorial: (tutorial: TutorialItem) => void;
}

function TutorialCard({
  tutorial,
  onSelect,
}: {
  tutorial: TutorialItem;
  onSelect: () => void;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group text-left bg-white border border-slate-200 hover:border-blue-400 rounded-2xl overflow-hidden transition-all flex flex-col cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
    >
      <div className="aspect-video w-full bg-slate-100 relative overflow-hidden">
        {tutorial.posterImageUrl && !imgError ? (
          <img
            src={tutorial.posterImageUrl}
            alt={tutorial.script.title}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex flex-col items-center justify-center p-4 text-slate-300 gap-2">
            <Film className="w-7 h-7 text-blue-400" aria-hidden="true" />
            <span className="text-xs font-medium text-center line-clamp-1">
              {tutorial.script.category}
            </span>
          </div>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between gap-3">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-medium text-slate-700">
              {tutorial.script.category}
            </span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{tutorial.script.estimatedTime}</span>
            <span aria-hidden="true">·</span>
            <span>{tutorial.script.difficulty}</span>
          </div>
          <h3 className="font-display text-lg font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
            {tutorial.script.title}
          </h3>
          <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
            {tutorial.script.subtitle}
          </p>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs font-medium text-blue-700">
          <span>Apri guida e storyboard</span>
          <ArrowUpRight
            className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            aria-hidden="true"
          />
        </div>
      </div>
    </button>
  );
}

export function ShowcaseGrid({
  tutorials,
  heading,
  subheading,
  onSelectTutorial,
}: ShowcaseGridProps) {
  return (
    <section aria-label={heading} className="space-y-5">
      <div className="space-y-1">
        <h2 className="font-display text-xl sm:text-2xl font-semibold text-slate-900">
          {heading}
        </h2>
        {subheading && (
          <p className="text-sm text-slate-600">{subheading}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {tutorials.map((item) => (
          <TutorialCard
            key={item.id}
            tutorial={item}
            onSelect={() => onSelectTutorial(item)}
          />
        ))}
      </div>
    </section>
  );
}
