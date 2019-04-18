import express, {Response, Request} from 'express';
import helmet from 'helmet';
import boom from 'boom';
import cookieSession from 'cookie-session';
import mitt from 'mitt';
import {getOAuthClient, getAuthUrl} from './auth';
import getFusiontables from './fusiontables/get-tables';
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
    return res.redirect(303, '/export');
  }

  const url = getAuthUrl(req);
  res.redirect(303, url);
});

app.get('/auth/callback', (req, res, next) => {
  if (!req.query.code) {
    return next(boom.badRequest());
  }

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
    .catch(error => next(boom.badImplementation(error)));
});

app.get('/export/updates', (req, res, next) => {
  const isSignedIn = Boolean(req.session && req.session.tokens);

  if (!isSignedIn) {
    return next(boom.unauthorized());
  }

  emitter.on('table-finished', tableFinishedHandler);

  function tableFinishedHandler(data: ITableFinishedEmitterData) {
    if (
      req.session &&
      JSON.stringify(data.credentials) === JSON.stringify(req.session.tokens)
    ) {
      res.json({
        error: data.error,
        table: data.table,
        driveFile: data.driveFile
      });

      emitter.off('table-finished', tableFinishedHandler);
    }
  }
});

app.get('/export', (req, res, next) => {
  const tokens = req.session && req.session.tokens;

  if (!tokens) {
    return res.redirect(303, '/');
  }

  const oauth2Client = getOAuthClient(req);
  oauth2Client.setCredentials(tokens);

  getFusiontables(oauth2Client)
    .then(tables => {
      res.render('export-select-tables', {tables, isSignedIn: Boolean(tokens)});
    })
    .catch(error => next(boom.badImplementation(error)));
});

app.post('/export', (req, res, next) => {
  const tokens = req.session && req.session.tokens;

  if (!tokens) {
    return res.redirect(303, '/');
  }

  const tableIds = req.body.tableIds || [];

  const origin = `${req.protocol}://${req.headers.host}`;
  const oauth2Client = getOAuthClient(req);
  oauth2Client.setCredentials(tokens);

  getFusiontables(oauth2Client)
    .then(tables => tables.filter(table => tableIds.includes(table.id)))
    .then(async tables => {
      await doExport(oauth2Client, emitter, tables, origin);
      res.render('export-in-progress', {tables, isSignedIn: Boolean(tokens)});
    })
    .catch(error => next(boom.badImplementation(error)));
});

app.get('/logout', (req, res) => {
  req.session = undefined;
  res.redirect(303, '/');
});

app.use((error: boom, req: Request, res: Response, next: any) => {
  // STACKDRIVER
  return res
    .status(error.output && error.output.statusCode)
    .render('error', {error: error.message});
});

if (module === require.main) {
  const server = app.listen(process.env.PORT || 3000, () => {
    const address = server.address() as string | AddressInfo;
    const port = isString(address) ? address : address.port;
    console.log(`App listening on port ${port}`);
  });
}

module.exports = app;
