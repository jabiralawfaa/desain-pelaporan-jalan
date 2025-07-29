"use client";

import { useAppContext } from "@/contexts/AppContext";
import { UserDashboard } from "@/components/UserDashboard";
import { AdminDashboard } from "@/components/AdminDashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function DashboardPage() {
  const { user, reportAreas, loading } = useAppContext();

  if (loading || !user) {
    return (
      <Card className="h-full">
        <CardContent className="p-4 h-full">
          <Skeleton className="w-full h-full rounded-md" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="h-screen w-screen">
        {user.role === 'admin' ? <AdminDashboard /> : <UserDashboard />}
    </div>
  );
}
