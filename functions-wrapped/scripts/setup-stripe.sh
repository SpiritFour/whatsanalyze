#!/bin/bash

# Stripe Firebase Functions Setup Script
# This script helps you configure secrets and environment variables

set -e

echo "🔐 Stripe Firebase Functions Setup"
echo "===================================="
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Install it with: npm install -g firebase-tools"
    exit 1
fi

# Ask which environment
echo "Which environment are you setting up?"
echo "1) Development (dev)"
echo "2) Production (prod)"
read -p "Enter choice [1-2]: " env_choice

if [ "$env_choice" = "1" ]; then
    PROJECT="wrapped-dev"
    ENV_FILE=".env.whatsanalyze-wrapped"
elif [ "$env_choice" = "2" ]; then
    PROJECT="wrapped-prod"
    ENV_FILE=".env.whatsanalyze-wrapped-prod"
else
    echo "❌ Invalid choice"
    exit 1
fi

echo ""
echo "📦 Setting up $PROJECT environment"
echo ""

# Set secrets
echo "🔑 Setting Secrets (stored in Google Secret Manager)"
echo ""
echo "Setting STRIPE_SECRET_KEY..."
firebase --project $PROJECT functions:secrets:set STRIPE_SECRET_KEY

echo ""
echo "Setting STRIPE_WEBHOOK_SECRET..."
firebase --project $PROJECT functions:secrets:set STRIPE_WEBHOOK_SECRET

echo ""
echo "✅ Secrets configured successfully!"
echo ""

echo "ℹ️  Non-sensitive config lives in $ENV_FILE (committed):"
echo "   - STRIPE_PUBLISHABLE_KEY"
echo "   - PRO_PRICE_ID"
echo "   - ALLOWED_ORIGINS"
echo "   - EMAIL_BASE_URL"

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Check $ENV_FILE for the non-sensitive config"
if [ "$PROJECT" = "wrapped-dev" ]; then
    echo "2. Deploy with: npm run deploy:dev"
else
    echo "2. Deploy with: npm run deploy:prod"
fi
