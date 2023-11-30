<div align="center" style="text-align: center; margin-bottom: 50px">
<img src="images/logo.png" alt="JS Client JS Logo" align="center" width="100">
<h1>AMP Client JS</h1>
<h2 align="center">Integration Guide</h2>
</div>

* [Client initialization](#client-initialization)
  * [Client Options](#client-options)
* [Creating banners](#creating-banners)
  * [Creating banners manually](#creating-banners-manually)
  * [Creating banners using data attributes](#creating-banners-using-data-attributes)
  * [Banners fetching and rendering](#banners-fetching-and-rendering)
  * [Integration with banners that are rendered server-side](#integration-with-banners-that-are-rendered-server-side)
  * [Banner states](#banner-states)
* [Client events](#client-events)
* [Metrics events](#metrics-events)
* [Full page example](#full-page-example)

## Client initialization

The client is simply instanced as follows:

```javascript
const AMPClient = AMPClientFactory.create({
  // ...options...
});
```

### Client Options

| Name                                     |                     Type                      |     Default     | Required (must be defined by user) | Description                                                                                                                                                                                                                                                                                                            |
|------------------------------------------|:---------------------------------------------:|:---------------:|:----------------------------------:|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **url**                                  |                   `string`                    |        -        |                Yes                 | Host URL of your amp application.                                                                                                                                                                                                                                                                                      |
| **channel**                              |                   `string`                    |        -        |                Yes                 | Project's code.                                                                                                                                                                                                                                                                                                        |
| **method**                               |                   `string`                    |      `GET`      |                 No                 | HTTP method, allowed values are `GET` and `POST`.                                                                                                                                                                                                                                                                      |
| **version**                              |                   `integer`                   |       `1`       |                 No                 | Version of API.                                                                                                                                                                                                                                                                                                        |
| **locale**                               |                 `null/string`                 |     `null`      |                 No                 | Locale string (`en_US`, `cs_CZ` etc.), a default locale will be used if the option is null.                                                                                                                                                                                                                            |
| **resources**                            |                   `object`                    |      `{}`       |                 No                 | Default resources that can be used for all positions on the page.                                                                                                                                                                                                                                                      |
| **origin**                               |                 `null/string`                 |     `null`      |                 No                 | Used as a value for the option header `X-Amp-Origin`. If the header is sent, the AMP API will return relative links as absolutes with this origin.                                                                                                                                                                     |
| **template.single**                      |                   `string`                    | *HTML template* |                 No                 | Template for banners with display type `single`.                                                                                                                                                                                                                                                                       |
| **template.random**                      |                   `string`                    | *HTML template* |                 No                 | Template for banners with display type `random`.                                                                                                                                                                                                                                                                       |
| **template.multiple**                    |                   `string`                    | *HTML template* |                 No                 | Template for banners with display type `multiple` (sliders).                                                                                                                                                                                                                                                           |
| **interaction.defaultIntersectionRatio** |                    `float`                    |      `0.5`      |                 No                 | How much of the banner must be in the user's viewport for the banner to be evaluated as visible. The value must be a decimal number between 0.1 and 1 in increments of 0.1 [e.g. 0.1, 0.2, 0.3, ...].                                                                                                                  |
| **interaction.intersectionRatioMap**     |                   `object`                    |      `{}`       |                 No                 | The "map" of intersection ratios. Keys must be numeric and represents a number of pixels. The values must match the same criteria as the option `interaction.defaultIntersectionRatio`. If a banner does not have an equal or greater pixel count than any option, then `defaultIntersectionRatio` is used.            |
| **interaction.firstTimeSeenTimeout**     |                   `integer`                   |     `1000`      |                 No                 | The value indicates, in milliseconds, how long the banner must be visible in the user's viewport before it is evaluated as having been seen for the first time. The minimum allowed value is 500.                                                                                                                      |
| **metrics.receiver**                     | `null/string/function/array<string/function>` |     `null`      |                 No                 | Metrics are sent to the selected receiver if the value is set. The value can be a custom function, or one of the following strings: `"plausible"`, `"gtag"`, `"gtm"` or `"debug"`. Alternatively, an array can be passed if we would like to send metrics to multiple receivers. For example, `["plausible", "gtag"]`. |
| **metrics.disabledEvents**               |                `array<string>`                |      `[]`       |                 No                 | Names of metric events that should not be sent.                                                                                                                                                                                                                                                                        |

The full configuration can look like this:

```javascript
const AMPClient = AMPClientFactory.create({
  url: 'https://url-to-amp-application',
  channel: 'channel-code',
  method: 'GET',
  version: 1,
  locale: 'en_US',
  resources: {
    role: 'guest',
    environments: [
      'development',
      'test'
    ],
  },
  origin: 'https://my-website.com',
  interaction: {
    defaultIntersectionRatio: 0.5,
    intersectionRatioMap: {
      '242500': 0.3,
    },
    firstTimeSeenTimeout: 1000,
  },
  metrics: {
    receiver: 'gtm',
    disabledEvents: ['amp:banner:loaded'],
  },
});
```

## Creating banners

Banners can be created manually through the client, or they can be created directly in HTML using data attributes.

### Creating banners manually

Banners are created using method `createBanner()`. The first argument of the method is the HTML element into which a banner will be rendered.
The second argument is a position code from the AMP and the third optional argument can be an object that contains resources of the banner.

```html
<div id="my-banner"></div>

<script>
  AMPClient.createBanner(document.getElementById('my-banner'), 'homepage.top', {
    a_resource: 'A',
    b_resource: ['B', 'C']
  });
</script>
```

### Creating banners using data attributes

The creation of banners is controlled by two types of data attributes. The first is `data-amp-banner`, which contains the position code from the AMP.
The second type are attributes with the prefix `data-amp-resource-`, which contain the resources of a given banner separated by a comma.

```html
<div data-amp-banner="homepage.top" data-amp-resource-a_resource="A" data-amp-resource-b_resource="B,C"></div>
```

To instantiate banners created in this way, the method `attachBanners()` must be called.

```javascript
AMPClient.attachBanners(); // attach all banners on the page
// or
AMPClient.attachBanners(document.getElementById('container')); // attach all banners inside the .container
```

### Banners fetching and rendering

To request the created banners and their rendering it is necessary to call the `fetch()` method.
This can be done before the closing tag `</body>`.

```html
    <!-- rest of the page -->
    <script>
        AMPClient.fetch();
    </script>
</body>
```

If the application somehow redraws parts of the HTML that contain banners (for example, by an AJAX call that returns HTML snippets for redrawing), the banners need to be re-created and redrawn after this action is completed.

```javascript
// attach banners after snippets from AJAX response are rendered
for (let snippet of snippets) {
  AMPClient.attachBanners(snippet);
}

// fetch banners after everything is attached
AMPClient.fetch();
```

### Integration with banners that are rendered server-side

Banners that are rendered server-side using [68publishers/amp-client-php](https://github.com/68publishers/amp-client-php) don't need any special integration.
The client will automatically know about these banners when the method `attachBanners()` is called. All functionalities like responding to banner events or sending metrics work the same way as for client-side rendered banners.

### Banner states

Banners can be in several states. Here is a list of them:

| Name        | Description                                                                                           |
|-------------|-------------------------------------------------------------------------------------------------------|
| `NEW`       | New banner is created.                                                                                |
| `RENDERED`  | Banner has been successfully rendered.                                                                |
| `NOT_FOUND` | The banner was not found in AMP's response.                                                           |
| `ERROR`     | Something went wrong. For example, the API returned an error, or a banner template contains an error. |

## Client events

The client emits several events that can be responded to. Here is a list of them:

| Name                               | Constant                                 | Function declaration                                                                                                             | Description                                                                            |
|------------------------------------|------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------|
| `amp:banner:attached`              | `EVENTS.ON_BANNER_ATTACHED`              | `( banner: Banner ) => void`                                                                                                     | Fired when a banner defined with `[data-amp-banner]` is attached into Client.          |
| `amp:banner:state-changed`         | `EVENTS.ON_BANNER_STATE_CHANGED`         | `( banner: Banner ) => void`                                                                                                     | Fired when a banner's state is changed - the banner object is created or rendered etc. |
| `amp:banner:intersection-changed`  | `EVENTS.ON_BANNER_INTERSECTION_CHANGED`  | `( params: { fingerprint: Fingerprint, element: HtmlElement, banner: Banner, entry: IntersectionObserverEntry } ) => void`       | Fired when a banner's intersection is changed.                                         |
| `amp:banner:first-time-seen`       | `EVENTS.ON_BANNER_FIRST_SEEN`            | `( params: { fingerprint: Fingerprint, element: HtmlElement, banner: Banner } ) => void`                                         | Fired when the user sees a banner for the first time.                                  |
| `amp:banner:first-time-fully-seen` | `EVENTS.ON_BANNER_FIRST_TIME_FULLY_SEEN` | `( params: { fingerprint: Fingerprint, element: HtmlElement, banner: Banner } ) => void`                                         | Fired when the user sees a fully banner for the first time.                            |
| `amp:banner:link-clicked`          | `EVENTS.ON_BANNER_LINK_CLICKED`          | `( params: { fingerprint: Fingerprint, element: HtmlElement, banner: Banner, target: HtmlElement, clickEvent: Event } ) => void` | Fired when the user clicks on any link in a banner.                                    |
| `amp:fetch:before`                 | `EVENTS.ON_BEFORE_FETCH`                 | `() => void`                                                                                                                     | Fired before calling of AMP API.                                                       |
| `amp:fetch:error`                  | `EVENTS.ON_BEFORE_ERROR`                 | `( response: Object ) => void`                                                                                                   | Fired when an API request failed or an error response was returned.                    |
| `amp:fetch:success`                | `EVENTS.ON_BEFORE_SUCCESS`               | `( response: Object ) => void`                                                                                                   | Fired when an API returned a success response.                                         |

Events can be attached in this way:

```javascript
AMPClient.on('amp:banner:state-changed', function (banner) {
  if ('RENDERED' !== banner.state || !banner.positionData.isMultiple()) { // do action only if the banner is rendered and position type is "multiple"
    return;
  }

  const element = banner.element; // HtmlElement

  // Here are other useful properties that may come in handy:
  const state = banner.state; // state of the banner
  const stateInfo = banner.stateInfo; // state info message
  const positionId = banner.positionData.id; // ID of the position
  const positionCode = banner.positionData.code; // code of the position
  const positionName = banner.positionData.name; // name of the position
  const positionDisplayType = banner.positionData.displayType; // type of the position [single, random, multiple]
  const rotationSeconds = banner.positionData.rotationSeconds; // how often the slider should scroll in seconds

  // do anything, e.g. initialize your favourite slider
});
```

### Metrics events

The client tracks several types of metrics on the banners.

Common properties for all metrics events are:

```json5
{
  channel_code: 'string',
  banner_id: 'string',
  banner_name: 'string', // the value may be NULL in AMP versions before v2.11
  position_id: 'string', // the value may be NULL in AMP versions before v2.11
  position_code: 'string',
  position_name: 'string', // the value may be NULL in AMP versions before v2.11
  campaign_id: 'string', // the value may be NULL in AMP versions before v2.11
  campaign_code: 'string',
  campaign_name: 'string', // the value may be NULL in AMP versions before v2.11
  breakpoint: 'string',
}
```

| Name                         | Event specific properties | Description                                                   |
|------------------------------|---------------------------|---------------------------------------------------------------|
| `amp:banner:loaded`          | -                         | A banner has been successfully loaded (rendered) on the page. |
| `amp:banner:displayed`       | -                         | The user has seen a banner.                                   |
| `amp:banner:fully-displayed` | -                         | The user has seen a fully banner.                             |
| `amp:banner:clicked`         | `{ link: 'string' }`      | The user clicked on a link in a banner.                       |

If you want to send data to GA via GTM please see [GTM Metrics Guide](./gtm-metrics-guide.md).

## Full page example

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>AMP Example</title>
    <script src="https://unpkg.com/amp-client/dist/amp-client.min.js"></script>
    
    <script>
      const AMPClient = AMPClientFactory.create({
        url: 'https://www.amp.example.com',
        channel: 'example',
        locale: 'cs_CZ',
        resources: {
          role: 'vip',
          foo: ['bar', 'baz']
        },
        metrics: {
          receiver: 'gtm',
        },
      });
  
      AMPClient.on('amp:banner:state-changed', function (banner) {
        if ('RENDERED' !== banner.state || 'multiple' !== banner.data.displayType) {
          return;
        }
  
        const element = banner.element;
        // initialize slider here
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
