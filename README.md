# Fusion Tables Drive Export

## Description

Export Google Fusion Tables to Google Drive.

### Links

* Live: https://fusion-tables-export.appspot.com/

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

Install the [Google Cloud SDK](https://cloud.google.com/sdk/) and initialize it by running:

```sh
gcloud init
```

### Configuration

Setup the gcloud to your project ID like this:

```sh
gcloud config set project my-project-id
```

Define the visualizer url in an environment variable called `VISUALIZER_BASE_URI` like this:

```sh
export VISUALIZER_BASE_URI="https://visualizer.my-domain.com"
```

Setup [Google Analytics](https://analytics.google.com/) and store your key in an environment variable called `GOOGLE_ANALYTICS_KEY`:

```sh
export GOOGLE_ANALYTICS_KEY="UA-XXXXXXXXX-X"
```

Define a secret key `SECRET_KEY` to create secure hashes for the log and progress:

```sh
export SECRET_KEY="my-secret-key"
```

To help with environment variable handling on a project level, check out [direnv](https://direnv.net/).

### APIs

Various APIs are needed for this project to run. Enable the [Fusion Tables API](https://console.cloud.google.com/apis/library/fusiontables.googleapis.com), the [Drive API](https://console.cloud.google.com/apis/library/drive.googleapis.com) and the [Sheets API](https://console.cloud.google.com/apis/library/sheets.googleapis.com) in your [Google Cloud Console](https://console.cloud.google.com/). Those are needed to read Fusiontables from a user account and to store the export in Google Drive including an index sheet listing all exports. [StackDriver](https://console.cloud.google.com/apis/library/clouderrorreporting.googleapis.com) needs to be activated for Error Reporting in the same Google Cloud Project.

### Server credentials

You’ll need some credentials for OAuth2. Go to the [Credentials page](https://console.cloud.google.com/apis/credentials) in your Google Cloud Project in the Google Cloud Console. Create some server side credentials with `http://localhost:3000/auth/callback` and `https://YOUR_DOMAIN/auth/callback` as the authorized redirect URIs. Download the credentials as a JSON file and save it as `./server-src/config/credentials.json`.

Also, create some server credentials with the role Owner to use the Datastore during development. Download the corresponding JSON file and save it in the `./server-src/config/` folder. Store the path to that file in an env called `GOOGLE_APPLICATION_CREDENTIALS`. To setup the database index, run the following once before starting the project:

```sh
yarn run deploy:datastore-indexes
```

### Develop

Run the following command to start the server on localhost:

```sh
yarn run start:dev # start the server
```

### Deploy

Run the following command to deploy the application:

```sh
yarn run deploy
```

## Hosting

The project is hosted at [AppEngine](https://console.cloud.google.com/appengine/start)
