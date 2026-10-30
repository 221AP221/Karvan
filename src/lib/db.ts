import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { LOCAL_DATABASE_URL } from "@/lib/local-db";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Lokal baza (prisma dev / PGlite) eyni anda yalnız bir bağlantı qəbul edir, ona görə orada
// sorğular bir bağlantıda növbəyə düzülür. Adi PostgreSQL-də standart hovuz işləyir.
const local = !process.env.DATABASE_URL;

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg(
      local ? { connectionString: LOCAL_DATABASE_URL, max: 1 } : { connectionString: process.env.DATABASE_URL },
    ),
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
