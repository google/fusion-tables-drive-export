import Papa from 'papaparse';

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
    return parsed.data;
  } catch (error) {
    console.error(error);
    return null;
  }
}
