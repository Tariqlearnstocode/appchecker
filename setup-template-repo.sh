#!/bin/bash

# Automated script to create template repository
# This will create the GitHub repo and push the code

set -e

TEMPLATE_NAME="appchecker-template"
GITHUB_USER="Tariqlearnstocode"

echo "🚀 Creating template repository: $TEMPLATE_NAME"
echo ""

# Check if template remote already exists
if git remote | grep -q "^template$"; then
    echo "⚠️  Template remote already exists. Removing it first..."
    git remote remove template
fi

# Check if GitHub CLI is available
if command -v gh &> /dev/null; then
    echo "✅ GitHub CLI found. Creating repository..."
    
    # Check if authenticated
    if gh auth status &> /dev/null; then
        echo "✅ GitHub CLI authenticated"
        
        # Create the repository
        echo "📦 Creating repository on GitHub..."
        gh repo create "$TEMPLATE_NAME" \
            --public \
            --description "Template repository for income verification applications" \
            --template=false \
            --clone=false
        
        # Add as remote and push
        echo "📤 Pushing code to template repository..."
        git remote add template "https://github.com/$GITHUB_USER/$TEMPLATE_NAME.git"
        git push template main:main
        
        echo ""
        echo "✅ Repository created and code pushed!"
        echo ""
        echo "📋 Next steps:"
        echo "1. Go to: https://github.com/$GITHUB_USER/$TEMPLATE_NAME/settings"
        echo "2. Scroll to 'Template repository' section"
        echo "3. Check 'Template repository' checkbox"
        echo "4. Click 'Update'"
        echo ""
        echo "✨ Your template will be ready to use!"
        
    else
        echo "❌ GitHub CLI not authenticated. Please run: gh auth login"
        exit 1
    fi
    
else
    echo "📋 GitHub CLI not found. Please follow these manual steps:"
    echo ""
    echo "1. Create repository on GitHub:"
    echo "   https://github.com/new"
    echo "   Name: $TEMPLATE_NAME"
    echo "   Description: Template repository for income verification applications"
    echo "   Visibility: Public"
    echo "   ⚠️  DO NOT initialize with README, .gitignore, or license"
    echo ""
    echo "2. After creating, press Enter to continue..."
    read -r
    
    echo ""
    echo "📤 Adding remote and pushing code..."
    git remote add template "https://github.com/$GITHUB_USER/$TEMPLATE_NAME.git"
    git push template main:main
    
    echo ""
    echo "✅ Code pushed successfully!"
    echo ""
    echo "📋 Final step - Mark as template:"
    echo "1. Go to: https://github.com/$GITHUB_USER/$TEMPLATE_NAME/settings"
    echo "2. Scroll to 'Template repository' section"
    echo "3. Check 'Template repository' checkbox"
    echo "4. Click 'Update'"
    echo ""
    echo "✨ Your template will be ready to use!"
fi

