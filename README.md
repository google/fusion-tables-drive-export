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
