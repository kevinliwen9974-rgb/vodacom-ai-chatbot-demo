# Vodacom demo — ECS deploy helpers
#
# Requires: sshpass (or key-based SSH), rsync, Node 20+ on the server.
# Secrets stay on the machine — never commit .env.local or data/kyc scans.

REMOTE_HOST="${ECS_HOST:-182.160.16.138}"
REMOTE_USER="${ECS_USER:-root}"
REMOTE_DIR="${VODACOM_DEMO_DIR:-/opt/vodacom-demo}"
APP_PORT="${VODACOM_DEMO_PORT:-3010}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

ssh_cmd() {
  if [[ -n "${ECS_PASSWORD:-}" ]]; then
    sshpass -p "$ECS_PASSWORD" ssh -o StrictHostKeyChecking=accept-new \
      "${REMOTE_USER}@${REMOTE_HOST}" "$@"
  else
    ssh -o StrictHostKeyChecking=accept-new "${REMOTE_USER}@${REMOTE_HOST}" "$@"
  fi
}

rsync_cmd() {
  if [[ -n "${ECS_PASSWORD:-}" ]]; then
    sshpass -p "$ECS_PASSWORD" rsync -az --delete "$@"
  else
    rsync -az --delete "$@"
  fi
}

echo "==> Sync code to ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}"
rsync_cmd \
  --exclude node_modules \
  --exclude .next \
  --exclude .git \
  --exclude .tmp \
  --exclude .agents \
  --exclude '.env*' \
  --exclude 'data/kyc/**' \
  -e "ssh -o StrictHostKeyChecking=accept-new" \
  "$ROOT/" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/"

echo "==> Sync private KYC docs (not in git)"
ssh_cmd "mkdir -p ${REMOTE_DIR}/data/kyc/shen"
if [[ -n "${ECS_PASSWORD:-}" ]]; then
  sshpass -p "$ECS_PASSWORD" rsync -az \
    -e "ssh -o StrictHostKeyChecking=accept-new" \
    "$ROOT/data/kyc/shen/" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/data/kyc/shen/" \
    --exclude '.gitkeep' || true
else
  rsync -az -e "ssh -o StrictHostKeyChecking=accept-new" \
    "$ROOT/data/kyc/shen/" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/data/kyc/shen/" \
    --exclude '.gitkeep' || true
fi

echo "==> Upload .env.local if present"
if [[ -f "$ROOT/.env.local" ]]; then
  if [[ -n "${ECS_PASSWORD:-}" ]]; then
    sshpass -p "$ECS_PASSWORD" scp -o StrictHostKeyChecking=accept-new \
      "$ROOT/.env.local" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/.env.local"
  else
    scp -o StrictHostKeyChecking=accept-new \
      "$ROOT/.env.local" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/.env.local"
  fi
fi

echo "==> Install, build, restart systemd"
ssh_cmd bash -s <<EOF
set -euo pipefail
cd ${REMOTE_DIR}
export PATH=/usr/local/bin:/usr/bin:\$PATH
if ! command -v node >/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
npm ci
npm run build
cat > /etc/systemd/system/vodacom-demo.service <<'UNIT'
[Unit]
Description=Vodacom AI CX Demo (Next.js)
After=network.target

[Service]
Type=simple
WorkingDirectory=${REMOTE_DIR}
Environment=NODE_ENV=production
Environment=PORT=${APP_PORT}
Environment=HOSTNAME=127.0.0.1
ExecStart=/usr/bin/npm run start -- -H 127.0.0.1 -p ${APP_PORT}
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl enable vodacom-demo
systemctl restart vodacom-demo
systemctl --no-pager --full status vodacom-demo | head -20
EOF

echo "==> Nginx vhost for vodacom-demo.alexsora.xyz"
ssh_cmd bash -s <<EOF
set -euo pipefail
cat > /etc/nginx/conf.d/vodacom-demo.conf <<'NGX'
server {
    listen 80;
    listen [::]:80;
    server_name vodacom-demo.alexsora.xyz;

    client_max_body_size 20m;

    location / {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 120s;
    }
}
NGX
nginx -t
systemctl reload nginx
echo "nginx ok"
EOF

echo "Done. App should answer on http://${REMOTE_HOST} (Host: vodacom-demo.alexsora.xyz) → :${APP_PORT}"
