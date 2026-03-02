# Usage

- For local development: docker-compose --env-file .env.local up
- For production: docker-compose --env-file .env.prod up

## Create self-signed cert
For a smoother browser experience, import meshlogiqlocalCA.pem into your system’s trusted root certificates. Use WSL to generate this on windows and Linux/MACos scripts provided install openssl

```
choco install openssl.light -y

winget install OpenSSL.Light
```


### Step 1: Create Domain Certificate Authority
```
openssl req -new -newkey rsa:4096 -days 1825 \
  -subj "/C=US/ST=New York/L=Rochester/O=MeshLogIQ/OU=Onsite/CN=MeshLogIQ Root CA" \
  -addext "basicConstraints=critical,CA:TRUE" \
  -addext "keyUsage=critical,keyCertSign,cRLSign" \
  -addext "subjectKeyIdentifier=hash" \
  -nodes -x509 -sha256 \
  -keyout meshlogiqlocalCA.key -out meshlogiqlocalCA.pem
```

### Step 2: Generate a Wildcard CSR (if not done yet)
```
openssl req -new -newkey rsa:2048 -nodes \
  -keyout wildcard.key \
  -out wildcard.csr \
  -subj "/C=US/ST=State/L=City/O=MeshLogIQ/OU=Onsite/CN=*.meshlogiq.local/" \
  -addext "subjectAltName=DNS:*.meshlogiq.local,DNS:meshlogiq.local"
```

### Step 3: Sign the Wildcard CSR with Your Root CA
```
openssl x509 -req -in wildcard.csr \
  -CA meshlogiqlocalCA.pem -CAkey meshlogiqlocalCA.key \
  -CAcreateserial -out wildcard.crt -days 365 -sha256 \
  -extfile <(printf "[ext]\nsubjectAltName=DNS:*.meshlogiq.local,DNS:meshlogiq.local\nkeyUsage=digitalSignature,keyEncipherment\nextendedKeyUsage=serverAuth,clientAuth") \
  -extensions ext
```

### Step 4: Verify the Signed Wildcard Certificate
```
openssl x509 -in wildcard.crt -text -noout
```
### Step 5: (Optional) Create a .pfx/.p12 Bundle for Servers
```
openssl pkcs12 -export -out wildcard.pfx \
  -inkey wildcard.key -in wildcard.crt -certfile meshlogiqlocalCA.pem
```

### Step 6: (Optional) Bundle the Root CA and wildcard cert:
if ther is a Missing Intermediate Chain include the CA with the wildcard
```
cat wildcard.crt meshlogiqlocalCA.pem > wildcard-fullchain.crt
```

### Step 7: Add Root CA PEM to Trusted Root Authorties
use cert manager.

### Step 8: update host file

```
127.0.0.1 api.meshlogiq.local dev.meshlogiq.local traefik.meshlogiq.local pgadmin.meshlogiq.local minio.meshlogiq.local s3.meshlogiq.local sso.meshlogiq.local meshlogiq.local
```

## Update docker container 

```
docker pull traefik:latest
docker compose up -d --force-recreate traefik
```

# Create backend super user after initial creation
```
# Windows PowerShell
docker exec meshlogiq-backend sh /scripts/create_superuser.sh `
  --username admin `
  --email admin@meshlogiq.localdomain `
  --password changeme
```

```
docker compose run --rm backend sh /scripts/create_superuser.sh \
  --username devadmin \
  --email devadmin@meshlogiq.localdomain \
  --password S3cret!
```

# Run development setup
```
docker compose -f infra/docker-compose.yml -f infra/docker-compose.dev.yml up -d --force-recreate traefik keycloak
```