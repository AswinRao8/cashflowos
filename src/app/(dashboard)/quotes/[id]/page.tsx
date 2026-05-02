"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ArrowLeft, FileText, Send, Check, X } from "lucide-react";

type QuoteStatus = "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED" | "EXPIRED";

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  total: number;
}

interface Quote {
  id: string;
  customerName: string;
  customerEmail: string | null;
  quoteNumber: string;
  status: QuoteStatus;
  issueDate: string;
  expiryDate: string | null;
  currency: string;
  totalAmount: number;
  taxAmount: number;
  notes: string | null;
  lead: { firstName: string; lastName: string | null } | null;
  lineItems: LineItem[];
}

const statusColors: Record<QuoteStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  SENT: "bg-blue-100 text-blue-800",
  ACCEPTED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  EXPIRED: "bg-yellow-100 text-yellow-800",
};

const statusLabels: Record<QuoteStatus, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  EXPIRED: "Expired",
};

export default function QuoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  const quoteId = params.id as string;
  const autoConvert = searchParams.get("convert") === "true";

  useEffect(() => {
    fetchQuote();
  }, [quoteId]);

  useEffect(() => {
    if (quote && autoConvert && (quote.status === "DRAFT" || quote.status === "SENT")) {
      setShowConvertDialog(true);
    }
  }, [quote, autoConvert]);

  async function fetchQuote() {
    try {
      const res = await fetch(`/api/quotes/${quoteId}`);
      const data = await res.json();
      if (data.success) {
        setQuote(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch quote:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function updateStatus(status: QuoteStatus) {
    try {
      const res = await fetch(`/api/quotes/${quoteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        setQuote({ ...quote!, status });
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  }

  async function convertToInvoice() {
    setIsConverting(true);
    try {
      const res = await fetch(`/api/quotes/${quoteId}/convert`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        router.push(`/invoices/${data.data.id}`);
      }
    } catch (error) {
      console.error("Failed to convert quote:", error);
      setIsConverting(false);
    }
  }

  function formatCurrency(amount: number, currency: string) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/3" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/4" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-medium">Quote not found</h2>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={() => router.push("/quotes")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Quotes
      </Button>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Quote {quote.quoteNumber}</CardTitle>
              <Badge className={statusColors[quote.status]}>{statusLabels[quote.status]}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Customer</p>
                <p className="font-medium">{quote.customerName}</p>
                {quote.customerEmail && (
                  <p className="text-muted-foreground">{quote.customerEmail}</p>
                )}
              </div>
              <div>
                <p className="text-muted-foreground">Issue Date</p>
                <p>{new Date(quote.issueDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Expiry Date</p>
                <p>{quote.expiryDate ? new Date(quote.expiryDate).toLocaleDateString() : "Not set"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Amount</p>
                <p className="font-bold text-lg">{formatCurrency(quote.totalAmount, quote.currency)}</p>
              </div>
            </div>
            {quote.notes && (
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="text-sm">{quote.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {quote.status === "DRAFT" && (
              <Button variant="outline" className="w-full" onClick={() => updateStatus("SENT")}>
                <Send className="mr-2 h-4 w-4" />
                Mark as Sent
              </Button>
            )}
            {(quote.status === "DRAFT" || quote.status === "SENT") && (
              <Button className="w-full" onClick={() => setShowConvertDialog(true)}>
                <Check className="mr-2 h-4 w-4" />
                Convert to Invoice
              </Button>
            )}
            {quote.status === "SENT" && (
              <>
                <Button variant="outline" className="w-full" onClick={() => updateStatus("ACCEPTED")}>
                  <Check className="mr-2 h-4 w-4" />
                  Mark as Accepted
                </Button>
                <Button variant="destructive" className="w-full" onClick={() => updateStatus("REJECTED")}>
                  <X className="mr-2 h-4 w-4" />
                  Mark as Rejected
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          {quote.lineItems && quote.lineItems.length > 0 ? (
            <div className="border rounded-md">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3">Description</th>
                    <th className="text-right p-3">Qty</th>
                    <th className="text-right p-3">Unit Price</th>
                    <th className="text-right p-3">Tax</th>
                    <th className="text-right p-3">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {quote.lineItems.map((item) => (
                    <tr key={item.id} className="border-b">
                      <td className="p-3">{item.description}</td>
                      <td className="text-right p-3">{item.quantity}</td>
                      <td className="text-right p-3">{formatCurrency(item.unitPrice, quote.currency)}</td>
                      <td className="text-right p-3">{item.taxRate}%</td>
                      <td className="text-right p-3">{formatCurrency(item.total, quote.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No line items</p>
          )}
          <div className="mt-4 flex justify-end gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Subtotal:</span>{" "}
              {formatCurrency(quote.totalAmount - quote.taxAmount, quote.currency)}
            </div>
            <div>
              <span className="text-muted-foreground">Tax:</span>{" "}
              {formatCurrency(quote.taxAmount, quote.currency)}
            </div>
            <div className="font-bold">
              <span>Total:</span> {formatCurrency(quote.totalAmount, quote.currency)}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convert to Invoice</DialogTitle>
            <DialogDescription>
              This will create an invoice based on this quote. The quote will be marked as accepted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConvertDialog(false)}>
              Cancel
            </Button>
            <Button onClick={convertToInvoice} disabled={isConverting}>
              {isConverting ? "Creating..." : "Create Invoice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}