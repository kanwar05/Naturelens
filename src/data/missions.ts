import type { ActivityType, Difficulty, Environment, Mission, MissionFilters } from '../types';

const missionLibrary: Record<ActivityType, { title: string; description: string; materials: string[]; steps: string[]; observations: string[]; reflection: string; safety: string[] }> = {
  birdwatching: {
    title: 'Birdsong Circuit',
    description: 'Tune into the neighborhood’s morning rhythm and notice which species are using the space around you.',
    materials: ['phone camera', 'quiet notebook', 'optional binoculars'],
    steps: [
      'Stand still for 30 seconds and listen for the first bird calls you can identify.',
      'Walk slowly along a path and note where birds are feeding, perching, or moving together.',
      'Observe body language and calls to infer whether the birds are active, alert, or nesting.',
      'Record one interesting behavior or sound pattern before you head back.',
    ],
    observations: ['Call patterns', 'Feeding locations', 'Flight paths', 'Habitat shifts'],
    reflection: 'Which bird behavior felt most different from the way animals move in a busy city?',
    safety: ['Stay on marked paths and keep a respectful distance from nests.', 'Do not disturb wildlife or block animal routes.', 'Avoid going near water or cliffs alone.'],
  },
  'plant observation': {
    title: 'Leaf and Stem Study',
    description: 'Slow down and notice the structural details of the plants growing nearby.',
    materials: ['small notebook', 'phone for close-up photos', 'water bottle'],
    steps: [
      'Choose a single plant or a small patch and look closely at the leaves and stems.',
      'Check how leaves are arranged, textured, and shaped along the stem.',
      'Look for signs of growth, stress, or pollinators around the flower or leaves.',
      'Record two features that make this plant distinct from nearby ones.',
    ],
    observations: ['Leaf shape', 'Vein patterns', 'Flower color', 'Stem texture'],
    reflection: 'What plant feature would help you recognize this species again on another walk?',
    safety: ['Do not touch unknown plants with thorns, sap, or unfamiliar irritants.', 'Wash hands after handling plants or soil.', 'Avoid eating any wild plants.'],
  },
  'mindful walking': {
    title: 'Grounding Walk',
    description: 'Use your senses to settle into the landscape and feel your pace change with the environment.',
    materials: ['comfortable shoes', 'water', 'a moment of stillness'],
    steps: [
      'Begin with a slow breath and notice the ground beneath your feet.',
      'Walk for a short stretch while tracking three sounds, two textures, and one color change.',
      'Pause at a natural feature such as a tree, bench, or patch of sun and simply observe.',
      'Return to the start with a calmer awareness of the space around you.',
    ],
    observations: ['Soundscape', 'Light changes', 'Ground texture', 'Breathing rhythm'],
    reflection: 'Which part of the walk felt the most grounded or calming?',
    safety: ['Choose familiar, safe paths and stay visible to others.', 'Carry water and take breaks as needed.', 'Mind weather, heat, and low light conditions.'],
  },
  photography: {
    title: 'Light and Texture Hunt',
    description: 'Look for interesting compositions created by light, pattern, and the natural world.',
    materials: ['camera or phone', 'a clean lens cloth or cloth', 'small notebook'],
    steps: [
      'Look for shapes, lines, and contrast created by leaves, bark, water, or wind.',
      'Move slowly and frame the subject with an intentional angle or horizon line.',
      'Pause to watch how light changes across the scene before taking a few frames.',
      'Choose one image to save and reflect on why it feels memorable.',
    ],
    observations: ['Composition', 'Movement', 'Shadow patterns', 'Color details'],
    reflection: 'What did the scene teach you about patience and noticing in the moment?',
    safety: ['Stay on safe paths and avoid slippery or crowded edges.', 'Keep your phone or camera secure and away from waterways.', 'Don’t enter restricted or private areas.'],
  },
  gardening: {
    title: 'Garden Observing Loop',
    description: 'Notice what is thriving, what needs attention, and which pollinators are active.',
    materials: ['garden gloves optional', 'hand trowel optional', 'notebook'],
    steps: [
      'Walk the garden edge and notice flowers, leaves, and soil conditions.',
      'Check where there is sunlight, shade, and moisture, then compare the plants in those zones.',
      'Look for pollinators or signs of watering needs and record one plant to revisit later.',
      'Finish with one small action: water, prune, or tidy a safe area without overworking it.',
    ],
    observations: ['Flower abundance', 'Soil moisture', 'Pollinator activity', 'Growth patterns'],
    reflection: 'Which plants seemed healthiest, and what conditions might support that?',
    safety: ['Avoid handling unknown plants or soil with hidden hazards.', 'Wear gloves if working with soil or tools.', 'Stay hydrated and keep a safe distance from sharp tools.'],
  },
  'general exploration': {
    title: 'Patch Observation Walk',
    description: 'Explore a familiar outdoor area with an intentional curiosity about changes and patterns in nature.',
    materials: ['notebook', 'camera optional', 'water'],
    steps: [
      'Choose one small area and notice its textures, sounds, and movement before you move on.',
      'Look for a living thing that changes as you slow down or pause.',
      'Record one idea or question you want to revisit on the next walk.',
      'Take a gentle moment to absorb the landscape before you leave.',
    ],
    observations: ['Microhabitats', 'Seasonal clues', 'Tracks or signs', 'Animal movement'],
    reflection: 'What sign of life felt easiest to overlook before you slowed down?',
    safety: ['Stay in public or permitted spaces.', 'Respect wildlife and avoid touching unknown organisms.', 'Check weather and daylight before exploring alone.'],
  },
};

const environmentAdjustments: Record<Environment, { description: string; titleSuffix: string }> = {
  park: { description: 'Keep your route close to open paths and public spaces.', titleSuffix: 'in the park' },
  garden: { description: 'Use the boundaries of the garden as your guide and look closely at plant layers.', titleSuffix: 'in the garden' },
  forest: { description: 'Stay on clear, well-marked trails and keep an eye on footing and light.', titleSuffix: 'in the forest' },
  neighborhood: { description: 'Notice the edge habitats and everyday green spaces around your daily routes.', titleSuffix: 'around the neighborhood' },
};

const difficultyNotes: Record<Difficulty, string> = {
  easy: 'Comfortable pacing and gentle observation.',
  moderate: 'A steady walk with a little extra attention to detail.',
  adventurous: 'Look for a little more movement, terrain, or quieter observation spots.',
};

export function buildOfflineMission(filters: MissionFilters): Mission {
  const base = missionLibrary[filters.activityType];
  const environmentContext = environmentAdjustments[filters.environment];
  const title = `${base.title} ${environmentContext.titleSuffix}`;

  return {
    id: `${filters.activityType}-${filters.environment}-${filters.time}-${filters.difficulty}`,
    title,
    description: `${base.description} ${environmentContext.description} ${difficultyNotes[filters.difficulty]}`,
    duration: filters.time,
    difficulty: filters.difficulty,
    activityType: filters.activityType,
    environment: filters.environment,
    materials: base.materials,
    steps: base.steps,
    observations: base.observations,
    reflection: base.reflection,
    safety: base.safety,
    source: 'offline',
  };
}

export function getDefaultMission(): Mission {
  return buildOfflineMission({ time: 20, activityType: 'general exploration', difficulty: 'easy', environment: 'park' });
}

export const natureTips = [
  'Look for patterns in leaf shape, bark texture, and bird movement before you name what you see.',
  'A slow walk often reveals more than a fast one — pause, listen, and notice the edges of a habitat.',
  'Keep a respectful distance from wildlife and leave nesting areas and delicate plants undisturbed.',
  'The best nature observations often come from small details: a seed head, a feather, or a shadow pattern.',
  'Think of your journal as a field notebook: describe what you notice, not only what you think it is.',
];
