import Papa from 'papaparse';
import parseGeoPoints from './parse-geo-points';

/**
 * Fetch a CSV and return it as JSON
 */
export default async function(): Promise<any> {
  const {hash} = document.location;

  if (!hash || !hash.startsWith('#file=')) {
    return null;
  }

  const fileId = hash.replace('#file=', '');

  try {
    const response = await gapi.client.drive.files.export({
      fileId,
      alt: 'media',
      mimeType: 'text/csv'
    });

    if (response.statusText !== 'OK') {
      return null;
    }

    const parsed = Papa.parse(response.body);
    const analyzedData = parseGeoPoints(parsed.data);
    return analyzedData;
  } catch (error) {
    console.error(error);
    return null;
  }
}
