# Fusion Tables Drive Export

## Description

Export Google Fusion Tables to Google Drive.

### Links

* Live: https://earth-voyager.appspot.com/

### Team

* PM Ubilabs: Patrick Mast <mast@ubilabs.net>
* DEV Ubilabs: Robert Katzki <katzki@ubilabs.net>

## Development

### Prerequisites
Make sure you have the following tools installed:

* git
* yarn

### Installation

After cloning the repository, install all dependencies:

```sh
yarn # install dependencies
```

### APIs

Enable the [Fusion Tables API](https://console.cloud.google.com/apis/library/fusiontables.googleapis.com), the [Drive API](https://console.cloud.google.com/apis/library/drive.googleapis.com) and the [Sheets API](https://console.cloud.google.com/apis/library/sheets.googleapis.com) in your [Google Cloud Console](https://console.cloud.google.com/). [StackDriver](https://console.cloud.google.com/apis/library/clouderrorreporting.googleapis.com) needs to be activated for Error Reporting in the same Google Cloud Project.

### Server credentials

You’ll need some credentials for OAuth2. Go to the [Credentials page](https://console.cloud.google.com/apis/credentials) in your Google Cloud Project in the Google Cloud Console. Create some server side credentials with `http://localhost:3000/auth/callback` and `https://YOUR_DOMAIN/auth/callback` as the authorized redirect URIs. Download the credentials as a JSON file and save it as `./server-src/config/credentials.json`.

### Develop

Run the following command to start the server on localhost:

```sh
yarn run start:dev # start the server
```

### Deploy

Install the [Google Cloud SDK](https://cloud.google.com/sdk/) and initialize it by running:

```sh
gcloud init
```

Then run the following command to deploy the application:

```sh
yarn run deploy
```

## Hosting

The project is hosted at [AppEngine](https://console.cloud.google.com/appengine/start?project=forward-ellipse-230710&serviceId=default)
