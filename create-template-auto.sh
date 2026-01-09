#!/bin/bash

# Automated template repository creation
set -e

TEMPLATE_NAME="appchecker-template"
GITHUB_USER="Tariqlearnstocode"

echo "🚀 Setting up template repository: $TEMPLATE_NAME"
echo ""

# Remove template remote if it exists
if git remote | grep -q "^template$"; then
    echo "⚠️  Removing existing template remote..."
    git remote remove template
fi

# Open GitHub new repository page
echo "🌐 Opening GitHub repository creation page..."
echo "   Please create a repository with these settings:"
echo "   - Name: $TEMPLATE_NAME"
echo "   - Description: Template repository for income verification applications"
echo "   - Visibility: Public (recommended for templates)"
echo "   - ⚠️  DO NOT initialize with README, .gitignore, or license"
echo ""

if command -v open &> /dev/null; then
    open "https://github.com/new?name=$TEMPLATE_NAME&description=Template%20repository%20for%20income%20verification%20applications"
elif command -v xdg-open &> /dev/null; then
    xdg-open "https://github.com/new?name=$TEMPLATE_NAME&description=Template%20repository%20for%20income%20verification%20applications"
else
    echo "   Please visit: https://github.com/new"
fi

echo ""
echo "⏳ Waiting for you to create the repository..."
echo "   After creating it, press Enter to continue..."
read -r

echo ""
echo "📤 Adding remote and pushing code..."
REPO_URL="https://github.com/$GITHUB_USER/$TEMPLATE_NAME.git"
git remote add template "$REPO_URL"
git push template main:main

echo ""
echo "✅ Code pushed successfully!"
echo ""
echo "📋 Final step - Mark repository as template:"
echo "   1. Go to: https://github.com/$GITHUB_USER/$TEMPLATE_NAME/settings"
echo "   2. Scroll to 'Template repository' section"
echo "   3. Check 'Template repository' checkbox"
echo "   4. Click 'Update'"
echo ""
echo "✨ Your template will be ready to use!"
echo ""
echo "   Repository URL: https://github.com/$GITHUB_USER/$TEMPLATE_NAME"

