import { cwd } from 'process';
import load from '@proload/core';
import type { Config as Pre_Config } from '@proload/core';

function preloadPlugin() {
  return {
    name: '@proload/plugin-tsm',
    extensions: ['ts', 'tsx', 'cts', 'mts'],
    async register(fileName: string) {
      if (/\.([cm]ts|tsx?)$/.test(fileName)) {
        await require('tsm');
      }
    },
  };
}

load.use([preloadPlugin()]);

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

export const loadConfig = async (namespace: string): Promise<Config> => {
  const config = (await load(namespace, { cwd: cwd() })) as
    | Pre_Config<Config>
    | undefined;

  return config?.value || DefaultConfig;
};
