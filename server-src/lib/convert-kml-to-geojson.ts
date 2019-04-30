import Papa from 'papaparse';
import {DOMParser} from 'xmldom';
import {kml as kml2GeoJson} from '@tmcw/togeojson';
import {ICsv} from '../interfaces/csv';

const DRIVE_CELL_LIMIT = 50000;

/**
 * Convert all Geo things to WKT
 */
export default function convertKmlToGeoJson(csv: ICsv): ICsv {
  const json = Papa.parse(csv.data).data;
  let hasLargeCells = false;

  const jsonWithGeoJson = json
    .filter(row => row)
    .map(row => {
      return row.map((cell: any) => {
        if (cell.length >= DRIVE_CELL_LIMIT) {
          hasLargeCells = true;
        }

        try {
          const geoJson = convertToGeoJson(cell);
          return geoJson || cell;
        } catch (error) {
          return cell;
        }
      });
    });

  return Object.assign({}, csv, {
    data: Papa.unparse(jsonWithGeoJson),
    hasLargeCells
  });
}

/**
 * Convert a value to GeoJSON or return null if not possible
 */
function convertToGeoJson(value: any): string | null {
  if (value.startsWith && !value.startsWith('<')) {
    return null;
  }

  const kmlString = `<?xml version="1.0" encoding="UTF-8"?>
    <kml xmlns="http://www.opengis.net/kml/2.2">
      <Placemark>
        ${value}
      </Placemark>
    </kml>`;

  const kmlDom = new DOMParser().parseFromString(kmlString, 'text/xml');
  const geoJson = kml2GeoJson(kmlDom);

  if (!geoJson.features || geoJson.features.length === 0) {
    return null;
  }

  return JSON.stringify(geoJson.features[0]);
}
