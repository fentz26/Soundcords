#!/bin/bash

# Setup script for Soundcord Extension
# This script organizes files for GitHub and Vercel deployment

echo "🚀 Setting up Soundcord Extension..."

# Create the main project directory
mkdir -p soundcord-extension
cd soundcord-extension

# Create extension directory
mkdir -p extension

# Move extension files to extension directory
echo "📁 Organizing extension files..."
cd ..

# Move all extension files to the new structure
mv manifest.json soundcord-extension/extension/
mv popup.html soundcord-extension/extension/
mv popup.js soundcord-extension/extension/
mv popup.css soundcord-extension/extension/
mv background.js soundcord-extension/extension/
mv content.js soundcord-extension/extension/
mv discord-content.js soundcord-extension/extension/

# Move image files
mv *.png soundcord-extension/extension/ 2>/dev/null || true
mv *.jpg soundcord-extension/extension/ 2>/dev/null || true
mv *.jpeg soundcord-extension/extension/ 2>/dev/null || true

# Move API files
mv api soundcord-extension/ 2>/dev/null || true

# Move configuration files
mv package.json soundcord-extension/ 2>/dev/null || true
mv vercel.json soundcord-extension/ 2>/dev/null || true

# Go to the new directory
cd soundcord-extension

# Create .gitignore
echo "📝 Creating .gitignore..."
cat > .gitignore << EOF
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Vercel
.vercel

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Logs
*.log
EOF

# Create initial git repository
echo "🔧 Initializing git repository..."
git init
git add .
git commit -m "Initial commit: Soundcord Discord extension with Vercel OAuth"

echo "✅ Setup complete!"
echo ""
echo "📋 Project renamed to: soundcord-extension"
echo ""
echo "📋 Next steps:"
echo "1. Create GitHub repository named 'soundcord-extension'"
echo "2. Push to GitHub: git remote add origin https://github.com/YOUR_USERNAME/soundcord-extension.git && git push -u origin main"
echo "3. Deploy to Vercel: vercel --prod"
echo "4. Set DISCORD_CLIENT_SECRET in Vercel environment variables"
echo "5. Update Vercel URL in extension/background.js"
echo "6. Load extension in Chrome from extension/ folder" 