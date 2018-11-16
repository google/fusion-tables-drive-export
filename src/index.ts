import express from 'express';
import helmet from 'helmet';
import cookieSession from 'cookie-session';
import {google} from 'googleapis';
import credentials from './credentials.json';
import DoExport from './do-export';
import {isString} from 'util';

const app = express();

const oauth2Client = new google.auth.OAuth2(
  credentials.web.client_id,
  credentials.web.client_secret,
  credentials.web.redirect_uris[0]
);

const scope = [
  'https://www.googleapis.com/auth/fusiontables.readonly',
  'https://www.googleapis.com/auth/drive.file'
];

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

  const url = oauth2Client.generateAuthUrl({scope});
  res.redirect(303, url);
});

app.get('/auth/callback', (req, res) => {
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

  oauth2Client.setCredentials(tokens);
  const doExport = new DoExport(oauth2Client);
  doExport
    .start()
    .then(result => console.log('DONE!'))
    .catch(error => console.error(error));

  res.render('export');
});

app.get('/logout', (req, res) => {
  req.session = undefined;
  res.redirect(303, '/');
});

if (module === require.main) {
  const server = app.listen(process.env.PORT || 3000, () => {
    const address = server.address();
    const port = isString(address) ? address : address.port;
    console.log(`App listening on port ${port}`);
  });
}

module.exports = app;
