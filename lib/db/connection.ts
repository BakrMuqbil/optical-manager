import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

function getDataDir() {
  if (process.env.ELECTRON_DATA_DIR) return process.env.ELECTRON_DATA_DIR;

  if (process.env.NODE_ENV === "production") {
    const userDataPath =
      process.env.APPDATA ||
      process.env.LOCALAPPDATA ||
      process.env.HOME ||
      process.cwd();
    return path.join(userDataPath, "optical-manager");
  }

  return path.join(process.cwd(), "data");
}

const dataDir = getDataDir();
fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, "optical-manager.db");
const globalForDb = globalThis as unknown as { db?: Database.Database };

export const db = globalForDb.db ?? new Database(dbPath);

db.pragma("foreign_keys = ON");
db.pragma("journal_mode = WAL");

if (process.env.NODE_ENV !== "production") globalForDb.db = db;

export { dbPath, dataDir };
