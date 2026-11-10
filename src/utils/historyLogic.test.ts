import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatDateCode,
  formatTripBatchTitle,
  groupItemsByStaging,
  finalizeTripRecord,
} from './historyLogic';
import { BagsealItem } from '../types';

test('formatDateCode formats date to DDMMYYYY string', () => {
  const d = new Date(2026, 10, 10); // Note: month 10 is November (0-indexed)
  assert.equal(formatDateCode(d), '10112026');

  const d2 = new Date(2026, 0, 5); // 5 Jan 2026
  assert.equal(formatDateCode(d2), '05012026');
});

test('formatTripBatchTitle outputs exact requested format: Trip 1-10112026', () => {
  const d = new Date(2026, 10, 10);
  assert.equal(formatTripBatchTitle('Trip 1', d), 'Trip 1-10112026');
  assert.equal(formatTripBatchTitle('Trip 3', d), 'Trip 3-10112026');
});

test('groupItemsByStaging aggregates bagseals and total qty per staging accurately', () => {
  const mockItems: BagsealItem[] = [
    { id: '1', barcode: 'SKMJ-01', qty: 20, scannedAt: '', trip: 'Trip 1', staging: 'SKMJ' },
    { id: '2', barcode: 'SKMJ-02', qty: 10, scannedAt: '', trip: 'Trip 1', staging: 'SKMJ' },
    { id: '3', barcode: 'CGK-01', qty: 50, scannedAt: '', trip: 'Trip 1', staging: 'CGK01' },
  ];

  const grouped = groupItemsByStaging(mockItems);
  assert.equal(grouped.length, 2);

  const cgk = grouped.find((g) => g.stagingCode === 'CGK01');
  assert.ok(cgk);
  assert.equal(cgk.totalBagseals, 1);
  assert.equal(cgk.totalQty, 50);

  const skmj = grouped.find((g) => g.stagingCode === 'SKMJ');
  assert.ok(skmj);
  assert.equal(skmj.totalBagseals, 2);
  assert.equal(skmj.totalQty, 30);
});

test('finalizeTripRecord creates complete finalized record with batchTitle', () => {
  const d = new Date(2026, 10, 10);
  const items: BagsealItem[] = [
    { id: '1', barcode: 'SKMJ-01', qty: 30, scannedAt: '', trip: 'Trip 2', staging: 'SKMJ' },
    { id: '2', barcode: 'SKMJ-02', qty: 70, scannedAt: '', trip: 'Trip 2', staging: 'SKMJ' },
  ];

  const record = finalizeTripRecord('Trip 2', items, d);
  assert.equal(record.batchTitle, 'Trip 2-10112026');
  assert.equal(record.totalBagseals, 2);
  assert.equal(record.totalQty, 100);
  assert.equal(record.stagings[0].stagingCode, 'SKMJ');
  assert.equal(record.stagings[0].totalBagseals, 2);
  assert.equal(record.stagings[0].totalQty, 100);
});
