export const DRIVE_ARCHIVE_FOLDER = 'ft-archive';
export const DRIVE_ARCHIVE_INDEX_SHEET = 'ft-archive-index';

export const getDriveSubfolderName = () => {
  const now = new Date();
  const Y = now.getFullYear();
  const M = String(now.getMonth() + 1).padStart(2, '0');
  const D = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');

  return `export-${Y}${M}${D}-${h}${m}`;
};

export const MIME_TYPES = {
  csv: 'text/csv',
  spreadsheet: 'application/vnd.google-apps.spreadsheet',
  folder: 'application/vnd.google-apps.folder'
};

export const IS_LARGE_TRESHOLD = 50000000; // byte
