'use strict';

var process = require('process');
var vendor = require('./vendor.js');

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

function preloadPlugin() {
  return {
    name: '@proload/plugin-tsm',
    extensions: ['ts', 'tsx', 'cts', 'mts'],
    register(fileName) {
      return __awaiter(this, void 0, void 0, function* () {
        if (/\.([cm]ts|tsx?)$/.test(fileName)) {
          yield require('tsm');
        }
      });
    },
  };
}
vendor.load.use([preloadPlugin()]);
const DefaultConfig = {
  releaseBranch: ['master', 'main'],
  scripts: {
    build: 'build',
    changelog: 'changelog',
  },
  tag: true,
};
const loadConfig = (namespace, options = {}) =>
  __awaiter(void 0, void 0, void 0, function* () {
    const config = yield vendor.load(
      namespace,
      Object.assign({ cwd: process.cwd() }, options)
    );
    return (
      (config === null || config === void 0 ? void 0 : config.value) ||
      DefaultConfig
    );
  });
function defineConfig(config) {
  return config;
}

exports.__awaiter = __awaiter;
exports.defineConfig = defineConfig;
exports.loadConfig = loadConfig;
