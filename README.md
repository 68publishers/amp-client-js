<div align="center" style="text-align: center; margin-bottom: 50px">
<img src="docs/images/logo.png" alt="JS Client JS Logo" align="center" width="100">
<h1>AMP Client JS</h1>
<p>:mega: JS Client for Advertising Management Platform</p>
</div>

## Installation

The preferred way to import AMP Client is CDN link. Two versions are available:

* `https://unpkg.com/amp-client/dist/amp-client.min.js`
* `https://unpkg.com/amp-client/dist/amp-client.standalone.min.js`

The only difference is the first one is bundled with components `template` and `merge` from the [lodash](https://lodash.com/) library and the standalone version not.
If you are using the *lodash* on your website then use the *standalone* version of AMP client.
In that case, lodash has to be imported as a first.

Prefer to use CDN links with a labeled version to prevent BC breaks e.g.:

```html
<script src="https://unpkg.com/amp-client@1.0/dist/amp-client.min.js"></script>
<!-- OR if you are using lodash on your website -->
<script src="https://unpkg.com/amp-client@1.0/dist/amp-client.standalone.min.js"></script>
```

### Installation via NPM

If you don't want to use CDN, you can install AMP Client manually via NPM.

```bash
$ npm install amp-client
# or using yarn
$ yarn add amp-client
```

After that, you can require AMP Client like any other JavaScript library.

## Versions compatibility matrix

| Client Version |   AMP version    | API version | Note                                                                                                                                  |
|:--------------:|:----------------:|:-----------:|---------------------------------------------------------------------------------------------------------------------------------------|
|     `~1.0`     |  `>=1.0 <=2.7`   |     `1`     |                                                                                                                                       |
|     `~1.1`     |  `>=1.0 <=2.7`   |     `1`     | API supports only GET requests (cannot set the `method: "POST"` option)                                                               |
|     `~1.1`     |     `>=2.8`      |     `1`     |                                                                                                                                       |
|     `~1.2`     | `>= 2.8 <= 2.10` |     `1`     | Limited metrics functionality - `banner_name`, `position_id`, `position_name`, `campaign_id` and `campaign_name` fields are not sent. |
|     `~1.2`     |     `<=2.11`     |     `1`     | The option `origin` has no effect, as it is not handled by AMP.                                                                       |
|     `~1.3`     |     `>=2.12`     |     `1`     |                                                                                                                                       |
|     `~1.4`     |     `>=2.12`     |     `1`     | Adds support for server-side rendered banners ([68publishers/amp-client-php](https://github.com/68publishers/amp-client-php)).        |

## Integration

For integration instructions follow the [Integration guide](docs/integration-guide.md).

## License

@todo
