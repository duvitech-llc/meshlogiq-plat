-- Create Keycloak database
CREATE DATABASE keycloak;

-- Connect to keycloak database and create user
-- Note: We grant all privileges on the keycloak database to the keycloak user
GRANT ALL PRIVILEGES ON DATABASE keycloak TO keycloak;

-- If the keycloak user doesn't exist, create it
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'keycloak') THEN
    CREATE ROLE keycloak WITH LOGIN PASSWORD 'keycloakpass';
    GRANT ALL PRIVILEGES ON DATABASE keycloak TO keycloak;
  END IF;
END $$;

-- Grant schema privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO keycloak;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO keycloak;