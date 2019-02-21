import Papa from 'papaparse';

/**
 * Fetch a CSV and return it as JSON
 */
export default async function(): Promise<any> {
  const {hash} = document.location;

  if (!hash || !hash.startsWith('#file=')) {
    return null;
  }

  const id = hash.replace('#file=', '');
  const url = `https://docs.google.com/spreadsheets/d/${id}/export?format=csv`;

  try {

    const response = await fetch(url);
    const csv = await response.text();

    if (csv.startsWith('<!DOCTYPE html>')) {
      return null;
    }

    const parsed = Papa.parse(csv);
    return parsed.data;
  } catch (error) {
    console.error(error);
    return null;
  }
}
