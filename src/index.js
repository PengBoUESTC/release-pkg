"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.release = exports.getCurBranch = void 0;
const path_1 = require("path");
const fs_1 = require("fs");
const minimist_1 = __importDefault(require("minimist"));
const enquirer_1 = require("enquirer");
const semver_1 = require("semver");
const execa_1 = require("execa");
const kolorist_1 = require("kolorist");
const PKG = 'package.json';
// get cwd
const root = process.cwd();
const rootPkg = (0, path_1.resolve)(root, PKG);
// get args
const args = (0, minimist_1.default)(process.argv.slice(2));
// get pkgMsg
const pkgInfo = require(rootPkg);
// get current version 
const curVersion = pkgInfo.version;
const run = (bin, args, opts = {}) => (0, execa_1.execa)(bin, args, Object.assign({ stdio: 'inherit' }, opts));
const log = (message) => console.log(message);
const incVersion = (release) => (0, semver_1.inc)(curVersion, release);
const updateVersion = (version) => {
    (0, fs_1.writeFileSync)(rootPkg, Object.assign(Object.assign({}, pkgInfo), { version }));
};
const versionIncrement = [
    'patch',
    'minor',
    'major',
];
const CUSTOM = 'custom';
const ReleaseBranch = [
    'master'
];
const getCurBranch = () => __awaiter(void 0, void 0, void 0, function* () {
    const { stdout } = yield run('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { stdio: 'pipe' });
    return stdout;
});
exports.getCurBranch = getCurBranch;
const release = () => __awaiter(void 0, void 0, void 0, function* () {
    log((0, kolorist_1.green)('\n Release start...'));
    // branch check 
    const curBranch = yield (0, exports.getCurBranch)();
    if (!ReleaseBranch.includes(curBranch)) {
        throw new Error(`branch ${curBranch} is not allowed to be released!`);
    }
    let targetVersion = args._[0];
    if (!targetVersion) {
        // show Increment selects 
        const { release } = yield (0, enquirer_1.prompt)({
            type: 'select',
            name: 'release',
            message: 'Select version Increment type',
            choices: versionIncrement.map(i => `${i} (${incVersion(i)})`).concat([CUSTOM])
        });
        if (CUSTOM === release) {
            targetVersion = yield (0, enquirer_1.prompt)({
                type: 'input',
                name: 'version',
                message: 'Input custom version',
                initial: curVersion
            });
        }
        else {
            targetVersion = release.match(/\((.*)\)/)[1];
        }
    }
    // verify version str
    if (!(0, semver_1.valid)(targetVersion)) {
        throw new Error(`${targetVersion} is not avaliable!`);
    }
    // confirm
    const { yes } = yield (0, enquirer_1.prompt)({
        type: 'confirm',
        name: 'yes',
        message: `Will you release version: ${targetVersion}? Confirm?`
    });
    if (!yes)
        return;
    // build target 
    log((0, kolorist_1.green)('\nStart building...'));
    yield run('npm', ['run', 'build']);
    // update version
    updateVersion(targetVersion);
    // gen changelog
    log((0, kolorist_1.green)('\nGenerate changelog...'));
    yield run('npm', ['run', 'changelog']);
    // get diff
    const { stdout: diff } = yield run('git', ['diff'], { stdio: 'pipe' });
    if (diff) {
        // add && commit
        log((0, kolorist_1.green)('\nCommit change...'));
        yield run('git', ['add', '-A']);
        yield run('git', ['commit', '-m', `release: ${targetVersion}`]);
    }
    else {
        log((0, kolorist_1.red)('\nNothing changed...'));
    }
    // push
    yield run('git', ['tag', `v${targetVersion}`]);
    yield run('git', ['push', 'origin', `${curBranch}`]);
    log((0, kolorist_1.green)('\nDone!'));
});
exports.release = release;
