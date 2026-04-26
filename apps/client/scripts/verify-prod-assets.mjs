import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const distDir = new URL('../dist/browser/', import.meta.url);
const indexPath = new URL('index.html', distDir);
const indexHtml = readFileSync(indexPath, 'utf8');
const files = readdirSync(distDir).filter((file) => statSync(join(distDir.pathname, file)).isFile());

const unhashedEntrypoints = [
  'main.js',
  'polyfills.js',
  'styles.css'
];

const missingHashEntrypoints = [
  /(?:^|")main-[A-Z0-9]{8}\.js(?:$|")/,
  /(?:^|")polyfills-[A-Z0-9]{8}\.js(?:$|")/,
  /(?:^|")styles-[A-Z0-9]{8}\.css(?:$|")/
];

for (const fileName of unhashedEntrypoints) {
  if (files.includes(fileName) || indexHtml.includes(`"${fileName}"`) || indexHtml.includes(`/${fileName}`)) {
    throw new Error(`Production build contains an unhashed cache-sensitive asset: ${fileName}`);
  }
}

for (const pattern of missingHashEntrypoints) {
  if (!pattern.test(indexHtml) && !files.some((fileName) => pattern.test(fileName))) {
    throw new Error(`Production build is missing expected hashed asset matching ${pattern}`);
  }
}

if (!indexHtml.includes('./runtime-config.js')) {
  throw new Error('Production index must load runtime-config.js before Angular starts.');
}

console.log('Production asset cache guard passed.');
