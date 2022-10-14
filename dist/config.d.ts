import type { LoadOptions } from '@proload/core';
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
export declare const loadConfig: (
  namespace: string,
  options?: LoadOptions<Record<any, any>>
) => Promise<Config>;
export declare function defineConfig(config: Config): Config;
