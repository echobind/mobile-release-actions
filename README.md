# mobile-release-actions

A monorepo of GitHub actions used for mobile releases.

* [tagging](./tagging)
  * Automate the versioning process for mobile applications.
* [eas-build](./eas-build)
  * Assists in building and submitting your app using [EAS](https://docs.expo.dev/eas/)
* [doppler-eas-env](./doppler-eas-env)
  * Read secrets from Doppler and write to correct release stage in `eas.json`

## Release Process

At a very basic level, the release process is as follows:

```mermaid
flowchart TB
  RS[release stage] & VFT[version change type] & P[platform] & B[branch] -.-> WD[manual start]
  WD --> COB[check out specified branch]
  COB --> UV[update versions]
  UV --> BA[build app]
```

## Full Workflow Examples

* [Using GitHub tagging](./examples/release-github.yml)
* [Using package.json versioning](./examples/release-manual.yml)
* [Pulling environment variables from Doppler](./examples/release-doppler.yml)

## Contributing

This repo uses [int128/release-typescript-action](https://github.com/int128/release-typescript-action) to automatically publish a new version on merge to main.
