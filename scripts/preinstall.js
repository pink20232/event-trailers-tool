// Preinstall script to install @eventbrite/marmalade from GitHub
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

if (!process.env.GITHUB_TOKEN) {
  console.error('ERROR: GITHUB_TOKEN environment variable is required');
  console.error('Please set GITHUB_TOKEN in your Vercel environment variables');
  process.exit(1);
}

const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Try common repository paths - update this with the correct one
const repos = [
  process.env.MARMALADE_REPO || 'eventbrite/design-ops-ds',
  'eventbrite/marmalade',
  'eventbrite/design-system'
];

const gitUrl = `git+https://${process.env.GITHUB_TOKEN}@github.com/${repos[0]}.git`;

console.log(`Installing @eventbrite/marmalade from ${repos[0]}...`);

try {
  // Update package.json temporarily to use the authenticated URL
  const originalDep = packageJson.dependencies['@eventbrite/marmalade'];
  packageJson.dependencies['@eventbrite/marmalade'] = gitUrl;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
  
  console.log('Package.json updated with authenticated Git URL');
} catch (error) {
  console.error('Failed to update package.json:', error.message);
  process.exit(1);
}
