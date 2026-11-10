import test from 'node:test';
import assert from 'node:assert/strict';
import {
  determineBarcodeQty,
  calculateTotals,
  calculateCategoryBreakdown,
  validateStagingLimit,
  isValidCategory,
  formatSheetRows,
  MAX_STAGINGS,
} from './bagsealLogic';
import { BagsealItem } from '../types';

test('determineBarcodeQty parses explicit Qty patterns', () => {
  assert.equal(determineBarcodeQty('BS-SKMJ-1024-Q15'), 15);
  assert.equal(determineBarcodeQty('BGS-092-QTY32'), 32);
  assert.equal(determineBarcodeQty('PACKAGE(30)24'), 24);
  assert.equal(determineBarcodeQty('BARCODE/18'), 18);
});

test('determineBarcodeQty returns consistent positive deterministic qty for generic barcodes', () => {
  const qty1 = determineBarcodeQty('SEAL987654321');
  const qty2 = determineBarcodeQty('SEAL987654321');
  assert.equal(qty1, qty2);
  assert.ok(qty1 >= 5 && qty1 <= 30);
});

test('calculateTotals correctly handles empty and populated lists', () => {
  assert.deepEqual(calculateTotals([]), { totalBagseals: 0, totalQty: 0 });

  const mockItems: BagsealItem[] = [
    {
      id: '1',
      barcode: 'BGS-001',
      qty: 12,
      categoryTag: 'Document',
      scannedAt: new Date().toISOString(),
      trip: 'Trip 1',
      staging: 'SKMJ',
    },
    {
      id: '2',
      barcode: 'BGS-002',
      qty: 8,
      categoryTag: 'HV',
      scannedAt: new Date().toISOString(),
      trip: 'Trip 1',
      staging: 'SKMJ',
    },
    {
      id: '3',
      barcode: 'BGS-003',
      qty: 25,
      categoryTag: 'VIP',
      scannedAt: new Date().toISOString(),
      trip: 'Trip 1',
      staging: 'SKMJ',
    },
  ];

  const totals = calculateTotals(mockItems);
  assert.equal(totals.totalBagseals, 3);
  assert.equal(totals.totalQty, 45);
});

test('calculateCategoryBreakdown groups items by tag', () => {
  const mockItems: BagsealItem[] = [
    { id: '1', barcode: 'A', qty: 5, categoryTag: 'Document', scannedAt: '', trip: 'Trip 1', staging: 'SKMJ' },
    { id: '2', barcode: 'B', qty: 5, categoryTag: 'HV', scannedAt: '', trip: 'Trip 1', staging: 'SKMJ' },
    { id: '3', barcode: 'C', qty: 5, categoryTag: 'VIP', scannedAt: '', trip: 'Trip 1', staging: 'SKMJ' },
    { id: '4', barcode: 'D', qty: 5, categoryTag: 'BP', scannedAt: '', trip: 'Trip 1', staging: 'SKMJ' },
    { id: '5', barcode: 'E', qty: 5, categoryTag: undefined, scannedAt: '', trip: 'Trip 1', staging: 'SKMJ' },
  ];

  const breakdown = calculateCategoryBreakdown(mockItems);
  assert.equal(breakdown.Document, 1);
  assert.equal(breakdown.HV, 1);
  assert.equal(breakdown.VIP, 1);
  assert.equal(breakdown.BP, 1);
  assert.equal(breakdown.Unassigned, 1);
});

test('validateStagingLimit enforces 34 staging cap', () => {
  assert.equal(validateStagingLimit(0, MAX_STAGINGS), true);
  assert.equal(validateStagingLimit(33, MAX_STAGINGS), true);
  assert.equal(validateStagingLimit(34, MAX_STAGINGS), false);
  assert.equal(validateStagingLimit(35, MAX_STAGINGS), false);
});

test('isValidCategory recognizes only Document, HV, VIP, BP', () => {
  assert.equal(isValidCategory('Document'), true);
  assert.equal(isValidCategory('HV'), true);
  assert.equal(isValidCategory('VIP'), true);
  assert.equal(isValidCategory('BP'), true);
  assert.equal(isValidCategory('Other'), false);
  assert.equal(isValidCategory(''), false);
});

test('formatSheetRows formats all expected columns for Google Sheets', () => {
  const item: BagsealItem = {
    id: 'test-1',
    barcode: 'BAGSEAL-8899',
    qty: 14,
    categoryTag: 'BP',
    scannedAt: '2026-11-09T18:00:00.000Z',
    trip: 'Trip 2',
    staging: 'SKMJ',
  };

  const rows = formatSheetRows([item], 'Trip 2', 'SKMJ', 'warehouse@logistics.com');
  assert.equal(rows.length, 1);
  assert.equal(rows[0][1], 'Trip 2');
  assert.equal(rows[0][2], 'SKMJ');
  assert.equal(rows[0][3], 'BAGSEAL-8899');
  assert.equal(rows[0][4], '14');
  assert.equal(rows[0][5], 'BP');
  assert.equal(rows[0][6], 'warehouse@logistics.com');
});
