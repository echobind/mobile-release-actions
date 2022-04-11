import { exec } from 'child_process';
import * as core from '@actions/core';

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

  await exec(`doppler secrets download --no-file --format=env --token=${token} > .env`);

  core.info('Secrets downloaded');
};

main().catch((e) => core.setFailed(e instanceof Error ? e.message : JSON.stringify(e)));
