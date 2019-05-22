import {google, drive_v3, sheets_v4} from 'googleapis';
import {OAuth2Client} from 'google-auth-library';
import {ISheet} from '../interfaces/sheet';
import {ITable} from '../interfaces/table';
import {IStyle} from '../interfaces/style';
import {MIME_TYPES} from '../config/config';
import getStyleHash from '../lib/get-style-hash';

const sheets = google.sheets('v4');

/**
 * Log an exported file in the index sheet
 */
interface ILogFileOptions {
  auth: OAuth2Client;
  origin: string;
  sheet: ISheet;
  table: ITable;
  driveFile: drive_v3.Schema$File;
  styles: IStyle[];
  hasGeometryData: boolean;
}
export default async function(options: ILogFileOptions): Promise<void> {
  const {
    auth,
    origin,
    sheet,
    table,
    driveFile,
    styles,
    hasGeometryData
  } = options;
  const {spreadsheetId, sheetId} = sheet;
  const tableLink = `https://fusiontables.google.com/DataSource?docid=${
    table.id
  }`;
  const fileLink = `https://drive.google.com/open?id=${driveFile.id}`;
  const fileType =
    driveFile.mimeType === MIME_TYPES.csv ? 'CSV' : 'Spreadsheet';
  const visualizerBaseLink = `${origin}/visualizer/#file=${driveFile.id}`;
  const exportDate = new Date().toISOString();
  let rows = [];

  const createRow = (visualizerLink?: string, index?: number) => {
    const isFirstRow = index === 0 || index === undefined;
    const VisualizationId = index !== undefined ? index + 1 : '';
    const visualizationValue = visualizerLink
      ? {
          formulaValue:
            `=HYPERLINK("${visualizerLink}",` +
            ` "Visualization ${VisualizationId}")`
        }
      : {
          stringValue: 'Cannot visualize — no geometry found.'
        };

    return {
      values: [
        {userEnteredValue: {stringValue: driveFile.name}},
        {userEnteredValue: {stringValue: isFirstRow ? tableLink : ''}},
        {userEnteredValue: {stringValue: isFirstRow ? fileLink : ''}},
        {userEnteredValue: {stringValue: isFirstRow ? fileType : ''}},
        {userEnteredValue: visualizationValue},
        {userEnteredValue: {stringValue: exportDate}}
      ]
    };
  };

  if (!hasGeometryData) {
    rows = [createRow()];
  } else if (styles && styles.length > 0) {
    rows = styles.map((style, index) => {
      const visualizerLink =
        visualizerBaseLink + `&style=${getStyleHash(style)}`;

      return createRow(visualizerLink, styles.length > 1 ? index : undefined);
    });
  } else {
    rows = [createRow(visualizerBaseLink)];
  }

  try {
    const response = await sheets.spreadsheets.batchUpdate({
      auth,
      spreadsheetId,
      requestBody: {
        requests: [
          {
            appendCells: {
              sheetId,
              rows,
              fields: 'userEnteredValue'
            }
          }
        ]
      }
    } as sheets_v4.Params$Resource$Spreadsheets$Batchupdate);

    if (response.statusText !== 'OK') {
      throw new Error(`Cannot log file export: ${response.statusText}`);
    }
  } catch (error) {
    throw error;
  }

  return;
}
