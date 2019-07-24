/*!
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import os from 'os';
import express, {Response, Request} from 'express';
import helmet from 'helmet';
import boom from 'boom';
import cookieSession from 'cookie-session';
import {ErrorReporting} from '@google-cloud/error-reporting';
import {getOAuthClient, getAuthUrl} from './lib/auth';
import isTokenValid from './lib/is-token-valid';
import findFusiontables from './drive/find-fusiontables';
import getFusiontablesByIds from './drive/get-fusiontables-by-ids';
import initExportProgress from './export-progress/init';
import isAuthorized from './export-progress/is-authorized';
import logExportFolder from './export-progress/log-export-folder';
import getExportFolderId from './export-progress/get-export-folder-id';
import getExportTables from './export-progress/get-export-tables';
import deleteExportProgress from './export-progress/delete-export';
import clearExportProgress from './export-progress/clear';
import hasOtherExportsForSession from './export-progress/has-other-exports-for-session';
import doExport from './lib/do-export';
import getHash from './lib/get-hash';
import {isString} from 'util';
import {AddressInfo} from 'net';
import {web as serverCredentials} from './config/credentials.json';

const app = express();
const errors = new ErrorReporting({
  reportUnhandledRejections: true,
  projectId: serverCredentials.project_id
});

app.set('view engine', 'pug');
app.set('views', './server-views');
app.use(express.urlencoded({extended: true}));
app.use(helmet());
app.use(helmet.referrerPolicy({policy: 'same-origin'}));
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      // tslint:disable quotemark
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        'www.googletagmanager.com',
        'www.google-analytics.com'
      ],
      imgSrc: ["'self'", 'www.google-analytics.com'],
      styleSrc: ["'self'", 'fonts.googleapis.com'],
      fontSrc: ["'self'", 'fonts.gstatic.com']
      // tslint:enable quotemark
    }
  })
);
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
  const tokens = req.session && req.session.tokens;
  const isSignedIn = isTokenValid(tokens);

  if (isSignedIn) {
    return res.redirect(303, '/export');
  }

  res.render('index', {isSignedIn});
});

app.get('/auth', (req, res) => {
  const tokens = req.session && req.session.tokens;
  const isSignedIn = isTokenValid(tokens);

  if (isSignedIn) {
    return res.redirect(303, '/export');
  }

  const url = getAuthUrl(req);
  res.redirect(303, url);
});

app.get('/auth/callback', async (req, res, next) => {
  if (!req.query.code) {
    return next(boom.badRequest());
  }

  try {
    const auth = getOAuthClient(req);
    const {tokens} = await auth.getToken(req.query.code);

    if (!req.session) {
      req.session = {};
    }

    req.session.tokens = tokens;
    res.redirect(303, '/export');
  } catch (error) {
    next(boom.badImplementation(error));
  }
});

app.get('/export/:exportId/updates', async (req, res, next) => {
  const tokens = req.session && req.session.tokens;
  const isSignedIn = isTokenValid(tokens);
  const exportId = req.params.exportId;

  if (!isSignedIn || !(await isAuthorized(exportId, tokens))) {
    return next(boom.unauthorized());
  }

  try {
    const tables = await getExportTables(exportId);
    const allFinished = tables.every(table => table.status !== 'loading');

    if (allFinished) {
      deleteExportProgress(exportId);
      const hasOtherExports = await hasOtherExportsForSession(exportId, tokens);

      if (!hasOtherExports) {
        req.session = undefined;
      }
    }

    res.set('Cache-Control', 'no-store');
    res.json(tables);
  } catch (error) {
    next(boom.badImplementation(error));
  }
});

app.get('/export/:exportId', async (req, res, next) => {
  const tokens = req.session && req.session.tokens;
  const isSignedIn = isTokenValid(tokens);
  const exportId = req.params.exportId;

  if (!isSignedIn || !(await isAuthorized(exportId, tokens))) {
    return res.redirect(303, '/');
  }

  try {
    const [tables, exportFolderId] = await Promise.all([
      getExportTables(exportId),
      getExportFolderId(exportId)
    ]);

    res.set('Cache-Control', 'no-store');
    res.render('export-in-progress', {
      tables,
      isSignedIn,
      exportFolderId,
      exportId
    });
  } catch (error) {
    next(boom.badImplementation(error));
  }
});

app.get('/export', async (req, res, next) => {
  const tokens = req.session && req.session.tokens;
  const isSignedIn = isTokenValid(tokens);

  if (!isSignedIn) {
    return res.redirect(303, '/');
  }

  const auth = getOAuthClient(req);
  auth.setCredentials(tokens);
  const {filterByName, pageToken} = req.query;

  try {
    const {tables, nextPageToken} = await findFusiontables(
      auth,
      filterByName,
      pageToken
    );

    res.set('Cache-Control', 'no-store');
    res.render('export-select-tables', {
      tables,
      isSignedIn,
      filterByName,
      nextPageToken
    });
  } catch (error) {
    next(boom.badImplementation(error));
  }
});

app.post('/export', async (req, res, next) => {
  const tokens = req.session && req.session.tokens;
  const isSignedIn = isTokenValid(tokens);

  if (!isSignedIn) {
    return res.redirect(303, '/');
  }

  const ip = getHash(req.ip).substr(0, 16);
  const tableIds = req.body.tableIds || [];
  const auth = getOAuthClient(req);
  auth.setCredentials(tokens);

  try {
    const tables = await getFusiontablesByIds(auth, tableIds);
    const exportId = await initExportProgress(tokens, tables);
    const exportFolderId = await doExport({ipHash: ip, auth, tables, exportId});

    await logExportFolder(exportId, exportFolderId);
    return res.redirect(302, `/export/${exportId}`);
  } catch (error) {
    next(boom.badImplementation(error));
  }
});

app.get('/clear-exports', (req, res) => {
  if (req.get('X-Appengine-Cron') !== 'true') {
    res.sendStatus(401);
    return;
  }

  clearExportProgress();
  res.sendStatus(200);
});

const TWO_POINT_FIVE_MB = 2.5 * 1024 * 1024 * 1024;
app.get('/is-instance-ready', (req, res) => {
  const freeMemory = os.freemem();
  const freeMemoryPercentage = freeMemory / os.totalmem();

  if (freeMemoryPercentage < 0.2 || freeMemory < TWO_POINT_FIVE_MB) {
    res.sendStatus(507);
    return;
  }

  res.sendStatus(200);
});

app.get('/privacy', (req, res) => {
  const tokens = req.session && req.session.tokens;
  const isSignedIn = isTokenValid(tokens);

  res.render('privacy', {isSignedIn});
});

app.get('/terms', (req, res) => {
  const tokens = req.session && req.session.tokens;
  const isSignedIn = isTokenValid(tokens);

  res.render('terms', {isSignedIn});
});

app.get('/logout', (req, res) => {
  req.session = undefined;
  res.redirect(303, '/');
});

app.use((error: boom, req: Request, res: Response, next: any) => {
  console.error(error.message, error.name);

  errors.report(error);

  if (
    error &&
    (error.message === 'invalid_request' ||
      error.message === 'No refresh token is set.')
  ) {
    return res.redirect(303, '/logout');
  }

  return res
    .status((error.output && error.output.statusCode) || 500)
    .render('error', {error: error.message});
});

app.use((req: Request, res: Response, next: any) => {
  const tokens = req.session && req.session.tokens;
  const isSignedIn = isTokenValid(tokens);
  res.status(404).render('404', {isSignedIn});
});

if (module === require.main) {
  const server = app.listen(process.env.PORT || 3000, () => {
    const address = server.address() as string | AddressInfo;
    const port = isString(address) ? address : address.port;
    console.log(`App listening on port ${port}`);
  });
}

module.exports = app;
