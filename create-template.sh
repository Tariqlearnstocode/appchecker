#!/bin/bash

# Script to create a template repository from the current codebase
# Usage: ./create-template.sh <template-repo-name>

set -e

TEMPLATE_NAME=${1:-"appchecker-template"}

echo "🚀 Creating template repository: $TEMPLATE_NAME"
echo ""

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "📦 Current branch: $CURRENT_BRANCH"
echo ""

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "⚠️  Warning: You have uncommitted changes"
    echo "   Consider committing them first:"
    echo "   git add . && git commit -m 'Prepare for template'"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "📋 Steps to create your template repository:"
echo ""
echo "1. Go to GitHub and create a new repository:"
echo "   https://github.com/new"
echo "   Name: $TEMPLATE_NAME"
echo "   Description: Template repository for income verification applications"
echo "   Visibility: Public (recommended for templates) or Private"
echo "   ⚠️  DO NOT initialize with README, .gitignore, or license"
echo ""
echo "2. After creating the repository, run these commands:"
echo ""
echo "   # Add the template repository as a remote"
echo "   git remote add template https://github.com/$(git config user.name)/$TEMPLATE_NAME.git"
echo ""
echo "   # Push current branch to template repository"
echo "   git push template $CURRENT_BRANCH:main"
echo ""
echo "   # (Optional) Push all branches"
echo "   git push template --all"
echo ""
echo "3. Go to your new repository on GitHub:"
echo "   https://github.com/$(git config user.name)/$TEMPLATE_NAME"
echo ""
echo "4. Mark it as a template:"
echo "   - Go to Settings → General"
echo "   - Scroll to 'Template repository' section"
echo "   - Check 'Template repository' checkbox"
echo "   - Click 'Update'"
echo ""
echo "✨ Done! Your template is ready to use."
echo ""
echo "   Others can now use it by clicking 'Use this template' on GitHub"
echo "   or by running: gh repo create <new-repo> --template $(git config user.name)/$TEMPLATE_NAME"

