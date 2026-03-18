// prisma.config.ts
import "dotenv/config";           // ← this loads your .env file
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",   // or wherever your schema is

  datasource: {
    url: env("DATABASE_URL"),       // ← your connection string comes from here
  },

  // Optional but recommended
  migrations: {
    path: "prisma/migrations",
  },
});