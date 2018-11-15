const {google} = require('googleapis');
const json2csv = require('json2csv').parse;

const fusiontables = google.fusiontables('v2');

module.exports = class {
  constructor(oauth2Client) {
    this.oauth2Client = oauth2Client;
  }

  getTables() {
    return fusiontables.table
      .list({
        auth: this.oauth2Client,
        maxResults: 1000
      })
      .then(result => result.data.items.map(table => ({
        id: table.tableId,
        name: table.name
      })));
  }

  getCSV(table) {
    return fusiontables.query
      .sqlGet({
        auth: this.oauth2Client,
        sql: `SELECT * FROM ${table.id}`
      })
      .then(result => result.data)
      .then(data => [data.columns].concat(data.rows))
      .then(json => json2csv(json, {header: false}))
      .then(csv => ({
        filename: `${table.name}.csv`,
        data: csv
      }))
  }
}
