# Engineering Overview

## Background

The Fusion Tables Archive **tool** performs two main steps:

*   It **exports** each of your Fusion Tables’ **table** data creating an archive which is either a Google Sheet or a Google Drive CSV file, depending on the size of the data.  All resulting data is placed in the `ft-archive` folder in Drive.
*   It generates map visualizations based on the archive data that will continue to work after Fusion Tables is shut down. These maps can be shared and embedded in your own website, using your own Maps API key.

The code in this repo only does the first step of exporting your tables. The visualization code is in a different repo.

## What does the exporter do?

This is a summary of the steps the tool takes to export your data. A more detailed explanation can be found beneath.

The main steps are as follows:

1.  Obtain OAuth credentials from Google to access Google Drive and Fusion Tables on behalf of the user.
1.  Get the list of all Fusion Tables "tables" owned by the user.
1.  Show the list to the user with selection boxes.  If there are many tables, paginate the list. Only the tables selected from one page of the listing can be exported at a time, which we call a `session`.
1.  Create the archive for each selected table in a session.  (a) Read the table, (b) transform the table data and (c) write that data to a Spreadsheet or a CSV file (when the table is large), (d) set ACLs and (e) update the the “index” Sheet `ft-archive-index` in your `ft-archive` folder.
1.  Show the exporting progress.  As the archives are being created, the tool shows a dynamic session status page.  After the export is finished, this session page cannot be opened again.

## Detailed Export Steps

This section provides more detail for each of the above steps.

### Authentication

The export application needs authentication from the user to access their files and to create an archive. The scopes needed are:

* `drive.metadata.readonly` — allows the tool to read the list of tables including their permissions from Drive owned by the user
* `fustiontables.readonly` — allows the tool to read the data from each of the users tables
* `drive.file` — despite the misleading name, this scope allows this tool to create new archives and update the files created by this application; other files cannot be changed.  The files created by this application are archives (Sheet or CSV) and the index Sheet.

### List and select tables to export

To get a list of all tables owned by the user, the Drive API is queried. The user can optionally filter by name of the tables.  We limit the number of tables shown on a page to **N** (either 50 or 100 currently).  We support navigating to subsequent pages.  On a page each table is selectable.  When the user U hits "Export Selected Tables' this request is sent to our node.js server.  Each request starts a `session`.

Creating an archive for a table can take over a minute, so we limit the size of a session to N tables.

### Creating the archive

An archive folder `ft-archive` is created in your Google Drive (if not present) along with an “index” sheet `ft-archive-index` containing the export results.

For each session **S**, a new session folder with a timestamp of **S** is created in the archive folder. All exported files will be stored in the session folder.

For each Fusion Table table **T**:
  * The exporter gets the raw data of **T** and the styles (visualizations) for **T**.
  * The data of the **T** is analyzed and KML geometry data is converted to GeoJSON.
  * We create an archive. If the resulting data will fit in a Sheet, a Spreadsheet is created. Otherwise, a CSV file is created. Sheets limits the number of cells and the size of a single cell to 50KB.
  * The permissions (ACLs) are copied from the **T** to the exported archive file.
  * In the “index” sheet, an entry is created for each exported **T** containing the link to the original file, the exported file and a link to the new visualizer that uses the exported file.

Once all tables in the session are processed, the session ends.

### Export Progress

After starting the session, the tool shows a status page for the session. The user **U** can follow the progress of the export. Potential errors are displayed there as well as the links to the archived file and to the new visualization based on that archive.

When the user leaves the status page, the user is logged out to force the user to verify access.

The status page cannot be accessed once it is closed.

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

The project is configured by Environment Variables. Either set them directly in your shell like this:

```sh
export MY_ENV_VARIABLE="my-value"
```

Or use a tool like [direnv](https://direnv.net/) to make the management of Environment Variables project dependent and not global.

## Browser Code

The browser code gets the OAuth token, show the list of tables and reads the status/progress while the session is active.

## Server Code

All access to Drive, Fusion Tables occurs in an App Engine server running Node.js.
The session runs on the server. The server is single threaded so it can only process a single session at a time.
