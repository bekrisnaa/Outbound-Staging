import { BagsealItem, GoogleSheetsSyncResult } from '../types';
import { formatSheetRows } from '../utils/bagsealLogic';
import { getAccessToken } from './auth';

const SPREADSHEET_ID_STORAGE_KEY = 'logiscan_google_sheet_id';

export function getSavedSpreadsheetId(): string | null {
  try {
    return localStorage.getItem(SPREADSHEET_ID_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function saveSpreadsheetId(id: string) {
  try {
    if (id) {
      localStorage.setItem(SPREADSHEET_ID_STORAGE_KEY, id.trim());
    } else {
      localStorage.removeItem(SPREADSHEET_ID_STORAGE_KEY);
    }
  } catch (e) {
    console.error('Failed to save spreadsheet ID', e);
  }
}

/**
 * Creates a new Google Spreadsheet specifically configured for logistics bagseal scanning.
 */
async function createNewLogisticsSpreadsheet(
  token: string,
  title = `Logistics Outbound Staging - ${new Date().toISOString().slice(0, 10)}`
): Promise<{ id: string; url: string }> {
  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title,
      },
      sheets: [
        {
          properties: {
            title: 'Bagseal Logs',
            gridProperties: {
              frozenRowCount: 1,
            },
          },
          data: [
            {
              startRow: 0,
              startColumn: 0,
              rowData: [
                {
                  values: [
                    { userEnteredValue: { stringValue: 'Scanned Timestamp' } },
                    { userEnteredValue: { stringValue: 'Trip' } },
                    { userEnteredValue: { stringValue: 'Staging' } },
                    { userEnteredValue: { stringValue: 'Bagseal Barcode' } },
                    { userEnteredValue: { stringValue: 'Quantity (Qty)' } },
                    { userEnteredValue: { stringValue: 'Category Tag' } },
                    { userEnteredValue: { stringValue: 'Operator' } },
                  ],
                },
              ],
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to create Google Sheet: ${response.status} ${errText}`);
  }

  const data = await response.json();
  const id = data.spreadsheetId;
  const url = `https://docs.google.com/spreadsheets/d/${id}/edit`;
  saveSpreadsheetId(id);
  return { id, url };
}

/**
 * Appends rows to the Google Spreadsheet.
 */
export async function syncDraftToGoogleSheets(
  items: BagsealItem[],
  trip: string,
  staging: string,
  userEmail: string,
  customSheetId?: string
): Promise<GoogleSheetsSyncResult> {
  if (items.length === 0) {
    throw new Error('No scanned bagseals to sync. Please scan items first.');
  }

  const token = await getAccessToken();
  if (!token) {
    throw new Error('You must sign in with Google to sync to Google Sheets.');
  }

  let spreadsheetId = customSheetId || getSavedSpreadsheetId();
  let spreadsheetUrl = spreadsheetId ? `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit` : '';

  // If no spreadsheet ID exists, create one with headers
  if (!spreadsheetId) {
    const newSheet = await createNewLogisticsSpreadsheet(
      token,
      `Outbound Staging Logs (${trip} - ${staging})`
    );
    spreadsheetId = newSheet.id;
    spreadsheetUrl = newSheet.url;
  }

  // Format rows: [Timestamp, Trip, Staging, Barcode, Qty, Category, Operator]
  const rows = formatSheetRows(items, trip, staging, userEmail);

  // Append values
  const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
  const appendResponse = await fetch(appendUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: rows,
    }),
  });

  if (!appendResponse.ok) {
    const errorBody = await appendResponse.text();
    // If the spreadsheet wasn't found or access was forbidden, try creating a fresh one
    if (appendResponse.status === 404 || appendResponse.status === 403) {
      const fallbackSheet = await createNewLogisticsSpreadsheet(
        token,
        `Outbound Staging Logs (${trip} - ${staging}) [New]`
      );
      spreadsheetId = fallbackSheet.id;
      spreadsheetUrl = fallbackSheet.url;

      const retryResponse = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ values: rows }),
        }
      );

      if (!retryResponse.ok) {
        throw new Error(`Failed to append to new Google Sheet: ${await retryResponse.text()}`);
      }
    } else {
      throw new Error(`Google Sheets API Error (${appendResponse.status}): ${errorBody}`);
    }
  }

  return {
    success: true,
    spreadsheetId,
    spreadsheetUrl,
    rowsAdded: items.length,
    syncedAt: new Date().toISOString(),
  };
}

/**
 * Client-side CSV exporter as a reliable fallback or export feature.
 */
export function exportDraftToCSV(items: BagsealItem[], trip: string, staging: string) {
  const headers = ['Timestamp', 'Trip', 'Staging', 'Bagseal Barcode', 'Qty', 'Category Tag'];
  const rows = items.map((item) => [
    `"${item.scannedAt}"`,
    `"${item.trip || trip}"`,
    `"${item.staging || staging}"`,
    `"${item.barcode}"`,
    item.qty,
    `"${item.categoryTag || 'Unassigned'}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Bagseal_Draft_${trip}_${staging}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
