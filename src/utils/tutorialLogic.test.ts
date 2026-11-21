import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyVideoApiError,
  formatScriptApiError,
  formatTutorialMarkdown,
  formatVideoTime,
  parseScriptResponse,
  validateTutorialQuery,
} from './tutorialLogic.ts';

test('validateTutorialQuery rejects empty and too-short queries', () => {
  assert.equal(validateTutorialQuery('   ').valid, false);
  assert.equal(validateTutorialQuery('hi').valid, false);
  const ok = validateTutorialQuery('  Come si fa   il nodo alla cravatta? ');
  assert.equal(ok.valid, true);
  assert.equal(ok.sanitized, 'Come si fa il nodo alla cravatta?');
});

test('parseScriptResponse parses fenced JSON and normalizes step numbers', () => {
  const sample = `\`\`\`json
  {
    "title": "Nodo Windsor Semplice",
    "subtitle": "Un nodo elegante e simmetrico in quattro mosse.",
    "category": "Stile & Abbigliamento",
    "estimatedTime": "2 minuti",
    "difficulty": "Facile",
    "toolsNeeded": ["Cravatta in seta", "Specchio"],
    "steps": [
      {
        "stepNumber": 9,
        "title": "Posiziona la cravatta",
        "description": "Incrocia l'estremità larga sopra quella stretta.",
        "visualCue": "Close-up on collar and silk tie overlap",
        "iconKey": "prepare",
        "durationSeconds": 3
      },
      {
        "stepNumber": 10,
        "title": "Chiudi il nodo",
        "description": "Fai scorrere la punta nell'asola frontale.",
        "visualCue": "Hands tightening the knot gently",
        "iconKey": "unknown_icon",
        "durationSeconds": 99
      }
    ],
    "videoPromptEn": "Close-up instructional video of hands tying a navy silk necktie, soft studio lighting, no text."
  }
  \`\`\``;

  const script = parseScriptResponse(sample);
  assert.equal(script.title, 'Nodo Windsor Semplice');
  assert.equal(script.steps.length, 2);
  assert.equal(script.steps[0].stepNumber, 1);
  assert.equal(script.steps[1].stepNumber, 2);
  assert.equal(script.steps[1].iconKey, 'hand');
  assert.equal(script.steps[1].durationSeconds, 2);
});

test('formatVideoTime formats seconds into tabular MM:SS', () => {
  assert.equal(formatVideoTime(0), '00:00');
  assert.equal(formatVideoTime(7.8), '00:07');
  assert.equal(formatVideoTime(75), '01:15');
  assert.equal(formatVideoTime(-4), '00:00');
});

test('classifyVideoApiError detects billing/quota vs timeout cleanly', () => {
  const quota = classifyVideoApiError(429, 'RESOURCE_EXHAUSTED: quota exceeded');
  assert.equal(quota.isQuotaOrBilling, true);
  assert.equal(quota.isTimeout, false);

  const timeout = classifyVideoApiError(504, 'Request timed out');
  assert.equal(timeout.isTimeout, true);
  assert.equal(timeout.isQuotaOrBilling, false);
});

test('formatTutorialMarkdown produces structured markdown guide', () => {
  const md = formatTutorialMarkdown({
    id: '1',
    query: 'Come fare il nodo',
    createdAt: '2026-11-21T10:00:00Z',
    aspectRatio: '16:9',
    duration: '10s',
    videoUrl: null,
    videoStatus: 'fallback',
    videoError: null,
    script: {
      title: 'Nodo perfetto',
      subtitle: 'Semplice e veloce',
      category: 'Stile',
      estimatedTime: '2 minuti',
      difficulty: 'Facile',
      toolsNeeded: ['Cravatta'],
      steps: [
        {
          stepNumber: 1,
          title: 'Incrocio',
          description: 'Incrocia i due lembi.',
          visualCue: 'Cross tie ends',
          iconKey: 'hand',
          durationSeconds: 3,
        },
      ],
      videoPromptEn: 'Hands tying a tie in daylight.',
    },
  });

  assert.match(md, /# Nodo perfetto/);
  assert.match(md, /1\. \*\*Incrocio\*\*/);
  assert.match(md, /Hands tying a tie in daylight/);
});

test('formatScriptApiError unwraps nested JSON error strings cleanly', () => {
  const raw503 = JSON.stringify({
    error: {
      code: 503,
      message: 'This model is currently experiencing high demand.',
      status: 'UNAVAILABLE',
    },
  });
  const msg = formatScriptApiError(raw503);
  assert.equal(
    msg,
    'Il modello Gemini è temporaneamente sovraccarico. Riprova tra qualche secondo.'
  );
  assert.equal(msg.includes('{'), false);
});
