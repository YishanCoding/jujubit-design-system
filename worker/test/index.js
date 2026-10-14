// Node resolves an explicit directory argument through index.js.
import { readdir } from 'node:fs/promises';
for (const file of (await readdir(new URL('.', import.meta.url))).sort()) {
  if (file.endsWith('.test.js')) await import(new URL(file, import.meta.url));
}
