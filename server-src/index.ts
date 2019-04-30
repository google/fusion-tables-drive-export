import express, {Response, Request} from 'express';
import helmet from 'helmet';
import boom from 'boom';
import cookieSession from 'cookie-session';
import {ErrorReporting} from '@google-cloud/error-reporting';
import {getOAuthClient, getAuthUrl} from './lib/auth';
import findFusiontables from './drive/find-fusiontables';
import ExportLog from './lib/export-log';
import doExport from './lib/do-export';
import {isString} from 'util';
import {AddressInfo} from 'net';
import {web as serverCredentials} from './config/credentials.json';
import credentials from './config/credentials-error-reporting.json';

const app = express();
const exportLog = new ExportLog();
const errors = new ErrorReporting({
  reportUnhandledRejections: true,
  projectId: serverCredentials.project_id,
  credentials
});

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

  if (isSignedIn) {
    return res.redirect(303, '/export');
  }

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

  const auth = getOAuthClient(req);
  auth
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

app.get('/export/updates/:exportId', (req, res, next) => {
  const tokens = req.session && req.session.tokens;
  const isSignedIn = Boolean(tokens);
  const exportId = req.params.exportId;

  if (!isSignedIn || !exportLog.isAuthorized(exportId, tokens)) {
    return next(boom.unauthorized());
  }

  res.json(exportLog.getExport(exportId));
});

app.get('/export', (req, res, next) => {
  const tokens = req.session && req.session.tokens;

  if (!tokens) {
    return res.redirect(303, '/');
  }

  const auth = getOAuthClient(req);
  auth.setCredentials(tokens);

  findFusiontables(auth)
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

  const auth = getOAuthClient(req);
  auth.setCredentials(tokens);

  findFusiontables(auth, tableIds)
    .then(async tables => {
      const exportId = exportLog.startExport(tokens, tables);
      const exportFolderId = await doExport({
        auth,
        tables,
        origin,
        exportLog,
        exportId
      });
      res.render('export-in-progress', {
        tables,
        isSignedIn: Boolean(tokens),
        exportFolderId,
        exportId
      });
    })
    .catch(error => next(boom.badImplementation(error)));
});

app.get('/logout', (req, res) => {
  req.session = undefined;
  res.redirect(303, '/');
});

app.use((error: boom, req: Request, res: Response, next: any) => {
  errors.report(error, req);

  if (error && error.message === 'invalid_request') {
    return res.redirect(303, '/logout');
  }

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
