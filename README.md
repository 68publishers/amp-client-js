# AMP - Javascript Client

## Installation

Firstly clone project:

```
$ git clone git@gitlab.com:68publishers/projects/amp-client.git
$ cd amp-client
```

Then download npm dependencies:

```bash
$ npm install
```

### Build

To build the application use this predefined commands:

```bash
$ npm run build:dev

or

$npm run build:prod
```

The paths of a output files are `build/amp-client.js` (dev mode) and `dist/amp-client.min.js` (production mode) respectively `dist/amp-client.standalone.min.js`

### Local DEV server/demo

Simple demo page is located in `build/index.html`. If you want to run this demo in your browser firstly run:

```bash
$ npm run start:dev
```

Then open your browser and search for `http://localhost:3000`.
