import { buildOfflineMission } from '../data/missions';
import type { Mission, MissionFilters } from '../types';

let modelPromise: Promise<any> | null = null;

function fallbackNatureReply(question: string): string {
  const normalized = question.toLowerCase();

  if (normalized.includes('butterfly') || normalized.includes('garden')) {
    return 'To invite butterflies, provide nectar-rich flowers with varied bloom times, a sunny patch, and a few sheltered resting spots. Keep a small water source and avoid pesticides so the garden supports a healthier pollinator cycle.';
  }

  if (normalized.includes('bird') || normalized.includes('calls')) {
    return 'Bird calls often change with time, weather, and the type of habitat nearby. Listen for repetition, pitch, and the rhythm of calls to help separate alarm calls, contact calls, and song.';
  }

  if (normalized.includes('tree') || normalized.includes('identify')) {
    return 'Start by noticing bark texture, leaf arrangement, and overall shape. Common trees can be grouped by their leaves, cones, and branching structure before you try a closer identification.';
  }

  if (normalized.includes('walk') || normalized.includes('observe')) {
    return 'On a short walk, focus on three things: sound, movement, and patterns of light. Notice where animals gather, how leaves shift, and which areas feel most alive during that time of day.';
  }

  return 'A good nature habit is to slow down, move deliberately, and record specific observations. Note what you hear, see, and feel, and keep a respectful distance from wildlife and unfamiliar plants.';
}

export async function loadNatureModel(): Promise<any | null> {
  if (modelPromise) {
    return modelPromise;
  }

  modelPromise = (async () => {
    try {
      const transformers = await import('@huggingface/transformers');
      const { pipeline, env } = transformers;
      env.allowLocalModels = true;
      env.useBrowserCache = true;
      return await pipeline('text-generation', 'Xenova/distilgpt2');
    } catch (_error) {
      return null;
    }
  })();

  return modelPromise;
}

export async function generateMissionWithAI(filters: MissionFilters): Promise<{ mission: Mission; source: 'ai' | 'offline'; status: string }> {
  const mission = buildOfflineMission(filters);

  try {
    const model = await loadNatureModel();
    if (!model) {
      return { mission, source: 'offline', status: 'Using the local mission library because the model is unavailable.' };
    }

    const prompt = `Create a short nature mission for ${filters.environment} with ${filters.activityType} in ${filters.time} minutes. Keep it under 120 words. Include title, description, materials, steps, observations, reflection, safety.`;
    const output = await model(prompt, { max_new_tokens: 80, temperature: 0.75, do_sample: true });
    const text = Array.isArray(output) ? output[0]?.generated_text ?? '' : String(output ?? '');

    if (typeof text === 'string' && text.trim().length > 30) {
      return {
        mission: { ...mission, title: text.split('\n')[0].replace(/^#+\s*/, '').slice(0, 48) || mission.title, source: 'ai' },
        source: 'ai',
        status: 'Local AI model generated this mission.',
      };
    }
  } catch (_error) {
    return { mission, source: 'offline', status: 'Model generation failed, so the offline mission was used instead.' };
  }

  return { mission, source: 'offline', status: 'Using the local mission library because the model is unavailable.' };
}

export async function generateGuideReply(question: string): Promise<{ answer: string; source: 'ai' | 'offline'; note: string }> {
  try {
    const model = await loadNatureModel();
    if (!model) {
      return {
        answer: fallbackNatureReply(question),
        source: 'offline',
        note: 'Processed locally is unavailable, so this is a curated nature guidance response.',
      };
    }

    const output = await model(`Answer like a friendly nature educator: ${question}. Keep it brief, practical, and caution users not to touch or eat unknown plants, mushrooms, fungi, insects, or wildlife.`, {
      max_new_tokens: 120,
      temperature: 0.8,
      do_sample: true,
    });
    const text = Array.isArray(output) ? output[0]?.generated_text ?? '' : String(output ?? '');

    if (typeof text === 'string' && text.trim().length > 20) {
      return {
        answer: text.replace(question, '').trim() || fallbackNatureReply(question),
        source: 'ai',
        note: 'Processed locally on this device.',
      };
    }
  } catch (_error) {
    return {
      answer: fallbackNatureReply(question),
      source: 'offline',
      note: 'AI processing failed, so a vetted fallback answer was shown instead.',
    };
  }

  return {
    answer: fallbackNatureReply(question),
    source: 'offline',
    note: 'No local model was available, so this guidance is kept general and safe.',
  };
}
