import Papa from 'papaparse';

const id = '1nlXO19BelHqPJskSxPO1RO5-eG52cAK3ehybW6XzX_c';
const url = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv`;
const url2 = `https://docs.google.com/spreadsheets/d/${id}/export?format=csv`;

/**
 * Fetch a CSV and return it as JSON
 */
export default async function(): Promise<any> {
  try {
    const response = await fetch(url);
    const csv = await response.text();
    const parsed = Papa.parse(csv);
    return parsed.data;
  } catch (error) {
    console.error(error);
    return null;
  }
}
