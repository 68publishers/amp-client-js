# Integration Guide

## Table of Contents

* [Script Import](#script-import)
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

The preferred way to import AMP script is CDN link. Two versions are available:

* `https://unpkg.com/amp-client/dist/amp-client.min.js`
* `https://unpkg.com/amp-client/dist/amp-client.standalone.min.js`

The only difference is the first one also contains [lodash](https://lodash.com/) library and the standalone version not.
If you are using the *lodash* on your website then use the *standalone* version of our client.

Prefer to use CDN links with a labeled version to prevent BC breaks e.g. `https://unpkg.com/amp-client@1.0/dist/amp-client.min.js`.

For example

```html
<script src="https://unpkg.com/amp-client@1.0/dist/amp-client.min.js"></script>
<!-- OR if you are using lodash on your website -->
<script src="https://unpkg.com/amp-client@1.0/dist/amp-client.standalone.min.js"></script>
```

## Options and Definitions

### Client Options

| Name | Type | Default | Required (must be defined by user) | Description |
| ----- | :-----: | :-----: | :-----: | ----- |
| **url** | `String` | - | Yes | Host URL of your amp application |
| **channel** | `String` | - | Yes | Project's code |
| **version** | `Integer` | 1 | No | Version of API |
| **locale** | `String`, `Null` | No | No | Locale string (`en_US`, `cs_CZ` etc.), a default locale will be used if the option is null |
| **resources** | `Object` | {} | No | Default resources that can be used for all positions on the page |
| **template** | `Object` | {} | No |  |
| **template.single** | `String` | *HTML template* | No | Template for banners with display type `single` |
| **template.random** | `String` | *HTML template* | No | Template for banners with display type `random` |
| **template.multiple** | `String` | *HTML template* | No | Template for banners with display type `multiple` (sliders) |

### Events

| Name | Constant | Arguments | Description |
| ----- | ----- | ----- | ----- |
| `amp:banner:attached` | `EVENTS.ON_BANNER_ATTACHED`| `{Object} banner` | Fired when a banner defined with `[data-amp-banner]` is attached into Client |
| `amp:banner:state-changed` | `EVENTS.ON_BANNER_STATE_CHANGED` | `{Object} banner` | Fired when a banner's state is changed - the banner object is created or rendered etc. |
| `amp:fetch:before` | `EVENTS.ON_BEFORE_FETCH` |  | Fired before calling of AMP API |
| `amp:fetch:error` | `EVENTS.ON_BEFORE_ERROR` | `{Object} response` | Fired when an API request failed or an error response was returned |
| `amp:fetch:success`| `EVENTS.ON_BEFORE_SUCCESS` | `{Object} response` | Fired when an API returned a success response |

Events can be attached in this way:

```javascript
var AMPClient = AMPClientFactory.create({...});

AMPClient.on(AMPClient.EVENTS.ON_BANNER_STATE_CHANGED, function (banner) {
  if (banner.STATE.RENDERED !== banner.state || 'multiple' !== banner.data.displayType) {
    return;
  }

  // initialize your favourite slider here :-)
});
```

### Banner States

- `NEW`
- `RENDERED`
- `NOT_FOUND`
- `ERROR`

## Client Initialization

Initialization example:

```javascript
var AMPClient = AMPClientFactory.create({
  url: 'https://www.amp.example.com',
  channel: 'example',
  locale: 'cs_CZ',
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
AMPClient.attachBanners();

// or

AMPClient.attachBanners(document.getElementById('container'));
```

## Data Fetching and Rendering

After all these initializations (probably before `</body>` closing tag) just simply call:

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
  <script src="https://unpkg.com/amp-client@1.0/dist/amp-client.min.js"></script>
  
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
    
    AMPClient.on(AMPClient.EVENTS.ON_BANNER_STATE_CHANGED, function (banner) {
      if (banner.STATE.RENDERED !== banner.state || 'multiple' !== banner.data.displayType) {
        return;
      }
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
