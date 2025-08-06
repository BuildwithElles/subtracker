#!/usr/bin/env node

/**
 * GitHub Actions Pipeline Status Checker
 * 
 * This script helps monitor the status of GitHub Actions workflows
 * after pushing changes to the repository.
 */

const https = require('https');

const REPO_OWNER = 'BuildwithElles';
const REPO_NAME = 'subtracker';
const API_BASE = 'https://api.github.com';

console.log('🔍 Checking GitHub Actions Pipeline Status...\n');

// Get the latest workflow runs
const options = {
  hostname: 'api.github.com',
  path: `/repos/${REPO_OWNER}/${REPO_NAME}/actions/runs?per_page=5`,
  method: 'GET',
  headers: {
    'User-Agent': 'SubTracker-Pipeline-Checker',
    'Accept': 'application/vnd.github.v3+json'
  }
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      
      if (response.workflow_runs && response.workflow_runs.length > 0) {
        console.log('📊 Recent Workflow Runs:');
        console.log('=' .repeat(50));
        
        response.workflow_runs.slice(0, 3).forEach((run, index) => {
          const status = getStatusEmoji(run.status, run.conclusion);
          const date = new Date(run.created_at).toLocaleString();
          
          console.log(`${index + 1}. ${status} ${run.name}`);
          console.log(`   Branch: ${run.head_branch}`);
          console.log(`   Status: ${run.status}${run.conclusion ? ` (${run.conclusion})` : ''}`);
          console.log(`   Created: ${date}`);
          console.log(`   URL: ${run.html_url}`);
          console.log('');
        });
        
        const latestRun = response.workflow_runs[0];
        if (latestRun.status === 'in_progress') {
          console.log('⏳ Latest workflow is currently running...');
          console.log(`   Monitor progress: ${latestRun.html_url}`);
        } else if (latestRun.conclusion === 'success') {
          console.log('✅ Latest workflow completed successfully!');
        } else if (latestRun.conclusion === 'failure') {
          console.log('❌ Latest workflow failed. Check the logs:');
          console.log(`   ${latestRun.html_url}`);
        }
      } else {
        console.log('📝 No workflow runs found yet.');
        console.log('   Workflows may still be starting up...');
      }
      
      console.log('\n🔗 Quick Links:');
      console.log(`   Repository: https://github.com/${REPO_OWNER}/${REPO_NAME}`);
      console.log(`   Actions: https://github.com/${REPO_OWNER}/${REPO_NAME}/actions`);
      console.log(`   Latest commit: https://github.com/${REPO_OWNER}/${REPO_NAME}/commits/main`);
      
    } catch (error) {
      console.error('❌ Error parsing response:', error.message);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error checking pipeline status:', error.message);
  console.log('\n💡 Manual Check:');
  console.log(`   Visit: https://github.com/${REPO_OWNER}/${REPO_NAME}/actions`);
});

req.end();

function getStatusEmoji(status, conclusion) {
  if (status === 'in_progress') return '⏳';
  if (status === 'queued') return '📋';
  if (conclusion === 'success') return '✅';
  if (conclusion === 'failure') return '❌';
  if (conclusion === 'cancelled') return '🚫';
  if (conclusion === 'skipped') return '⏭️';
  return '❓';
}
