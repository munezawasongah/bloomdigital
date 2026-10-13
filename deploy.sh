#!/bin/bash
# ════════════════════════════════════════════════════════════════
#  BLOOM PLATFORM — Linux Deployment Script
#  Run this on your Linux machine step by step
#  Evans Okoth | ServiceHub Kenya
# ════════════════════════════════════════════════════════════════

# ── COLOUR HELPERS ──────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; CYAN='\033[0;36m'; NC='\033[0m'
info()    { echo -e "${CYAN}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC}   $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
err()     { echo -e "${RED}[ERR]${NC}  $1"; }
step()    { echo -e "\n${GREEN}══════════════════════════════════════${NC}"; echo -e "${GREEN} $1${NC}"; echo -e "${GREEN}══════════════════════════════════════${NC}"; }

# ════════════════════════════════════════════════════════════════
step "STEP 1 — Check System Requirements"
# ════════════════════════════════════════════════════════════════

# Node.js version check
if command -v node &>/dev/null; then
  NODE_VER=$(node -v)
  success "Node.js found: $NODE_VER"
else
  warn "Node.js not found. Installing..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
  success "Node.js installed: $(node -v)"
fi

# npm check
if command -v npm &>/dev/null; then
  success "npm found: $(npm -v)"
fi

# git check
if command -v git &>/dev/null; then
  success "git found: $(git --version)"
else
  warn "Installing git..."
  sudo apt-get install -y git
fi

# ════════════════════════════════════════════════════════════════
step "STEP 2 — Install Railway CLI"
# ════════════════════════════════════════════════════════════════
# Railway is the easiest free host for Node.js with env vars + HTTPS

if ! command -v railway &>/dev/null; then
  info "Installing Railway CLI..."
  curl -fsSL https://railway.app/install.sh | sh
  # Add to PATH for this session
  export PATH="$HOME/.railway/bin:$PATH"
  success "Railway CLI installed"
else
  success "Railway CLI already installed: $(railway --version 2>/dev/null || echo 'ok')"
fi

echo ""
echo -e "${YELLOW}ACTION REQUIRED:${NC}"
echo "  1. Go to https://railway.app and create a FREE account (use GitHub login)"
echo "  2. Come back here and press ENTER when done"
read -p "Press ENTER after creating your Railway account..."

# ════════════════════════════════════════════════════════════════
step "STEP 3 — Configure .env"
# ════════════════════════════════════════════════════════════════

BLOOM_DIR="$HOME/bloom"
if [ ! -d "$BLOOM_DIR" ]; then
  err "Bloom directory not found at $BLOOM_DIR"
  echo "Please unzip the bloom-platform.zip first:"
  echo "  cd ~ && unzip bloom-platform.zip"
  exit 1
fi

cd "$BLOOM_DIR"
info "Working in: $BLOOM_DIR"

read -p "  Choose an admin password : " ADMIN_PWD

# BASE_URL is filled after Railway gives us a URL
cat > .env <<ENVEOF
PORT=3000
BASE_URL=PLACEHOLDER
ADMIN_PASSWORD=$ADMIN_PWD
ENVEOF

success ".env written (BASE_URL will be set after Railway deploy)"

# ════════════════════════════════════════════════════════════════
step "STEP 4 — Initialise Git & Push to Railway"
# ════════════════════════════════════════════════════════════════

cd "$BLOOM_DIR"

# Make sure db/gardens.json exists with empty default
mkdir -p db
echo '{}' > db/gardens.json

# Ensure .gitignore is correct
cat > .gitignore <<'GITEOF'
node_modules/
.env
*.log
GITEOF

# Initialise git if needed
if [ ! -d ".git" ]; then
  git init
  success "Git repository initialised"
fi

git add .
git commit -m "Bloom platform initial deploy" 2>/dev/null || git commit --allow-empty -m "Bloom deploy"

success "Git commit done"

# ════════════════════════════════════════════════════════════════
step "STEP 5 — Deploy to Railway"
# ════════════════════════════════════════════════════════════════

# Login to Railway (opens browser)
info "Logging into Railway — a browser window will open..."
railway login

# Create a new project on Railway
info "Creating Railway project..."
railway init --name bloom-platform

# Deploy
info "Deploying to Railway..."
railway up

# Get the public URL
info "Getting your public URL..."
sleep 5
RAILWAY_URL=$(railway domain 2>/dev/null | grep -oP 'https://[^\s]+' | head -1)

if [ -z "$RAILWAY_URL" ]; then
  warn "Could not auto-detect Railway URL."
  echo ""
  echo "  Go to https://railway.app/dashboard"
  echo "  Open your 'bloom-platform' project"
  echo "  Click 'Settings' → 'Networking' → 'Generate Domain'"
  echo "  Copy the https:// URL and paste it here:"
  read -p "  Your Railway URL: " RAILWAY_URL
fi

success "Your app is live at: $RAILWAY_URL"

# ════════════════════════════════════════════════════════════════
step "STEP 6 — Update Environment Variables on Railway"
# ════════════════════════════════════════════════════════════════

info "Setting environment variables on Railway..."

railway variables set \
  BASE_URL="$RAILWAY_URL" \
  ADMIN_PASSWORD="$ADMIN_PWD" \
  PORT=3000

success "Environment variables set on Railway"

# Trigger redeploy with correct env vars
info "Redeploying with updated environment..."
railway up

# ════════════════════════════════════════════════════════════════
step "STEP 7 — Verify Deployment"
# ════════════════════════════════════════════════════════════════

sleep 8
info "Testing your live platform..."

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$RAILWAY_URL" 2>/dev/null)

if [ "$HTTP_CODE" = "200" ]; then
  success "Frontend is live! HTTP $HTTP_CODE"
else
  warn "Got HTTP $HTTP_CODE — app may still be starting (takes ~30s on first deploy)"
fi

API_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$RAILWAY_URL/api/garden/test" 2>/dev/null)
info "API health: HTTP $API_CODE (404 is expected for unknown garden)"

# ════════════════════════════════════════════════════════════════
step "DEPLOYMENT COMPLETE 🌸"
# ════════════════════════════════════════════════════════════════

echo ""
echo -e "${GREEN}  Your Bloom platform is live!${NC}"
echo ""
echo -e "  🌍 Frontend  : ${CYAN}$RAILWAY_URL${NC}"
echo -e "  📡 API       : ${CYAN}$RAILWAY_URL/api/garden${NC}"
echo ""
echo -e "${YELLOW}  Next steps:${NC}"
echo "  1. Open $RAILWAY_URL in your browser"
echo "  2. Fill in sender/recipient, choose a message, customise (free!)"
echo "  3. Click 'Send via WhatsApp' to send the garden link"
echo "  4. Recipient opens link and sees their animated garden"
echo ""
echo -e "${YELLOW}  Monitor logs:${NC}"
echo "  railway logs"
echo ""
echo -e "${YELLOW}  Redeploy after code changes:${NC}"
echo "  cd ~/bloom && railway up"
echo ""
