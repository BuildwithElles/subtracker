@echo off
echo 🔧 Committing Supabase Integration Fix...

echo Current git status:
git status

echo Adding all changes (excluding .env files and node_modules)...
git add .

echo Checking for sensitive files...
git status --cached | findstr /R "\.env[^.]" && (
    echo ❌ ERROR: .env files detected in staged changes!
    echo Please unstage .env files before committing.
    pause
    exit /b 1
) || echo ✅ No .env files detected in staged changes.

git status --cached | findstr "node_modules" && (
    echo ❌ ERROR: node_modules detected in staged changes!
    echo Please check your .gitignore file.
    pause
    exit /b 1
) || echo ✅ No node_modules detected in staged changes.

echo Files to be committed:
git status --cached

echo Committing changes...
git commit -m "🔧 Fix Supabase integration for E2E testing - Enhanced Supabase client global availability for testing - Updated environment configuration and validation - Added comprehensive test utilities - Improved error handling and connection testing - Enhanced E2E test suite for Supabase integration - Fixes: Supabase client not available during E2E test execution"

echo Pushing to remote repository...
git push origin main

echo ✅ Git operations completed!
echo Recent commits:
git log --oneline -3

pause
