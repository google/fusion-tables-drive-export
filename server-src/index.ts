import express from 'express';
import helmet from 'helmet';
import cookieSession from 'cookie-session';
import mitt from 'mitt';
import {getOAuthClient, getAuthUrl} from './auth';
import getFusiontables from './fusiontables/get-tables';
import doExport from './do-export';
import {isString} from 'util';
import {AddressInfo} from 'net';
import {ITableFinishedEmitterData} from './interfaces/table-finished-emitter-data';
import handleError from './handle-error';

const app = express();
const emitter = new mitt();

app.set('view engine', 'pug');
app.set('views', './server-views');
app.use(express.urlencoded({extended: true}));
app.use(helmet());
app.use(express.static('server-static'));
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

  emitter.on('table-finished', tableFinishedHandler);

  function tableFinishedHandler(data: ITableFinishedEmitterData) {
    if (
      req.session &&
      JSON.stringify(data.credentials) === JSON.stringify(req.session.tokens)
    ) {
      res.json({
        table: data.table,
        driveFile: data.driveFile
      });

      emitter.off('table-finished', tableFinishedHandler);
    }
  }
});

app.get('/export', (req, res) => {
  const tokens = req.session && req.session.tokens;

  if (!tokens) {
    res.redirect(303, '/');
    return;
  }

  const oauth2Client = getOAuthClient(req);
  oauth2Client.setCredentials(tokens);

  getFusiontables(oauth2Client)
    .then(tables => {
      res.render('export-select-tables', {tables, isSignedIn: Boolean(tokens)});
    })
    .catch(error => handleError(error, req, res));
});

app.post('/export', (req, res) => {
  const tokens = req.session && req.session.tokens;

  if (!tokens) {
    res.redirect(303, '/');
    return;
  }

  const tableIds = req.body.tableIds || [];

  const origin = `${req.protocol}://${req.headers.host}`;
  const oauth2Client = getOAuthClient(req);
  oauth2Client.setCredentials(tokens);

  getFusiontables(oauth2Client)
    .then(tables => tables.filter(table => tableIds.includes(table.id)))
    .then(tables => {
      res.render('export-in-progress', {tables, isSignedIn: Boolean(tokens)});
      doExport(oauth2Client, emitter, tables, origin)
        .then(() => console.log('DONE!'))
        .catch(error => console.error(error));
    })
    .catch(error => handleError(error, req, res));
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
