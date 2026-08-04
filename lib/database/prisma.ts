import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

type HyperdriveBinding = { connectionString: string };
type AppCloudflareEnv = { HYPERDRIVE?: HyperdriveBinding };
type PrismaGlobal = { prisma?: PrismaClient };

const globalForPrisma = globalThis as unknown as PrismaGlobal;

function cloudflareConnectionString(): string | undefined {
  try {
    return getCloudflareContext<AppCloudflareEnv>().env.HYPERDRIVE?.connectionString;
  } catch {
    return undefined;
  }
}

export function getPrismaClient(): PrismaClient {
  const hyperdriveUrl = cloudflareConnectionString();
  if (hyperdriveUrl) {
    const adapter = new PrismaPg({ connectionString: hyperdriveUrl });
    return new PrismaClient({ adapter, log: ["error"] });
  }

  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
  }
  return globalForPrisma.prisma;
}
