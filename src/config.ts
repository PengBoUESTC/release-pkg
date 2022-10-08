import { resolve, extname } from 'path';
import { existsSync, readFileSync } from 'fs';

const DEFAULT_CONFIG_FILES = [
  'release.pkg.json',
  'release.pkg.js',
  'release.pkg.ts',
];

const enum CONFIG_EXT {
  JSON = '.json',
  JS = '.js',
  TS = '.ts',
}

const DefaultConfig = {
  releaseBranch: ['master', 'main'],
  scripts: {
    build: 'build',
    changelog: 'changelog',
  },
  tag: true,
};

export interface Config {
  releaseBranch: string[];
  releaseUser?: string[];
  scripts: {
    build: string;
    changelog: string;
  };
  tag?: boolean;
  release?: boolean;
}

const getConfigFilePath = (root: string): string | undefined => {
  for (const file of DEFAULT_CONFIG_FILES) {
    const filePath = resolve(root, file);
    if (existsSync(filePath)) return filePath;
  }
};

const getConfigFromFile = (resolvedPath: string): Config | null => {
  const ext = extname(resolvedPath);
  if (CONFIG_EXT.JS === ext) return require(resolvedPath);
  if (CONFIG_EXT.JSON === ext)
    return JSON.parse(readFileSync(resolvedPath).toString());

  return null;
};

export const configParse = (root: string = process.cwd()): Config => {
  const resolvedPath = getConfigFilePath(root);
  if (!resolvedPath) return DefaultConfig;

  return getConfigFromFile(resolvedPath) || DefaultConfig;
};
