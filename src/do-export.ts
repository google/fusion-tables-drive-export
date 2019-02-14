import {getOAuthClient} from './auth';
import FusionTables from './fusion-tables';
import Drive from './drive';
import pLimit from 'p-limit';
import {OAuth2Client} from 'google-auth-library';
import {ITable} from './interfaces/table';
import {ICsv} from './interfaces/csv';

export default function(
  oauth2Client: OAuth2Client,
  tables: ITable[]
): Promise<ICsv[]> {
  const fusionTables = new FusionTables(oauth2Client);
  const drive = new Drive(oauth2Client);

  return new Promise((resolve, reject) => {
    const limit = pLimit(1);

    Promise.all(
      tables.map(table => limit(() => saveTable(table, fusionTables, drive)))
    )
      .then(resolve)
      .catch(reject);
  });
}

async function saveTable(
  table: ITable,
  fusionTables: FusionTables,
  drive: Drive
): Promise<ICsv> {
  console.log(`###### Starting to save ${table.name}.`);

  const csv = await fusionTables.getCSV(table);
  const driveFile = await drive.uploadCsv(csv);

  console.log(`###### Drive ID for ${csv.name}: ${driveFile.id}`);
  console.log(`###### Saved ${csv.name}.`);
  return csv;
}
