import "dotenv/config";
import { defineConfig } from "prisma/config";
import { LOCAL_DATABASE_URL } from "./src/lib/local-db";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations", seed: "tsx prisma/seed.ts" },
  datasource: { url: process.env.DATABASE_URL ?? LOCAL_DATABASE_URL },
});
