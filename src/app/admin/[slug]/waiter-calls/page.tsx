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
import { isDemoRestaurant, shouldUseLocalDemoFallback } from "@/data/demo-restaurant";
import { formatFirestoreError, logFirestoreError, logFirestoreOperation } from "@/lib/firestore-debug";

interface WaiterCall {
  id: string;
  restaurantId: string;
  restaurantSlug?: string;
  tableNumber: string;
  status: "OPEN" | "ACKNOWLEDGED" | "CLOSED";
  createdAt?: { toDate: () => Date };
}

export default function WaiterCallsPage() {
  const { user } = useAuth();
  const [calls, setCalls] = useState<WaiterCall[]>([]);
  const [listenerError, setListenerError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.restaurantId) return;

    logFirestoreOperation("subscribe", {
      collection: "waiterCalls",
      constraints: ["restaurantSlug == value", "status in OPEN/ACKNOWLEDGED", "orderBy createdAt desc"],
      restaurantSlug: user.restaurantId,
      authUid: user.uid,
      authRole: user.role,
      queryPath: "waiterCalls",
    });

    const callsQuery = query(
      collection(db, "waiterCalls"),
      where("restaurantSlug", "==", user.restaurantId),
      where("status", "in", ["OPEN", "ACKNOWLEDGED"]),
      orderBy("createdAt", "desc")
    );

    return onSnapshot(callsQuery, (snapshot) => {
      setCalls(snapshot.docs.map((call) => ({ id: call.id, ...call.data() })) as WaiterCall[]);
      setListenerError(null);
    }, (error) => {
      if (shouldUseLocalDemoFallback() && process.env.NODE_ENV !== "production" && user.restaurantId && isDemoRestaurant(user.restaurantId)) {
        setCalls([]);
        setListenerError(null);
        return;
      }
      logFirestoreError("waiterCalls.subscribe", error, {
        collection: "waiterCalls",
        restaurantSlug: user.restaurantId,
        queryPath: "waiterCalls",
      });
      setListenerError(`Could not subscribe to waiter calls: ${formatFirestoreError(error)}`);
      toast.error(`Failed to load waiter calls: ${formatFirestoreError(error)}`);
    });
  }, [user?.restaurantId, user?.role, user?.uid]);

  const closeCall = async (callId: string) => {
    try {
      logFirestoreOperation("updateDoc", {
        collection: "waiterCalls",
        queryPath: `waiterCalls/${callId}`,
        restaurantSlug: user?.restaurantId,
      });
      await updateDoc(doc(db, "waiterCalls", callId), {
        status: "CLOSED",
        updatedAt: new Date(),
      });
      toast.success("Waiter call closed.");
    } catch (error) {
      logFirestoreError("waiterCalls.updateDoc", error, {
        collection: "waiterCalls",
        queryPath: `waiterCalls/${callId}`,
        restaurantSlug: user?.restaurantId,
      });
      toast.error(`Could not close waiter call: ${formatFirestoreError(error)}`);
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
        {listenerError && (
          <div className="col-span-full rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {listenerError}
          </div>
        )}

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

        {!listenerError && calls.length === 0 && (
          <div className="col-span-full rounded-xl border-2 border-dashed py-16 text-center text-muted-foreground">
            No active waiter calls.
          </div>
        )}
      </div>
    </div>
  );
}
