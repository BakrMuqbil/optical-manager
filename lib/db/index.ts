import { db } from "./connection";
import { initializeSchema } from "./schema";
import { runMigrations } from "./migrations";

initializeSchema(db);
runMigrations();

export { db } from "./connection";
export { uid, nextCustomerNumber, nextInvoiceNumber, nextTransactionNumber, normalizeMoney, normalizeOptionalNumber, normalizeOptionalInt } from "./helpers";
export { getSettings } from "./settings";
