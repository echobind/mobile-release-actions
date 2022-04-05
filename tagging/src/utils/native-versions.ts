import * as core from '@actions/core';
import path from 'path';
import fs from 'fs';
import { Xcode } from 'pbxproj-dom/xcode';
import plist from 'plist';
import { uniq as unique, flattenDeep } from 'lodash';

const getIosDir = (rootDirectory?: string) => {
  const iosPath = rootDirectory ? `${rootDirectory}/ios` : 'ios';

  return path.join(process.env.GITHUB_WORKSPACE || '', iosPath);
};

const getBuildGradleDir = (rootDirectory?: string) => {
  const buildGradlePath = rootDirectory
    ? `${rootDirectory}/android/app/build.gradle`
    : 'android/app/build.gradle';

  return path.join(process.env.GITHUB_WORKSPACE || '', buildGradlePath);
};

interface WriteBuildAndAppVersionProps {
  tag: string;
  rootDirectory: string | undefined;
}

/**
 * Write iOS and Android Build/App versions
 */
export const writeBuildAndAppVersions = async ({
  tag,
  rootDirectory,
}: WriteBuildAndAppVersionProps) => {
  const [appVersionWithV, stringBuildVersion] = tag.split('-');
  const appVersion = appVersionWithV.replace('v', '');
  const buildVersion = Number(stringBuildVersion);

  await updateIOSVersions({ appVersion, buildVersion, rootDirectory });
  await updateAndroidVersions({ appVersion, buildVersion, rootDirectory });
};

interface AppVersionAndBuildVersion {
  appVersion: string;
  buildVersion: number;
  rootDirectory: string | undefined;
}

/**
 * Updates ios projects/plists with new app versions
 */
async function updateIOSVersions({
  appVersion,
  buildVersion,
  rootDirectory,
}: AppVersionAndBuildVersion) {
  core.info(`-- Updating iOS App version to ${appVersion} --`);
  core.info(`-- Updating iOS build version to ${buildVersion} --`);

  const xcodeProjects = fs
    .readdirSync(getIosDir(rootDirectory))
    .filter((file) => /\.xcodeproj$/i.test(file));

  const projectFolder = path.join(getIosDir(rootDirectory), xcodeProjects[0]);
  const xcode = Xcode.open(path.join(projectFolder, 'project.pbxproj'));

  await updateXcodeProjects({ xcode, buildVersion, appVersion, rootDirectory });
  await updatePlists({ xcode, buildVersion, appVersion, rootDirectory });
}

interface UpdateXcodeProjects extends AppVersionAndBuildVersion {
  xcode: any;
}

/**
 * Updates the CURRENT_PROJECT_VERSION within an xcode project
 */
async function updateXcodeProjects({ xcode, buildVersion }: UpdateXcodeProjects) {
  xcode.document.projects.forEach((project: any) => {
    project.targets.filter(Boolean).forEach((target: any) => {
      target.buildConfigurationsList.buildConfigurations.forEach((config: any) => {
        config.patch({
          buildSettings: {
            CURRENT_PROJECT_VERSION: buildVersion,
          },
        });
      });
    });
  });

  return xcode.save();
}

/**
 * Updates plists with a new app/build version
 */
async function updatePlists({
  xcode,
  appVersion,
  buildVersion,
  rootDirectory,
}: UpdateXcodeProjects) {
  const plistFileNames = getPlistFilenames(xcode);

  const plistsToSave = plistFileNames.map((filename: any) => {
    const plistPath = path.join(getIosDir(rootDirectory), filename);
    const plistObject = plist.parse(fs.readFileSync(plistPath, 'utf8')) as any;

    plistObject.CFBundleShortVersionString = appVersion;
    plistObject.CFBundleVersion = `${buildVersion}`;

    const file = plist.build(plistObject);
    return fs.promises.writeFile(plistPath, file);
  });

  await Promise.all(plistsToSave);
}

/**
 * Gets plists used in a given project
 */
function getPlistFilenames(xcode: any) {
  return unique(
    flattenDeep(
      xcode.document.projects.map((project: any) => {
        return project.targets.filter(Boolean).map((target: any) => {
          return target.buildConfigurationsList.buildConfigurations.map((config: any) => {
            return config.ast.value.get('buildSettings').get('INFOPLIST_FILE').text;
          });
        });
      })
    )
  );
}

/**
 * Updates plists with a new app/build version
 */
async function updateAndroidVersions({
  appVersion,
  buildVersion,
  rootDirectory,
}: AppVersionAndBuildVersion) {
  core.info(`-- Updating Android App version to ${appVersion} --`);
  core.info(`-- Updating Android build version to ${buildVersion} --`);
  let gradleFile: string | Buffer = await fs.promises.readFile(getBuildGradleDir(rootDirectory));

  // Note that buildVersion MUST be an integer, or Android builds will fail. See:
  //  https://stackoverflow.com/a/64708656/344391
  gradleFile = gradleFile.toString().replace(/versionCode (\d+)/, `versionCode ${buildVersion}`);

  gradleFile = gradleFile
    .toString()
    .replace(/versionName (["'])(.*)["']/, `versionName $1${appVersion}$1`);

  return fs.promises.writeFile(getBuildGradleDir(rootDirectory), gradleFile);
}
