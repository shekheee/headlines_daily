"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate } from "@/lib/utils";

const ROLE_BADGE = {
  ADMIN: "destructive",
  EDITOR: "info",
  REPORTER: "secondary",
} as const;

export function UsersManager({ users, currentUserId }: { users: any[]; currentUserId: string }) {
  const router = useRouter();

  const changeRole = async (userId: string, role: string) => {
    await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    router.refresh();
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left px-4 py-3 font-medium">User</th>
            <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Email</th>
            <th className="text-left px-4 py-3 font-medium">Role</th>
            <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Joined</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-muted/30">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  {user.image ? (
                    <img src={user.image} alt={user.name || ""} className="h-8 w-8 rounded-full" />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium">
                      {user.name?.[0]?.toUpperCase() || "?"}
                    </div>
                  )}
                  <span className="font-medium">{user.name || "Unnamed"}</span>
                  {user.id === currentUserId && (
                    <span className="text-xs text-muted-foreground">(you)</span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">
                {user.email}
              </td>
              <td className="px-4 py-3">
                {user.id === currentUserId ? (
                  <Badge variant={ROLE_BADGE[user.role as keyof typeof ROLE_BADGE] as any}>
                    {user.role}
                  </Badge>
                ) : (
                  <Select value={user.role} onValueChange={(v) => changeRole(user.id, v)}>
                    <SelectTrigger className="w-32 h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="EDITOR">Editor</SelectItem>
                      <SelectItem value="REPORTER">Reporter</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </td>
              <td className="px-4 py-3 hidden md:table-cell text-muted-foreground text-xs">
                {formatDate(user.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
