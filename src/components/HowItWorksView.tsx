import { Clapperboard, FileText, PlayCircle } from 'lucide-react';

interface HowItWorksViewProps {
  onTryNow: () => void;
}

export function HowItWorksView({ onTryNow }: HowItWorksViewProps) {
  const phases = [
    {
      number: '01',
      title: 'Regia e Sceneggiatura (Gemini)',
      icon: FileText,
      description:
        'Appena invii la tua domanda, il modello linguistico Gemini analizza il procedimento, estrae l’occorrente essenziale, scrive i passaggi chiave in italiano e progetta un prompt visivo in inglese privo di testo confuso.',
    },
    {
      number: '02',
      title: 'Generazione Video (Veo / Omni)',
      icon: Clapperboard,
      description:
        'Il prompt visivo viene inviato tramite SDK Google GenAI al modello text-to-video. Mentre il video viene renderizzato, puoi già leggere i passaggi testuali della Fase 1 senza attese vuote.',
    },
    {
      number: '03',
      title: 'Player Integrato e Fallback Illustrato',
      icon: PlayCircle,
      description:
        'A generazione completata puoi riprodurre il video in loop o scaricarlo in MP4. Se il modello video supera il timeout o i limiti di quota, TutAI attiva automaticamente lo storyboard interattivo passo-passo.',
    },
  ];

  return (
    <section className="max-w-4xl mx-auto space-y-10 py-4">
      <div className="space-y-3 max-w-2xl">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight text-balance">
          Dalla domanda al video tutorial in due fasi coordinate
        </h1>
        <p className="text-base text-slate-600 leading-relaxed">
          TutAI separa la comprensione didattica dalla sintesi video per offrire istruzioni chiare, verificabili e utilizzabili in ogni condizione di rete o quota.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {phases.map((phase) => {
          const Icon = phase.icon;
          return (
            <div
              key={phase.number}
              className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-medium text-blue-700 tabular-nums">
                  {phase.number}
                </span>
                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                  <Icon className="w-4 h-4" aria-hidden="true" />
                </div>
              </div>
              <h2 className="font-display text-lg font-semibold text-slate-900">
                {phase.title}
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                {phase.description}
              </p>
            </div>
          );
        })}
      </div>

      <div className="pt-2">
        <button
          type="button"
          onClick={onTryNow}
          className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
        >
          Prova ora con una domanda
        </button>
      </div>
    </section>
  );
}
