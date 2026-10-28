CREATE TABLE IF NOT EXISTS twillio_cred (
    id SERIAL PRIMARY KEY,
    auth_token TEXT,
    account_sid TEXT
);