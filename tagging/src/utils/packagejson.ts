import fs from 'fs/promises';

const getPackageJsonPath = (rootDirectory: string | undefined) =>
  rootDirectory ? `${rootDirectory}/package.json` : 'package.json';

/** Get version from package json */
export const getPackageJsonVersion = (rootDirectory: string | undefined) => {
  const packageJson = require(`${process.env.GITHUB_WORKSPACE}/${getPackageJsonPath(
    rootDirectory
  )}`);

  if (!packageJson.version) {
    throw new Error('No version specified in package.json');
  }

  return packageJson.version;
};

/** Write new version to package json */
export const writePackageJsonVersion = async (
  newVersion: string,
  rootDirectory: string | undefined
) => {
  const packageJson = require(`${process.env.GITHUB_WORKSPACE}/${getPackageJsonPath(
    rootDirectory
  )}`);
  const json = {
    ...packageJson,
  };

  json.version = newVersion;

  await fs.writeFile(
    `${process.env.GITHUB_WORKSPACE}/${getPackageJsonPath(rootDirectory)}`,
    JSON.stringify(json, null, 2)
  );
};
