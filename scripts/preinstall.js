// Preinstall script to install @eventbrite/marmalade from GitHub
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('=== Preinstall script running ===');
console.log('Current directory:', process.cwd());
console.log('All environment variables:', Object.keys(process.env).filter(k => k.includes('GITHUB') || k.includes('TOKEN') || k.includes('VERCEL')).join(', '));

// Try multiple possible environment variable names
const githubToken = process.env.GITHUB_TOKEN || 
                    process.env.VERCEL_GITHUB_TOKEN || 
                    process.env.GH_TOKEN ||
                    process.env.GITHUB_PAT;

console.log('GITHUB_TOKEN exists:', !!process.env.GITHUB_TOKEN);
console.log('VERCEL_GITHUB_TOKEN exists:', !!process.env.VERCEL_GITHUB_TOKEN);
console.log('GH_TOKEN exists:', !!process.env.GH_TOKEN);
console.log('GITHUB_PAT exists:', !!process.env.GITHUB_PAT);
console.log('Using token:', githubToken ? 'YES (hidden)' : 'NO');

if (!githubToken) {
  console.error('ERROR: GitHub token not found in environment variables');
  console.error('Available env vars with GITHUB/TOKEN:', Object.keys(process.env).filter(k => 
    k.toUpperCase().includes('GITHUB') || k.toUpperCase().includes('TOKEN')
  ).join(', '));
  console.error('');
  console.error('Please ensure GITHUB_TOKEN is set in Vercel:');
  console.error('1. Go to Project Settings → Environment Variables');
  console.error('2. Add GITHUB_TOKEN with your GitHub Personal Access Token');
  console.error('3. Make sure it\'s enabled for Production, Preview, and Development');
  console.error('4. Redeploy the project');
  process.exit(1);
}

const packageJsonPath = path.join(__dirname, '..', 'package.json');
const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
const marmaladePath = path.join(nodeModulesPath, '@eventbrite', 'marmalade');

console.log('Reading package.json from:', packageJsonPath);

if (!fs.existsSync(packageJsonPath)) {
  console.error('ERROR: package.json not found at', packageJsonPath);
  process.exit(1);
}

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Repository URL
const repoUrl = process.env.MARMALADE_REPO || 'eventbrite/marmalade';
// Use HTTPS format with token embedded
const gitUrl = `https://${githubToken}@github.com/${repoUrl}.git`;

console.log(`Installing @eventbrite/marmalade from ${repoUrl}...`);
console.log('Git URL (token hidden):', `https://***@github.com/${repoUrl}.git`);

// Create node_modules directories if they don't exist
if (!fs.existsSync(nodeModulesPath)) {
  fs.mkdirSync(nodeModulesPath, { recursive: true });
}
if (!fs.existsSync(path.join(nodeModulesPath, '@eventbrite'))) {
  fs.mkdirSync(path.join(nodeModulesPath, '@eventbrite'), { recursive: true });
}

// Remove existing installation if it exists
if (fs.existsSync(marmaladePath)) {
  console.log('Removing existing marmalade installation...');
  fs.rmSync(marmaladePath, { recursive: true, force: true });
}

// Clone the repository directly using git clone
try {
  console.log('Cloning repository using git clone...');
  execSync(`git clone --depth 1 ${gitUrl} ${marmaladePath}`, {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, GITHUB_TOKEN: githubToken }
  });
  
  console.log('✓ Successfully cloned marmalade package');
  
  // Update package.json to reference the local installation
  packageJson.dependencies['@eventbrite/marmalade'] = `file:${marmaladePath}`;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
  
  console.log('✓ Package.json updated to use local file installation');
  console.log('✓ Preinstall script completed successfully');
} catch (error) {
  console.error('✗ Failed to clone repository:', error.message);
  console.error('Error details:', error);
  
  // If cloning fails, try installing via npm with the token in the URL
  console.log('Attempting fallback: installing via npm...');
  try {
    // Set up git config to use HTTPS
    execSync('git config --global url."https://".insteadOf ssh://', { stdio: 'ignore' });
    execSync('git config --global url."https://github.com/".insteadOf git@github.com:', { stdio: 'ignore' });
    
    // Update package.json with Git URL
    packageJson.dependencies['@eventbrite/marmalade'] = `git+${gitUrl}`;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
    
    console.log('✓ Package.json updated with Git URL (npm will install)');
  } catch (fallbackError) {
    console.error('✗ Fallback also failed:', fallbackError.message);
    process.exit(1);
  }
}

console.log('=== Preinstall script completed ===');
