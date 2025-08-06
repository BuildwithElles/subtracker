#!/usr/bin/env node

/**
 * GitHub Actions Setup Verification Script
 * Verifies that all necessary files and configurations are in place
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 GitHub Actions Setup Verification\n');

const checks = [
  {
    name: 'CI/CD Workflow File',
    path: '.github/workflows/ci.yml',
    required: true
  },
  {
    name: 'Development Workflow File', 
    path: '.github/workflows/dev.yml',
    required: true
  },
  {
    name: 'Deployment Workflow File',
    path: '.github/workflows/deploy.yml', 
    required: true
  },
  {
    name: 'Maintenance Workflow File',
    path: '.github/workflows/maintenance.yml',
    required: true
  },
  {
    name: 'Workflows Documentation',
    path: '.github/workflows/README.md',
    required: false
  },
  {
    name: 'ESLint Configuration',
    path: '.eslintrc.json',
    required: true
  },
  {
    name: 'Prettier Configuration', 
    path: '.prettierrc',
    required: true
  },
  {
    name: 'TypeScript Configuration',
    path: 'tsconfig.json',
    required: true
  },
  {
    name: 'Playwright Configuration',
    path: 'playwright.config.ts',
    required: true
  }
];

let allPassed = true;

checks.forEach(check => {
  const exists = fs.existsSync(check.path);
  const status = exists ? '✅' : (check.required ? '❌' : '⚠️');
  const message = exists ? 'Found' : (check.required ? 'Missing (Required)' : 'Missing (Optional)');
  
  console.log(`${status} ${check.name}: ${message}`);
  
  if (check.required && !exists) {
    allPassed = false;
  }
});

console.log('\n📊 Package.json Scripts Check:');

try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredScripts = [
    'lint',
    'lint:fix', 
    'format',
    'format:check',
    'build',
    'dev'
  ];
  
  requiredScripts.forEach(script => {
    const exists = packageJson.scripts && packageJson.scripts[script];
    const status = exists ? '✅' : '❌';
    console.log(`${status} npm run ${script}: ${exists ? 'Available' : 'Missing'}`);
    
    if (!exists) {
      allPassed = false;
    }
  });
} catch (error) {
  console.log('❌ package.json: Could not read or parse');
  allPassed = false;
}

console.log('\n🔐 Environment Variables Needed:');
console.log('📝 Add these secrets to your GitHub repository settings:');
console.log('   - VITE_SUPABASE_URL');
console.log('   - VITE_SUPABASE_ANON_KEY');
console.log('   - VITE_GOOGLE_CLIENT_ID');
console.log('   - VERCEL_TOKEN (for Vercel deployment)');
console.log('   - VERCEL_ORG_ID (for Vercel deployment)');
console.log('   - VERCEL_PROJECT_ID (for Vercel deployment)');

console.log('\n🎯 Summary:');
if (allPassed) {
  console.log('✅ All required files and configurations are in place!');
  console.log('🚀 Your GitHub Actions CI/CD pipeline is ready to use.');
  console.log('💡 Next step: Configure repository secrets and test with a PR.');
} else {
  console.log('❌ Some required files or configurations are missing.');
  console.log('📋 Please review the missing items above and ensure they are in place.');
}

process.exit(allPassed ? 0 : 1);
