import { resolve } from 'path';
import { writeFileSync } from 'fs';
import minimist from 'minimist';
import { prompt } from 'enquirer';
import { inc, valid } from 'semver';
import { execa } from 'execa';
import { green, red } from 'kolorist';
import type { Options } from 'execa';
import type { ReleaseType } from 'semver';

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
const incVersion = (release: ReleaseType) => inc(curVersion, release);
const updateVersion = (version: string) => {
  writeFileSync(rootPkg, {
    ...pkgInfo,
    version,
  });
};

const versionIncrement: ReleaseType[] = ['patch', 'minor', 'major'];

const CUSTOM = 'custom';

const ReleaseBranch = ['master'];

export const getCurBranch = async () => {
  const { stdout } = await run('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
    stdio: 'pipe',
  });
  return stdout;
};

export const release = async () => {
  log(green('\n Release start...'));
  // branch check
  const curBranch = await getCurBranch();
  if (!ReleaseBranch.includes(curBranch)) {
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
      targetVersion = await prompt({
        type: 'input',
        name: 'version',
        message: 'Input custom version',
        initial: curVersion,
      });
    } else {
      targetVersion = release.match(/\((.*)\)/)![1];
    }
  }

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

  // build target
  log(green('\nStart building...'));
  await run('npm', ['run', 'build']);

  // update version
  updateVersion(targetVersion);

  // gen changelog
  log(green('\nGenerate changelog...'));
  await run('npm', ['run', 'changelog']);

  // get diff
  const { stdout: diff } = await run('git', ['diff'], { stdio: 'pipe' });
  if (diff) {
    // add && commit
    log(green('\nCommit change...'));
    await run('git', ['add', '-A']);
    await run('git', ['commit', '-m', `release: ${targetVersion}`]);
  } else {
    log(red('\nNothing changed...'));
  }

  // push
  await run('git', ['tag', `v${targetVersion}`]);
  await run('git', ['push', 'origin', `${curBranch}`]);
  log(green('\nDone!'));
};
