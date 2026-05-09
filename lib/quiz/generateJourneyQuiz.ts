export interface JourneyQuizQuestion {
  prompt: string;
  choices: string[];
  correctIndex: number;
}

function rng(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], rand: () => number): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const t = a[i]!;
    a[i] = a[j]!;
    a[j] = t;
  }
  return a;
}

/** Decoy phrase pool (not keyed to verse text; used only as wrong distractors) */
const PHRASE_DECOYS = [
  "The Elephant",
  "The Fig",
  "The Cave",
  "The Smoke",
  "The Elephant's Army",
  "The Last Day",
  "The Night Journey",
  "Stories of the Past",
  "The Heights",
  "The Romans",
  "The Divorce",
  "The Spider",
  "The Ant",
  "The Bees",
  "The Bees and Honey",
  "The Pen",
  "The Darkness",
  "The Morning Splendour",
  "Those Who Pull Out",
  "The Sundering Hour",
  "The Tidings",
  "The Star",
  "The Sun",
  "The Moon",
  "Those Who Tear Out",
  "The Charging Steeds",
  "The Folding Up",
  "The Clearing",
  "The Earthquake",
  "The Striking Blow",
  "The Abundance",
  "Loss and Gain",
  "The Small Kindness",
  "The Sovereignty",
  "The Sovereign Power",
  "The Event",
  "The Disbelievers",
  "The Help",
  "The Loss",
  "The Forenoon",
  "The Night",
  "The Daybreak",
  "The City of Security",
  "The Galloping Horses",
  "The Scattering Wind",
  "The Winnowing Winds",
  "The Mount",
  "The Olive",
  "The Fig Tree",
  "The Enveloping",
  "The Resurrection"
];

/**
 * Each completion uses a new seed (gate cycle + gates lit + session nonce) so questions do not repeat.
 */
export function buildJourneyQuizQuestion(params: {
  chapterId: number;
  nameSimple: string;
  englishTitle: string;
  sampleTranslation: string;
  gateCycleIndex: number;
  gatesLitThisCycle: number;
  sessionNonce: number;
}): JourneyQuizQuestion {
  const { chapterId, nameSimple, englishTitle, sampleTranslation, gateCycleIndex, gatesLitThisCycle, sessionNonce } =
    params;

  const seed =
    (chapterId * 1_001_003) ^
    (gateCycleIndex * 734_917) ^
    (gatesLitThisCycle * 193_939) ^
    (sessionNonce * 40_069);
  const rand = rng(seed >>> 0);
  const title = englishTitle.trim() || nameSimple;
  const mode = rand();

  if (mode < 0.55 && sampleTranslation.trim().length > 12) {
    const snippet = sampleTranslation.trim();
    const clip = snippet.length > 110 ? `${snippet.slice(0, 110)}…` : snippet;
    const wrong = shuffle(
      PHRASE_DECOYS.filter((p) => p !== title),
      rand
    ).slice(0, 3);
    const choices = shuffle([title, ...wrong], rand);
    const correctIndex = choices.indexOf(title);

    return {
      prompt: `You just heard an ayah from ${nameSimple}. Which usual English surah title best matches this translation snippet?\n\n“${clip}”`,
      choices,
      correctIndex: correctIndex >= 0 ? correctIndex : 0
    };
  }

  const wrongTitles = shuffle(
    PHRASE_DECOYS.filter((p) => p !== title),
    rand
  ).slice(0, 3);
  const choices = shuffle([title, ...wrongTitles], rand);
  const correctIndex = choices.indexOf(title);

  return {
    prompt: `What is the usual English title for Surah ${chapterId} (“${nameSimple}”)?`,
    choices,
    correctIndex: correctIndex >= 0 ? correctIndex : 0
  };
}
