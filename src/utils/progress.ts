import type { ActivityRecord, MissionCompletion } from '../types';

export function calculateStreak(completions: Array<{ date: string }>): number {
  const uniqueDates = new Set(completions.map((completion) => completion.date.slice(0, 10)));
  const today = new Date();
  let streak = 0;

  for (let index = 0; index < 365; index += 1) {
    const current = new Date(today);
    current.setDate(today.getDate() - index);
    const key = current.toISOString().slice(0, 10);

    if (uniqueDates.has(key)) {
      streak += 1;
    } else if (index === 0) {
      continue;
    } else {
      break;
    }
  }

  return streak;
}

export function buildWeeklyActivity(completions: MissionCompletion[], journalCount: number) {
  const result = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));

    const label = date.toLocaleDateString('en-US', { weekday: 'short' });
    const dateKey = date.toISOString().slice(0, 10);
    const missionCount = completions.filter((completion) => completion.date.slice(0, 10) === dateKey).length;

    return { label, count: missionCount + Math.min(1, Math.floor(journalCount / 7)) };
  });

  return result;
}

export function recentActivityFromData(
  completions: MissionCompletion[],
  journalEntries: Array<{ id: string; title: string; date: string; notes: string }>,
): ActivityRecord[] {
  const missionActivities: ActivityRecord[] = completions.map((completion) => ({
    id: completion.id,
    type: 'mission',
    title: completion.title,
    description: 'Completed a mission outdoors',
    date: completion.date,
    minutes: completion.duration,
  }));

  const journalActivities: ActivityRecord[] = journalEntries.map((entry) => ({
    id: entry.id,
    type: 'journal',
    title: entry.title,
    description: entry.notes.slice(0, 80) || 'Added a journal observation',
    date: entry.date,
  }));

  return [...missionActivities, ...journalActivities].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
}
