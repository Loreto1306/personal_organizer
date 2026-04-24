import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, '../data.db'));

// Inicialização segura
db.exec(`
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
`);

// Migração: Tentar adicionar colunas caso elas não existam (SQLite não suporta ADD COLUMN IF NOT EXISTS nativamente)
try {
  db.exec("ALTER TABLE tasks ADD COLUMN startTime TEXT;");
  console.log("Coluna 'startTime' adicionada.");
} catch (e) {
  // Coluna já existe
}

try {
  db.exec("ALTER TABLE tasks ADD COLUMN recurringDays TEXT;");
  console.log("Coluna 'recurringDays' adicionada.");
} catch (e) {
  // Coluna já existe
}

export default db;
