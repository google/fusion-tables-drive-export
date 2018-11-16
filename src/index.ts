import express from 'express';
import helmet from 'helmet';
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

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/auth', (req, res) => {
  const url = oauth2Client.generateAuthUrl({scope});
  res.redirect(303, url);
});

app.get('/auth/callback', (req, res) => {
  oauth2Client
    .getToken(req.query.code)
    .then(({tokens}) => {
      oauth2Client.setCredentials(tokens);
      const doExport = new DoExport(oauth2Client);
      doExport
        .start()
        .then(result => console.log('DONE!'))
        .catch(error => console.error(error));

      res.render('export');
    })
    .catch(error => res.status(500).send(error));
});

if (module === require.main) {
  const server = app.listen(process.env.PORT || 3000, () => {
    const address = server.address();
    const port = isString(address) ? address : address.port;
    console.log(`App listening on port ${port}`);
  });
}

module.exports = app;
