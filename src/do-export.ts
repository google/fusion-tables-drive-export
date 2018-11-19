import {getOAuthClient} from './auth';
import FusionTables from './fusion-tables';
import Drive from './drive';
import pLimit from 'p-limit';
import {OAuth2Client} from 'google-auth-library';
import {ITable} from './interfaces/table';
import {ICsv} from './interfaces/csv';

export default function(oauth2Client: OAuth2Client): Promise<ICsv[]> {
  const fusionTables = new FusionTables(oauth2Client);
  const drive = new Drive(oauth2Client);

  return new Promise((resolve, reject) => {
    const limit = pLimit(1);

    fusionTables
      .getTables()
      .then(tables =>
        Promise.all(
          tables.map(table =>
            limit(() => saveTable(table, fusionTables, drive))
          )
        )
      )
      .then(resolve)
      .catch(reject);
  });
}

function saveTable(
  table: ITable,
  fusionTables: FusionTables,
  drive: Drive
): Promise<ICsv> {
  console.log(`###### Starting to save ${table.name}.`);

  return fusionTables
    .getCSV(table)
    .then(csv => drive.uploadCsv(csv))
    .then(csv => {
      console.log(`###### Saved ${csv.name}.`);
      return csv;
    });
}
