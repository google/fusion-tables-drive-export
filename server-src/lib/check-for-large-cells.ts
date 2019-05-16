const DRIVE_CELL_LIMIT = 50000;

/**
 * Check whether the data has large cells
 */
export default function checkForLargeCells(json: any[]): boolean {
  let hasLargeCells = false;

  json.forEach(row => {
    row.forEach((cell: any) => {
      if (cell.length >= DRIVE_CELL_LIMIT) {
        hasLargeCells = true;
      }
    });
  });

  return hasLargeCells;
}
