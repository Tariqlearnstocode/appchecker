#!/bin/bash

# Non-interactive template repository setup
set -e

TEMPLATE_NAME="appchecker-template"
GITHUB_USER="Tariqlearnstocode"
REPO_URL="https://github.com/$GITHUB_USER/$TEMPLATE_NAME.git"

echo "🚀 Creating template repository: $TEMPLATE_NAME"
echo ""

# Remove template remote if it exists
if git remote | grep -q "^template$"; then
    echo "⚠️  Removing existing template remote..."
    git remote remove template
fi

# Try to add remote and push
echo "📤 Attempting to push to template repository..."
echo ""

if git remote add template "$REPO_URL" 2>/dev/null; then
    echo "✅ Remote added"
else
    echo "⚠️  Remote may already exist, continuing..."
fi

# Try to push - this will fail if repo doesn't exist, which is fine
if git push template main:main 2>&1; then
    echo ""
    echo "✅ Code pushed successfully!"
    echo ""
    echo "📋 Final step - Mark repository as template:"
    echo "   1. Go to: https://github.com/$GITHUB_USER/$TEMPLATE_NAME/settings"
    echo "   2. Scroll to 'Template repository' section"
    echo "   3. Check 'Template repository' checkbox"
    echo "   4. Click 'Update'"
    echo ""
    echo "✨ Your template is ready!"
else
    echo ""
    echo "⚠️  Repository doesn't exist yet. Please create it first:"
    echo ""
    echo "   1. Go to: https://github.com/new"
    echo "   2. Repository name: $TEMPLATE_NAME"
    echo "   3. Description: Template repository for income verification applications"
    echo "   4. Visibility: Public (recommended)"
    echo "   5. ⚠️  DO NOT initialize with README, .gitignore, or license"
    echo "   6. Click 'Create repository'"
    echo ""
    echo "   Then run this script again, or manually run:"
    echo "   git push template main:main"
    echo ""
    echo "   After pushing, mark it as template at:"
    echo "   https://github.com/$GITHUB_USER/$TEMPLATE_NAME/settings"
fi

