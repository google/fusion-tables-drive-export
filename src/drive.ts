import {Readable} from 'stream';
import {google, drive_v3} from 'googleapis';
import {OAuth2Client} from 'google-auth-library';
import {ICsv} from './interfaces/csv';

const drive = google.drive('v3');

export default class {
  private oauth2Client: OAuth2Client;

  constructor(oauth2Client: OAuth2Client) {
    this.oauth2Client = oauth2Client;
  }

  /**
   * Upload the CSV
   */
  public async upload(csv: ICsv): Promise<drive_v3.Schema$File> {
    if (csv.hasLargeCells) {
      return this.uploadAsCsv(csv);
    }

    try {
      const file = this.uploadAsSheet(csv);
      return file;
    } catch (error) {
      return this.uploadAsCsv(csv);
    }
  }

  /**
   * Upload the file as a CSV
   */
  private async uploadAsCsv(csv: ICsv): Promise<drive_v3.Schema$File> {
    const mimeType = 'text/csv';
    return this.doUpload(csv, mimeType);
  }

  /**
   * Upload the file as a Google Sheet
   */
  private async uploadAsSheet(csv: ICsv): Promise<drive_v3.Schema$File> {
    const mimeType = 'application/vnd.google-apps.spreadsheet';
    return this.doUpload(csv, mimeType);
  }

  /**
   * Upload the CSV
   */
  private async doUpload(
    csv: ICsv,
    mimeType: string
  ): Promise<drive_v3.Schema$File> {
    const stream = new Readable();
    stream._read = () => {
      return;
    };
    stream.push(csv.data);
    stream.push(null);

    const file = await drive.files.create({
      auth: this.oauth2Client,
      requestBody: {
        mimeType,
        name: csv.name
      },
      media: {
        mimeType: 'text/csv',
        body: stream
      }
    } as drive_v3.Params$Resource$Files$Create);
    // Need to set this as somehow the typing from Google expects mediaType
    // but it just works with mimeType (which the examples also use…).
    // Issue opened: https://github.com/googleapis/google-api-nodejs-client/issues/1598

    return file.data;
  }
}
