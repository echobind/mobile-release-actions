import * as core from '@actions/core';
import * as exec from '@actions/exec';

import { DEFAULT_APP_VERSION } from './constants';
import { createGithubTag, getMostRecentGithubTag } from './utils/github';
import { writeBuildAndAppVersions } from './utils/native-versions';
import { getPackageJsonVersion, writePackageJsonVersion } from './utils/packagejson';
import { getNewTag, getVersionFromTag } from './utils/tags';
import { validateVersionChangeType } from './utils/validation';

const main = async (): Promise<void> => {
  const githubAuthToken = core.getInput('github-auth-token');
  const branchToTag = core.getInput('branch');
  const versionChangeType = validateVersionChangeType(core.getInput('version-change-type'));
  const buildVersion = core.getInput('build-version') || '1';
  const githubTagging = core.getBooleanInput('github-tagging');
  const createTag = core.getBooleanInput('create-tag');
  const rootDirectory = core.getInput('root-directory');

  await exec.exec('git', ['config', 'user.name', 'github-actions']);
  await exec.exec('git', ['config', 'user.email', 'github-actions@github.com']);

  let currentVersion = DEFAULT_APP_VERSION,
    currentTag: string | null = '';

  if (githubTagging) {
    currentTag = await getMostRecentGithubTag(githubAuthToken);
    currentVersion = getVersionFromTag(currentTag);
  } else {
    currentVersion = getPackageJsonVersion(rootDirectory);
  }

  const newTag = getNewTag({
    buildVersion,
    currentVersion,
    versionChangeType,
  });

  await writeBuildAndAppVersions({
    tag: newTag,
    rootDirectory,
  });

  if (githubTagging) {
    if (createTag) {
      core.info(`Creating new tag ${newTag}`);

      await createGithubTag({
        githubAuthToken,
        branchToTag,
        currentTag,
        newTag,
      });
    }
  } else {
    const newVersion = getVersionFromTag(newTag);

    if (newVersion !== currentVersion) {
      core.info(`Updating package.json version to ${newVersion}`);

      await writePackageJsonVersion(newVersion, rootDirectory);

      await exec.exec('git', [
        'add',
        rootDirectory ? `${rootDirectory}/package.json` : 'package.json',
      ]);
      await exec.exec('git', ['commit', '-m', `chore(release): ${newTag}`]);
      await exec.exec('git', ['push', '-f', 'origin', branchToTag]);
    } else {
      core.info('No version change detected');
    }
  }

  core.setOutput('tag', newTag);
};

main().catch((e) => core.setFailed(e instanceof Error ? e.message : JSON.stringify(e)));
