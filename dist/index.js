'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var require$$0 = require('path');
var require$$0$1 = require('fs');
var vendor = require('./vendor-89578cd2.js');
require('assert');
require('events');
require('readline');
require('child_process');
require('buffer');
require('stream');
require('util');
require('node:buffer');
require('node:path');
require('node:child_process');
require('node:process');
require('node:url');
require('os');
require('node:os');

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __awaiter(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P
      ? value
      : new P(function (resolve) {
          resolve(value);
        });
  }
  return new (P || (P = Promise))(function (resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator['throw'](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done
        ? resolve(result.value)
        : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
}

const DEFAULT_CONFIG_FILES = [
  'release.pkg.json',
  'release.pkg.js',
  'release.pkg.ts',
];
const DefaultConfig = {
  releaseBranch: ['master', 'main'],
  scripts: {
    build: 'build',
    changelog: 'changelog',
  },
  tag: true,
};
const getConfigFilePath = (root) => {
  for (const file of DEFAULT_CONFIG_FILES) {
    const filePath = require$$0.resolve(root, file);
    if (require$$0$1.existsSync(filePath)) return filePath;
  }
};
const getConfigFromFile = (resolvedPath) => {
  const ext = require$$0.extname(resolvedPath);
  if ('.js' === ext) return require(resolvedPath);
  if ('.json' === ext)
    return JSON.parse(require$$0$1.readFileSync(resolvedPath).toString());
  return null;
};
const configParse = (root = process.cwd()) => {
  const resolvedPath = getConfigFilePath(root);
  if (!resolvedPath) return DefaultConfig;
  return getConfigFromFile(resolvedPath) || DefaultConfig;
};

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
const config = configParse();
const versionIncrement = ['patch', 'minor', 'major'];
const CUSTOM = 'custom';
const getCurBranch = () =>
  __awaiter(void 0, void 0, void 0, function* () {
    const { stdout } = yield run('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
      stdio: 'pipe',
    });
    return stdout;
  });
const release = () =>
  __awaiter(void 0, void 0, void 0, function* () {
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
        targetVersion = yield vendor.enquirer.prompt({
          type: 'input',
          name: 'version',
          message: 'Input custom version',
          initial: curVersion,
        });
      } else {
        targetVersion = (release.match(/\((.*)\)/) || [])[1];
      }
    }
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
    if (tag) {
      yield run('git', ['tag', `v${targetVersion}`]);
    }
    yield run('git', ['push', 'origin', `${curBranch}`]);
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
release();

exports.getCurBranch = getCurBranch;
exports.release = release;
