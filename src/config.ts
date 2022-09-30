import { resolve } from 'path';
import { existsSync } from 'fs';

const DEFAULT_CONFIG_FILES = [
  'release.pkg.json',
  'release.pkg.js',
  'release.pkg.ts',
];

export interface Config {
  releaseBranch: string[];
  scripts: {
    build: string;
    changelog: string;
  };
  tag?: boolean;
}

const getConfigFilePath = (root: string): string | undefined => {
  for (const file of DEFAULT_CONFIG_FILES) {
    const filePath = resolve(root, file);
    if (existsSync(filePath)) return filePath;
  }
};

export const configParse = (root: string = process.cwd()): Config | null => {
  const resolvedPath = getConfigFilePath(root);
  if (!resolvedPath) return null;

  // const config =
  return {
    releaseBranch: [],
    scripts: {
      build: 'build',
      changelog: 'changelog',
    },
  };
};
