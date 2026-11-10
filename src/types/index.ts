export type CategoryTag = 'Document' | 'HV' | 'VIP' | 'BP';

export const CATEGORY_TAGS: CategoryTag[] = ['Document', 'HV', 'VIP', 'BP'];

export interface BagsealItem {
  id: string;
  barcode: string;
  qty: number;
  categoryTag?: CategoryTag;
  scannedAt: string; // ISO string
  trip: string; // e.g. "Trip 1"
  staging: string; // e.g. "SKMJ"
}

export type TripId = 'Trip 1' | 'Trip 2' | 'Trip 3' | 'Trip 4';

export const TRIPS: TripId[] = ['Trip 1', 'Trip 2', 'Trip 3', 'Trip 4'];

export interface StagingItem {
  id: string;
  name: string;
  code: string;
  description?: string;
  createdAt: string;
}

export interface AppDraftState {
  currentTrip: TripId;
  currentStaging: string;
  items: BagsealItem[];
  lastSavedAt: string;
}

export interface StagingSummary {
  stagingCode: string;
  stagingName?: string;
  totalBagseals: number;
  totalQty: number;
  items: BagsealItem[];
}

export interface TripHistoryRecord {
  id: string;
  batchTitle: string; // e.g. "Trip 1-10112026"
  trip: TripId;
  dateCode: string; // "10112026" (DDMMYYYY)
  finalizedAt: string; // ISO string
  totalBagseals: number;
  totalQty: number;
  stagings: StagingSummary[]; // Rekap per staging: SKMJ, BAGSEAL 30, QTY 1100
  rawItems: BagsealItem[];
  syncedToSheets?: boolean;
}

export interface GoogleSheetsSyncResult {
  success: boolean;
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  rowsAdded: number;
  syncedAt: string;
  error?: string;
}
