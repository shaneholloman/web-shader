#!/usr/bin/env node

/**
 * Copy TypeScript Types to Docs
 * 
 * Copies all .d.ts files from dist/ to the docs app public folder
 * so Monaco editor can load them with proper import resolution.
 */

const fs = require('fs');
const path = require('path');

const DIST_DIR = path.join(__dirname, '..', 'dist');
const OUTPUT_DIR = path.join(__dirname, '..', '..', '..', 'apps', 'docs', 'public', 'ralph-gpu-types');

function copyTypes() {
  // Check if dist directory exists
  if (!fs.existsSync(DIST_DIR)) {
    console.error('⚠ dist/ directory not found. Run build first.');
    process.exit(1);
  }

  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Read all .d.ts files (excluding .d.ts.map)
  const files = fs
    .readdirSync(DIST_DIR)
    .filter((f) => f.endsWith('.d.ts') && !f.endsWith('.d.ts.map'));

  if (files.length === 0) {
    console.error('⚠ No .d.ts files found in dist/');
    process.exit(1);
  }

  // Copy each file as-is (preserving imports/exports)
  let count = 0;
  for (const file of files) {
    const sourcePath = path.join(DIST_DIR, file);
    const destPath = path.join(OUTPUT_DIR, file);
    fs.copyFileSync(sourcePath, destPath);
    count++;
  }

  console.log(`✓ Copied ${count} type files to apps/docs/public/ralph-gpu-types/`);
}

copyTypes();
