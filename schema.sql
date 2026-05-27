DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    username TEXT,
    first_name TEXT,
    wallet_address TEXT,
    balance REAL DEFAULT 0,
    referred_by INTEGER,
    state TEXT DEFAULT 'idle',
    temp_data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS withdrawals;
CREATE TABLE withdrawals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    amount REAL,
    tx_hash TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
