'use strict';

var config$1 = require('./config.js');
var require$$0 = require('path');
var require$$0$1 = require('fs');
var vendor = require('./vendor.js');

const PKG = 'package.json';
const root = process.cwd();
const rootPkg = require$$0.resolve(root, PKG);
const args = vendor.minimist(process.argv.slice(2));
const pkgInfo = require(rootPkg);
const curVersion = pkgInfo.version;
const run = (bin, args, opts = {}) =>
  vendor.execa(bin, args, Object.assign({ stdio: 'inherit' }, opts));
const log = (message) => console.log(message);
const infoLog = (message) => log(vendor.green(message));
const warnLog = (message) => log(vendor.yellow(message));
const incVersion = (release) => vendor.semver.inc(curVersion, release);
const updateVersion = (version) => {
  require$$0$1.writeFileSync(
    rootPkg,
    JSON.stringify(
      Object.assign(Object.assign({}, pkgInfo), { version }),
      null,
      2
    ) + '\n'
  );
};
let config;
const versionIncrement = ['patch', 'minor', 'major'];
const CUSTOM = 'custom';
const getCurBranch = () =>
  config$1.__awaiter(void 0, void 0, void 0, function* () {
    const { stdout } = yield run('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
      stdio: 'pipe',
    });
    return stdout;
  });
const release = () =>
  config$1.__awaiter(void 0, void 0, void 0, function* () {
    config = yield config$1.loadConfig('release');
    infoLog('\n Release start...');
    const curBranch = yield getCurBranch();
    const { releaseBranch } = config;
    if (!releaseBranch.includes(curBranch)) {
      throw new Error(`branch ${curBranch} is not allowed to be released!`);
    }
    let targetVersion = args._[0];
    if (!targetVersion) {
      const { release } = yield vendor.enquirer.prompt({
        type: 'select',
        name: 'release',
        message: 'Select version Increment type',
        choices: versionIncrement
          .map((i) => `${i} (${incVersion(i)})`)
          .concat([CUSTOM]),
      });
      if (CUSTOM === release) {
        targetVersion = (yield vendor.enquirer.prompt({
          type: 'input',
          name: 'version',
          message: 'Input custom version',
          initial: curVersion,
        })).version;
      } else {
        targetVersion = (release.match(/\((.*)\)/) || [])[1];
      }
    }
    console.log(targetVersion);
    if (!vendor.semver.valid(targetVersion)) {
      throw new Error(`${targetVersion} is not avaliable!`);
    }
    const { yes } = yield vendor.enquirer.prompt({
      type: 'confirm',
      name: 'yes',
      message: `Will you release version: ${targetVersion}? Confirm?`,
    });
    if (!yes) return;
    const { build, changelog } = config.scripts;
    updateVersion(targetVersion);
    if (build) {
      infoLog('\nStart building...');
      yield run('npm', ['run', build]);
      infoLog('\nBuild Done...');
    }
    if (changelog) {
      infoLog('\nGenerate changelog...');
      yield run('npm', ['run', changelog]);
      infoLog('\nChangelog done...');
    }
    const { stdout: diff } = yield run('git', ['diff'], { stdio: 'pipe' });
    if (diff) {
      infoLog('\nCommit change...');
      yield run('git', ['add', '-A']);
      yield run('git', ['commit', '-m', `release: ${targetVersion}`]);
    } else {
      log(vendor.red('\nNothing changed...'));
    }
    const { tag, releaseUser, release } = config;
    try {
      if (tag) {
        yield run('git', ['tag', `v${targetVersion}`]);
      }
    } catch (e) {
      return log(vendor.red(`\nGit Tag error... \n${e.message}`));
    }
    try {
      yield run('git', ['push', 'origin', `${curBranch}`]);
    } catch (e) {
      log(vendor.red('\nGit Push stoped...'));
      release && warnLog('\nPkg release stoped...');
    }
    if (release) {
      infoLog('\nStart publish...');
      if (releaseUser && releaseUser.length) {
        const { stdout: curUser } = yield run('npm', ['whoami'], {
          stdio: 'pipe',
        });
        if (!releaseUser.includes(curUser)) {
          log(
            vendor.red(
              `\nCurrent user (${curUser}) is not allowed to publish...`
            )
          );
        } else {
          yield run('npm', ['publish'], { stdio: 'pipe' });
          infoLog('\nPublish successful...');
        }
      }
    }
    infoLog('\nDone!');
  });

exports.release = release;
