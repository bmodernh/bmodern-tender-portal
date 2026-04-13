import { createConnection } from "mysql2/promise";

const url = process.env.DATABASE_URL;
const conn = await createConnection(url);
try {
  await conn.execute("ALTER TABLE projects ADD signed_contract_url text");
  console.log("Added signed_contract_url");
} catch (e) {
  if (e.message.includes("Duplicate")) console.log("signed_contract_url already exists");
  else throw e;
}
try {
  await conn.execute("ALTER TABLE projects ADD signed_contract_uploaded_at timestamp");
  console.log("Added signed_contract_uploaded_at");
} catch (e) {
  if (e.message.includes("Duplicate")) console.log("signed_contract_uploaded_at already exists");
  else throw e;
}
await conn.end();
console.log("Done");
