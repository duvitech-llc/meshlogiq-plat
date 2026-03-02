#!/usr/bin/env bash
set -euo pipefail

# Usage: ./generate-meshlogiq-certs.sh [certs_dir] [domain]
CERTS_DIR="${1:-traefik/certs}"
DOMAIN="${2:-meshlogiq.local}"

# Optional flags
USE_INTERMEDIATE="${USE_INTERMEDIATE:-false}"
CLIENT_NAME="${CLIENT_NAME:-meshlogiq-device}"
CREATE_CLIENT_CERT="${CREATE_CLIENT_CERT:-true}"

ORG="meshlogiq"
OU="Onsite"
COUNTRY="US"
STATE="New York"
CITY="Rochester"

mkdir -p "$CERTS_DIR"
cd "$CERTS_DIR"

echo "==> Working in: $(pwd)"
echo "==> Domain: $DOMAIN  (will issue *.${DOMAIN})"

# Files
CA_KEY="meshlogiqlocalCA.key"
CA_CRT="meshlogiqlocalCA.pem"
CA_SRL="meshlogiqlocalCA.srl"
ICA_KEY="meshlogiqlocalICA.key"
ICA_CRT="meshlogiqlocalICA.pem"

WILDCARD_KEY="wildcard.key"
WILDCARD_CSR="wildcard.csr"
WILDCARD_CRT="wildcard.crt"
WILDCARD_PFX="wildcard.pfx"
FULLCHAIN_CRT="wildcard-fullchain.crt"
CA_CHAIN="meshlogiq-ca-chain.pem"

CLIENT_KEY="${CLIENT_NAME}.key"
CLIENT_CSR="${CLIENT_NAME}.csr"
CLIENT_CRT="${CLIENT_NAME}.crt"
CLIENT_PFX="${CLIENT_NAME}.pfx"

SAN_EXT="$(mktemp)"
CLIENT_EXT="$(mktemp)"
trap 'rm -f "$SAN_EXT" "$CLIENT_EXT"' EXIT

cat >"$SAN_EXT" <<EOF
[ext]
subjectAltName=DNS:*.${DOMAIN},DNS:${DOMAIN}
keyUsage=digitalSignature,keyEncipherment
extendedKeyUsage=serverAuth,clientAuth
EOF

cat >"$CLIENT_EXT" <<EOF
[ext]
keyUsage=digitalSignature
extendedKeyUsage=clientAuth
EOF

# 1) Root CA (valid 5 years)
if [[ ! -f "$CA_KEY" || ! -f "$CA_CRT" ]]; then
  echo "==> Creating Root CA (5 years)"
  openssl req -new -newkey rsa:4096 -days 1825 \
    -subj "/C=${COUNTRY}/ST=${STATE}/L=${CITY}/O=${ORG}/OU=${OU}/CN=meshlogiq Root CA" \
    -addext "basicConstraints=critical,CA:TRUE" \
    -addext "keyUsage=critical,keyCertSign,cRLSign" \
    -addext "subjectKeyIdentifier=hash" \
    -nodes -x509 -sha256 \
    -keyout "$CA_KEY" -out "$CA_CRT"
else
  echo "==> Root CA already exists, skipping."
fi

# 1b) Intermediate CA (optional)
if [[ "$USE_INTERMEDIATE" == "true" ]]; then
  if [[ ! -f "$ICA_KEY" || ! -f "$ICA_CRT" ]]; then
    echo "==> Creating Intermediate CA (3 years)"
    openssl req -new -newkey rsa:4096 -nodes \
      -subj "/C=${COUNTRY}/ST=${STATE}/L=${CITY}/O=${ORG}/OU=${OU}/CN=meshlogiq Intermediate CA" \
      -keyout "$ICA_KEY" -out "${ICA_KEY}.csr"

    openssl x509 -req -in "${ICA_KEY}.csr" \
      -CA "$CA_CRT" -CAkey "$CA_KEY" -CAcreateserial \
      -out "$ICA_CRT" -days 1095 -sha256 \
      -addext "basicConstraints=critical,CA:TRUE" \
      -addext "keyUsage=critical,keyCertSign,cRLSign" \
      -addext "subjectKeyIdentifier=hash" \
      -addext "authorityKeyIdentifier=keyid,issuer"
  else
    echo "==> Intermediate CA already exists, skipping."
  fi
fi

# 2) Wildcard CSR (and key)
if [[ ! -f "$WILDCARD_KEY" || ! -f "$WILDCARD_CSR" ]]; then
  echo "==> Creating wildcard key+CSR for *.${DOMAIN}"
  openssl req -new -newkey rsa:2048 -nodes \
    -keyout "$WILDCARD_KEY" \
    -out "$WILDCARD_CSR" \
    -subj "/C=${COUNTRY}/ST=${STATE}/L=${CITY}/O=${ORG}/OU=${OU}/CN=*.${DOMAIN}/" \
    -addext "subjectAltName=DNS:*.${DOMAIN},DNS:${DOMAIN}"
else
  echo "==> Wildcard key/CSR already exists, skipping."
fi

# 3) Sign CSR with CA (valid 1 year)
if [[ "$USE_INTERMEDIATE" == "true" ]]; then
  echo "==> Signing wildcard certificate with Intermediate CA (1 year)"
  openssl x509 -req -in "$WILDCARD_CSR" \
    -CA "$ICA_CRT" -CAkey "$ICA_KEY" -CAcreateserial \
    -out "$WILDCARD_CRT" -days 365 -sha256 \
    -extfile "$SAN_EXT" -extensions ext
else
  echo "==> Signing wildcard certificate with Root CA (1 year)"
  openssl x509 -req -in "$WILDCARD_CSR" \
    -CA "$CA_CRT" -CAkey "$CA_KEY" -CAcreateserial \
    -out "$WILDCARD_CRT" -days 365 -sha256 \
    -extfile "$SAN_EXT" -extensions ext
fi

# 4) Verify
echo "==> Verifying certificate:"
openssl x509 -in "$WILDCARD_CRT" -text -noout | sed -n '1,25p'

# 5) PFX bundle (optional)
if [[ ! -f "$WILDCARD_PFX" ]]; then
  echo "==> Creating PFX bundle"
  openssl pkcs12 -export -out "$WILDCARD_PFX" \
    -inkey "$WILDCARD_KEY" -in "$WILDCARD_CRT" -certfile "$CA_CRT" \
    -passout pass:
fi

# 6) Fullchain + CA chain
if [[ "$USE_INTERMEDIATE" == "true" ]]; then
  cat "$WILDCARD_CRT" "$ICA_CRT" "$CA_CRT" > "$FULLCHAIN_CRT"
  cat "$ICA_CRT" "$CA_CRT" > "$CA_CHAIN"
else
  cat "$WILDCARD_CRT" "$CA_CRT" > "$FULLCHAIN_CRT"
  cat "$CA_CRT" > "$CA_CHAIN"
fi

# 7) Client cert for devices (optional)
if [[ "$CREATE_CLIENT_CERT" == "true" ]]; then
  if [[ ! -f "$CLIENT_KEY" || ! -f "$CLIENT_CRT" ]]; then
    echo "==> Creating client cert for $CLIENT_NAME"
    openssl req -new -newkey rsa:2048 -nodes \
      -keyout "$CLIENT_KEY" -out "$CLIENT_CSR" \
      -subj "/C=${COUNTRY}/ST=${STATE}/L=${CITY}/O=${ORG}/OU=${OU}/CN=${CLIENT_NAME}"

    if [[ "$USE_INTERMEDIATE" == "true" ]]; then
      openssl x509 -req -in "$CLIENT_CSR" \
        -CA "$ICA_CRT" -CAkey "$ICA_KEY" -CAcreateserial \
        -out "$CLIENT_CRT" -days 365 -sha256 \
        -extfile "$CLIENT_EXT" -extensions ext
    else
      openssl x509 -req -in "$CLIENT_CSR" \
        -CA "$CA_CRT" -CAkey "$CA_KEY" -CAcreateserial \
        -out "$CLIENT_CRT" -days 365 -sha256 \
        -extfile "$CLIENT_EXT" -extensions ext
    fi

    if [[ ! -f "$CLIENT_PFX" ]]; then
      openssl pkcs12 -export -out "$CLIENT_PFX" \
        -inkey "$CLIENT_KEY" -in "$CLIENT_CRT" -certfile "$CA_CHAIN" \
        -passout pass:
    fi
  else
    echo "==> Client cert already exists, skipping."
  fi
fi

# Lock down keys
chmod 600 "$CA_KEY" "$WILDCARD_KEY" "$ICA_KEY" "$CLIENT_KEY" 2>/dev/null || true

echo
echo "==> Done. Files created in $(pwd):"
ls -1 "$CA_KEY" "$CA_CRT" "$ICA_KEY" "$ICA_CRT" "$WILDCARD_KEY" "$WILDCARD_CSR" "$WILDCARD_CRT" "$WILDCARD_PFX" "$FULLCHAIN_CRT" "$CA_CHAIN" "$CLIENT_KEY" "$CLIENT_CSR" "$CLIENT_CRT" "$CLIENT_PFX" 2>/dev/null || true

echo
echo "==> Next:"
echo "   1) Import Root CA into Trusted Root (Cert Manager):  $(pwd)/$CA_CRT"
echo "   2) Use '*.${DOMAIN}' certs for services (wildcard.crt/key or wildcard-fullchain.crt)."
echo "   3) /etc/hosts entry:"
echo "      127.0.0.1 api.${DOMAIN} dev.${DOMAIN} traefik.${DOMAIN} pgadmin.${DOMAIN} minio.${DOMAIN}"
