// Postinstall script to ensure @eventbrite/marmalade is installed
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const packagePath = path.join(__dirname, '..', 'node_modules', '@eventbrite', 'marmalade');

console.log('=== Checking for @eventbrite/marmalade ===');
console.log('Package path:', packagePath);
console.log('Package exists:', fs.existsSync(packagePath));

if (fs.existsSync(packagePath)) {
  console.log('✓ @eventbrite/marmalade is already installed');
  process.exit(0);
}

if (!process.env.GITHUB_TOKEN) {
  console.error('ERROR: GITHUB_TOKEN environment variable is required');
  process.exit(1);
}

// Configure Git to use HTTPS instead of SSH
try {
  execSync('git config --global url."https://".insteadOf ssh://', { stdio: 'ignore' });
  execSync('git config --global url."https://github.com/".insteadOf git@github.com:', { stdio: 'ignore' });
} catch (error) {
  // Ignore errors
}

const repoUrl = process.env.MARMALADE_REPO || 'eventbrite/marmalade';
// Use HTTPS format explicitly - npm will use this format
const gitUrl = `https://${process.env.GITHUB_TOKEN}@github.com/${repoUrl}.git`;

console.log(`Installing @eventbrite/marmalade from ${repoUrl}...`);

try {
  // Use git+https format to ensure npm uses HTTPS
  execSync(`npm install git+${gitUrl} --no-save`, {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  console.log('✓ Successfully installed @eventbrite/marmalade');
} catch (error) {
  console.error('✗ Failed to install @eventbrite/marmalade:', error.message);
  process.exit(1);
}
