// bundle_context.js
const fs = require('fs');
const path = require('path');

// Configuration
const OUTPUT_FILE = 'GEM_KNOWLEDGE.md';
const IGNORE_FILES = ['bundle_context.js', 'package.json', 'package-lock.json', '.gitignore'];

function bundle() {
    const dir = __dirname;
    const files = fs.readdirSync(dir);
    
    let content = "# NEXUS OS - CURRENT CODEBASE\n\n";
    content += `Last Updated: ${new Date().toISOString()}\n\n`;

    // 1. Read Manifesto first (if exists)
    if (fs.existsSync(path.join(dir, '_Admin', 'SYSTEM_MANIFESTO.md'))) {
        content += "## SYSTEM MANIFESTO\n";
        content += fs.readFileSync(path.join(dir, '_Admin', 'SYSTEM_MANIFESTO.md'), 'utf8');
        content += "\n\n---\n\n";
    }

    // 2. Read all .gs and .js files
    files.forEach(file => {
        if (file.endsWith('.gs') || file.endsWith('.js')) {
            if (IGNORE_FILES.includes(file)) return;

            content += `## FILE: ${file}\n`;
            content += "```javascript\n";
            content += fs.readFileSync(path.join(dir, file), 'utf8');
            content += "\n```\n\n";
        }
    });

    fs.writeFileSync(OUTPUT_FILE, content);
    console.log(`✅ bundled ${files.length} files into ${OUTPUT_FILE}`);
}

bundle();