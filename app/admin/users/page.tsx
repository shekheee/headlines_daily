import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { UsersManager } from "./UsersManager";

export const metadata = { title: "Users — Headlines Daily Admin" };

export default async function UsersPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/admin");

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, image: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Users</h1>
        <p className="text-muted-foreground mt-1">{users.length} team members</p>
      </div>
      <UsersManager users={users} currentUserId={session.user.id} />
    </div>
  );
}
