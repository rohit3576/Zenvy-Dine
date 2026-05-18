/*
  Production seed entrypoint.
  Requires Admin SDK credentials and an explicit confirmation flag so sample
  tenant data is never written to a production project by accident.
*/
if (!process.argv.includes("--confirm-production")) {
  console.error("Refusing to seed production without --confirm-production.");
  console.error("Usage: npm run seed:production -- --confirm-production");
  process.exit(1);
}

process.env.SEED_PROFILE = "production";
process.env.SEED_MODE = "admin";
import "./seed";
