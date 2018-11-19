import {google} from 'googleapis';
import credentials from './credentials.json';
import { OAuth2Client } from 'google-auth-library';

const SCOPE = [
  'https://www.googleapis.com/auth/fusiontables.readonly',
  'https://www.googleapis.com/auth/drive.file'
];

export function getOAuthClient(): OAuth2Client {
  return new google.auth.OAuth2(
    credentials.web.client_id,
    credentials.web.client_secret,
    credentials.web.redirect_uris[0]
  );
}

export function getAuthUrl(): string {
  const oauth2Client = getOAuthClient();
  return oauth2Client.generateAuthUrl({scope: SCOPE});
}
