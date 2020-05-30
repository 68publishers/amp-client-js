# AMP Client JS
> Advertising Management Platform Client

## Table of Contents

* [Getting Started](#getting-started)
  * [Prerequisites](#prerequisites)
  * [Installation](#installation)
* [Build and Development](#build-and-demo)
* [Integration](#integration)

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

Use predefined commands for the application's build:

```sh
$ npm run build:dev # or prod
```

Paths of an output files are:
 - `~/build/amp-client.js` (dev mode)
 - `~/dist/amp-client.min.js` (production mode) respectively `~/dist/amp-client.standalone.min.js`.

A simple demo page is located in `~/build/index.html`. To show demo in your browser run:

```sh
$ npm run start:dev
```

Then visit the page `http://localhost:3000`.

## Integration

Please see the [Integration Guide](docs/integration.md).
