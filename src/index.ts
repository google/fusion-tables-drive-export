import express from 'express';
import helmet from 'helmet';
import cookieSession from 'cookie-session';
import {getOAuthClient, getAuthUrl} from './auth';
import FusionTables from './fusion-tables';
import doExport from './do-export';
import {isString} from 'util';
import { AddressInfo } from 'net';

const app = express();

app.set('view engine', 'pug');
app.use(helmet());
app.use(express.static('assets'));
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
  res.render('index');
});

app.get('/auth', (req, res) => {
  if (req.session && req.session.tokens) {
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
      res.render('export', {tables});
      doExport(oauth2Client, tables)
        .then(result => console.log('DONE!'))
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
