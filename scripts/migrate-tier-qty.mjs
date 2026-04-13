import mysql from "mysql2/promise";
import * as dotenv from "dotenv";
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const queries = [
  "ALTER TABLE `upgrade_pricing_rules` ADD `tier2Qty` int DEFAULT 0",
  "ALTER TABLE `upgrade_pricing_rules` ADD `tier3Qty` int DEFAULT 0",
];

for (const q of queries) {
  try {
    await conn.execute(q);
    console.log("OK:", q);
  } catch (e) {
    if (e.code === "ER_DUP_FIELDNAME") {
      console.log("Already exists:", q);
    } else {
      console.error("Error:", e.message);
    }
  }
}

await conn.end();
console.log("Done.");
