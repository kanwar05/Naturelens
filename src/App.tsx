import { useEffect, useMemo, useState } from 'react';
import { Link, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, BookOpen, Compass, Flower2, Footprints, GitBranch, Leaf, Map, NotebookPen, Sparkles, Trees } from 'lucide-react';
import { buildOfflineMission, getDefaultMission, natureTips } from './data/missions';
import { generateGuideReply, generateMissionWithAI, loadNatureModel } from './services/ai';
import {
  clearAllData,
  deleteJournalEntry,
  getCompletedMissions,
  getJournalEntries,
  getSavedMissions,
  saveJournalEntry,
  saveMission,
  saveMissionCompletion,
  updateJournalEntry,
} from './services/storage';
import type { Difficulty, Environment, JournalEntry, Mission, MissionCompletion, MissionFilters } from './types';
import { buildWeeklyActivity, calculateStreak, recentActivityFromData } from './utils/progress';
import './App.css';

const timeOptions = [10, 20, 30, 60] as const;
const activityOptions = ['birdwatching', 'plant observation', 'mindful walking', 'photography', 'gardening', 'general exploration'] as const;
const difficultyOptions: Difficulty[] = ['easy', 'moderate', 'adventurous'];
const environmentOptions: Environment[] = ['park', 'garden', 'forest', 'neighborhood'];

const defaultFilters: MissionFilters = {
  time: 20,
  activityType: 'general exploration',
  difficulty: 'easy',
  environment: 'park',
};

const starterQuestions = [
  'How can I attract butterflies to my garden?',
  'What should I observe during a short nature walk?',
  'How do birds use different calls?',
  'How do I start identifying common trees?',
];

function App() {
  return (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/missions" element={<MissionExplorerPage />} />
        <Route path="/guide" element={<NatureGuidePage />} />
        <Route path="/journal" element={<JournalPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/mission/:missionId" element={<MissionDetailPage />} />
      </Routes>
    </div>
  );
}

function LandingPage() {
  const navigate = useNavigate();

  return (
    <PageFrame noTitle>
      <div className="landing-page">
        <section className="hero-panel">
          <div className="hero-copy">
            <span className="eyebrow">Offline-first nature companion</span>
            <h1>Less scrolling. More exploring.</h1>
            <p>
              NatureLens helps you make the most of a few minutes outdoors: discover a mission,
              learn what to notice, and save the best parts of the day in a local journal.
            </p>
            <div className="cta-row">
              <button type="button" className="primary-btn" onClick={() => navigate('/missions')}>
                Start Exploring <ArrowRight size={16} />
              </button>
              <a className="secondary-btn" href="#how-it-works">Discover How It Works</a>
            </div>
            <div className="hero-meta">
              <span><Compass size={15} /> Local-first AI</span>
              <span><BookOpen size={15} /> Offline ready</span>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-image" aria-label="Forest landscape illustration" />
          </div>
        </section>

        <section id="how-it-works" className="feature-grid">
          <FeatureCard icon={<Sparkles size={22} />} title="AI Nature Guide" description="Ask practical questions and turn them into safe outdoor observations." />
          <FeatureCard icon={<Footprints size={22} />} title="Outdoor Missions" description="Choose a time, activity, and setting to generate a focused action plan." />
          <FeatureCard icon={<Map size={22} />} title="Offline Exploration" description="Saved missions and journal notes remain available when the signal drops." />
        </section>

        <section className="preview-box">
          <div>
            <span className="eyebrow">Your next adventure starts here</span>
            <h2>Forest trail reset</h2>
            <p>Slow your pace, listen for bird calls, and notice which small details stand out during a short walk.</p>
          </div>
          <div className="mini-mission">
            <span>20 min</span>
            <strong>Birdsong Circuit</strong>
            <button type="button" onClick={() => navigate('/missions')}>Plan this walk</button>
          </div>
        </section>

        <section className="why-local">
          <div>
            <span className="eyebrow">Why local matters</span>
            <h3>AI that prepares you for the outdoors instead of keeping you on-screen.</h3>
          </div>
          <p>
            NatureLens is designed to respect attention, provide useful local guidance, and keep your data on-device so you can keep exploring without relying on a constant connection.
          </p>
        </section>
      </div>

      <footer className="site-footer">
        <div>NatureLens © 2026</div>
        <div className="footer-links">
          <a href="https://github.com" target="_blank" rel="noreferrer">GitHub</a>
          <a href="https://dev.to/challenges" target="_blank" rel="noreferrer">Challenge</a>
        </div>
      </footer>
    </PageFrame>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <article className="feature-card">
      <div className="feature-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </article>
  );
}

function MissionExplorerPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<MissionFilters>(defaultFilters);
  const [mission, setMission] = useState<Mission | null>(getDefaultMission());
  const [status, setStatus] = useState('Offline-ready mission library ready.');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingModel, setLoadingModel] = useState(false);

  useEffect(() => {
    const init = async () => {
      setLoadingModel(true);
      try {
        await loadNatureModel();
      } catch {
        // Ignore model loading errors and keep the app working.
      } finally {
        setLoadingModel(false);
      }
    };

    void init();
  }, []);

  const handleGenerate = async () => {
    setIsLoading(true);
    setStatus('Generating a mission based on your time and interests…');
    try {
      const generated = await generateMissionWithAI(filters);
      setMission(generated.mission);
      setStatus(generated.status);
    } catch {
      const fallback = buildOfflineMission(filters);
      setMission(fallback);
      setStatus('Model generation failed, so the offline mission library was used instead.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageFrame title="Outdoor mission explorer" subtitle="Choose a short, focused exploration that fits your time and environment.">
      <div className="mission-grid">
        <div className="card-panel form-panel">
          <div className="field-group">
            <label>Available time</label>
            <div className="segmented-row">
              {timeOptions.map((value) => (
                <button
                  key={value}
                  type="button"
                  className={filters.time === value ? 'segmented active' : 'segmented'}
                  onClick={() => setFilters((prev) => ({ ...prev, time: value }))}
                >
                  {value} min
                </button>
              ))}
            </div>
          </div>

          <div className="field-group">
            <label>Activity type</label>
            <select value={filters.activityType} onChange={(event) => setFilters((prev) => ({ ...prev, activityType: event.target.value as MissionFilters['activityType'] }))}>
              {activityOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <div className="field-group">
            <label>Difficulty</label>
            <div className="segmented-row compact">
              {difficultyOptions.map((value) => (
                <button
                  key={value}
                  type="button"
                  className={filters.difficulty === value ? 'segmented active' : 'segmented'}
                  onClick={() => setFilters((prev) => ({ ...prev, difficulty: value }))}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          <div className="field-group">
            <label>Environment</label>
            <div className="segmented-row compact">
              {environmentOptions.map((value) => (
                <button
                  key={value}
                  type="button"
                  className={filters.environment === value ? 'segmented active' : 'segmented'}
                  onClick={() => setFilters((prev) => ({ ...prev, environment: value }))}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          <div className="button-stack">
            <button type="button" className="primary-btn full" onClick={handleGenerate} disabled={isLoading}>
              {isLoading ? 'Generating…' : 'Generate mission'}
            </button>
            <button type="button" className="ghost-btn full" onClick={async () => { if (mission) { await saveMission(mission); } }}>
              Save mission
            </button>
          </div>
          <p className="status-note">{loadingModel ? 'Loading the local AI model…' : status}</p>
        </div>

        <div className="card-panel mission-panel">
          {mission ? (
            <>
              <div className="mission-header-row">
                <span className={`source-badge ${mission.source}`}>{mission.source === 'ai' ? 'AI generated' : 'Offline library'}</span>
                <span className="mission-duration">{mission.duration} minutes</span>
              </div>
              <h3>{mission.title}</h3>
              <p className="mission-description">{mission.description}</p>
              <div className="mission-meta-row">
                <span>{mission.difficulty}</span>
                <span>{mission.activityType}</span>
                <span>{mission.environment}</span>
              </div>

              <div className="detail-block">
                <h4>Materials</h4>
                <ul>
                  {mission.materials.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>

              <div className="detail-block">
                <h4>Steps</h4>
                <ol>
                  {mission.steps.map((step, index) => <li key={`${step}-${index}`}>{step}</li>)}
                </ol>
              </div>

              <div className="detail-block">
                <h4>Things to observe</h4>
                <ul>
                  {mission.observations.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>

              <div className="detail-block">
                <h4>Reflection question</h4>
                <p>{mission.reflection}</p>
              </div>

              <div className="detail-block">
                <h4>Safety tips</h4>
                <ul>
                  {mission.safety.map((tip) => <li key={tip}>{tip}</li>)}
                </ul>
              </div>

              <div className="mission-actions">
                <button type="button" className="primary-btn" onClick={() => navigate(`/mission/${mission.id}`)}>Start Mission</button>
                <button type="button" className="ghost-btn" onClick={async () => { await saveMission(mission); }}>Save Mission</button>
              </div>
            </>
          ) : (
            <div className="empty-state">No mission yet. Adjust your filters and generate a new one.</div>
          )}
        </div>
      </div>
    </PageFrame>
  );
}

function NatureGuidePage() {
  const [input, setInput] = useState('What should I observe during a short nature walk?');
  const [messages, setMessages] = useState<Array<{ id: string; role: 'user' | 'assistant'; content: string; note?: string }>>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'I can help with nature questions, safety, and simple outdoor observations. Ask me about birds, plants, or what to notice on a walk.',
      note: 'Curated protection and local-safe guidance are available even when the model is unavailable.',
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [modelStatus, setModelStatus] = useState('Checking local model…');

  useEffect(() => {
    const init = async () => {
      try {
        const model = await loadNatureModel();
        setModelStatus(model ? 'Local model ready on this device.' : 'No local model available. Using curated guidance and nature tips.');
      } catch {
        setModelStatus('No local model available. Using curated guidance and nature tips.');
      }
    };

    void init();
  }, []);

  const handleAsk = async (questionOverride?: string) => {
    const question = (questionOverride ?? input).trim();
    if (!question) return;

    setMessages((prev) => [...prev, { id: String(Date.now()), role: 'user', content: question }]);
    setIsLoading(true);
    try {
      const result = await generateGuideReply(question);
      setMessages((prev) => [...prev, { id: String(Date.now() + 1), role: 'assistant', content: result.answer, note: result.note }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageFrame title="AI nature guide" subtitle="Ask for practical, outdoor-friendly guidance. Local processing is preferred when available.">
      <div className="guide-layout">
        <div className="card-panel guide-sidebar">
          <div className="status-strip">{modelStatus}</div>
          <div className="chip-list">
            {starterQuestions.map((question) => (
              <button key={question} type="button" className="chip" onClick={() => handleAsk(question)}>{question}</button>
            ))}
          </div>
          <div className="tip-list">
            {natureTips.map((tip) => <p key={tip}>{tip}</p>)}
          </div>
        </div>

        <div className="card-panel guide-chat">
          <div className="chat-window">
            {messages.map((message) => (
              <div key={message.id} className={message.role === 'user' ? 'msg user' : 'msg assistant'}>
                <span>{message.content}</span>
                {message.note ? <small>{message.note}</small> : null}
              </div>
            ))}
            {isLoading ? <div className="msg assistant loading">Generating a local nature response…</div> : null}
          </div>
          <div className="question-row">
            <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask about birds, plants, or the next walk" />
            <button type="button" className="primary-btn" onClick={() => handleAsk()}>Ask</button>
          </div>
          <div className="sub-actions">
            <button type="button" className="ghost-btn" onClick={() => setMessages([{ id: 'welcome', role: 'assistant', content: 'I can help with nature questions, safety, and simple outdoor observations. Ask me about birds, plants, or what to notice on a walk.' }])}>Reset</button>
            <button type="button" className="ghost-btn" onClick={() => handleAsk('What should I notice on a 20-minute nature walk near a park or garden?')}>Take this outside</button>
          </div>
        </div>
      </div>
    </PageFrame>
  );
}

function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const categories = ['Birds', 'Plants', 'Insects', 'Weather', 'Landscape', 'General'];
  const [draft, setDraft] = useState({
    title: '',
    date: new Date().toISOString().slice(0, 10),
    category: 'Birds',
    location: '',
    notes: '',
    photo: '',
  });
  const [isEditing, setIsEditing] = useState<string | null>(null);

  const loadEntries = async () => {
    const stored = await getJournalEntries();
    const sorted = stored.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setEntries(sorted);
  };

  useEffect(() => {
    void loadEntries();
  }, []);

  const filteredEntries = useMemo(() => entries.filter((entry) => {
    const query = searchTerm.toLowerCase();
    const categoryMatch = filterCategory === 'all' || entry.category === filterCategory;
    const textMatch = !query || [entry.title, entry.location, entry.notes].join(' ').toLowerCase().includes(query);
    return categoryMatch && textMatch;
  }), [entries, filterCategory, searchTerm]);

  const handleSubmit = async () => {
    const entry: JournalEntry = {
      id: isEditing ?? `entry-${Date.now()}`,
      title: draft.title || 'Nature observation',
      date: draft.date,
      category: draft.category,
      location: draft.location || 'Local outdoor spot',
      notes: draft.notes || 'A quick note from outside.',
      photo: draft.photo.trim() ? draft.photo : undefined,
      createdAt: new Date().toISOString(),
    };

    if (isEditing) {
      await updateJournalEntry(entry);
    } else {
      await saveJournalEntry(entry);
    }

    setDraft({ title: '', date: new Date().toISOString().slice(0, 10), category: 'Birds', location: '', notes: '', photo: '' });
    setIsEditing(null);
    await loadEntries();
  };

  const handleEdit = (entry: JournalEntry) => {
    setDraft({
      title: entry.title,
      date: entry.date,
      category: entry.category,
      location: entry.location,
      notes: entry.notes,
      photo: entry.photo ?? '',
    });
    setIsEditing(entry.id);
  };

  const handleDelete = async (id: string) => {
    await deleteJournalEntry(id);
    await loadEntries();
  };

  return (
    <PageFrame title="Nature journal" subtitle="Record what you noticed outside and save it locally for later.">
      <div className="journal-layout">
        <div className="card-panel form-panel">
          <h3>{isEditing ? 'Edit observation' : 'Add observation'}</h3>
          <div className="field-group">
            <label>Title</label>
            <input value={draft.title} onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))} />
          </div>
          <div className="two-column">
            <div className="field-group">
              <label>Date</label>
              <input type="date" value={draft.date} onChange={(event) => setDraft((prev) => ({ ...prev, date: event.target.value }))} />
            </div>
            <div className="field-group">
              <label>Category</label>
              <select value={draft.category} onChange={(event) => setDraft((prev) => ({ ...prev, category: event.target.value }))}>
                {categories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </div>
          </div>
          <div className="field-group">
            <label>Location description</label>
            <input value={draft.location} onChange={(event) => setDraft((prev) => ({ ...prev, location: event.target.value }))} />
          </div>
          <div className="field-group">
            <label>Notes</label>
            <textarea value={draft.notes} onChange={(event) => setDraft((prev) => ({ ...prev, notes: event.target.value }))} rows={5} />
          </div>
          <div className="field-group">
            <label>Optional photo URL</label>
            <input value={draft.photo} onChange={(event) => setDraft((prev) => ({ ...prev, photo: event.target.value }))} placeholder="Paste a photo URL or leave blank" />
          </div>
          <p className="permission-note">Camera access can be requested when the feature is used, but no precise location data is tracked in the background.</p>
          <div className="button-stack">
            <button type="button" className="primary-btn full" onClick={handleSubmit}>{isEditing ? 'Update observation' : 'Save observation'}</button>
            {isEditing ? (
              <button type="button" className="ghost-btn full" onClick={() => {
                setIsEditing(null);
                setDraft({ title: '', date: new Date().toISOString().slice(0, 10), category: 'Birds', location: '', notes: '', photo: '' });
              }}>Cancel</button>
            ) : null}
          </div>
        </div>

        <div className="card-panel list-panel">
          <div className="toolbar-row">
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search observations" />
            <select value={filterCategory} onChange={(event) => setFilterCategory(event.target.value)}>
              <option value="all">All</option>
              {categories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          </div>

          {filteredEntries.length === 0 ? (
            <div className="empty-state large">
              <NotebookPen size={28} />
              <p>No observations yet. Start your first journal entry.</p>
              <button type="button" className="primary-btn" onClick={() => setDraft((prev) => ({ ...prev, title: 'First nature note' }))}>Add the first observation</button>
            </div>
          ) : (
            <div className="journal-list">
              {filteredEntries.map((entry) => (
                <article key={entry.id} className="journal-card">
                  {entry.photo ? <img src={entry.photo} alt={entry.title} className="journal-photo" /> : <div className="journal-photo placeholder"><Trees size={32} /></div>}
                  <div className="journal-card-content">
                    <div className="journal-header-row">
                      <h4>{entry.title}</h4>
                      <span>{entry.category}</span>
                    </div>
                    <p className="muted-label">{entry.date}</p>
                    <p className="journal-location">{entry.location}</p>
                    <p>{entry.notes}</p>
                    <div className="journal-actions">
                      <button type="button" className="ghost-btn small" onClick={() => handleEdit(entry)}>Edit</button>
                      <button type="button" className="ghost-btn small danger" onClick={() => handleDelete(entry.id)}>Delete</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageFrame>
  );
}

function DashboardPage() {
  const [summary, setSummary] = useState({
    missionsCompleted: 0,
    totalMinutes: 0,
    streak: 0,
    journalEntries: 0,
    recentActivities: [] as Array<{ id: string; title: string; description: string; date: string; minutes?: number }>,
    weeklyActivity: [] as Array<{ label: string; count: number }>,
    badges: [] as string[],
    suggestedMission: getDefaultMission(),
  });

  const refresh = async () => {
    const completions = await getCompletedMissions();
    const entries = await getJournalEntries();
    const saved = await getSavedMissions();
    const totalMinutes = completions.reduce((sum, completion) => sum + completion.duration, 0);
    const nextSummary = {
      missionsCompleted: completions.length,
      totalMinutes,
      streak: calculateStreak(completions),
      journalEntries: entries.length,
      recentActivities: recentActivityFromData(completions, entries),
      weeklyActivity: buildWeeklyActivity(completions, entries.length),
      badges: [
        completions.length > 0 ? 'Trail starter' : 'Ready to begin',
        totalMinutes >= 60 ? 'Outdoors regular' : 'Steady explorer',
        entries.length > 0 ? 'Field observer' : 'New journal',
      ],
      suggestedMission: saved[0] ?? getDefaultMission(),
    };
    setSummary(nextSummary);
  };

  useEffect(() => {
    void refresh();
  }, []);

  const handleReset = async () => {
    const ok = window.confirm('Reset all stored NatureLens data? This cannot be undone.');
    if (ok) {
      await clearAllData();
      await refresh();
    }
  };

  return (
    <PageFrame title="Dashboard and progress" subtitle="Real local progress from your saved missions and journal entries.">
      <div className="dashboard-grid">
        <div className="metric-grid">
          <MetricCard label="Missions completed" value={String(summary.missionsCompleted)} icon={<Flower2 />} />
          <MetricCard label="Total outdoor minutes" value={`${summary.totalMinutes}`} icon={<Compass />} />
          <MetricCard label="Current streak" value={`${summary.streak} days`} icon={<GitBranch />} />
          <MetricCard label="Journal entries" value={String(summary.journalEntries)} icon={<NotebookPen />} />
        </div>

        <div className="card-panel chart-panel">
          <h3>Weekly outdoor activity</h3>
          <div className="chart-bars">
            {summary.weeklyActivity.map((entry) => (
              <div key={entry.label} className="bar-wrap">
                <div className="bar" style={{ height: `${Math.max(18, entry.count * 26)}px` }} />
                <span>{entry.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card-panel badge-panel">
          <h3>Achievement badges</h3>
          <div className="badge-list">
            {summary.badges.map((badge) => <span key={badge} className="badge-pill">{badge}</span>)}
          </div>
        </div>

        <div className="card-panel recent-panel">
          <h3>Recent activities</h3>
          <ul>
            {summary.recentActivities.length === 0 ? <li>No activity yet.</li> : summary.recentActivities.map((activity) => (
              <li key={activity.id}>
                <strong>{activity.title}</strong>
                <span>{activity.description}</span>
                <small>{new Date(activity.date).toLocaleDateString()}</small>
              </li>
            ))}
          </ul>
        </div>

        <div className="card-panel suggestion-panel">
          <h3>Suggested next mission</h3>
          <div className="suggestion-box">
            <strong>{summary.suggestedMission.title}</strong>
            <p>{summary.suggestedMission.description}</p>
            <button type="button" className="primary-btn small" onClick={() => window.location.assign(`/mission/${summary.suggestedMission.id}`)}>Start it</button>
          </div>
        </div>
      </div>

      <div className="reset-section">
        <button type="button" className="ghost-btn danger" onClick={handleReset}>Reset all data</button>
      </div>
    </PageFrame>
  );
}

function MissionDetailPage() {
  const params = useParams();
  const navigate = useNavigate();
  const [mission, setMission] = useState<Mission | null>(null);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState('');
  const [complete, setComplete] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      const saved = await getSavedMissions();
      const currentId = params.missionId;
      const found = saved.find((entry) => entry.id === currentId) ?? getDefaultMission();
      setMission(found);
      setChecklist(Object.fromEntries(found.steps.map((step) => [step, false])));
    };

    void load();
  }, [params.missionId]);

  const toggleStep = (step: string) => {
    setChecklist((prev) => ({ ...prev, [step]: !prev[step] }));
  };

  const handleComplete = async () => {
    if (!mission) return;

    const completion: MissionCompletion = {
      id: `mission-complete-${Date.now()}`,
      missionId: mission.id,
      title: mission.title,
      date: new Date().toISOString(),
      duration: mission.duration,
      completedAt: new Date().toISOString(),
    };

    await saveMissionCompletion(completion);
    setComplete(true);
    setMessage('Mission complete — your streak and dashboard update locally.');
  };

  if (!mission) {
    return <PageFrame title="Mission" subtitle="Loading your outdoor plan…" />;
  }

  return (
    <PageFrame title={mission.title} subtitle={mission.description}>
      <div className="mission-detail card-panel">
        <div className="mission-objective">
          <h3>Mission objective</h3>
          <p>{mission.description}</p>
        </div>

        <div className="checklist-box">
          <h3>Checklist</h3>
          {mission.steps.map((step, index) => (
            <label key={`${step}-${index}`} className="check-row">
              <input type="checkbox" checked={Boolean(checklist[step])} onChange={() => toggleStep(step)} />
              <span>{step}</span>
            </label>
          ))}
        </div>

        <div className="notes-box">
          <h3>Observation notes</h3>
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Write what you noticed, heard, or felt in the moment." rows={5} />
        </div>

        <div className="reflection-box">
          <h3>Reflection</h3>
          <p>{mission.reflection}</p>
        </div>

        <div className="button-stack detail-actions">
          <button type="button" className="primary-btn" onClick={handleComplete}>Complete mission</button>
          <button type="button" className="ghost-btn" onClick={() => navigate('/missions')}>Back to missions</button>
        </div>

        {complete ? <div className="success-banner">{message}</div> : null}
      </div>
    </PageFrame>
  );
}

function PageFrame({ title, subtitle, children, noTitle }: { title?: string; subtitle?: string; children?: React.ReactNode; noTitle?: boolean }) {
  return (
    <div className="page-shell">
      <nav className="topbar">
        <div className="brand-wrap">
          <div className="brand-mark"><Leaf size={18} /></div>
          <span>NatureLens</span>
        </div>
        <div className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/missions">Missions</Link>
          <Link to="/guide">AI Guide</Link>
          <Link to="/journal">Journal</Link>
          <Link to="/dashboard">Dashboard</Link>
        </div>
      </nav>

      <main className="content-shell">
        {!noTitle ? (
          <div className="page-header">
            <span className="eyebrow">NatureLens</span>
            <h1>{title}</h1>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
        ) : null}
        {children}
      </main>
    </div>
  );
}

function MetricCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="metric-card card-panel">
      <div className="metric-icon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default App;
