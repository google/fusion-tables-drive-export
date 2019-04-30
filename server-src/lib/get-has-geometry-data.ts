const latLngPairs: Array<[string, string]> = [
  ['Latitude', 'Longitude'],
  ['latitude', 'longitude'],
  ['Lat', 'Lng'],
  ['Lat', 'Lon'],
  ['Lat', 'Long'],
  ['lat', 'lng'],
  ['lat', 'lon'],
  ['lat', 'long']
];

/**
 * Parse the data for geometries or point data
 */
export default function(data: string[][]): boolean {
  const columnNames = data[0];

  if (columnNames.includes('geometry')) {
    return true;
  }

  const latLngPair = latLngPairs.find(
    pair => columnNames.includes(pair[0]) && columnNames.includes(pair[1])
  );

  if (latLngPair) {
    return true;
  }

  return false;
}
