#!/usr/bin/env node
import { readdirSync, statSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import process from 'node:process';

function fail(msg) {
  console.error(`[AgentOS] FAIL: ${msg}`);
  process.exitCode = 1;
}
function ok(msg) {
  console.log(`[AgentOS] OK: ${msg}`);
}

const root = process.cwd();
const knowledgeDir = join(root, 'Agent OS', 'knowledge');
const pagesDir = join(knowledgeDir, 'pages');
const compsDir = join(knowledgeDir, 'components');

// 1) Required files exist
if (!existsSync(join(knowledgeDir, 'INDEX.md'))) fail('Missing knowledge/INDEX.md'); else ok('knowledge/INDEX.md present');
if (!existsSync(join(compsDir, 'AllComponentsIndex.md'))) fail('Missing components/AllComponentsIndex.md'); else ok('AllComponentsIndex.md present');

// 2) No duplicate page docs like {name}.md and {name}-page.md
try {
  const files = readdirSync(pagesDir).filter(f => f.endsWith('.md'));
  const baseNames = new Set(files.map(f => f.replace(/-page\.md$/, '.md')));
  for (const f of files) {
    if (f.endsWith('-page.md')) {
      const base = f.replace(/-page\.md$/, '.md');
      if (files.includes(base)) fail(`Duplicate page docs detected: ${base} and ${f}`);
    }
  }
  ok('No duplicate page docs');
} catch (e) {
  fail(`Error scanning page docs: ${e.message}`);
}

// 3) Presence scan: src/app pages should have at least one knowledge doc (best-effort heuristic)
// This is a soft check; prints warnings only
try {
  const appDir = join(root, 'src', 'app');
  const routes = [];
  const stack = [appDir];
  while (stack.length) {
    const dir = stack.pop();
    const entries = readdirSync(dir);
    for (const name of entries) {
      const full = join(dir, name);
      const s = statSync(full);
      if (s.isDirectory()) stack.push(full);
      else if (name === 'page.tsx' || name === 'page.ts') routes.push(full);
    }
  }
  const pageDocs = new Set(readdirSync(pagesDir).map(f => f.toLowerCase()));
  let missing = 0;
  for (const r of routes) {
    const rel = r.replace(appDir + '\\', '').replace(appDir + '/', '');
    const firstSeg = rel.split(/[\\/]/)[0] || 'root';
    let candidates = [];
    if (rel === 'page.tsx' || rel === 'page.ts') {
      candidates = ['welcome.md'];
    } else {
      candidates = [
        `${firstSeg}.md`,
        `${firstSeg}-page.md`,
        `${firstSeg.replace(/\[|\]/g, '')}.md`,
      ].map(s => s.toLowerCase());
    }
    if (!candidates.some(c => pageDocs.has(c))) {
      console.warn(`[AgentOS] WARN: Missing knowledge doc for route segment '${firstSeg}'`);
      missing++;
    }
  }
  if (missing === 0) ok('Knowledge coverage heuristic passed');
} catch (e) {
  console.warn(`[AgentOS] WARN: Skipped coverage heuristic: ${e.message}`);
}

async function checkPrBody() {
  try {
    const eventName = process.env.GITHUB_EVENT_NAME || '';
    if (eventName !== 'pull_request') return; // only PRs
    const token = process.env.GITHUB_TOKEN;
    if (!token) return;
    const eventPath = process.env.GITHUB_EVENT_PATH;
    if (!eventPath) return;
    const evt = JSON.parse(await (await import('node:fs/promises')).readFile(eventPath, 'utf8'));
    const body = evt.pull_request?.body || '';
    const hasBMAD = /bmad/i.test(body);
    const hasAwesome = /awesome-claude-code/i.test(body);
    if (!hasBMAD || !hasAwesome) fail('PR body must include BMAD and awesome-claude-code references/links.'); else ok('PR body includes BMAD + awesome references');
  } catch (e) {
    console.warn(`[AgentOS] WARN: PR body check skipped: ${e.message}`);
  }
}

await checkPrBody();

process.exit(process.exitCode || 0); 