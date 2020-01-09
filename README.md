<div align="center">

  <a href="https://www.npmjs.com/package/amp-client">
    <img src="docs/images/logo.png" alt="Logo" title="AMP" width="100">
  </a>

  <h1>AMP Client JS</h1>

  <p>
    <strong>Advertising Management Platform Client</strong>
  </p>
  <br>
  <br>
</div>

## Table of Contents

* [Getting Started](#getting-started)
  * [Prerequisites](#prerequisites)
  * [Installation](#installation)
* [Build and Development](#build-and-demo)
* [Integration](#integration)
* [License](#license)
* [Contact](#contact)

## Getting Started

Please follow these instructions to get a local copy and setting up it.

### Prerequisites

* Git
* Npm

### Installation

1. Clone the repo

```sh
$ git clone git@gitlab.com:68publishers/projects/amp/amp-client-js.git
$ cd amp-client-js
```

2. Install npm dependencies

```sh
$ npm install
```

## Build and Demo

Use this predefined commands for the application's build:

```sh
$ npm run build:dev

or

$ npm run build:prod
```

Paths of an output files are `~/build/amp-client.js` (dev mode) and `~/dist/amp-client.min.js` (production mode) respectively `~/dist/amp-client.standalone.min.js`.

A simple demo page is located in `~/build/index.html`. If you want to run this demo in your browser the run this command:

```sh
$ npm run start:dev
```

And then open your browser and search for `http://localhost:3000`.

## Integration

Please follow [this link](docs/integration.md).

## License

@todo

## Contact

[68publishers](https://www.68publishers.io) - support@68publishers.io
