import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

// Deterministic PDF extraction and asset preparation. PE is image-only and was visually transcribed.
const root = path.resolve(import.meta.dirname, '..');
const pdfTool = process.argv[2] ?? 'pdftotext';
const files = [
  ['gat', '20251227140287889.pdf', 2], ['mathematics', '202512271521179041.pdf', 10],
  ['physical-education', '202512271937553070.pdf', 4], ['chemistry', '20251227437950608.pdf', 4], ['english', '20251227980877010.pdf', 2],
];
mkdirSync(path.join(root, 'public/syllabus'), { recursive: true });
mkdirSync(path.join(root, 'data'), { recursive: true });
const sources = files.map(([subject, file, pageCount]) => {
  const input = path.join(root, file);
  copyFileSync(input, path.join(root, 'public/syllabus', file));
  const result = spawnSync(pdfTool, ['-layout', input, '-'], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`PDF extraction failed for ${file}: ${result.error?.message ?? result.stderr}`);
  const pages = result.stdout.split('\f').slice(0, pageCount).map((text, index) => ({ page: index + 1, text: text.trim() }));
  if (pages.length !== pageCount) throw new Error(`Unexpected page count for ${file}`);
  return { subject, file, pageCount, sha256: createHash('sha256').update(readFileSync(input)).digest('hex'), extraction: subject === 'physical-education' ? 'image-only; visual transcription in syllabus dataset' : 'Poppler layout extraction, manually structured', pages };
});
writeFileSync(path.join(root, 'data/source-pages.json'), JSON.stringify(sources, null, 2) + '\n');
console.log(`Prepared ${sources.length} sources, ${sources.reduce((sum, source) => sum + source.pageCount, 0)} pages.`);
