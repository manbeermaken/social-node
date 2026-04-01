import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

// 1. Wrap your working logic in a factory function
const prismaClientSingleton = () => {
  const connectionString = process.env.POSTGRES_DATABASE_URL;
  
  if (!connectionString) {
    throw new Error("POSTGRES_DATABASE_URL is not defined");
  }

  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
};

// 2. Tell TypeScript about the global variable
declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

// 3. Check if we already have an instance; if not, create one using your function
const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

// 4. In development, save the instance to the global object so it survives the next hot reload
if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}

export { prisma };