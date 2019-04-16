import {google} from 'googleapis';
import credentials from './credentials.json';
import {OAuth2Client} from 'google-auth-library';
import {Request} from 'express';

const SCOPE = [
  'https://www.googleapis.com/auth/fusiontables.readonly',
  'https://www.googleapis.com/auth/drive'
];

export function getOAuthClient(req: Request): OAuth2Client {
  let redirectUri = credentials.web.redirect_uris[0];

  if (req.headers.host && req.headers.host !== 'localhost:3000') {
    redirectUri = redirectUri.replace(
      'http://localhost:3000',
      `https://${req.headers.host}`
    );
  }

  return new google.auth.OAuth2(
    credentials.web.client_id,
    credentials.web.client_secret,
    redirectUri
  );
}

export function getAuthUrl(req: Request): string {
  const oauth2Client = getOAuthClient(req);
  return oauth2Client.generateAuthUrl({scope: SCOPE});
}
