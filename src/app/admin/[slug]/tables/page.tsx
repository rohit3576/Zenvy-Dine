"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/providers/AuthProvider";
import { Table } from "@/types/restaurant";
import { demoTables, isDemoRestaurant, shouldUseLocalDemoFallback } from "@/data/demo-restaurant";
import { formatFirestoreError, logFirestoreError, logFirestoreOperation } from "@/lib/firestore-debug";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { Plus, Trash2, Download, Printer, Table as TableIcon } from "lucide-react";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui/premium";

export default function TableManagementPage({ params }: { params: Promise<{ slug: string }> }) {
  const { user } = useAuth();
  const [tables, setTables] = useState<Table[]>([]);
  const [newTableNumber, setNewTableNumber] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [slug, setSlug] = useState("");
  const [listenerError, setListenerError] = useState<string | null>(null);
  const isLocalDemo = shouldUseLocalDemoFallback() && process.env.NODE_ENV !== "production" && !!user?.restaurantId && isDemoRestaurant(user.restaurantId);

  useEffect(() => {
    if (!user?.restaurantId) return;

    logFirestoreOperation("subscribe", {
      collection: "tables",
      constraints: ["restaurantSlug == value"],
      restaurantSlug: user.restaurantId,
      authUid: user.uid,
      authRole: user.role,
      queryPath: "tables",
    });

    const q = query(
      collection(db, "tables"),
      where("restaurantSlug", "==", user.restaurantId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTables(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Table[]);
      setListenerError(null);
    }, (error) => {
      if (shouldUseLocalDemoFallback() && process.env.NODE_ENV !== "production" && user.restaurantId && isDemoRestaurant(user.restaurantId)) {
        setTables(demoTables);
        setListenerError(null);
        return;
      }
      logFirestoreError("tables.subscribe", error, {
        collection: "tables",
        restaurantSlug: user.restaurantId,
        queryPath: "tables",
      });
      setListenerError(`Table realtime updates are unavailable. ${formatFirestoreError(error)}`);
      toast.error(`Tables unavailable: ${formatFirestoreError(error)}`);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    params.then(({ slug }) => setSlug(slug));
  }, [params]);

  const handleAddTable = async () => {
    const restaurantId = user?.restaurantId;
    if (!newTableNumber || !restaurantId) return;
    setIsAdding(true);
    try {
      if (isLocalDemo) {
        setTables((current) => [
          ...current,
          {
            id: `local-table-${Date.now()}`,
            restaurantId,
            restaurantSlug: restaurantId,
            number: newTableNumber,
            isActive: true,
            createdAt: demoTables[0].createdAt,
            updatedAt: demoTables[0].updatedAt,
          },
        ]);
        setNewTableNumber("");
        toast.success("Table added locally");
        return;
      }
      logFirestoreOperation("addDoc", {
        collection: "tables",
        restaurantSlug: restaurantId,
        tableId: newTableNumber,
        queryPath: "tables",
      });
      await addDoc(collection(db, "tables"), {
        restaurantId,
        restaurantSlug: restaurantId,
        number: newTableNumber,
        tableNumber: newTableNumber,
        isActive: true,
        active: true,
        qrCode: `/r/${restaurantId}/table/${newTableNumber}`,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setNewTableNumber("");
      toast.success("Table added successfully");
    } catch (error) {
      logFirestoreError("tables.addDoc", error, {
        collection: "tables",
        restaurantSlug: restaurantId,
        tableId: newTableNumber,
        queryPath: "tables",
      });
      toast.error(`Failed to add table: ${formatFirestoreError(error)}`);
    } finally {
      setIsAdding(false);
    }
  };

  const deleteTable = async (id: string) => {
    if (confirm("Are you sure you want to delete this table?")) {
      try {
        if (isLocalDemo) {
          setTables((current) => current.filter((table) => table.id !== id));
          toast.success("Table deleted locally");
          return;
        }
        logFirestoreOperation("deleteDoc", {
          collection: "tables",
          queryPath: `tables/${id}`,
          restaurantSlug: user?.restaurantId,
        });
        await deleteDoc(doc(db, "tables", id));
        toast.success("Table deleted");
      } catch (error) {
        logFirestoreError("tables.deleteDoc", error, {
          collection: "tables",
          queryPath: `tables/${id}`,
          restaurantSlug: user?.restaurantId,
        });
        toast.error(`Failed to delete table: ${formatFirestoreError(error)}`);
      }
    }
  };

  const downloadQR = (tableNumber: string) => {
    const svg = document.getElementById(`qr-${tableNumber}`) as SVGElement | null;
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `QR-Table-${tableNumber}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="QR tables"
        title="Table Management"
        description="Generate polished QR entry points for each active table."
        action={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Input
              placeholder="Table number"
              className="sm:w-44"
              value={newTableNumber}
              onChange={(e) => setNewTableNumber(e.target.value)}
            />
            <Button variant="premium" onClick={handleAddTable} disabled={isAdding}>
              <Plus className="mr-2 h-4 w-4" /> Add Table
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {listenerError && (
          <div className="col-span-full rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {listenerError}
          </div>
        )}

        {tables.map((table) => {
          const qrUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/r/${slug}/table/${table.number}`;
          return (
            <Card key={table.id} className="group overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between border-b border-black/[0.06] bg-slate-50 py-3">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">Table {table.number}</CardTitle>
                  <StatusBadge tone="green">Active</StatusBadge>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => deleteTable(table.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="p-6 flex flex-col items-center space-y-4">
                <div className="rounded-2xl border bg-white p-4 shadow-inner">
                  <QRCodeSVG 
                    id={`qr-${table.number}`}
                    value={qrUrl} 
                    size={160}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <div className="flex gap-2 w-full">
                  <Button 
                    variant="outline" 
                    className="flex-1 text-xs"
                    onClick={() => downloadQR(table.number)}
                  >
                    <Download className="w-3 h-3 mr-2" /> Download
                  </Button>
                  <Button variant="outline" className="text-xs" onClick={() => window.print()}>
                    <Printer className="w-3 h-3" />
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground break-all text-center">
                  {qrUrl}
                </p>
              </CardContent>
            </Card>
          );
        })}

        {!listenerError && tables.length === 0 && (
          <div className="col-span-full">
            <EmptyState
              icon={TableIcon}
              title="No tables yet"
              description="Add your first table to generate a QR code for guest ordering."
            />
          </div>
        )}
      </div>
    </div>
  );
}
