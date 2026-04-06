import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const user = await prisma.user.findFirst({ where: { email: "admin@dailynews.com" } });
  if (!user) {
    console.log("NO USER FOUND — need to re-seed");
    return;
  }
  const pw = (user as any).password;
  console.log("email:", user.email);
  console.log("role:", user.role);
  console.log("hasPassword:", !!pw);
  console.log("passwordLength:", pw?.length);

  if (pw) {
    const match = await bcrypt.compare("Admin@123456", pw);
    console.log("password matches 'Admin@123456':", match);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
