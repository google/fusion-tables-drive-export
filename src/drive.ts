import {Readable} from 'stream';
import {google} from 'googleapis';
import {OAuth2Client} from 'google-auth-library';
import {ICsv} from './interfaces/csv';

const drive = google.drive('v3');

export default class {
  private oauth2Client: OAuth2Client;

  constructor(oauth2Client: OAuth2Client) {
    this.oauth2Client = oauth2Client;
  }

  /**
   * Get the tables for the authenticated user account
   */
  public uploadCsv(csv: ICsv): Promise<ICsv> {
    const stream = new Readable();
    stream._read = () => {
      return;
    };
    stream.push(csv.data);
    stream.push(null);

    return drive.files
      .create({
        auth: this.oauth2Client,
        requestBody: {
          mimeType: 'application/vnd.google-apps.spreadsheet',
          name: csv.filename
        },
        media: {
          body: stream
        }
      })
      .then(() => csv);
  }
}
