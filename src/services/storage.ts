import type { JournalEntry, Mission, MissionCompletion } from '../types';

const DB_NAME = 'naturelens-db';
const DB_VERSION = 1;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains('journal')) {
        database.createObjectStore('journal', { keyPath: 'id' });
      }
      if (!database.objectStoreNames.contains('missions')) {
        database.createObjectStore('missions', { keyPath: 'id' });
      }
      if (!database.objectStoreNames.contains('completions')) {
        database.createObjectStore('completions', { keyPath: 'id' });
      }
      if (!database.objectStoreNames.contains('saved')) {
        database.createObjectStore('saved', { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Unable to open database'));
  });
}

function asPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Request failed'));
  });
}

export async function saveJournalEntry(entry: JournalEntry): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction('journal', 'readwrite');
  const store = transaction.objectStore('journal');
  await asPromise(store.put(entry));
}

export async function getJournalEntries(): Promise<JournalEntry[]> {
  const database = await openDatabase();
  const transaction = database.transaction('journal', 'readonly');
  const store = transaction.objectStore('journal');
  return asPromise(store.getAll());
}

export async function updateJournalEntry(entry: JournalEntry): Promise<void> {
  await saveJournalEntry(entry);
}

export async function deleteJournalEntry(id: string): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction('journal', 'readwrite');
  const store = transaction.objectStore('journal');
  await asPromise(store.delete(id));
}

export async function saveMission(mission: Mission): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction('saved', 'readwrite');
  const store = transaction.objectStore('saved');
  await asPromise(store.put(mission));
}

export async function getSavedMissions(): Promise<Mission[]> {
  const database = await openDatabase();
  const transaction = database.transaction('saved', 'readonly');
  const store = transaction.objectStore('saved');
  return asPromise(store.getAll());
}

export async function saveMissionCompletion(entry: MissionCompletion): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction('completions', 'readwrite');
  const store = transaction.objectStore('completions');
  await asPromise(store.put(entry));
}

export async function getCompletedMissions(): Promise<MissionCompletion[]> {
  const database = await openDatabase();
  const transaction = database.transaction('completions', 'readonly');
  const store = transaction.objectStore('completions');
  return asPromise(store.getAll());
}

export async function clearAllData(): Promise<void> {
  const database = await openDatabase();
  const journal = database.transaction('journal', 'readwrite').objectStore('journal');
  const saved = database.transaction('saved', 'readwrite').objectStore('saved');
  const completions = database.transaction('completions', 'readwrite').objectStore('completions');
  await asPromise(journal.clear());
  await asPromise(saved.clear());
  await asPromise(completions.clear());
}
