/**
 * make-release.js
 * 
 * Run after `npm run build` to create GitHub-ready zip files:
 *   - release/Flux-Terminal-v1.0.0-Windows-x64.zip  (64-bit portable)
 *   - release/Flux-Terminal-v1.0.0-Windows-x32.zip  (32-bit portable)
 * 
 * Usage: node make-release.js
 */

const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const pkg     = require('./package.json');
const version = pkg.version || '1.0.0';

const releaseDir = path.join(__dirname, 'release');

const builds = [
  { folder: 'win-unpacked',      zip: `Flux-Terminal-v${version}-Windows-x64.zip`,  label: '64-bit (x64)' },
  { folder: 'win-ia32-unpacked', zip: `Flux-Terminal-v${version}-Windows-x32.zip`,  label: '32-bit (x32)' },
];

console.log(`\n🚀 Flux Terminal v${version} — Building GitHub Release Zips\n`);

for (const { folder, zip, label } of builds) {
  const srcDir  = path.join(releaseDir, folder);
  const outZip  = path.join(releaseDir, zip);

  if (!fs.existsSync(srcDir)) {
    console.warn(`  ⚠️  Skipping ${label}: folder not found → ${srcDir}`);
    continue;
  }

  // Delete old zip if exists
  if (fs.existsSync(outZip)) fs.unlinkSync(outZip);

  console.log(`  📦 Zipping ${label}...`);
  console.log(`     Source : ${srcDir}`);
  console.log(`     Output : ${outZip}`);

  // Use PowerShell Compress-Archive (available on all modern Windows)
  const cmd = `powershell -Command "Compress-Archive -Path '${srcDir}\\*' -DestinationPath '${outZip}' -Force"`;
  execSync(cmd, { stdio: 'inherit' });

  const sizeMB = (fs.statSync(outZip).size / 1024 / 1024).toFixed(1);
  console.log(`     ✅ Done! Size: ${sizeMB} MB\n`);
}

console.log('📋 GitHub Release Files:');
for (const { zip } of builds) {
  const outZip = path.join(releaseDir, zip);
  if (fs.existsSync(outZip)) {
    const sizeMB = (fs.statSync(outZip).size / 1024 / 1024).toFixed(1);
    console.log(`   → release/${zip}  (${sizeMB} MB)`);
  }
}
console.log('\n✨ Upload these zip files to your GitHub Release!\n');
