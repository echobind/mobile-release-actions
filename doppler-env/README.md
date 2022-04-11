# doppler-env

An action for writing Doppler environment variables into a .env file based on profile. This action will pull the doppler values for the token tied to the profile and write them to a `.env` file. 

## Usage
```yaml
- uses: echobind/mobile-release-actions/doppler-env@v1
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