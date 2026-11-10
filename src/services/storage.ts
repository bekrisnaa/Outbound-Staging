import { AppDraftState, BagsealItem, StagingItem, TripId } from '../types';

const DRAFT_STORAGE_KEY = 'logiscan_active_draft_v1';
const STAGINGS_STORAGE_KEY = 'logiscan_custom_stagings_v1';

// Initial preloaded realistic logistics stagings (can be edited/deleted up to 34 max)
export const DEFAULT_STAGINGS: StagingItem[] = [
  { id: 'stg-1', code: 'SKMJ', name: 'Sukamaju Outbound Hub', createdAt: '2026-01-01' },
  { id: 'stg-2', code: 'CGK01', name: 'Cengkareng Central Gateway', createdAt: '2026-01-01' },
  { id: 'stg-3', code: 'BDG02', name: 'Bandung Timur Sortation', createdAt: '2026-01-01' },
  { id: 'stg-4', code: 'SUB01', name: 'Surabaya Tanjung Perak Hub', createdAt: '2026-01-01' },
  { id: 'stg-5', code: 'SOC01', name: 'Solo Adi Soemarmo Hub', createdAt: '2026-01-01' },
  { id: 'stg-6', code: 'JOG03', name: 'Yogyakarta Maguwo Express', createdAt: '2026-01-01' },
  { id: 'stg-7', code: 'SMG02', name: 'Semarang Port Facility', createdAt: '2026-01-01' },
  { id: 'stg-8', code: 'BPN01', name: 'Balikpapan Air Freight', createdAt: '2026-01-01' },
  { id: 'stg-9', code: 'DPS01', name: 'Denpasar Ngurah Rai Cargo', createdAt: '2026-01-01' },
  { id: 'stg-10', code: 'UPG01', name: 'Makassar Sultan Hasanuddin', createdAt: '2026-01-01' },
];

/**
 * Loads the active draft from LocalStorage.
 * Note: Never resets or overwrites on date change! All data and tags persist across days/midnight.
 */
export function loadActiveDraft(): AppDraftState {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.items)) {
        return {
          currentTrip: parsed.currentTrip || 'Trip 1',
          currentStaging: parsed.currentStaging || 'SKMJ',
          items: parsed.items,
          lastSavedAt: parsed.lastSavedAt || new Date().toISOString(),
        };
      }
    }
  } catch (err) {
    console.error('Failed to load active draft from storage', err);
  }

  return {
    currentTrip: 'Trip 1',
    currentStaging: 'SKMJ',
    items: [],
    lastSavedAt: new Date().toISOString(),
  };
}

/**
 * Saves the active draft to LocalStorage.
 */
export function saveActiveDraft(draft: AppDraftState): void {
  try {
    const toSave: AppDraftState = {
      ...draft,
      lastSavedAt: new Date().toISOString(),
    };
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(toSave));
  } catch (err) {
    console.error('Failed to save active draft to storage', err);
  }
}

/**
 * Clears the active draft upon user confirmation or successful Google Sheets sync.
 */
export function clearActiveDraft(): void {
  try {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear active draft', err);
  }
}

/**
 * Loads custom stagings from LocalStorage (max 34).
 */
export function loadStagings(): StagingItem[] {
  try {
    const raw = localStorage.getItem(STAGINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.slice(0, 34);
      }
    }
  } catch (err) {
    console.error('Failed to load stagings from storage', err);
  }

  // Save default stagings so user sees them immediately
  saveStagings(DEFAULT_STAGINGS);
  return DEFAULT_STAGINGS;
}

/**
 * Saves custom stagings list to LocalStorage.
 */
export function saveStagings(stagings: StagingItem[]): void {
  try {
    const capped = stagings.slice(0, 34);
    localStorage.setItem(STAGINGS_STORAGE_KEY, JSON.stringify(capped));
  } catch (err) {
    console.error('Failed to save stagings to storage', err);
  }
}
