import { exec } from 'child_process';
import fs from 'fs/promises';
import * as core from '@actions/core';

const main = async (): Promise<void> => {
  const releaseStage = core.getInput('releaseStage');
  const tokenKey = `${releaseStage.toUpperCase()}_DOPPLER_TOKEN`;
  const token = process.env[tokenKey];

  if (!token) {
    throw new Error(`No token for ${tokenKey} in environment`);
  }

  await exec(`doppler secrets download --no-file --format=json --token=${token} > temp.json`);

  const secretsFile = await fs.readFile(`${process.env.GITHUB_WORKSPACE}/temp.json`, 'utf8');
  const easJsonFile = await fs.readFile(`${process.env.GITHUB_WORKSPACE}/eas.json`, 'utf8');
  const secrets = JSON.parse(secretsFile);
  const easConfig = JSON.parse(easJsonFile);

  const updatedEasJson = {
    ...easConfig,
    build: {
      ...easConfig.build,
      [releaseStage]: {
        ...easConfig.build[releaseStage],
        ...secrets,
      },
    },
  };

  await fs.writeFile(
    `${process.env.GITHUB_WORKSPACE}/eas.json`,
    JSON.stringify(updatedEasJson, null, 2)
  );
};

main().catch((e) => core.setFailed(e instanceof Error ? e.message : JSON.stringify(e)));
