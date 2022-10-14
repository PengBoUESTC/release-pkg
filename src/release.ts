import { resolve } from 'path';
import { writeFileSync } from 'fs';
import minimist from 'minimist';
import { prompt } from 'enquirer';
import { inc, valid } from 'semver';
import { execa } from 'execa';
import { green, red } from 'kolorist';
import type { Options } from 'execa';
import type { ReleaseType } from 'semver';

import { loadConfig } from './config';
import type { Config } from './config';

const PKG = 'package.json';
// get cwd
const root = process.cwd();
const rootPkg = resolve(root, PKG);
// get args
const args = minimist(process.argv.slice(2));
// get pkgMsg
const pkgInfo = require(rootPkg);
// get current version
const curVersion = pkgInfo.version;

const run = (bin: string, args: string[], opts: Options = {}) =>
  execa(bin, args, { stdio: 'inherit', ...opts });
const log = (message: any) => console.log(message);
const infoLog = (message: string) => log(green(message));
const incVersion = (release: ReleaseType) => inc(curVersion, release);
const updateVersion = (version: string) => {
  writeFileSync(
    rootPkg,
    JSON.stringify(
      {
        ...pkgInfo,
        version,
      },
      null,
      2
    ) + '\n'
  );
};
let config: Config | undefined;

const versionIncrement: ReleaseType[] = ['patch', 'minor', 'major'];

const CUSTOM = 'custom';

export const getCurBranch = async () => {
  const { stdout } = await run('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
    stdio: 'pipe',
  });
  return stdout;
};

export const release = async () => {
  config = await loadConfig('release');
  infoLog('\n Release start...');
  // branch check
  const curBranch = await getCurBranch();
  const { releaseBranch } = config;
  if (!releaseBranch.includes(curBranch)) {
    throw new Error(`branch ${curBranch} is not allowed to be released!`);
  }
  let targetVersion = args._[0];

  if (!targetVersion) {
    // show Increment selects
    const { release } = await prompt<{ release: string }>({
      type: 'select',
      name: 'release',
      message: 'Select version Increment type',
      choices: versionIncrement
        .map((i) => `${i} (${incVersion(i)})`)
        .concat([CUSTOM]),
    });

    if (CUSTOM === release) {
      targetVersion = (
        await prompt<{ version: string }>({
          type: 'input',
          name: 'version',
          message: 'Input custom version',
          initial: curVersion,
        })
      ).version;
    } else {
      targetVersion = (release.match(/\((.*)\)/) || [])[1];
    }
  }
  console.log(targetVersion);
  // verify version str
  if (!valid(targetVersion)) {
    throw new Error(`${targetVersion} is not avaliable!`);
  }

  // confirm
  const { yes } = await prompt<{ yes: boolean }>({
    type: 'confirm',
    name: 'yes',
    message: `Will you release version: ${targetVersion}? Confirm?`,
  });

  if (!yes) return;
  const { build, changelog } = config.scripts;
  // update version
  updateVersion(targetVersion);

  // build target
  if (build) {
    infoLog('\nStart building...');
    await run('npm', ['run', build]);
    infoLog('\nBuild Done...');
  }

  // gen changelog
  if (changelog) {
    infoLog('\nGenerate changelog...');
    await run('npm', ['run', changelog]);
    infoLog('\nChangelog done...');
  }

  // get diff
  const { stdout: diff } = await run('git', ['diff'], { stdio: 'pipe' });
  if (diff) {
    // add && commit
    infoLog('\nCommit change...');
    await run('git', ['add', '-A']);
    await run('git', ['commit', '-m', `release: ${targetVersion}`]);
  } else {
    log(red('\nNothing changed...'));
  }

  // push
  const { tag, releaseUser, release } = config;
  if (tag) {
    await run('git', ['tag', `v${targetVersion}`]);
  }
  await run('git', ['push', 'origin', `${curBranch}`]);
  if (release) {
    infoLog('\nStart publish...');
    if (releaseUser && releaseUser.length) {
      // get current npm user
      const { stdout: curUser } = await run('npm', ['whoami'], {
        stdio: 'pipe',
      });
      if (!releaseUser.includes(curUser)) {
        log(red(`\nCurrent user (${curUser}) is not allowed to publish...`));
      } else {
        await run('npm', ['publish'], { stdio: 'pipe' });
        infoLog('\nPublish successful...');
      }
    }
  }
  infoLog('\nDone!');
};
