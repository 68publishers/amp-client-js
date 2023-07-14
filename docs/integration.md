# Integration Guide

## Table of Contents

* [Import Script](#import-script)
  * [Install via NPM](#install-via-npm)
* [Versions compatibility matrix](#versions-compatibility-matrix)
* [Options and Definitions](#options-and-definitions)
  * [Client Options](#client-options)
  * [Events](#events)
  * [Banner States](#banner-states)
* [Client Initialization](#client-initialization)
* [Create Banner](#create-banner)
  * [Manual](#manual)
  * [Via Data Attributes](#via-data-attributes)
* [Data Fetching and Rendering](#data-fetching-and-rendering)

## Import Script

The preferred way to import AMP Client is CDN link. Two versions are available:

* `https://unpkg.com/amp-client/dist/amp-client.min.js`
* `https://unpkg.com/amp-client/dist/amp-client.standalone.min.js`

The only difference is the first one contains [lodash](https://lodash.com/) library and the standalone version not.
If you are using the *lodash* on your website then use the *standalone* version of AMP client.
In that case, lodash has to be imported as a first.

Prefer to use CDN links with a labeled version to prevent BC breaks e.g.:

```html
<script src="https://unpkg.com/amp-client@1.0/dist/amp-client.min.js"></script>
<!-- OR if you are using lodash on your website -->
<script src="https://unpkg.com/amp-client@1.0/dist/amp-client.standalone.min.js"></script>
```

### Install via NPM

If you don't want to use CDN, you can install AMP Client manually via NPM.

```bash
$ npm install amp-client
# OR using yarn
$ yarn add amp-client
```

After that, you can require AMP Client like any other JavaScript library.

## Versions compatibility matrix

| Client Version |  AMP version  | API version | Note                                                                    |
|:--------------:|:-------------:|:-----------:|-------------------------------------------------------------------------|
|     `^1.0`     | `>=1.0 <=2.7` |     `1`     |                                                                         |
|     `^1.1`     | `>=1.0 <=2.7` |     `1`     | API supports only GET requests (cannot set the `method: "POST"` option) |
|     `^1.1`     |    `>2.8`     |     `1`     |                                                                         |

## Options and Definitions

### Client Options

| Name                                  |                     Type                      |     Default     | Required (must be defined by user) | Description                                                                                                                                                                                                                                                                                                            |
|---------------------------------------|:---------------------------------------------:|:---------------:|:----------------------------------:|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **url**                               |                   `string`                    |        -        |                Yes                 | Host URL of your amp application                                                                                                                                                                                                                                                                                       |
| **channel**                           |                   `string`                    |        -        |                Yes                 | Project's code                                                                                                                                                                                                                                                                                                         |
| **method**                            |                   `string`                    |      `GET`      |                 No                 | HTTP method, allowed values are `GET` and `POST`                                                                                                                                                                                                                                                                       |
| **version**                           |                   `integer`                   |       `1`       |                 No                 | Version of API                                                                                                                                                                                                                                                                                                         |
| **locale**                            |                 `null/string`                 |     `null`      |                 No                 | Locale string (`en_US`, `cs_CZ` etc.), a default locale will be used if the option is null                                                                                                                                                                                                                             |
| **resources**                         |                   `object`                    |      `{}`       |                 No                 | Default resources that can be used for all positions on the page                                                                                                                                                                                                                                                       |
| **template.single**                   |                   `string`                    | *HTML template* |                 No                 | Template for banners with display type `single`                                                                                                                                                                                                                                                                        |
| **template.random**                   |                   `string`                    | *HTML template* |                 No                 | Template for banners with display type `random`                                                                                                                                                                                                                                                                        |
| **template.multiple**                 |                   `string`                    | *HTML template* |                 No                 | Template for banners with display type `multiple` (sliders)                                                                                                                                                                                                                                                            |
| **interaction.intersectionThreshold** |                    `float`                    |      `0.5`      |                 No                 | The value specifies how much of the banner must be in the user's viewport for the banner to be evaluated as visible/invisible. The value must be a decimal number between 0 and 1.                                                                                                                                     |
| **interaction.firstSeenTimeout**      |                   `integer`                   |     `1000`      |                 No                 | The value indicates, in milliseconds, how long the banner must be visible in the user's viewport before it is evaluated as having been seen for the first time.                                                                                                                                                        |
| **metrics.receiver**                  | `null/string/function/array<string/function>` |     `null`      |                 No                 | Metrics are sent to the selected receiver if the value is set. The value can be a custom function, or one of the following strings: `"plausible"`, `"gtag"`, `"gtm"` or `"debug"`. Alternatively, an array can be passed if we would like to send metrics to multiple receivers. For example, `["plausible", "gtag"]`. |
| **metrics.disabledEvents**            |                `array<string>`                |      `[]`       |                 No                 | Names of metric events that should not be sent.                                                                                                                                                                                                                                                                        |

### Banner states

| Name        | Description                                                                                           |
|-------------|-------------------------------------------------------------------------------------------------------|
| `NEW`       | New banner is created.                                                                                |
| `RENDERED`  | Banner has been successfully rendered.                                                                |
| `NOT_FOUND` | The banner was not found in AMP's response.                                                           |
| `ERROR`     | Something went wrong. For example, the API returned an error, or a banner template contains an error. |

### Events

| Name                              | Constant                                | Function declaration                                                                                                             | Description                                                                            |
|-----------------------------------|-----------------------------------------|----------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------|
| `amp:banner:attached`             | `EVENTS.ON_BANNER_ATTACHED`             | `( banner: Banner ) => void`                                                                                                     | Fired when a banner defined with `[data-amp-banner]` is attached into Client           |
| `amp:banner:state-changed`        | `EVENTS.ON_BANNER_STATE_CHANGED`        | `( banner: Banner ) => void`                                                                                                     | Fired when a banner's state is changed - the banner object is created or rendered etc. |
| `amp:banner:intersection-changed` | `EVENTS.ON_BANNER_INTERSECTION_CHANGED` | `( params: { fingerprint: Fingerprint, element: HtmlElement, banner: Banner, entry: IntersectionObserverEntry } ) => void`       | Fired when a banner's intersection is changed.                                         |
| `amp:banner:first-seen`           | `EVENTS.ON_BANNER_FIRST_SEEN`           | `( params: { fingerprint: Fingerprint, element: HtmlElement, banner: Banner } ) => void`                                         | Fired when the user sees a banner for the first time                                   |
| `amp:banner:link-clicked`         | `EVENTS.ON_BANNER_LINK_CLICKED`         | `( params: { fingerprint: Fingerprint, element: HtmlElement, banner: Banner, target: HtmlElement, clickEvent: Event } ) => void` | Fired when the user clicks on any link in a banner.                                    |
| `amp:fetch:before`                | `EVENTS.ON_BEFORE_FETCH`                | `() => void`                                                                                                                     | Fired before calling of AMP API                                                        |
| `amp:fetch:error`                 | `EVENTS.ON_BEFORE_ERROR`                | `( response: Object ) => void`                                                                                                   | Fired when an API request failed or an error response was returned                     |
| `amp:fetch:success`               | `EVENTS.ON_BEFORE_SUCCESS`              | `( response: Object ) => void`                                                                                                   | Fired when an API returned a success response                                          |

Events can be attached in this way:

```javascript
var AMPClient = AMPClientFactory.create({...});

AMPClient.on('amp:banner:state-changed', function (banner) {
  if ('RENDERED' !== banner.state || 'multiple' !== banner.data.displayType) {
    return;
  }

  var element = banner.element; // HtmlElement

  // initialize your favourite slider here :-)
});
```

### Metrics events

Common properties for all metrics events are:

```json5
{
  channel_code: 'string',
  banner_id: 'string',
  banner_name: 'string', // the value may be NULL in older AMP versions
  position_id: 'string', // the value may be NULL in older AMP versions
  position_code: 'string',
  position_name: 'string', // the value may be NULL in older AMP versions
  campaign_id: 'string', // the value may be NULL in older AMP versions
  campaign_code: 'string',
  campaign_name: 'string', // the value may be NULL in older AMP versions
  breakpoint: 'string',
}
```

| Name                   | Event specific properties | Description                                                   |
|------------------------|---------------------------|---------------------------------------------------------------|
| `amp:banner:loaded`    | -                         | A banner has been successfully loaded (rendered) on the page. |
| `amp:banner:displayed` | -                         | The user has seen a banner                                    |
| `amp:banner:clicked`   | `{ link: 'string' }`      | The user clicked on a link in a banner.                       |

## Client Initialization

Initialization example:

```javascript
var AMPClient = AMPClientFactory.create({
  url: 'https://www.amp.example.com',
  channel: 'example',
  locale: 'cs_CZ',
  method: 'POST',
  resources: {
    role: 'vip',
    foo: ['bar', 'baz']
  }
});
```

## Create Banner

### Manual

```html
<div id="my-banner"></div>

<script>
  AMPClient.createBanner(document.getElementById('my-banner'), 'homepage.top', {
    a_resource: 'A',
    b_resource: ['B', 'C']
  });
</script>
```

### Via Data Attributes

```html
<div data-amp-banner="homepage.top" data-amp-resource-a_resource="A" data-amp-resource-b_resource="B, C"></div>
```

If you are using an initialization via data attributes please remember to call this function:

```javascript
AMPClient.attachBanners(); // attach all banners on the page

// or

AMPClient.attachBanners(document.getElementById('container')); // attach all baners inside the .container
```

## Data Fetching and Rendering

After all these initializations (probably before the `</body>` closing tag) just simply call:

```javascript
AMPClient.fetch();
```

That's all!

Here is a full example of an HTML document:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>AMP Example</title>
  <script src="https://unpkg.com/amp-client/dist/amp-client.min.js"></script>
  
  <script>
    var AMPClient = AMPClientFactory.create({
      url: 'https://www.amp.example.com',
      channel: 'example',
      locale: 'cs_CZ',
      resources: {
        role: 'vip',
        foo: ['bar', 'baz']
      }
    });

    AMPClient.on('amp:banner:state-changed', function (banner) {
      if ('RENDERED' !== banner.state || 'multiple' !== banner.data.displayType) {
        return;
      }

      var element = banner.element; // HtmlElement

      // initialize your favourite slider here :-)
    }); 
  </script>
</head>
<body>
  <div id="my-banner"></div>
  <script>
    AMPClient.createBanner(document.getElementById('my-banner'), 'homepage.top', {
      a_resource: 'A',
      b_resource: ['B', 'C']
    });
  </script>

  <div data-amp-banner="homepage.bottom" data-amp-resource-a_resource="A" data-amp-resource-b_resource="B, C"></div>

  <script>
    AMPClient.attachBanners();
    AMPClient.fetch();
  </script>
</body>
</html>
```
