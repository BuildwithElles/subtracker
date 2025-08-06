# 🚀 GitHub Actions CI/CD Workflows

This directory contains automated workflows for continuous integration, deployment, and maintenance of the SubTracker application.

## 📁 Workflow Files

### 🔄 [`ci.yml`](./ci.yml) - Main CI/CD Pipeline

**Triggers:** Push to `main`/`develop`, Pull Requests to `main`

**Jobs:**

- **🔍 Code Quality**: ESLint, Prettier, TypeScript validation
- **🧪 Unit Tests**: Runs unit tests (when implemented)
- **🎭 E2E Tests**: Playwright end-to-end testing
- **🚀 Build & Deploy**: Production build and deployment
- **🔒 Security Audit**: npm audit and vulnerability scanning
- **📊 Code Coverage**: Coverage reporting for PRs

### ⚡ [`dev.yml`](./dev.yml) - Development CI

**Triggers:** Push to development branches, PRs

**Jobs:**

- **⚡ Quick Validation**: Fast linting and build checks
- **🔍 PR Validation**: Comprehensive PR checks
- **💬 PR Comments**: Automated status comments on PRs

### 🚀 [`deploy.yml`](./deploy.yml) - Production Deployment

**Triggers:** Push to `main`, Manual dispatch

**Jobs:**

- **🔍 Pre-Deploy Validation**: Comprehensive pre-deployment checks
- **🚀 Vercel Deployment**: Deploy to Vercel (primary)
- **🌐 Netlify Deployment**: Alternative deployment option (disabled)
- **✅ Post-Deploy Verification**: Health checks and notifications
- **⏪ Emergency Rollback**: Rollback capability

### 🔧 [`maintenance.yml`](./maintenance.yml) - Maintenance & Security

**Triggers:** Weekly schedule (Sundays 2 AM UTC), Manual dispatch

**Jobs:**

- **🔒 Security Audit**: Comprehensive security scanning
- **📦 Dependency Updates**: Check for outdated packages
- **🔍 CodeQL Analysis**: GitHub's security analysis
- **📄 License Compliance**: License compatibility checks
- **📊 Bundle Analysis**: Bundle size monitoring
- **📋 Maintenance Summary**: Weekly maintenance reports

## 🔧 Setup Instructions

### 1. Repository Secrets

Add these secrets to your GitHub repository settings:

#### Required for Deployment:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

#### For Vercel Deployment:

```
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_vercel_org_id
VERCEL_PROJECT_ID=your_vercel_project_id
```

#### For Netlify Deployment (Optional):

```
NETLIFY_AUTH_TOKEN=your_netlify_auth_token
NETLIFY_SITE_ID=your_netlify_site_id
```

### 2. Environment Setup

- **Node.js Version**: 18 (specified in workflows)
- **Package Manager**: npm (using npm ci for faster installs)
- **Cache**: Node modules cached for faster builds

### 3. Branch Protection Rules

Recommended branch protection for `main`:

- ✅ Require status checks before merging
- ✅ Require branches to be up to date
- ✅ Include administrators
- ✅ Required status checks:
  - `🔍 Code Quality`
  - `⚡ Quick Validation`
  - `🧪 Run Tests`

## 🏃‍♂️ Workflow Behavior

### Development Flow:

1. **Feature Branch** → Triggers `dev.yml` (quick validation)
2. **Pull Request** → Triggers both `dev.yml` and `ci.yml`
3. **Merge to Main** → Triggers full `ci.yml` + `deploy.yml`

### Security & Maintenance:

- **Weekly Scans**: Automated security and dependency audits
- **Real-time Monitoring**: CodeQL analysis on every push
- **License Compliance**: Ensures legal compliance
- **Bundle Monitoring**: Tracks application size

## 📊 Monitoring & Reports

### Artifacts Generated:

- **Test Reports**: Playwright test results and screenshots
- **Security Reports**: Vulnerability scans and audits
- **Dependency Reports**: Outdated package listings
- **Bundle Reports**: Size analysis and breakdowns
- **License Reports**: License compliance summaries

### Notifications:

- **PR Comments**: Automated status updates on pull requests
- **Deployment Status**: Success/failure notifications
- **Security Alerts**: Vulnerability notifications
- **Maintenance Reports**: Weekly maintenance summaries

## 🛠️ Customization

### Adding New Jobs:

1. Copy existing job structure
2. Update triggers and dependencies
3. Add required secrets/environment variables
4. Test with workflow dispatch

### Deployment Targets:

- **Primary**: Vercel (configured)
- **Alternative**: Netlify (available but disabled)
- **Custom**: Add your preferred platform

### Testing Integration:

- **Unit Tests**: Ready for Jest/Vitest integration
- **E2E Tests**: Playwright configured and running
- **Coverage**: Ready for coverage reporting tools

## 🔍 Troubleshooting

### Common Issues:

1. **Build Failures**: Check environment variables are set
2. **Test Failures**: Ensure Playwright browsers are installed
3. **Deployment Issues**: Verify deployment platform secrets
4. **Security Alerts**: Review and update vulnerable dependencies

### Debug Commands:

```bash
# Local testing of workflows
npm run lint          # Test linting
npm run build          # Test build process
npx playwright test    # Test E2E scenarios
npm audit              # Check security vulnerabilities
```

## 📈 Performance Optimization

### Build Optimization:

- **Caching**: Node modules and build artifacts cached
- **Parallel Jobs**: Independent jobs run concurrently
- **Conditional Execution**: Jobs skip when not needed
- **Artifact Management**: Automatic cleanup and retention

### Cost Optimization:

- **Development Branches**: Lightweight validation only
- **Scheduled Maintenance**: Run during low-traffic hours
- **Conditional Deployments**: Deploy only when necessary
- **Smart Caching**: Reduce redundant operations

---

## 🎯 Next Steps

1. **Configure Repository Secrets** for your deployment platform
2. **Set Up Branch Protection Rules** for the main branch
3. **Test Workflows** with a sample pull request
4. **Monitor First Deployment** to ensure everything works
5. **Customize Notifications** for your team's needs

For questions or issues with the CI/CD setup, refer to the GitHub Actions documentation or create an issue in the repository.
