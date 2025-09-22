# 🚀 GitHub Upload Guide

## Files Ready for GitHub Upload

Your AI Planet project is now properly configured for GitHub with all sensitive information protected!

### ✅ Safe to Upload
- All source code files
- README.md (comprehensive documentation)
- .gitignore (protects sensitive files)
- .env.template (environment template)
- requirements.txt (Python dependencies)
- package.json (Node.js dependencies)
- All component and module files

### ❌ Protected from Upload (.gitignore)
- .env and .env.local files (API keys)
- node_modules/ directories
- __pycache__/ directories
- Build outputs
- IDE configurations
- OS-specific files

## 📋 Upload Steps

### Method 1: Command Line (Recommended)

1. **Initialize Git Repository**
   ```bash
   cd /Users/manishsinghchouhan1309/Desktop/Project/AI-planet
   git init
   ```

2. **Add Your GitHub Remote**
   ```bash
   git remote add origin https://github.com/manishsingh1309/ai-planet.git
   ```

3. **Stage All Files**
   ```bash
   git add .
   ```

4. **Commit Changes**
   ```bash
   git commit -m "Initial commit: AI Planet Workflow Builder"
   ```

5. **Push to GitHub**
   ```bash
   git branch -M main
   git push -u origin main
   ```

### Method 2: GitHub Desktop

1. Open GitHub Desktop
2. Click "Add an Existing Repository from your Hard Drive"
3. Choose the AI-planet folder
4. Publish repository to GitHub
5. Select your account and repository name
6. Click "Publish Repository"

### Method 3: VS Code

1. Open the project in VS Code
2. Click the Source Control tab (Ctrl+Shift+G)
3. Click "Initialize Repository"
4. Stage all changes with "+"
5. Commit with a message
6. Click "Publish to GitHub"

## 🔧 Post-Upload Setup for Users

Users who clone your repository will need to:

1. **Clone the Repository**
   ```bash
   git clone https://github.com/manishsingh1309/ai-planet.git
   cd ai-planet
   ```

2. **Set Up Environment**
   ```bash
   cd Frontend
   cp .env.template .env.local
   # Edit .env.local with their Gemini API key
   ```

3. **Install Dependencies**
   ```bash
   # Frontend
   npm install

   # Backend
   cd ../Backend
   pip install -r requirements.txt
   ```

4. **Run the Application**
   ```bash
   # Backend (Terminal 1)
   python3 main.py

   # Frontend (Terminal 2)
   cd Frontend
   npm start
   ```

## 🔑 Environment Setup Guide for Users

After cloning, users need to get their own Gemini API key:

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy to Frontend/.env.local file

## 🎯 Repository Features

Your repository will include:
- ✅ Professional README with screenshots
- ✅ Complete setup instructions
- ✅ Environment configuration guide
- ✅ Troubleshooting section
- ✅ Contributing guidelines
- ✅ License information
- ✅ Modern project structure

## 📸 Screenshots Location

Make sure to upload your screenshots to the Images/ folder:
- Images/1.PNG (main interface)
- Images/2.png (workflow builder)
- Images/3.png (chat interface)
- Images/4.png (configuration panel)
- Images/5.png (additional views)

## 🚨 Important Notes

1. **Never commit .env files** - The .gitignore prevents this
2. **API keys are user-specific** - Each user needs their own
3. **Dependencies are managed** - requirements.txt and package.json handle this
4. **README is comprehensive** - Users have complete setup guide

Your project is now ready for professional GitHub hosting! 🎉