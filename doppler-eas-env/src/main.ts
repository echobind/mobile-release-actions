import { exec } from 'child_process';
import * as core from '@actions/core';
import fs from 'fs/promises';

const main = async (): Promise<void> => {
  const releaseStage = core.getInput('releaseStage');
  const tokenKey = `${releaseStage.toUpperCase()}_DOPPLER_TOKEN`;

  core.info(`Pulling token from ${tokenKey}`);

  const token = process.env[tokenKey];

  if (!token) {
    throw new Error(`No token for ${tokenKey} in environment`);
  } else {
    core.info('Token found');
  }

  exec(
    '(curl -Ls --tlsv1.2 --proto "=https" --retry 3 https://cli.doppler.com/install.sh || wget -t 3 -qO- https://cli.doppler.com/install.sh) | sudo sh',
    (err) => {
      if (err) {
        core.setFailed(err instanceof Error ? err.message : JSON.stringify(err));
      } else {
        core.info('Doppler CLI installed');

        exec(
          `doppler secrets download --no-file --format=json --token=${token} > temp.json`,
          async (err) => {
            if (err) {
              core.setFailed(err instanceof Error ? err.message : JSON.stringify(err));
            } else {
              core.info('Secrets downloaded');

              const secretsFile = await fs.readFile(
                `${process.env.GITHUB_WORKSPACE}/temp.json`,
                'utf8'
              );
              const easJsonFile = await fs.readFile(
                `${process.env.GITHUB_WORKSPACE}/eas.json`,
                'utf8'
              );
              const secrets = JSON.parse(secretsFile);
              const easConfig = JSON.parse(easJsonFile);

              const updatedEasJson = {
                ...easConfig,
                build: {
                  ...easConfig.build,
                  [releaseStage]: {
                    ...easConfig.build[releaseStage],
                    env: {
                      ...easConfig.build[releaseStage].env,
                      ...secrets,
                    },
                  },
                },
              };

              await fs.writeFile(
                `${process.env.GITHUB_WORKSPACE}/eas.json`,
                JSON.stringify(updatedEasJson, null, 2)
              );

              core.info('EAS config updated');
            }
          }
        );
      }
    }
  );
};

main().catch((e) => core.setFailed(e instanceof Error ? e.message : JSON.stringify(e)));
