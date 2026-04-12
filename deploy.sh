#!/bin/bash

# 🚀 Safe Hire System - Quick Deploy to Vercel
# Run this script to deploy your application to Vercel

set -e  # Exit on error

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Safe Hire System - Vercel Deployment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found"
    echo "Please run this script from the project root directory"
    exit 1
fi

echo "📁 Current directory: $(pwd)"
echo ""

# Check if vercel CLI is installed
echo "🔍 Checking for Vercel CLI..."
if ! command -v vercel &> /dev/null; then
    echo "⚠️  Vercel CLI not found. Installing..."
    npm install -g vercel
    echo "✅ Vercel CLI installed!"
else
    echo "✅ Vercel CLI found!"
fi
echo ""

# Check if user is logged in
echo "🔐 Checking Vercel authentication..."
if ! vercel whoami &> /dev/null; then
    echo "⚠️  Not logged in to Vercel"
    echo "Please login to continue..."
    vercel login
    echo "✅ Logged in successfully!"
else
    VERCEL_USER=$(vercel whoami)
    echo "✅ Logged in as: $VERCEL_USER"
fi
echo ""

# Ask for environment variables
echo "⚙️  Environment Variables Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "You'll need these from your Supabase dashboard:"
echo "1. Project URL (https://xxx.supabase.co)"
echo "2. Anon/Public API Key"
echo ""
read -p "Have you added environment variables to Vercel? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "📝 Please add these environment variables in Vercel Dashboard:"
    echo ""
    echo "   Variable Name: NEXT_PUBLIC_SUPABASE_URL"
    echo "   Variable Name: NEXT_PUBLIC_SUPABASE_ANON_KEY"
    echo ""
    echo "   Go to: https://vercel.com/dashboard"
    echo "   → Your Project → Settings → Environment Variables"
    echo ""
    read -p "Press Enter when done..."
fi
echo ""

# Run build locally to check for errors
echo "🔨 Testing build locally..."
if npm run build; then
    echo "✅ Local build successful!"
else
    echo "❌ Build failed! Please fix errors before deploying."
    exit 1
fi
echo ""

# Deploy
echo "🚀 Deploying to Vercel..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Ask for production or preview
read -p "Deploy to production? (y/n - 'n' creates preview) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📦 Deploying to PRODUCTION..."
    vercel --prod
else
    echo "📦 Creating PREVIEW deployment..."
    vercel
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Deployment Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Next Steps:"
echo "1. Visit your deployment URL"
echo "2. Test signup and dashboard"
echo "3. Verify database connection"
echo "4. Update Supabase redirect URLs if needed"
echo ""
echo "🔧 Troubleshooting:"
echo "   - Check Vercel logs: vercel logs [URL]"
echo "   - View deployments: vercel ls"
echo "   - Redeploy: vercel --prod --force"
echo ""
echo "🎉 Happy Hiring!"
echo ""
