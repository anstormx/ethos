import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// globalForPrisma is a globalThis object with added prisma property added to it and isn't modifiable during hot reloads
// The prisma property is set to the PrismaClient instance if it exists, otherwise it is set to a new PrismaClient instance
// If the NODE_ENV environment variable is not set to "production", the globalForPrisma.prisma property is set to the PrismaClient instance
// This prevents the PrismaClient instance from being recreated on every request in development mode and creating new connection pools to the database