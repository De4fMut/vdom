import { readFileSync, writeFileSync } from 'fs';
const files = [
    'src/vnode.js',
    'src/diff.js',
    'src/renderer.js',
    'src/main.js'
];

let output = '';
files.forEach(file => {
    let content = readFileSync(file, 'utf8');
    content = content
        .replace(/export\s+(const|function|class|{)/g, '$1')
        .replace(/import\s*{[^}]*}\s*from\s*['"][^'"]+['"];?/g, '');
    output += content + '\n\n';
});

writeFileSync('dist/bundle.js', output);