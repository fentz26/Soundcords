#!/bin/bash

# Setup script for Soundcords Extension
# This script organizes files for GitHub and Vercel deployment

echo "🚀 Setting up Soundcords Extension..."

# Create the main project directory
mkdir -p soundcords-extension
cd soundcords-extension

# Create extension directory
mkdir -p extension

# Move extension files to extension directory
echo "📁 Organizing extension files..."
cd ..

# Move all extension files to the new structure
mv manifest.json soundcords-extension/extension/
mv popup.html soundcords-extension/extension/
mv popup.js soundcords-extension/extension/
mv popup.css soundcords-extension/extension/
mv background.js soundcords-extension/extension/
mv content.js soundcords-extension/extension/
mv discord-content.js soundcords-extension/extension/

# Move image files
mv *.png soundcords-extension/extension/ 2>/dev/null || true
mv *.jpg soundcords-extension/extension/ 2>/dev/null || true
mv *.jpeg soundcords-extension/extension/ 2>/dev/null || true

# Move API files
mv api soundcords-extension/ 2>/dev/null || true

# Move configuration files
mv package.json soundcords-extension/ 2>/dev/null || true
mv vercel.json soundcords-extension/ 2>/dev/null || true

# Go to the new directory
cd soundcords-extension

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
git commit -m "Initial commit: Soundcords Discord extension with Vercel OAuth"

echo "✅ Setup complete!"
echo ""
echo "📋 Project renamed to: soundcords-extension"
echo ""
echo "📋 Next steps:"
echo "1. Create GitHub repository named 'soundcords-extension'"
echo "2. Push to GitHub: git remote add origin https://github.com/YOUR_USERNAME/soundcords-extension.git && git push -u origin main"
echo "3. Deploy to Vercel: vercel --prod"
echo "4. Set DISCORD_CLIENT_SECRET in Vercel environment variables"
echo "5. Update Vercel URL in extension/background.js"
echo "6. Load extension in Chrome from extension/ folder" 