# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- Added support for content type `noContent`.

## [1.8.0] - 2025-05-06
### Added
- Added support for closing server-side banners with the state stored in a cookie.
- Added support for animated closing. The first animation type `slideUp` implemented.
- Added support for Content API v2.

### Changed
- Reduced compiled bundle size.
- Server-side banners are now managed by the client similarly like client-side rendered banners which fixes initialization of sliders on window resize.
- Updated integration guide.
- Changed the default API version in the configuration to `2`.

### Fixed
- Fixed banners re-rendering when the default content is missing.
- Fixed scripts evaluation in HTML banners.

## [1.7.0] - 2024-11-14
### Added
- Added new client event `amp:banner:mutated`.

### Changed
- Banners are now tracked by MutationObserver to be able to send metric events from cloned banners, or close banners with buttons that were added after rendering.

## [1.6.1] - 2024-10-11
### Added
- Added support for banners closing.
- HTML banners can be simply closed via any element with a data attribute `data-amp-banner-close=""`.
- Added the ability to rename events and their parameters using the `metrics.events` and `metrics.params` options. Parameters can also be overwritten for each event separately.
- Added the ability to add custom extra parameters for all events using the `metrics.extraParams` option or for each event separately.

### Changed
- Changed arguments that are passed to the listeners `amp:banner:attached`, `amp:banner:state-changed`, `amp:fetch:error` and `amp:fetch:success`. Arguments are now passed as an object, so instead of `(banner) => {}` it is necessary to write `({ banner }) => {}`, respectively `({ response }) => {}` in case of events `amp:fetch:error` and `amp:fetch:success`.
- Moved `dimensions` field from the `positionData` to the content object of type `img` according to changes in AMP v2.16.0 API changes.
- Updated docs.

### Removed
- Removed the `metrics.disabledEvents` option. Events can now be disabled by putting `false` next to the event name in the `metrics.events` option.

## [1.6.0] - 2024-09-19
### Added
- Added support for new banner option `fetchpriority`.
- Added support for banner options defined in the AMP administration.

### Changed
- Updated docs.

### Deprecated
- Deprecated the option `loading-offset`. The option `loading` is now processed as an expression.

## [1.5.0] - 2024-04-04
### Added
- Added `embed` mode for banners rendering. Embed banners are rendered in iframes and can be enabled via data attribute `data-amp-mode="embed"`.
- Added a new JS client for use in iframes. It is not intended for direct use on a website.
- Added the property `AMPClientFactory.version` that returns the package version in semver format.
- Added attributes `width` and `height` for images if a dimensions are returned by the API.

### Changed
- The package has been refactored from CommonJS to ESM.
- Updated dependencies.
- The property `version` on the client now returns an object of type `ClientVersion` instead of a simple semver string.
- Updated docs.

## [1.4.0] - 2023-12-14
### Added
- Added property `version` in the client.
- Added integration with server-side rendered banners.
- Added ability to provide custom options for each banner. Options can be passed via data attributes `data-amp-option-<optionName>="<optionValue>"` and can be retrieved in event handlers.
- Added support for native lazy loading. Feature can be enabled through banner options `loading=lazy` and `loading-offset=<offset>` (for multiple positions only).

### Changed
- Property `banner.data` is now deprecated. To access information about a position use property `banner.positionData`. For example, replace `banner.data.displayType` with `banner.positionData.displayType`.
- The default templates have been modified and moved to the `./src/template` directory.
- Updated docs.

## [1.3.1] - 2023-10-25
### Fixed
- Fixed issue with unicode characters when creating banner fingerprint.

## [1.3.0] - 2023-10-24
### Added
- Added new optional configuration option `origin` that is used as a value for the header `X-Amp-Origin`.

### Changed
- Changed the default templates - images are now rendered inside `<picture>` with `<source>` tags inside if the API returns data for them.

## [1.2.1] - 2023-10-25
### Fixed
- Fixed issue with unicode characters when creating banner fingerprint.

## [1.2.0] - 2023-08-14
### Added
- Added support for watching interactions with banners (intersection in the viewport and clicks) and metrics.
- Added new configuration options for interaction:
  - `interaction.defaultIntersectionRatio`
  - `interaction.intersectionRatioMap`
  - `interaction.firstTimeSeenTimeout`
- Added new configuration options for metrics:
  - `metrics.receiver`
  - `metrics.disabledEvents`
- Added new client events:
  - `amp:banner:intersection-changed`
  - `amp:banner:first-time-seen`
  - `amp:banner:first-time-fully-seen`
  - `amp:banner:link-clicked`
- Added automatically sending of metrics events:
  - `amp:banner:loaded`
  - `amp:banner:displayed`
  - `amp:banner:fully-displayed`
  - `amp:banner:clicked`
- Added preconfigured receivers for handling metrics events:
  - `debug`
  - `plausible`
  - `gtag`
  - `gtm`

### Changed
- Updated integration guide.

## [1.1.0] - 2023-01-04
### Added
- Added the client option `method` with accepted values `GET` and `POST`, the default value is `GET`.
- The client is now is able to communicate with API via both methods.
- Added the CHANGELOG.
- Added the section `Versions compatibility matrix` in the `Integration Guide`.

### Changed
- Updated the table of the client options in the `Integration Guide`.

## [1.0.10] - 2021-10-31
### Changed
- Replaced usage of function `Array.includes()` with `Array.indexOf()`.

## [1.0.9] - 2021-05-21
### Changed
- Updated the default templates for banners (opening links in the new window allowed).

## 1.0.8 - 2021-03-26
### Added
- Added `Integration Guide` into the README.

### Fixed
- Added missing getter `Banner.resources`.

[Unreleased]: https://github.com/68publishers/amp-client-js/compare/v1.8.0...HEAD
[1.8.0]: https://github.com/68publishers/amp-client-js/compare/v1.7.0...v1.8.0
[1.7.0]: https://github.com/68publishers/amp-client-js/compare/v1.6.1...v1.7.0
[1.6.1]: https://github.com/68publishers/amp-client-js/compare/v1.6.0...v1.6.1
[1.6.0]: https://github.com/68publishers/amp-client-js/compare/v1.5.0...v1.6.0
[1.5.0]: https://github.com/68publishers/amp-client-js/compare/v1.4.0...v1.5.0
[1.4.0]: https://github.com/68publishers/amp-client-js/compare/v1.3.1...v1.4.0
[1.3.1]: https://github.com/68publishers/amp-client-js/compare/v1.3.0...v1.3.1
[1.3.0]: https://github.com/68publishers/amp-client-js/compare/v1.2.1...v1.3.0
[1.2.1]: https://github.com/68publishers/amp-client-js/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/68publishers/amp-client-js/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/68publishers/amp-client-js/compare/v1.0.10...v1.1.0
[1.0.10]: https://github.com/68publishers/amp-client-js/compare/v1.0.9...v1.0.10
[1.0.9]: https://github.com/68publishers/amp-client-js/compare/v1.0.8...v1.0.9
