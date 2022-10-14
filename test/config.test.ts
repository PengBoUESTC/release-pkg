import { loadConfig } from '../dist/config';

test('test config parse', async () => {
  const config = await loadConfig('release');
  expect(config).toMatchSnapshot();
});