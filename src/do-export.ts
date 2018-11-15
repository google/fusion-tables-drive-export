import fs from 'fs';
import FusionTables from './fusion-tables';
import pLimit from 'p-limit';
import {OAuth2Client} from 'google-auth-library';
import {ITable} from './interfaces/table';
import {ICsv} from './interfaces/csv';

export default class {
  private fusionTables: FusionTables;

  constructor(oauth2Client: OAuth2Client) {
    this.fusionTables = new FusionTables(oauth2Client);
  }

  public start() {
    return new Promise((resolve, reject) => {
      const limit = pLimit(1);

      this.fusionTables
        .getTables()
        .then(tables =>
          Promise.all(tables.map(table => limit(() => this.saveTable(table))))
        )
        .then(resolve)
        .catch(reject);
    });
  }

  private saveTable(table: ITable): Promise<ICsv> {
    console.log(`Starting to save ${table.name}.`);
    return this.fusionTables.getCSV(table).then(csv => {
      fs.writeFileSync('./export/' + csv.filename, csv.data);
      console.log(`Saved ${csv.filename}.`);
      return csv;
    });
  }
}
