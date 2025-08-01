# Development Files

This folder contains all the development and backend files for the Soundcords project.

## Contents:

### Backend Files:
- `api/` - Vercel API routes for Discord OAuth
- `package.json` - Node.js dependencies and scripts
- `vercel.json` - Vercel deployment configuration
- `setup.sh` - Development setup script

### Environment Files:
- `.env` - Local environment variables (contains sensitive data)
- `env-template.txt` - Template for environment variables

## Development Setup:

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   - Copy `env-template.txt` to `.env`
   - Fill in your Discord credentials

3. **Deploy to Vercel:**
   ```bash
   vercel --prod
   ```

## Important Notes:
- The `.env` file contains sensitive Discord credentials
- Never commit the `.env` file to version control
- The API is deployed at: `https://soundcords-6tz3jy0eo-fentzzz.vercel.app`

## API Endpoints:
- `POST /api/discord-oauth` - Discord OAuth token exchange 