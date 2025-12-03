#!/usr/bin/env node
import { activate } from './hooks/activate';

const [projectDir] = process.argv;

if (!projectDir) {
  console.error('Usage: skipsetup-plugin-small <project-directory>');
  process.exit(1);
}

try {
  activate(projectDir);
  console.log('Plugin activation complete.');
} catch {
  console.error(' Plugin activation failed');
  process.exit(1);
}
