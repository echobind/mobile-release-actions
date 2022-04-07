import { exec } from 'child_process';
import fs from 'fs/promises';
import * as core from '@actions/core';
import { cwd } from 'process';

const main = async (): Promise<void> => {
  const token = '';
  const profile = 'alpha';

  await exec(`doppler secrets download --no-file --format=json --token=${token} > temp.json`);

  const secretsFile = await fs.readFile(`${cwd()}/temp.json`, 'utf8');
  const easJsonFile = await fs.readFile(`${cwd()}/eas.json`, 'utf8');
  const secrets = JSON.parse(secretsFile);
  const easConfig = JSON.parse(easJsonFile);

  const updatedEasJson = {
    ...easConfig,
    build: {
      ...easConfig.build,
      [profile]: {
        ...easConfig.build[profile],
        ...secrets,
      },
    },
  };

  await fs.writeFile(`${cwd()}/eas.json`, JSON.stringify(updatedEasJson, null, 2));
};

main().catch((e) => core.setFailed(e instanceof Error ? e.message : JSON.stringify(e)));
