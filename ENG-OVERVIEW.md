# Engineering Overview

## Background

The Fusion Tables Archive **tool** performs two main steps:

*   It **exports** each of your Fusion Tables’ **table** data creating an archive which is either a Google Sheet or a Google Drive CSV file, depending on the size of the data. All resulting data is placed in the `ft-archive` folder in Drive.
*   It generates map visualizations based on the archive data that will continue to work after Fusion Tables is shut down. These maps can be shared and embedded in your own website, using your own Maps API key.

The code in this repo only does the first step of exporting your tables. The visualization code is in a different repo.

## What does the exporter do?

This is a summary of the steps the tool takes to export your data. A more detailed explanation can be found beneath.

The main steps are as follows:

1. Obtain OAuth credentials from Google to access Google Drive and Fusion Tables on behalf of the user.
1. Get the list of all Fusion Tables "tables" owned by the user.
1. Show the list to the user with selection boxes. If there are many tables, paginate the list. Only the tables selected from one page of the listing can be exported at a time, which we call a `session`.
1. Create the archive for each selected table in a session. (a) Read the table, (b) transform the table data and (c) write that data to a spreadsheet or a CSV file (when the table is large), (d) set ACLs and (e) update the the “index” Sheet `ft-archive-index` in your `ft-archive` folder.
1. Show the exporting progress. As the archives are being created, the tool shows a dynamic session status page. After the export is finished, this session page cannot be opened again.

## Detailed Export Steps

This section provides more detail for each of the above steps.

### Authentication

The export application needs authentication from the user to access their files and to create an archive. The scopes needed are:

* `drive.metadata.readonly` — allows the tool to read the list of tables including their permissions from Drive owned by the user
* `fustiontables.readonly` — allows the tool to read the data from each of the users tables
* `drive.file` — despite the misleading name, this scope allows this tool to create new archives and update the files created by this application; other files cannot be changed. The files created by this application are archives (Sheet or CSV) and the index spreadsheet.

### List and select tables to export

To get a list of all tables owned by the user, the Drive API is queried. The user can optionally filter by name of the tables. The number of tables shown on a page is limited to 100. More Fusion Tables can be found on subsequent pages. On a page each table is selectable. When the user **U** hits "Export Selected Tables' this request is sent to our node.js server. Each request starts a `session`.

Creating an archive for a table can take over a minute, so we limit the size of a session to N tables.

### Creating the archive

An archive folder `ft-archive` is created in your Google Drive (if not present) along with an “index” spreadsheet `ft-archive-index` containing the export results.

For each session **S**, a new session folder with a timestamp of **S** is created in the archive folder. All exported files will be stored in the session folder.

### Export Progress

After starting the session, the tool shows a status page for the session. The user **U** can follow the progress of the export. Potential errors are displayed there as well as the links to the archived file and to the new visualization based on that archive.

When the user leaves the status page, the user is logged out to force the user to verify access. The status page cannot be accessed once it is closed.

For each Fusion Table table **T**:
  * The exporter gets the raw data of **T** and the styles (visualizations) for **T**.
  * The data of the **T** is analyzed and KML geometry data is converted to GeoJSON.
  * An archive is created. If the resulting data will fit in a Google Sheets spreadsheet it is created. Otherwise, a CSV file is created. Sheets limits the number of cells and the size of a single cell to 50KB and the filesize of the spreadsheet upload is limited to 5MB. If there is any repeating error creating the spreadsheet for any reason, an upload as CSV is tried.
  * The permissions (ACLs) are copied from the **T** to the exported archive file.
  * In the “index” spreadsheet, an entry is created for each exported **T** containing the link to the original file, the exported file and a link to the new visualizer that uses the exported file.

Once all tables in the session are processed, the session ends.

### Error handling

Errors are thrown when they occur. There can be general errors like creating the archive folder or reading the list of FusionTables. In that case, an error is displayed immediately and the export is cancelled.

When an error occurs while archiving a specific table, the error is shown on the progress page. If multiple exports are run in parallel there can be errors because the rate limit for the Sheets API is hit. The file might already be exported but not logged in the archive index spreadsheet.

For all errors, the exporter retries the requests with an incremental backoff strategy. This means it retries again after a short time. In case of a repeating error it waits longer for each retry and fails after 6 retries.

## Summary of Code

The project is written in [TypeScript](https://www.typescriptlang.org/) which is converted to JavaScript by the `tsc` compiler.

The code is broken into the following directories:

*  `server-src`: Contains the code for the server. This is a Node.js application using [Express](https://expressjs.com/).
*  `server-static-src`: Static assets for the exporter like the CSS (written in [stylus](http://stylus-lang.com/)) and some client side JavaScript (written in TypeScript) can be found here.
*  `server-views`: The templates of the server are stored in this folder. They are written in pug which is turned into HTML by the Express server.

### Config files

There are a few configuration files in the root directory of this project. Here is an explanation on what they do:

* `.editorconfig`: formatting settings for your code editor
* `app.yaml`: configuration for the Google Cloud AppEngine, see [documentation](https://cloud.google.com/appengine/docs/flexible/nodejs/reference/app-yaml)
* `cron.yaml`: cron jobs definition for the Google Cloud, see [documentation](https://cloud.google.com/appengine/docs/flexible/nodejs/scheduling-jobs-with-cron-yaml)
* `dispatch.yaml`: routing definition for the Google Cloud AppEngine to route the visualizer routes to the visualizer server, see [documentation](https://cloud.google.com/appengine/docs/flexible/nodejs/reference/dispatch-yaml)
* `index.yaml`: definition of indexes for the Google Cloud Datastore which stores the export progress, see [documentation](https://cloud.google.com/appengine/docs/flexible/nodejs/configuring-datastore-indexes-with-index-yaml)
* `package.json`: contains the dependencies and the scripted tasks that can be run to start the project, to build and deploy it
* `tsconfig.json`: TypeScript configuration
* `tslint.json`: code formatting definitions for TypeScript

### Environment Variables

Parts of this project are configured by shell environment variables. Set them directly in your shell like this:

```sh
export MY_ENV_VARIABLE="my-value"
```

or create a file say `env.sh` that looks like

```sh
# Shell environment variables for both the exporter and the visualizer
export VISUALIZER_BASE_URI="https://fta.dom/geoviz"
export GOOGLE_ANALYTICS_KEY="UA-xxxxxx"
export GOOGLE_SIGNIN_CLIENT_ID="your-oauth-client-id.apps.googleusercontent.com"
export GOOGLE_MAPS_API_KEY="your-maps-api-key"
```

and source that file via `. env.sh`

Or use a tool like [direnv](https://direnv.net/) to make the management of Environment Variables project dependent and not global.

## URL coordination between the exporter and the visualizer

Let `fta.dom` to be the domain where the exporter and visualizer are hosted. Let `vizpath` to be the path prefix that all visualizer URLs start with. For the launched tool, the actual values are

*   fta.dom = fusiontables-archive.withgoogle.com
*   vizpath = geoviz

The `vizpath` is specified in two places in this project.

1. The `VISUALIZER_BASE_URI` environment variable must have it as the path prefix, e.g.
such as "https://fusiontables-archive.withgoogle.com/geoviz". The exporter generates links to the visualization in (a) the status page when exporting and (b) the `ft-archive-index` spreadsheet.
1. The dispatch.yaml file must specify that all urls starting with /vizpath and /vizpath/* are sent to the geoviz service set in App Engine.

## Browser Code

The browser code gets the OAuth token, show the list of tables and reads the status/progress while the session is active.

## Server Code

All access to Drive, Fusion Tables occurs in an App Engine server running Node.js.
The session runs on the server. The server is single threaded so it can only process a single session at a time.
