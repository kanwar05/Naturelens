export type TimeChoice = 10 | 20 | 30 | 60;
export type ActivityType = 'birdwatching' | 'plant observation' | 'mindful walking' | 'photography' | 'gardening' | 'general exploration';
export type Difficulty = 'easy' | 'moderate' | 'adventurous';
export type Environment = 'park' | 'garden' | 'forest' | 'neighborhood';

export interface MissionFilters {
  time: TimeChoice;
  activityType: ActivityType;
  difficulty: Difficulty;
  environment: Environment;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  duration: number;
  difficulty: Difficulty;
  activityType: ActivityType;
  environment: Environment;
  materials: string[];
  steps: string[];
  observations: string[];
  reflection: string;
  safety: string[];
  source: 'ai' | 'offline';
}

export interface JournalEntry {
  id: string;
  title: string;
  date: string;
  category: string;
  location: string;
  notes: string;
  photo?: string;
  createdAt: string;
}

export interface MissionCompletion {
  id: string;
  missionId: string;
  title: string;
  date: string;
  duration: number;
  completedAt: string;
}

export interface DashboardSummary {
  missionsCompleted: number;
  totalMinutes: number;
  streak: number;
  journalEntries: number;
  recentActivities: ActivityRecord[];
  weeklyActivity: Array<{ label: string; count: number }>;
  badges: string[];
  suggestedMission: Mission;
}

export interface ActivityRecord {
  id: string;
  type: 'mission' | 'journal';
  title: string;
  description: string;
  date: string;
  minutes?: number;
}
