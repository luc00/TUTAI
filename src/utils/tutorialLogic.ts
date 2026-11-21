import type {
  StepIconKey,
  TutorialItem,
  TutorialScript,
  TutorialStep,
  VideoErrorInfo,
} from '../types/tutorial.ts';

const VALID_ICON_KEYS: StepIconKey[] = [
  'prepare',
  'hand',
  'tool',
  'measure',
  'heat',
  'check',
  'finish',
];

export interface QueryValidationResult {
  valid: boolean;
  sanitized: string;
  error?: string;
}

/**
 * Validates and normalizes a user's tutorial prompt before dispatching API calls.
 */
export function validateTutorialQuery(rawQuery: string): QueryValidationResult {
  const sanitized = rawQuery.replace(/\s+/g, ' ').trim();
  if (!sanitized) {
    return {
      valid: false,
      sanitized: '',
      error: "Inserisci una domanda pratica (es. 'Come si fa il nodo alla cravatta?').",
    };
  }
  if (sanitized.length < 4) {
    return {
      valid: false,
      sanitized,
      error: 'La richiesta è troppo breve: aggiungi qualche dettaglio in più.',
    };
  }
  if (sanitized.length > 300) {
    return {
      valid: false,
      sanitized: sanitized.slice(0, 300),
      error: 'La richiesta supera il limite di 300 caratteri.',
    };
  }
  return { valid: true, sanitized };
}

/**
 * Normalizes and validates raw JSON returned by Gemini Phase 1 into a safe TutorialScript.
 */
export function parseScriptResponse(rawText: string): TutorialScript {
  const cleaned = rawText
    .replace(/^```json\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  const parsed = JSON.parse(cleaned) as Record<string, unknown>;

  const title =
    typeof parsed.title === 'string' && parsed.title.trim()
      ? parsed.title.trim()
      : 'Guida Tutorial Passo-Passo';

  const subtitle =
    typeof parsed.subtitle === 'string' && parsed.subtitle.trim()
      ? parsed.subtitle.trim()
      : 'Istruzioni pratiche chiare e ordinate per completare il procedimento.';

  const category =
    typeof parsed.category === 'string' && parsed.category.trim()
      ? parsed.category.trim()
      : 'Guida pratica';

  const estimatedTime =
    typeof parsed.estimatedTime === 'string' && parsed.estimatedTime.trim()
      ? parsed.estimatedTime.trim()
      : '3 minuti';

  const rawDiff = typeof parsed.difficulty === 'string' ? parsed.difficulty : '';
  const difficulty: TutorialScript['difficulty'] =
    rawDiff === 'Facile' || rawDiff === 'Media' || rawDiff === 'Avanzata'
      ? rawDiff
      : 'Facile';

  const toolsNeeded = Array.isArray(parsed.toolsNeeded)
    ? parsed.toolsNeeded
        .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
        .map((item) => item.trim())
        .slice(0, 6)
    : [];

  const rawSteps = Array.isArray(parsed.steps) ? parsed.steps : [];
  const steps: TutorialStep[] = rawSteps
    .map((entry, idx): TutorialStep | null => {
      if (!entry || typeof entry !== 'object') return null;
      const obj = entry as Record<string, unknown>;
      const stepTitle =
        typeof obj.title === 'string' && obj.title.trim()
          ? obj.title.trim()
          : `Passaggio ${idx + 1}`;
      const description =
        typeof obj.description === 'string' && obj.description.trim()
          ? obj.description.trim()
          : '';
      if (!description) return null;

      const visualCue =
        typeof obj.visualCue === 'string' && obj.visualCue.trim()
          ? obj.visualCue.trim()
          : stepTitle;

      const iconKey = VALID_ICON_KEYS.includes(obj.iconKey as StepIconKey)
        ? (obj.iconKey as StepIconKey)
        : 'hand';

      const rawDur = Number(obj.durationSeconds);
      const durationSeconds =
        Number.isFinite(rawDur) && rawDur >= 1 && rawDur <= 30
          ? Math.round(rawDur)
          : 2;

      return {
        stepNumber: idx + 1,
        title: stepTitle,
        description,
        visualCue,
        iconKey,
        durationSeconds,
      };
    })
    .filter((step): step is TutorialStep => step !== null)
    .slice(0, 8);

  if (steps.length === 0) {
    throw new Error('La sceneggiatura generata non contiene passaggi validi.');
  }

  const videoPromptEn =
    typeof parsed.videoPromptEn === 'string' && parsed.videoPromptEn.trim()
      ? parsed.videoPromptEn.trim()
      : `Clean instructional studio video demonstrating ${title}, natural soft lighting, steady close-up camera framing, smooth step-by-step hand movements, crisp focus, no overlaid text or watermarks.`;

  return {
    title,
    subtitle,
    category,
    estimatedTime,
    difficulty,
    toolsNeeded,
    steps,
    videoPromptEn,
  };
}

/**
 * Formats seconds into tabular MM:SS timestamp strings (e.g. 00:08).
 */
export function formatVideoTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
  const whole = Math.floor(seconds);
  const mins = Math.floor(whole / 60);
  const secs = whole % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Classifies backend video generation errors into clear Italian UI fallback messages.
 */
export function classifyVideoApiError(status: number, rawMessage: string): VideoErrorInfo {
  const lower = rawMessage.toLowerCase();
  const isQuotaOrBilling =
    status === 402 ||
    status === 403 ||
    status === 429 ||
    lower.includes('quota') ||
    lower.includes('resource_exhausted') ||
    lower.includes('permission_denied') ||
    lower.includes('billing') ||
    lower.includes('paid');

  const isTimeout =
    status === 408 ||
    status === 504 ||
    lower.includes('timeout') ||
    lower.includes('timed out') ||
    lower.includes('aborted');

  if (isQuotaOrBilling) {
    return {
      code: 'QUOTA_OR_BILLING',
      isQuotaOrBilling: true,
      isTimeout: false,
      message:
        'Il modello video richiede una chiave API con piano a pagamento attivo o quota disponibile in Settings > Secrets. Puoi seguire subito la guida interattiva passo-passo qui sotto.',
    };
  }

  if (isTimeout) {
    return {
      code: 'VIDEO_TIMEOUT',
      isQuotaOrBilling: false,
      isTimeout: true,
      message:
        'La generazione video ha superato il tempo massimo di attesa. Puoi riprovare tra poco oppure seguire lo storyboard interattivo con i passaggi completi.',
    };
  }

  if (status === 404 || lower.includes('not found')) {
    return {
      code: 'MODEL_UNAVAILABLE',
      isQuotaOrBilling: true,
      isTimeout: false,
      message:
        'Il modello video Veo / Omni non è disponibile o richiede l’abilitazione con una chiave API a pagamento in Settings > Secrets. Puoi comunque seguire lo storyboard interattivo qui sotto.',
    };
  }

  return {
    code: 'VIDEO_UNAVAILABLE',
    isQuotaOrBilling: false,
    isTimeout: false,
    message:
      rawMessage.trim() ||
      'Il servizio video non è momentaneamente disponibile. Ecco la guida completa illustrata con tutti i passaggi.',
  };
}

/**
 * Normalizes raw Gemini SDK error strings (including nested JSON payloads) into clean Italian copy.
 */
export function formatScriptApiError(rawMessage: string): string {
  let extracted = rawMessage.trim();
  if (extracted.startsWith('{')) {
    try {
      const parsed = JSON.parse(extracted) as {
        error?: { code?: number; message?: string; status?: string };
        message?: string;
      };
      extracted = parsed.error?.message || parsed.message || extracted;
    } catch {
      // Keep original message if not valid JSON
    }
  }

  const lower = extracted.toLowerCase();
  if (
    lower.includes('high demand') ||
    lower.includes('unavailable') ||
    lower.includes('503')
  ) {
    return 'Il modello Gemini è temporaneamente sovraccarico. Riprova tra qualche secondo.';
  }
  if (
    lower.includes('quota') ||
    lower.includes('resource_exhausted') ||
    lower.includes('429')
  ) {
    return 'Limite di quota raggiunto per la chiave API corrente. Riprova tra poco o verifica Settings > Secrets.';
  }
  if (
    lower.includes('permission_denied') ||
    lower.includes('api_key_invalid') ||
    lower.includes('403')
  ) {
    return 'Chiave API Gemini non valida o non autorizzata. Verifica GEMINI_API_KEY in Settings > Secrets.';
  }
  return extracted || 'Errore imprevisto durante la generazione della sceneggiatura.';
}

/**
 * Exports a TutorialItem into a clean Markdown document for user download or copy.
 */
export function formatTutorialMarkdown(item: TutorialItem): string {
  const lines: string[] = [
    `# ${item.script.title}`,
    '',
    item.script.subtitle,
    '',
    `- **Richiesta:** ${item.query}`,
    `- **Categoria:** ${item.script.category}`,
    `- **Difficoltà:** ${item.script.difficulty}`,
    `- **Tempo stimato:** ${item.script.estimatedTime}`,
    '',
  ];

  if (item.script.toolsNeeded.length > 0) {
    lines.push('## Occorrente', '');
    for (const tool of item.script.toolsNeeded) {
      lines.push(`- ${tool}`);
    }
    lines.push('');
  }

  lines.push('## Passaggi chiave', '');
  for (const step of item.script.steps) {
    lines.push(`${step.stepNumber}. **${step.title}** — ${step.description}`);
  }

  lines.push('', '## Prompt visivo (Veo / Omni)', '', `> ${item.script.videoPromptEn}`, '');
  return lines.join('\n');
}
