import { BagsealItem, StagingSummary, TripHistoryRecord, TripId } from '../types';

/**
 * Formats a Date object to DDMMYYYY string (e.g. 10 November 2026 -> 10112026)
 */
export function formatDateCode(date: Date = new Date()): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear());
  return `${day}${month}${year}`;
}

/**
 * Creates batch title in format "Trip 1-10112026"
 */
export function formatTripBatchTitle(trip: TripId, date: Date = new Date()): string {
  return `${trip}-${formatDateCode(date)}`;
}

/**
 * Groups scanned bagseals by Staging destination code
 * and sums up total bagseals and total qty per staging.
 * (e.g. SKMJ: BAGSEAL 30, QTY 1100)
 */
export function groupItemsByStaging(
  items: BagsealItem[],
  stagingNameMap?: Map<string, string>
): StagingSummary[] {
  if (!Array.isArray(items) || items.length === 0) {
    return [];
  }

  const map = new Map<string, BagsealItem[]>();

  for (const item of items) {
    const code = item.staging || 'UNKNOWN';
    if (!map.has(code)) {
      map.set(code, []);
    }
    map.get(code)!.push(item);
  }

  const summaries: StagingSummary[] = [];

  for (const [stagingCode, stagingItems] of map.entries()) {
    const totalBagseals = stagingItems.length;
    const totalQty = stagingItems.reduce((sum, i) => sum + (Number(i.qty) || 0), 0);

    summaries.push({
      stagingCode,
      stagingName: stagingNameMap?.get(stagingCode),
      totalBagseals,
      totalQty,
      items: stagingItems,
    });
  }

  // Sort by stagingCode alphabetically
  summaries.sort((a, b) => a.stagingCode.localeCompare(b.stagingCode));
  return summaries;
}

/**
 * Finalizes a trip draft into a persistent TripHistoryRecord
 */
export function finalizeTripRecord(
  trip: TripId,
  items: BagsealItem[],
  date: Date = new Date(),
  stagingNameMap?: Map<string, string>
): TripHistoryRecord {
  const batchTitle = formatTripBatchTitle(trip, date);
  const stagings = groupItemsByStaging(items, stagingNameMap);
  const totalBagseals = items.length;
  const totalQty = items.reduce((sum, i) => sum + (Number(i.qty) || 0), 0);

  return {
    id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    batchTitle,
    trip,
    dateCode: formatDateCode(date),
    finalizedAt: date.toISOString(),
    totalBagseals,
    totalQty,
    stagings,
    rawItems: [...items],
    syncedToSheets: false,
  };
}

