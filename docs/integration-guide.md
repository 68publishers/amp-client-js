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
  * [Banner options](#banner-options)
    * [Expressions in options](#expressions-in-options)
    * [Lazy loading of image banners](#lazy-loading-of-image-banners)
    * [Fetch priority of image banners](#fetch-priority-of-image-banners)
  * [Loading banners in iframes](#loading-banners-in-iframes)
  * [Integration with banners that are rendered server-side](#integration-with-banners-that-are-rendered-server-side)
  * [Banner states](#banner-states)
* [Client events](#client-events)
* [Closing banners](#closing-banners)
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

| Name                                     |                     Type                      |        Default         | Required (must be defined by user) | Description                                                                                                                                                                                                                                                                                                            |
|------------------------------------------|:---------------------------------------------:|:----------------------:|:----------------------------------:|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **url**                                  |                   `string`                    |           -            |                Yes                 | Host URL of your amp application.                                                                                                                                                                                                                                                                                      |
| **channel**                              |                   `string`                    |           -            |                Yes                 | Project's code.                                                                                                                                                                                                                                                                                                        |
| **method**                               |                   `string`                    |         `GET`          |                 No                 | HTTP method, allowed values are `GET` and `POST`.                                                                                                                                                                                                                                                                      |
| **version**                              |                   `integer`                   |          `1`           |                 No                 | Version of API.                                                                                                                                                                                                                                                                                                        |
| **locale**                               |                 `null/string`                 |         `null`         |                 No                 | Locale string (`en_US`, `cs_CZ` etc.), a default locale will be used if the option is null.                                                                                                                                                                                                                            |
| **resources**                            |                   `object`                    |          `{}`          |                 No                 | Default resources that can be used for all positions on the page.                                                                                                                                                                                                                                                      |
| **origin**                               |                 `null/string`                 |         `null`         |                 No                 | Used as a value for the option header `X-Amp-Origin`. If the header is sent, the AMP API will return relative links as absolutes with this origin.                                                                                                                                                                     |
| **template.single**                      |                   `string`                    |    *HTML template*     |                 No                 | Template for banners with display type `single`.                                                                                                                                                                                                                                                                       |
| **template.random**                      |                   `string`                    |    *HTML template*     |                 No                 | Template for banners with display type `random`.                                                                                                                                                                                                                                                                       |
| **template.multiple**                    |                   `string`                    |    *HTML template*     |                 No                 | Template for banners with display type `multiple` (sliders).                                                                                                                                                                                                                                                           |
| **interaction.defaultIntersectionRatio** |                    `float`                    |         `0.5`          |                 No                 | How much of the banner must be in the user's viewport for the banner to be evaluated as visible. The value must be a decimal number between 0.1 and 1 in increments of 0.1 [e.g. 0.1, 0.2, 0.3, ...].                                                                                                                  |
| **interaction.intersectionRatioMap**     |                   `object`                    |          `{}`          |                 No                 | The "map" of intersection ratios. Keys must be numeric and represents a number of pixels. The values must match the same criteria as the option `interaction.defaultIntersectionRatio`. If a banner does not have an equal or greater pixel count than any option, then `defaultIntersectionRatio` is used.            |
| **interaction.firstTimeSeenTimeout**     |                   `integer`                   |         `1000`         |                 No                 | The value indicates, in milliseconds, how long the banner must be visible in the user's viewport before it is evaluated as having been seen for the first time. The minimum allowed value is 500.                                                                                                                      |
| **metrics.receiver**                     | `null/string/function/array<string/function>` |         `null`         |                 No                 | Metrics are sent to the selected receiver if the value is set. The value can be a custom function, or one of the following strings: `"plausible"`, `"gtag"`, `"gtm"` or `"debug"`. Alternatively, an array can be passed if we would like to send metrics to multiple receivers. For example, `["plausible", "gtag"]`. |
| **metrics.disabledEvents**               |                `array<string>`                |          `[]`          |                 No                 | Names of metric events that should not be sent.                                                                                                                                                                                                                                                                        |
| **closing.storage**                      |                   `string`                    |   `"memoryStorage"`    |                 No                 | The storage where information about banners closed by the user is stored. Allowed values are `memoryStorage` (default, banners are not closed permanently), `localStorage` and `sessionStorage`.                                                                                                                       |
| **closing.key**                          |                   `string`                    | `"amp-closed-banners"` |                 No                 | The storage key under which information about closed banners is stored.                                                                                                                                                                                                                                                |
| **closing.maxItems**                     |                   `integer`                   |         `500`          |                 No                 | Maximum number of closed items (banners) in the storage.                                                                                                                                                                                                                                                               |

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
  closing: {
    storage: 'localStorage',
    key: 'permanently-closed-banners',
    maxItems: 100,
  }
});
```

## Creating banners

Banners can be created manually through the client, or they can be created directly in HTML using data attributes.

### Creating banners manually

Banners are created using method `createBanner()`. The method accepts the following arguments:

- `{HtmlElement|String} element` - Selector or HTML element into which a banner will be rendered.
- `{String} position` - Position code from the AMP.
- `{Object} ?resources` - Optional object that can contains resources of the banner.
- `{Object} ?options` - Optional object that can contain arbitrary custom values. These options can then be retrieved in event handlers and templates.
- `{String} ?mode` - Optional argument. Specifies how the banner should be rendered. Supported values are `"managed"` (default value) and `"embed"` (more in the section [Loading banners in iframes](#loading-banners-in-iframes)).

```html
<div id="banner1"></div>
<div id="banner2"></div>

<script>
  // minimal setup
  AMPClient.createBanner(
    document.getElementById('banner1'),
    'homepage.top',
  );

  // full setup
  AMPClient.createBanner(
    document.getElementById('banner2'),
    'homepage.promo',
    {
      a_resource: 'A',
      b_resource: ['B', 'C'],
    },
    {
      loading: 'lazy',
      customOption: 'customValue',
    },
  );
</script>
```

### Creating banners using data attributes

The creation of banners is controlled by the following data attributes:

- `data-amp-banner` - Required attribute. The value contains the position code from the AMP.
- `data-amp-resource-<code>` - Optional attribute. The attribute name must end with a resource code from the AMP. The attribute value should contain individual values of the resource separated by a comma.
- `data-amp-option-<option>` - Optional attribute. The attribute name must end with the option name, which can be anything, as well as the attribute value. These options can then be retrieved in event handlers and templates.
- `data-amp-mode` - Optional attribute. Specifies how the banner should be rendered. Supported values are `"managed"` (default value) and `"embed"` (more in the section [Loading banners in iframes](#loading-banners-in-iframes)).

```html
<div data-amp-banner="homepage.top"
     data-amp-resource-a_resource="A"
     data-amp-resource-b_resource="B,C"
     data-amp-option-loading="lazy"
     data-amp-option-customOption="customValue">
</div>
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

### Banner options

Banners can contain options, which is practically a key-value object with arbitrary data.
Options are accessible from event handlers and some of them have functionality tied to them.
Options that are automatically handled by the client are for example `loading`, or `fetchpriority`.

There are several ways to pass options to banners.

1. Using the fourth argument of the method `createBanner()`.
2. Using data attributes with prefix `data-amp-option-`.
3. By setting them on the position detail page in the AMP administration.

Options defined in the AMP administration (variant 3) have a higher priority than options passed directly through the client (variants 1 and 2).

#### Expressions in options

In the case of `multiple` positions, it is sometimes desirable to apply options to only some of the banners (e.g. `loading` or `fetchpriority` options).
An option value can contain multiple expressions separated by a comma. The value of the first expression that satisfies a condition is always used.
Expressions are written in the format `{CONDITION}:{VALUE}` and a condition is always matched against an index (order starting from 0) of a banner.

The supported conditions are
- `{INDEX}` - exact match
- `{INDEX}-{INDEX}` - range from - to
- `<{INDEX}`
- `<={INDEX}`
- `>{INDEX}`
- `>={INDEX}`

If an expression does not contain any condition (it is not really an expression), it is evaluated positively and the given value is used.

For a better understanding, here is an example.
The required behavior of the `fetchpriority` option is:
- the first (index 0) banner must have the value `high`
- the second (index 1) and third (index 2) banners must have the value `auto`
- the other banners (from index 3) must have the value `low`

The desired result can be achieved by multiple expressions, all the following expressions have the same result:

- `0:high,1:auto,2:auto,low`
- `0:high,1-2:auto,low`
- `0:high,<=2:auto,>=3:low`
- `>2:low,>0:auto,high`

If an expression is used on a position with one banner (type `single` or `random`), the index 0 is always used to evaluate the expression, since the position contains only one banner.

#### Lazy loading of image banners

The default client templates support [native lazy loading](https://developer.mozilla.org/en-US/docs/Web/Performance/Lazy_loading#images_and_iframes) of images.
To activate lazy loading the option `loading: lazy` must be passed to the banner.

```javascript
AMPClient.createBanner(element, 'homepage.top', {}, {
  loading: 'lazy',
});
```

```html
<div data-amp-banner="homepage.top"
     data-amp-option-loading="lazy">
</div>
```

A special case is a position of type `multiple`, where it may be desirable to lazily load all banners except the first.
This can be achieved with the following expression:

```javascript
AMPClient.createBanner(element, 'homepage.top', {}, {
  loading: '>=1:lazy',
});
```

```html
<div data-amp-banner="homepage.top"
     data-amp-option-loading=">=1:lazy">
</div>
```

If you prefer a different implementation of lazy loading, it is possible to pass custom templates to the client in the configuration object instead of [the default ones](../src/template) and integrate a different solution in these templates.

#### Fetch priority of image banners

The [fetchpriority](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/fetchPriority) attribute can be set for image and embed banners using the `fetchpriority` option.

```javascript
AMPClient.createBanner(element, 'homepage.top', {}, {
  fetchpriority: 'high',
});
```

```html
<div data-amp-banner="homepage.top"
     data-amp-option-fetchpriority="high">
</div>
```

In the case of a `multiple` position, it may be required that the first banner have a fetch priority of `high` and the others `low`.
This can be achieved with the following expression:

```javascript
AMPClient.createBanner(element, 'homepage.top', {}, {
  fetchpriority: '0:high,low',
});
```

```html
<div data-amp-banner="homepage.top"
     data-amp-option-fetchpriority="0:high,low">
</div>
```

### Loading banners in iframes

Banners can be rendered in the `<iframe>` tag. To achieve this, just switch the banner to `embed` mode.

```javascript
AMPClient.createBanner(element, 'homepage.top', {}, {}, 'embed');
```

```html
<div data-amp-banner="homepage.top"
     data-amp-mode="embed">
</div>
```

The iframe will be rendered when the method `attachBanners()` is called.

⚠️ Only image banners on `single` and `random` positions are now fully compatible with `embed` mode. Rendering other types via `embed` mode is not recommended.

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
| `CLOSED`    | Banner has been closed by the user.                                                                   |


## Client events

The client emits several events that can be responded to. Here is a list of them:

| Name                               | Constant                                 | Function declaration                                                                                                                                                 | Description                                                                                                                                                                |
|------------------------------------|------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `amp:banner:attached`              | `EVENTS.ON_BANNER_ATTACHED`              | `({ banner: Banner }) => void`                                                                                                                                       | Fired when a banner defined with `[data-amp-banner]` is attached into Client.                                                                                              |
| `amp:banner:state-changed`         | `EVENTS.ON_BANNER_STATE_CHANGED`         | `({ banner: Banner }) => void`                                                                                                                                       | Fired when a banner's state is changed - the banner object is created or rendered etc.                                                                                     |
| `amp:banner:intersection-changed`  | `EVENTS.ON_BANNER_INTERSECTION_CHANGED`  | `({ fingerprint: Fingerprint, element: HtmlElement, banner: Banner, entry: IntersectionObserverEntry }) => void`                                                     | Fired when a banner's intersection is changed.                                                                                                                             |
| `amp:banner:first-time-seen`       | `EVENTS.ON_BANNER_FIRST_SEEN`            | `({ fingerprint: Fingerprint, element: HtmlElement, banner: Banner }) => void`                                                                                       | Fired when the user sees a banner for the first time.                                                                                                                      |
| `amp:banner:first-time-fully-seen` | `EVENTS.ON_BANNER_FIRST_TIME_FULLY_SEEN` | `({ fingerprint: Fingerprint, element: HtmlElement, banner: Banner }) => void`                                                                                       | Fired when the user sees a fully banner for the first time.                                                                                                                |
| `amp:banner:link-clicked`          | `EVENTS.ON_BANNER_LINK_CLICKED`          | `({ fingerprint: Fingerprint, element: HtmlElement, banner: Banner, target: HtmlElement, clickEvent: Event }) => void`                                               | Fired when the user clicks on any link in a banner.                                                                                                                        |
| `amp:banner:before-close`          | `EVENTS.ON_BANNER_BEFORE_CLOSE`          | `({ fingerprint: Fingerprint, element: HtmlElement, banner: Banner, setOperation: Function(operation: Function(el: HtmlElement) => void/Promise) => void }) => void` | Fired before the banner is closed by the user. The banner is simply removed by default. A callback can be passed to the `setOperation` argument to override this behavior. |
| `amp:banner:after-close`           | `EVENTS.ON_BANNER_AFTER_CLOSE`           | `({ fingerprint: Fingerprint, element: HtmlElement, banner: Banner }) => void`                                                                                       | Fired after the banner is closed by the user.                                                                                                                              |
| `amp:fetch:before`                 | `EVENTS.ON_BEFORE_FETCH`                 | `() => void`                                                                                                                                                         | Fired before calling of AMP API.                                                                                                                                           |
| `amp:fetch:error`                  | `EVENTS.ON_BEFORE_ERROR`                 | `({ response: Object }) => void`                                                                                                                                     | Fired when an API request failed or an error response was returned.                                                                                                        |
| `amp:fetch:success`                | `EVENTS.ON_BEFORE_SUCCESS`               | `({ response: Object }) => void`                                                                                                                                     | Fired when an API returned a success response.                                                                                                                             |

Events can be attached in the following way:

```javascript
AMPClient.on('amp:banner:state-changed', function ({ banner }) {
  if ('RENDERED' !== banner.state || !banner.positionData.isMultiple() || banner.isEmbed()) { // do action only if the banner is rendered, position type is "multiple" and not embed
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

  // It is also possible to retrieve custom options that were passed to the banner during initialization:
  const loadingOption = banner.options.get('loading', 'eager'); // the second argument is the default value
  const customOption = banner.options.get('customOption', undefined);

  banner.isManaged(); // Is the banner rendered by JS client?
  banner.isExternal(); // Was the banner rendered server-side?
  banner.isEmbed(); // Is the banner rendered in the <iframe> tag?

  // do anything, e.g. initialize your favourite slider
});
```

## Closing banners

> ⚠️Currently integrated for HTML banners only.

A banner is closed by clicking on the element with the data attribute `data-amp-banner-close`. The attribute does not require any value and must be inside the banner to be closed.

By default, the banner is simply removed from the page after closing. To change this behavior (for example, remove by animation), you can bind a listener to the `amp:banner:before-close` event:

```javascript
AMPClient.on('amp:banner:before-close', ({ setOperation }) => {
  setOperation(element => {
      // animate the element
  });
});
```

The callback passed to the `setOperation` function can return Promise. At that point, the banner will actually be removed once the Promise has succeeded.

## Metrics events

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
| `amp:banner:closed`          | -                         | A banner has been closed/dismissed by the user.               |

If you want to send data to GA via GTM please see [GTM Metrics Guide](./gtm-metrics-guide.md).

## Full page example

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>AMP Example</title>
    <script src="https://unpkg.com/@68publishers/amp-client/dist/amp-client.min.js"></script>
    
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
  
      AMPClient.on('amp:banner:state-changed', function ({ banner }) {
        if ('RENDERED' !== banner.state || !banner.positionData.isMultiple() || banner.isEmbed()) {
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
