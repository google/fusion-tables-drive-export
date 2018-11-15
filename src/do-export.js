const fs = require('fs');
const FusionTables = require('./fusion-tables');
const pLimit = require('p-limit');

module.exports = class {
  constructor(oauth2Client) {
    this.fusionTables = new FusionTables(oauth2Client);
  }

  start() {
    return new Promise((resolve, reject) => {
      const limit = pLimit(1);

      this.fusionTables.getTables()
        .then(tables => Promise.all(
          tables.map(table => limit(() => this.saveTable(table)))
        ))
        .then(resolve)
        .catch(reject);
    });
  }

  saveTable(table) {
    console.log(`Starting to save ${table.name}.`);
    return this.fusionTables.getCSV(table)
      .then(csv => {
        fs.writeFileSync('./export/' + csv.filename, csv.data);
        console.log(`Saved ${csv.filename}.`);
        return csv;
      })
  }
}
