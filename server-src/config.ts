export const DRIVE_ARCHIVE_FOLDER = 'ft-archive';

export const getDriveSubfolderName = () => {
  const now = new Date();
  const Y = now.getFullYear();
  const M = String(now.getMonth() + 1).padStart(2, '0');
  const D = String(now.getDay()).padStart(2, '0');
  const h = now.getHours();
  const m = now.getMinutes();

  return `export-${Y}${M}${D}-${h}${m}`;
};
