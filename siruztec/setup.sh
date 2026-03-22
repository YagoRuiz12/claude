#!/usr/bin/env bash
# =============================================================================
# SiruzTec — Script de Setup Completo
# Configura Supabase, Stripe e faz deploy na Vercel automaticamente.
#
# Uso:
#   chmod +x setup.sh
#   ./setup.sh
# =============================================================================

set -euo pipefail

# ── Cores ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
RESET='\033[0m'

ok()   { echo -e "${GREEN}✓${RESET} $1"; }
info() { echo -e "${BLUE}→${RESET} $1"; }
warn() { echo -e "${YELLOW}⚠${RESET} $1"; }
fail() { echo -e "${RED}✗ ERRO:${RESET} $1"; exit 1; }
header() { echo -e "\n${BOLD}${BLUE}══ $1 ══${RESET}"; }

# ── Verificar dependências ────────────────────────────────────────────────────
header "Verificando dependências"

for cmd in curl jq node npm; do
  command -v "$cmd" &>/dev/null && ok "$cmd instalado" || fail "$cmd não encontrado. Instale e tente novamente."
done

# Vercel CLI
if ! command -v vercel &>/dev/null; then
  info "Instalando Vercel CLI..."
  npm install -g vercel@latest
  ok "Vercel CLI instalado"
else
  ok "Vercel CLI instalado"
fi

# Stripe CLI
if ! command -v stripe &>/dev/null; then
  warn "Stripe CLI não encontrado — instale em https://stripe.com/docs/stripe-cli"
  warn "O webhook precisa ser configurado manualmente depois."
  STRIPE_CLI=false
else
  ok "Stripe CLI instalado"
  STRIPE_CLI=true
fi

# ── Coletar credenciais ───────────────────────────────────────────────────────
header "Configuração das credenciais"

echo ""
echo -e "${BOLD}Você precisará das seguintes informações:${RESET}"
echo "  1. Supabase: URL do projeto e chaves (supabase.com → seu projeto → Settings → API)"
echo "  2. Anthropic: API Key (console.anthropic.com)"
echo "  3. Stripe: Chaves da conta (dashboard.stripe.com → Developers → API keys)"
echo "  4. Email do admin"
echo ""

# Supabase
read -rp "$(echo -e "${BOLD}Supabase Project URL${RESET} (ex: https://xyz.supabase.co): ")" SUPABASE_URL
[[ "$SUPABASE_URL" =~ ^https://.*\.supabase\.co$ ]] || fail "URL do Supabase inválida"

read -rp "$(echo -e "${BOLD}Supabase Anon Key${RESET}: ")" SUPABASE_ANON_KEY
[[ -n "$SUPABASE_ANON_KEY" ]] || fail "Anon Key não pode ser vazia"

read -rp "$(echo -e "${BOLD}Supabase Service Role Key${RESET}: ")" SUPABASE_SERVICE_ROLE_KEY
[[ -n "$SUPABASE_SERVICE_ROLE_KEY" ]] || fail "Service Role Key não pode ser vazia"

# Anthropic
read -rp "$(echo -e "${BOLD}Anthropic API Key${RESET} (sk-ant-...): ")" ANTHROPIC_API_KEY
[[ "$ANTHROPIC_API_KEY" =~ ^sk-ant- ]] || fail "API Key da Anthropic inválida (deve começar com sk-ant-)"

# Stripe
read -rp "$(echo -e "${BOLD}Stripe Secret Key${RESET} (sk_live_... ou sk_test_...): ")" STRIPE_SECRET_KEY
[[ "$STRIPE_SECRET_KEY" =~ ^sk_(live|test)_ ]] || fail "Stripe Secret Key inválida"

read -rp "$(echo -e "${BOLD}Stripe Publishable Key${RESET} (pk_live_... ou pk_test_...): ")" STRIPE_PUBLISHABLE_KEY
[[ "$STRIPE_PUBLISHABLE_KEY" =~ ^pk_(live|test)_ ]] || fail "Stripe Publishable Key inválida"

# Admin
read -rp "$(echo -e "${BOLD}Seu email de admin${RESET}: ")" ADMIN_EMAIL
[[ "$ADMIN_EMAIL" =~ @ ]] || fail "Email inválido"

# Domínio Vercel
read -rp "$(echo -e "${BOLD}Nome do projeto na Vercel${RESET} (ex: siruztec → siruztec.vercel.app): ")" VERCEL_PROJECT_NAME
VERCEL_PROJECT_NAME="${VERCEL_PROJECT_NAME:-siruztec}"
APP_URL="https://${VERCEL_PROJECT_NAME}.vercel.app"

echo ""
ok "Credenciais coletadas"

# ── Configurar banco Supabase ─────────────────────────────────────────────────
header "Configurando banco de dados Supabase"

info "Executando migrations via API REST..."

SQL=$(cat <<'SQLEOF'
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Tenants (empresas clientes)
create table if not exists tenants (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references auth.users(id) on delete cascade,
  name text not null,
  plan text not null default 'startup' check (plan in ('startup', 'scale', 'dominance')),
  stripe_customer_id text,
  stripe_subscription_id text,
  status text not null default 'trial' check (status in ('trial', 'active', 'paused', 'cancelled')),
  created_at timestamptz default now()
);

-- Business profiles
create table if not exists business_profiles (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id) on delete cascade unique,
  company_name text not null,
  industry text not null,
  size text not null,
  target_audience text not null,
  main_challenge text not null,
  goals text[] not null default '{}',
  tone_of_voice text not null,
  context_summary text,
  onboarding_completed boolean default false,
  created_at timestamptz default now()
);

-- Conversations
create table if not exists conversations (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id) on delete cascade,
  agent_id text not null,
  messages jsonb not null default '[]',
  routed_from text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Usage logs
create table if not exists usage_logs (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id) on delete cascade,
  agent_id text not null,
  tokens_used integer not null default 0,
  created_at timestamptz default now()
);

-- Sessões freelancer (contratação avulsa de especialistas)
create table if not exists freelance_sessions (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id) on delete cascade,
  agent_id text not null,
  stripe_payment_id text not null,
  messages_used integer not null default 0,
  messages_limit integer not null default 20,
  expires_at timestamptz not null default (now() + interval '24 hours'),
  created_at timestamptz default now()
);

-- Colunas de onboarding conversacional (idempotentes)
alter table business_profiles
  add column if not exists partial_profile jsonb default '{}',
  add column if not exists onboarding_messages jsonb default '[]';

-- Row Level Security
alter table tenants enable row level security;
alter table business_profiles enable row level security;
alter table conversations enable row level security;
alter table usage_logs enable row level security;
alter table freelance_sessions enable row level security;

-- Policies (idempotent: drop before create)
drop policy if exists "Users see own tenant" on tenants;
create policy "Users see own tenant" on tenants
  for all using (owner_id = auth.uid());

drop policy if exists "Users see own profile" on business_profiles;
create policy "Users see own profile" on business_profiles
  for all using (
    tenant_id in (select id from tenants where owner_id = auth.uid())
  );

drop policy if exists "Users see own conversations" on conversations;
create policy "Users see own conversations" on conversations
  for all using (
    tenant_id in (select id from tenants where owner_id = auth.uid())
  );

drop policy if exists "Users see own usage" on usage_logs;
create policy "Users see own usage" on usage_logs
  for all using (
    tenant_id in (select id from tenants where owner_id = auth.uid())
  );

drop policy if exists "Users see own freelance sessions" on freelance_sessions;
create policy "Users see own freelance sessions" on freelance_sessions
  for all using (
    tenant_id in (select id from tenants where owner_id = auth.uid())
  );
SQLEOF
)

SUPABASE_PROJECT_REF=$(echo "$SUPABASE_URL" | sed 's|https://||' | cut -d'.' -f1)

HTTP_STATUS=$(curl -s -o /tmp/supabase_response.json -w "%{http_code}" \
  -X POST \
  "https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/database/query" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"query\": $(echo "$SQL" | jq -Rs .)}")

if [[ "$HTTP_STATUS" == "200" || "$HTTP_STATUS" == "201" ]]; then
  ok "Schema criado no Supabase"
else
  warn "API REST retornou $HTTP_STATUS — exibindo SQL para execução manual"
  echo ""
  echo -e "${YELLOW}Cole este SQL no Supabase SQL Editor (supabase.com → seu projeto → SQL Editor):${RESET}"
  echo "────────────────────────────────────────────"
  echo "$SQL"
  echo "────────────────────────────────────────────"
  echo ""
  read -rp "Pressione ENTER após executar o SQL no Supabase..."
  ok "Schema confirmado"
fi

# ── Criar produtos no Stripe ──────────────────────────────────────────────────
header "Criando produtos no Stripe"

create_stripe_price() {
  local name=$1 amount=$2 lookup_key=$3

  PRODUCT_ID=$(curl -s \
    -u "${STRIPE_SECRET_KEY}:" \
    -d "name=${name}" \
    -d "metadata[plan]=${lookup_key}" \
    "https://api.stripe.com/v1/products" | jq -r '.id')

  PRICE_ID=$(curl -s \
    -u "${STRIPE_SECRET_KEY}:" \
    -d "currency=brl" \
    -d "unit_amount=${amount}" \
    -d "recurring[interval]=month" \
    -d "product=${PRODUCT_ID}" \
    -d "lookup_key=${lookup_key}" \
    "https://api.stripe.com/v1/prices" | jq -r '.id')

  echo "$PRICE_ID"
}

info "Criando produto STARTUP (R\$97/mês)..."
PRICE_STARTUP=$(create_stripe_price "SiruzTec STARTUP" 9700 "startup")
[[ "$PRICE_STARTUP" =~ ^price_ ]] && ok "STARTUP: $PRICE_STARTUP" || fail "Erro ao criar produto STARTUP"

info "Criando produto SCALE (R\$297/mês)..."
PRICE_SCALE=$(create_stripe_price "SiruzTec SCALE" 29700 "scale")
[[ "$PRICE_SCALE" =~ ^price_ ]] && ok "SCALE: $PRICE_SCALE" || fail "Erro ao criar produto SCALE"

info "Criando produto DOMINANCE (R\$697/mês)..."
PRICE_DOMINANCE=$(create_stripe_price "SiruzTec DOMINANCE" 69700 "dominance")
[[ "$PRICE_DOMINANCE" =~ ^price_ ]] && ok "DOMINANCE: $PRICE_DOMINANCE" || fail "Erro ao criar produto DOMINANCE"

# Produtos one-time (freelancer)
create_stripe_price_onetime() {
  local name=$1 amount=$2 lookup_key=$3
  PRODUCT_ID=$(curl -s \
    -u "${STRIPE_SECRET_KEY}:" \
    -d "name=${name}" \
    "https://api.stripe.com/v1/products" | jq -r '.id')
  PRICE_ID=$(curl -s \
    -u "${STRIPE_SECRET_KEY}:" \
    -d "currency=brl" \
    -d "unit_amount=${amount}" \
    -d "product=${PRODUCT_ID}" \
    -d "lookup_key=${lookup_key}" \
    "https://api.stripe.com/v1/prices" | jq -r '.id')
  echo "$PRICE_ID"
}

info "Criando produto FREELANCER SCALE (R\$19 one-time)..."
PRICE_FREELANCE_SCALE=$(create_stripe_price_onetime "SiruzTec Freelancer SCALE" 1900 "freelance_scale")
[[ "$PRICE_FREELANCE_SCALE" =~ ^price_ ]] && ok "FREELANCER SCALE: $PRICE_FREELANCE_SCALE" || fail "Erro ao criar produto FREELANCER SCALE"

info "Criando produto FREELANCER DOMINANCE (R\$39 one-time)..."
PRICE_FREELANCE_DOMINANCE=$(create_stripe_price_onetime "SiruzTec Freelancer DOMINANCE" 3900 "freelance_dominance")
[[ "$PRICE_FREELANCE_DOMINANCE" =~ ^price_ ]] && ok "FREELANCER DOMINANCE: $PRICE_FREELANCE_DOMINANCE" || fail "Erro ao criar produto FREELANCER DOMINANCE"

# ── Criar .env.local ──────────────────────────────────────────────────────────
header "Gerando .env.local"

cat > .env.local <<ENVEOF
# Supabase
NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}

# Anthropic
ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}

# Stripe
STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${STRIPE_PUBLISHABLE_KEY}
STRIPE_WEBHOOK_SECRET=whsec_PLACEHOLDER
STRIPE_STARTUP_PRICE_ID=${PRICE_STARTUP}
STRIPE_SCALE_PRICE_ID=${PRICE_SCALE}
STRIPE_DOMINANCE_PRICE_ID=${PRICE_DOMINANCE}
STRIPE_FREELANCE_SCALE_PRICE_ID=${PRICE_FREELANCE_SCALE}
STRIPE_FREELANCE_DOMINANCE_PRICE_ID=${PRICE_FREELANCE_DOMINANCE}

# App
NEXT_PUBLIC_APP_URL=${APP_URL}
ADMIN_EMAIL=${ADMIN_EMAIL}
ENVEOF

ok ".env.local criado"

# ── Deploy na Vercel ──────────────────────────────────────────────────────────
header "Deploy na Vercel"

info "Fazendo login na Vercel (abrirá o browser)..."
vercel login

info "Linkando projeto..."
vercel link --project "$VERCEL_PROJECT_NAME" --yes 2>/dev/null || true

info "Adicionando variáveis de ambiente na Vercel..."

add_vercel_env() {
  echo "$2" | vercel env add "$1" production --yes 2>/dev/null || \
  vercel env rm "$1" production --yes 2>/dev/null && echo "$2" | vercel env add "$1" production --yes
}

add_vercel_env "NEXT_PUBLIC_SUPABASE_URL"          "$SUPABASE_URL"
add_vercel_env "NEXT_PUBLIC_SUPABASE_ANON_KEY"     "$SUPABASE_ANON_KEY"
add_vercel_env "SUPABASE_SERVICE_ROLE_KEY"          "$SUPABASE_SERVICE_ROLE_KEY"
add_vercel_env "ANTHROPIC_API_KEY"                  "$ANTHROPIC_API_KEY"
add_vercel_env "STRIPE_SECRET_KEY"                  "$STRIPE_SECRET_KEY"
add_vercel_env "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" "$STRIPE_PUBLISHABLE_KEY"
add_vercel_env "STRIPE_STARTUP_PRICE_ID"               "$PRICE_STARTUP"
add_vercel_env "STRIPE_SCALE_PRICE_ID"                 "$PRICE_SCALE"
add_vercel_env "STRIPE_DOMINANCE_PRICE_ID"             "$PRICE_DOMINANCE"
add_vercel_env "STRIPE_FREELANCE_SCALE_PRICE_ID"       "$PRICE_FREELANCE_SCALE"
add_vercel_env "STRIPE_FREELANCE_DOMINANCE_PRICE_ID"   "$PRICE_FREELANCE_DOMINANCE"
add_vercel_env "NEXT_PUBLIC_APP_URL"                   "$APP_URL"
add_vercel_env "ADMIN_EMAIL"                        "$ADMIN_EMAIL"

ok "Variáveis de ambiente configuradas"

info "Fazendo deploy de produção..."
vercel --prod --yes

ok "Deploy concluído!"

# ── Configurar Stripe Webhook ─────────────────────────────────────────────────
header "Configurando Stripe Webhook"

WEBHOOK_URL="${APP_URL}/api/webhooks/stripe"

if [[ "$STRIPE_CLI" == "true" ]]; then
  info "Criando webhook via Stripe CLI..."
  WEBHOOK_SECRET=$(stripe webhooks create \
    --url "$WEBHOOK_URL" \
    --events "checkout.session.completed,customer.subscription.updated,customer.subscription.deleted" \
    --format json 2>/dev/null | jq -r '.secret' || echo "")

  if [[ "$WEBHOOK_SECRET" =~ ^whsec_ ]]; then
    echo "$WEBHOOK_SECRET" | vercel env add "STRIPE_WEBHOOK_SECRET" production --yes
    ok "Webhook criado: $WEBHOOK_URL"
    ok "Secret atualizado na Vercel"

    info "Redeploy para aplicar o webhook secret..."
    vercel --prod --yes
  else
    warn "Não foi possível criar webhook automaticamente"
    warn "Crie manualmente em: https://dashboard.stripe.com/webhooks"
  fi
else
  echo ""
  warn "Stripe CLI não disponível. Crie o webhook manualmente:"
  echo ""
  echo "  1. Acesse: https://dashboard.stripe.com/webhooks"
  echo "  2. Clique em 'Add endpoint'"
  echo "  3. URL: ${WEBHOOK_URL}"
  echo "  4. Eventos: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted"
  echo "  5. Copie o 'Signing secret' (whsec_...)"
  echo "  6. Execute:"
  echo "     echo 'whsec_SEU_SECRET' | vercel env add STRIPE_WEBHOOK_SECRET production"
  echo "     vercel --prod"
  echo ""
fi

# ── Configurar Auth Supabase ──────────────────────────────────────────────────
header "Configuração Auth Supabase"

echo ""
echo -e "${YELLOW}Configure manualmente no Supabase Dashboard:${RESET}"
echo "  1. Acesse: ${SUPABASE_URL/https:\/\//https:\/\/supabase.com/project/}/auth/url-configuration"
echo "     (Authentication → URL Configuration)"
echo "  2. Site URL: ${APP_URL}"
echo "  3. Redirect URLs: ${APP_URL}/auth/callback"
echo ""
echo "  Para ativar Google OAuth:"
echo "  4. Authentication → Providers → Google → Enable"
echo "  5. Adicione Client ID e Secret do Google Cloud Console"
echo ""

# ── Resumo Final ──────────────────────────────────────────────────────────────
header "Setup concluído!"

echo ""
echo -e "${GREEN}${BOLD}SiruzTec está no ar! 🚀${RESET}"
echo ""
echo -e "  ${BOLD}URL:${RESET}      ${APP_URL}"
echo -e "  ${BOLD}Admin:${RESET}    ${APP_URL}/admin"
echo -e "  ${BOLD}Login:${RESET}    ${APP_URL}/login"
echo -e "  ${BOLD}Preços:${RESET}   ${APP_URL}/precos"
echo ""
echo -e "${BOLD}Stripe Price IDs:${RESET}"
echo "  STARTUP:              $PRICE_STARTUP"
echo "  SCALE:                $PRICE_SCALE"
echo "  DOMINANCE:            $PRICE_DOMINANCE"
echo "  FREELANCER SCALE:     $PRICE_FREELANCE_SCALE"
echo "  FREELANCER DOMINANCE: $PRICE_FREELANCE_DOMINANCE"
echo ""
echo -e "${YELLOW}Lembrete: configure o Auth Supabase conforme acima antes de testar login.${RESET}"
echo ""
