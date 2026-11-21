import type { TutorialItem } from '../types/tutorial.ts';

export const QUICK_SUGGESTIONS: string[] = [
  'Come si fa il nodo alla cravatta?',
  'Come cambiare una gomma all’auto?',
  'Come preparare un espresso perfetto?',
  'Come piegare una camicia senza stropicciarla?',
];

export const SHOWCASE_TUTORIALS: TutorialItem[] = [
  {
    id: 'showcase-tie-knot',
    query: 'Come si fa il nodo alla cravatta?',
    createdAt: '2026-11-21T09:00:00Z',
    aspectRatio: '16:9',
    duration: '10s',
    videoUrl: null,
    videoStatus: 'idle',
    videoError: null,
    posterImageUrl: '/src/assets/images/tutorial_tie_knot_1795287194584.jpg',
    isCurated: true,
    script: {
      title: 'Nodo Semplice alla Cravatta (Four-in-Hand)',
      subtitle:
        'Il nodo classico, versatile ed elegante da eseguire in quattro passaggi davanti allo specchio.',
      category: 'Stile & Abbigliamento',
      estimatedTime: '2 minuti',
      difficulty: 'Facile',
      toolsNeeded: ['Cravatta in seta', 'Camicia con colletto chiuso', 'Specchio'],
      steps: [
        {
          stepNumber: 1,
          title: 'Posiziona i due lembi',
          description:
            'Alza il colletto e appoggia la cravatta attorno al collo: il lato largo (pala) deve scendere a destra circa 30 cm più in basso del lato stretto.',
          visualCue: 'Over-the-shoulder view aligning the wide blade lower than the narrow blade.',
          iconKey: 'prepare',
          durationSeconds: 2,
        },
        {
          stepNumber: 2,
          title: 'Incrocia e avvolgi',
          description:
            'Porta il lembo largo sopra quello stretto verso sinistra, fallo passare dietro e riportalo davanti verso destra.',
          visualCue: 'Close-up of hands wrapping the wide silk blade around the narrow blade.',
          iconKey: 'hand',
          durationSeconds: 3,
        },
        {
          stepNumber: 3,
          title: 'Passa dal collo e infila',
          description:
            'Solleva il lembo largo facendolo salire da dietro verso l’alto nell’anello del collo, poi fallo scorrere dentro il passante frontale appena creato.',
          visualCue: 'Fingers guiding the wide blade down through the front silk loop.',
          iconKey: 'tool',
          durationSeconds: 3,
        },
        {
          stepNumber: 4,
          title: 'Centra e regola il nodo',
          description:
            'Tieni fermo il lembo stretto con una mano e fai scorrere il nodo verso l’alto con l’altra, lasciando una leggera fossetta sotto il nodo.',
          visualCue: 'Final adjustment sliding the knot neatly into the crisp white collar.',
          iconKey: 'finish',
          durationSeconds: 2,
        },
      ],
      videoPromptEn:
        'Instructional close-up studio video of a person’s hands tying a classic navy silk necktie over a crisp white Oxford collar. Soft diffused natural window lighting, neutral warm stone background, shallow depth of field, steady front-facing framing, clear step-by-step hand motions wrapping and tightening the knot cleanly, no overlaid text or watermarks.',
    },
  },
  {
    id: 'showcase-car-tire',
    query: 'Come cambiare una gomma all’auto?',
    createdAt: '2026-11-21T09:15:00Z',
    aspectRatio: '16:9',
    duration: '10s',
    videoUrl: null,
    videoStatus: 'idle',
    videoError: null,
    posterImageUrl: '/src/assets/images/tutorial_car_tire_1795287195719.jpg',
    isCurated: true,
    script: {
      title: 'Sostituzione Sicura di una Ruota Forata',
      subtitle:
        'Procedura essenziale passo-passo per mettere in sicurezza l’auto e montare il ruotino di scorta.',
      category: 'Manutenzione Auto',
      estimatedTime: '15 minuti',
      difficulty: 'Media',
      toolsNeeded: [
        'Cric e chiave a croce',
        'Ruota di scorta',
        'Cunei fermaruota',
        'Guanti da lavoro',
      ],
      steps: [
        {
          stepNumber: 1,
          title: 'Metti in sicurezza il veicolo',
          description:
            'Accosta su terreno piano, attiva le quattro frecce, tira il freno a mano, inserisci la prima marcia e posiziona i cunei dietro le ruote opposte.',
          visualCue: 'Driver engaging parking brake and placing wheel chocks on flat asphalt.',
          iconKey: 'check',
          durationSeconds: 2,
        },
        {
          stepNumber: 2,
          title: 'Allenta i bulloni prima di sollevare',
          description:
            'Con la chiave a croce ruota i bulloni in senso antiorario di mezzo giro mentre la ruota tocca ancora terra, così non girerà a vuoto.',
          visualCue: 'Close-up using cross lug wrench to break torque on wheel bolts.',
          iconKey: 'tool',
          durationSeconds: 2,
        },
        {
          stepNumber: 3,
          title: 'Solleva con il cric e rimuovi la ruota',
          description:
            'Posiziona il cric nel punto di sollevamento rinforzato sotto il telaio, alza l’auto finché la gomma si stacca da terra e svita del tutto i bulloni.',
          visualCue: 'Hydraulic jack lifting car chassis cleanly on concrete floor.',
          iconKey: 'prepare',
          durationSeconds: 3,
        },
        {
          stepNumber: 4,
          title: 'Monta la scorta e serra a stella',
          description:
            'Allinea la ruota di scorta ai fori, avvita i bulloni a mano, abbassa l’auto e stringi definitivamente seguendo uno schema incrociato a stella.',
          visualCue: 'Hands mounting spare wheel and tightening bolts in star pattern.',
          iconKey: 'finish',
          durationSeconds: 3,
        },
      ],
      videoPromptEn:
        'Clear instructional workshop video showing a person safely changing a car wheel on clean light concrete in bright natural daylight. Steady medium shot showing placing a jack under the frame, loosening lug nuts with a red cross wrench, swapping the tire, and tightening bolts in a star sequence, realistic mechanical detail, no text overlays.',
    },
  },
  {
    id: 'showcase-espresso',
    query: 'Come preparare un espresso perfetto?',
    createdAt: '2026-11-21T09:30:00Z',
    aspectRatio: '16:9',
    duration: '10s',
    videoUrl: null,
    videoStatus: 'idle',
    videoError: null,
    posterImageUrl: '/src/assets/images/tutorial_espresso_1795287194880.jpg',
    isCurated: true,
    script: {
      title: 'Estrazione Espresso Bilanciato con Crema',
      subtitle:
        'Dosaggio, pressatura uniforme e tempi di estrazione per ottenere una crema tigrata e corposa.',
      category: 'Cucina & Caffetteria',
      estimatedTime: '4 minuti',
      difficulty: 'Media',
      toolsNeeded: [
        'Macchina espresso',
        'Caffè macinato fine (18g)',
        'Pressino (tamper)',
        'Bilancia di precisione',
      ],
      steps: [
        {
          stepNumber: 1,
          title: 'Dosa e livella il macinato',
          description:
            'Pesa 18 g di caffè macinato fresco nel portafiltro pulito e asciutto, quindi distribuiscilo in modo uniforme picchiettando leggermente.',
          visualCue: 'Freshly ground espresso dosed cleanly into stainless portafilter.',
          iconKey: 'measure',
          durationSeconds: 2,
        },
        {
          stepNumber: 2,
          title: 'Pressa in modo dritto e costante',
          description:
            'Appoggia il pressino perfettamente perpendicolare e applica una pressione ferma e livellata per compattare il pannello di caffè senza inclinazioni.',
          visualCue: 'Hand pressing tamper straight down onto coffee bed on travertine counter.',
          iconKey: 'hand',
          durationSeconds: 2,
        },
        {
          stepNumber: 3,
          title: 'Spurga il gruppo e aggancia',
          description:
            'Fai scorrere un secondo d’acqua dal gruppo erogatore per stabilizzare la temperatura, quindi aggancia subito il portafiltro con decisione.',
          visualCue: 'Flushing group head and locking portafilter smoothly into place.',
          iconKey: 'heat',
          durationSeconds: 3,
        },
        {
          stepNumber: 4,
          title: 'Estrai 36 g in 25–30 secondi',
          description:
            'Avvia l’erogazione: dopo 5 secondi di pre-infusione il flusso scende come miele caldo formando crema nocciola tigrata nella tazzina preriscaldata.',
          visualCue: 'Macro close-up of golden crema pouring from portafilter spout into ceramic cup.',
          iconKey: 'finish',
          durationSeconds: 3,
        },
      ],
      videoPromptEn:
        'Warm minimalist editorial instructional video of a barista preparing a balanced espresso shot. Smooth close-up sequence of dosing fine coffee grounds into a stainless steel portafilter, tamping flat on a matte travertine counter, locking the portafilter, and extracting rich tiger-striped golden crema into a warm ceramic demitasse cup, soft studio light, no overlaid text.',
    },
  },
];
