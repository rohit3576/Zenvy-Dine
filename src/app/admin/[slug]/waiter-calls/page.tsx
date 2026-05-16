"use client";

import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, orderBy, query, updateDoc, where } from "firebase/firestore";
import { BellRing, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/firebase";
import { useAuth } from "@/providers/AuthProvider";

interface WaiterCall {
  id: string;
  restaurantId: string;
  tableNumber: string;
  status: "OPEN" | "ACKNOWLEDGED" | "CLOSED";
  createdAt?: { toDate: () => Date };
}

export default function WaiterCallsPage() {
  const { user } = useAuth();
  const [calls, setCalls] = useState<WaiterCall[]>([]);

  useEffect(() => {
    if (!user?.restaurantId) return;

    const callsQuery = query(
      collection(db, "waiterCalls"),
      where("restaurantId", "==", user.restaurantId),
      where("status", "in", ["OPEN", "ACKNOWLEDGED"]),
      orderBy("createdAt", "desc")
    );

    return onSnapshot(callsQuery, (snapshot) => {
      setCalls(snapshot.docs.map((call) => ({ id: call.id, ...call.data() })) as WaiterCall[]);
    });
  }, [user?.restaurantId]);

  const closeCall = async (callId: string) => {
    try {
      await updateDoc(doc(db, "waiterCalls", callId), {
        status: "CLOSED",
        updatedAt: new Date(),
      });
      toast.success("Waiter call closed.");
    } catch (error) {
      console.error("Waiter call update error:", error);
      toast.error("Could not close waiter call.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <BellRing className="h-7 w-7" />
          Waiter Calls
        </h2>
        <Badge variant="outline">{calls.length} active</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {calls.map((call) => (
          <Card key={call.id} className="border-l-4 border-l-amber-500">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Table {call.tableNumber}</CardTitle>
                <Badge>{call.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Requested {call.createdAt ? formatDistanceToNow(call.createdAt.toDate(), { addSuffix: true }) : "just now"}
              </p>
              <Button className="w-full" onClick={() => closeCall(call.id)}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Mark attended
              </Button>
            </CardContent>
          </Card>
        ))}

        {calls.length === 0 && (
          <div className="col-span-full rounded-xl border-2 border-dashed py-16 text-center text-muted-foreground">
            No active waiter calls.
          </div>
        )}
      </div>
    </div>
  );
}
