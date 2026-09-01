import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('route.ts')) results.push(file);
    }
  });
  return results;
}

const routes = walk('src/app/api');
for (const file of routes) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('export async function GET') && !content.includes('force-dynamic')) {
    content = `export const dynamic = 'force-dynamic';\n\n` + content;
    fs.writeFileSync(file, content);
    console.log('Fixed', file);
  }
}
