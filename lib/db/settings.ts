import { db } from "./connection";

export function getSettings() {
  return db.prepare("SELECT * FROM settings WHERE id = 1").get();
}
