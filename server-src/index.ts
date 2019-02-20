import express from 'express';
import helmet from 'helmet';
import cookieSession from 'cookie-session';
import mitt from 'mitt';
import {getOAuthClient, getAuthUrl} from './auth';
import FusionTables from './fusion-tables';
import doExport from './do-export';
import {isString} from 'util';
import {AddressInfo} from 'net';
import {ITableFinishedEmitterData} from './interfaces/table-finished-emitter-data';

const app = express();
const emitter = new mitt();

app.set('view engine', 'pug');
app.set('views', './server-views');
app.use(express.urlencoded({extended: true}));
app.use(helmet());
app.use(express.static('server-assets'));
app.use(
  cookieSession({
    name: 'fusiontables',
    keys: [
      'WLTiBCAZtthrUGMUK4Yjx(TBNvisYkHLeT)XGaEU',
      'hzACNQ^TykcjCGBgcPR(UCTtv9pvaogGqJtHFQND'
    ],
    maxAge: 24 * 60 * 60 * 1000
  })
);

app.get('/', (req, res) => {
  const isSignedIn = Boolean(req.session && req.session.tokens);
  res.render('index', {isSignedIn});
});

app.get('/auth', (req, res) => {
  const isSignedIn = Boolean(req.session && req.session.tokens);
  if (isSignedIn) {
    res.redirect(303, '/export');
    return;
  }

  const url = getAuthUrl(req);
  res.redirect(303, url);
});

app.get('/auth/callback', (req, res) => {
  const oauth2Client = getOAuthClient(req);
  oauth2Client
    .getToken(req.query.code)
    .then(({tokens}) => {
      if (!req.session) {
        req.session = {};
      }

      req.session.tokens = tokens;
      res.redirect(303, '/export');
    })
    .catch(error => res.status(500).send(error));
});

app.get('/export/updates', (req, res) => {
  const isSignedIn = Boolean(req.session && req.session.tokens);

  if (!isSignedIn) {
    res.status(401);
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  res.write('data: ' + null + '\n\n');

  emitter.on('table-finished', (data: ITableFinishedEmitterData) => {
    if (
      req.session &&
      JSON.stringify(data.credentials) === JSON.stringify(req.session.tokens)
    ) {
      const dataToWrite = {
        table: data.table,
        driveFile: data.driveFile
      };
      res.write('data: ' + JSON.stringify(dataToWrite) + '\n\n');
    }
  });
});

app.get('/export', (req, res) => {
  const tokens = req.session && req.session.tokens;

  if (!tokens) {
    res.redirect(303, '/');
    return;
  }

  const oauth2Client = getOAuthClient(req);
  oauth2Client.setCredentials(tokens);
  const fusionTables = new FusionTables(oauth2Client);

  fusionTables
    .getTables()
    .then(tables => {
      res.render('export-select-tables', {tables, isSignedIn: Boolean(tokens)});
    })
    .catch(error => res.render('error', {error}));
});

app.post('/export', (req, res) => {
  const tokens = req.session && req.session.tokens;

  if (!tokens) {
    res.redirect(303, '/');
    return;
  }

  const tableIds = req.body.tableIds || [];

  const oauth2Client = getOAuthClient(req);
  oauth2Client.setCredentials(tokens);
  const fusionTables = new FusionTables(oauth2Client);

  fusionTables
    .getTables()
    .then(tables => tables.filter(table => tableIds.includes(table.id)))
    .then(tables => {
      res.render('export-in-progress', {tables, isSignedIn: Boolean(tokens)});
      doExport(oauth2Client, emitter, tables)
        .then(() => console.log('DONE!'))
        .catch(error => console.error(error));
    })
    .catch(error => res.render('error', {error}));
});

app.get('/logout', (req, res) => {
  req.session = undefined;
  res.redirect(303, '/');
});

if (module === require.main) {
  const server = app.listen(process.env.PORT || 3000, () => {
    const address = server.address() as string | AddressInfo;
    const port = isString(address) ? address : address.port;
    console.log(`App listening on port ${port}`);
  });
}

module.exports = app;
