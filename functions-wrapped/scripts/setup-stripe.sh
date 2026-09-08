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
    PROJECT="dev"
    ENV_FILE=".env.dev.local"
elif [ "$env_choice" = "2" ]; then
    PROJECT="prod"
    ENV_FILE=".env.prod.local"
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

# Create env file if it doesn't exist
if [ ! -f "$ENV_FILE" ]; then
    echo "📝 Creating $ENV_FILE..."
    
    if [ "$PROJECT" = "dev" ]; then
        cp .env.dev "$ENV_FILE"
    else
        cp .env.prod "$ENV_FILE"
    fi
    
    echo "✅ Created $ENV_FILE - Please edit it with your values:"
    echo "   - STRIPE_PUBLISHABLE_KEY"
    echo "   - BASIC_PRICE_ID"
    echo "   - PRO_PRICE_ID"
    echo "   - DOMAIN"
else
    echo "ℹ️  $ENV_FILE already exists"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit $ENV_FILE with your non-sensitive config"
echo "2. Deploy with: npm run deploy:$PROJECT"
