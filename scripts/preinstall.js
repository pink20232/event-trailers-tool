// Preinstall script to install @eventbrite/marmalade from GitHub
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('=== Preinstall script running ===');
console.log('GITHUB_TOKEN exists:', !!process.env.GITHUB_TOKEN);
console.log('Current directory:', process.cwd());

if (!process.env.GITHUB_TOKEN) {
  console.error('ERROR: GITHUB_TOKEN environment variable is required');
  console.error('Please set GITHUB_TOKEN in your Vercel environment variables');
  process.exit(1);
}

const packageJsonPath = path.join(__dirname, '..', 'package.json');
console.log('Reading package.json from:', packageJsonPath);

if (!fs.existsSync(packageJsonPath)) {
  console.error('ERROR: package.json not found at', packageJsonPath);
  process.exit(1);
}

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Try common repository paths - update this with the correct one
const repoUrl = process.env.MARMALADE_REPO || 'eventbrite/design-ops-ds';
const gitUrl = `git+https://${process.env.GITHUB_TOKEN}@github.com/${repoUrl}.git`;

console.log(`Installing @eventbrite/marmalade from ${repoUrl}...`);
console.log('Git URL (token hidden):', `git+https://***@github.com/${repoUrl}.git`);

try {
  // Update package.json to use the authenticated URL
  const originalDep = packageJson.dependencies['@eventbrite/marmalade'];
  console.log('Original dependency:', originalDep);
  
  packageJson.dependencies['@eventbrite/marmalade'] = gitUrl;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
  
  console.log('✓ Package.json updated with authenticated Git URL');
  console.log('New dependency:', gitUrl.replace(process.env.GITHUB_TOKEN, '***'));
} catch (error) {
  console.error('✗ Failed to update package.json:', error.message);
  console.error(error.stack);
  process.exit(1);
}

console.log('=== Preinstall script completed ===');
