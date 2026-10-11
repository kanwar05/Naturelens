import { describe, expect, it } from 'vitest';
import { calculateStreak } from './utils/progress';
import { buildOfflineMission } from './data/missions';

describe('mission generation', () => {
  it('builds a deterministic offline mission from the selected filters', () => {
    const mission = buildOfflineMission({
      time: 30,
      activityType: 'birdwatching',
      difficulty: 'moderate',
      environment: 'forest',
    });

    expect(mission.title).toContain('Birdsong Circuit');
    expect(mission.duration).toBe(30);
    expect(mission.environment).toBe('forest');
    expect(mission.steps.length).toBeGreaterThanOrEqual(3);
  });
});

describe('streak logic', () => {
  it('counts a current streak from completed mission dates', () => {
    const today = new Date();
    const dates = [
      { date: new Date(today.getTime()).toISOString() },
      { date: new Date(today.getTime() - 86400000).toISOString() },
      { date: new Date(today.getTime() - 172800000).toISOString() },
    ];

    expect(calculateStreak(dates)).toBe(3);
  });
});
