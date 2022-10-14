import { resolve } from 'path';
import { loadConfig } from '../dist/config';

test('test config parse', async () => {
  const config = await loadConfig('release');
  expect(config).toMatchSnapshot();
});

test('test config parse', async () => {
  const config = await loadConfig('define', { filePath: resolve(__dirname, './test.config/define.config.ts') });
  expect(config).toMatchSnapshot();
});
