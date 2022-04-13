# doppler-eas-env

An action for writing Doppler environment variables into your `eas.json` based on release stage. This action will pull the doppler values for the token tied to the release stage and write them to `eas.json` under the correct release stage.

## Usage
```yaml
- uses: echobind/mobile-release-actions/doppler-eas-env@v1
  env:
    ALPHA_DOPPLER_TOKEN: ${{ secrets.ALPHA_DOPPLER_TOKEN }}
    BETA_DOPPLER_TOKEN: ${{ secrets.BETA_DOPPLER_TOKEN }}
    PRODUCTION_DOPPLER_TOKEN: ${{ secrets.PRODUCTION_DOPPLER_TOKEN }}
  with:
    releaseStage: ${{ github.event.inputs.releaseStage }}
```

## Setup

In order to use this action properly, you need to generate an access token for each config that you want to access. These configs should each correspond to a release stage that you want to inject the values into. They should be put into GitHub secrets prefixed with the release stage name. For example, if you have lanes for `FOO`, `BAR`, and `BAZ`, specified in your `build` key in `eas.json`, you should have a doppler token tied to corresponding Doppler configs added to secrets with the following names:

```
FOO_DOPPLER_TOKEN
BAR_DOPPLER_TOKEN
BAZ_DOPPLER_TOKEN
```

The action will use the corresponding token based on the release stage passed.

## Additional Links

For more info on env variables in `eas.json`, see the [EAS docs](https://docs.expo.dev/build-reference/variables/).

For more info on using environment variables in expo, see the [Expo docs](https://docs.expo.dev/guides/environment-variables/).