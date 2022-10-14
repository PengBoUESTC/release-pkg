'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var release = require('./release.js');
var config = require('./config.js');
require('path');
require('fs');
require('./vendor.js');
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
require('module');
require('url');
require('process');

release.release();

exports.release = release.release;
exports.loadConfig = config.loadConfig;
