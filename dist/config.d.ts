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
export declare const configParse: (root?: string) => Config;
