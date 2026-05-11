import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, '../data.db'));

// Inicialização segura
db.exec(`
  CREATE TABLE IF NOT EXISTS objectives (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    deadline TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS goals (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    targetValue REAL,
    currentValue REAL DEFAULT 0,
    objectiveId TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (objectiveId) REFERENCES objectives (id)
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    completed INTEGER DEFAULT 0,
    dueDate TEXT,
    startTime TEXT,
    category TEXT DEFAULT 'work',
    priority TEXT DEFAULT 'medium',
    type TEXT DEFAULT 'event',
    frequency TEXT DEFAULT 'none',
    recurringDays TEXT,
    objectiveId TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (objectiveId) REFERENCES objectives (id)
  );

  CREATE TABLE IF NOT EXISTS task_completions (
    id TEXT PRIMARY KEY,
    taskId TEXT NOT NULL,
    date TEXT NOT NULL,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (taskId) REFERENCES tasks (id)
  );

  CREATE TABLE IF NOT EXISTS assets (
    id TEXT PRIMARY KEY,
    symbol TEXT NOT NULL,
    name TEXT,
    type TEXT,
    category TEXT DEFAULT 'stock',
    quantity REAL DEFAULT 0,
    averagePrice REAL DEFAULT 0,
    currentPrice REAL,
    dailyChange REAL,
    changePercent REAL,
    purchaseDate TEXT,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    type TEXT CHECK(type IN ('income', 'expense')),
    category TEXT,
    paymentMethod TEXT DEFAULT 'cash',
    date TEXT NOT NULL,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

// Migrações para tabelas existentes
const migrations = [
  { table: 'assets', column: 'dailyChange', type: 'REAL' },
  { table: 'assets', column: 'changePercent', type: 'REAL' },
  { table: 'assets', column: 'purchaseDate', type: 'TEXT' },
  { table: 'transactions', column: 'paymentMethod', type: "TEXT DEFAULT 'cash'" }
];

migrations.forEach(({ table, column, type }) => {
  try {
    db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`).run();
    console.log(`Migration: Coluna ${column} adicionada em ${table}`);
  } catch (err) {
    // Ignora erro se a coluna já existir
  }
});

export default db;
