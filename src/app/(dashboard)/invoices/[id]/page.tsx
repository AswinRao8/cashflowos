"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Receipt, Send, CheckCircle, AlertCircle } from "lucide-react";

type InvoiceStatus = "DRAFT" | "SENT" | "VIEWED" | "PAID" | "OVERDUE" | "VOID";

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  total: number;
}

interface Payment {
  id: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  reference: string | null;
}

interface Invoice {
  id: string;
  customerName: string;
  customerEmail: string | null;
  invoiceNumber: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  currency: string;
  totalAmount: number;
  taxAmount: number;
  notes: string | null;
  lead: { firstName: string; lastName: string | null } | null;
  quote: { quoteNumber: string } | null;
  lineItems: LineItem[];
  payments: Payment[];
}

const statusColors: Record<InvoiceStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  SENT: "bg-blue-100 text-blue-800",
  VIEWED: "bg-purple-100 text-purple-800",
  PAID: "bg-green-100 text-green-800",
  OVERDUE: "bg-red-100 text-red-800",
  VOID: "bg-gray-100 text-gray-500",
};

const statusLabels: Record<InvoiceStatus, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  VIEWED: "Viewed",
  PAID: "Paid",
  OVERDUE: "Overdue",
  VOID: "Void",
};

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  const invoiceId = params.id as string;

  useEffect(() => {
    fetchInvoice();
  }, [invoiceId]);

  async function fetchInvoice() {
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`);
      const data = await res.json();
      if (data.success) {
        setInvoice(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch invoice:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function updateStatus(status: InvoiceStatus) {
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        setInvoice({ ...invoice!, status });
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  }

  async function markAsPaid() {
    setIsPaying(true);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PAID" }),
      });
      const data = await res.json();
      if (data.success) {
        setInvoice({ ...invoice!, status: "PAID" });
        setShowPayDialog(false);
      }
    } catch (error) {
      console.error("Failed to mark as paid:", error);
      setIsPaying(false);
    }
  }

  function formatCurrency(amount: number, currency: string) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);
  }

  const paidAmount = invoice?.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
  const remainingAmount = (invoice?.totalAmount || 0) - paidAmount;

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

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-medium">Invoice not found</h2>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={() => router.push("/invoices")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Invoices
      </Button>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Invoice {invoice.invoiceNumber}</CardTitle>
              <Badge className={statusColors[invoice.status]}>{statusLabels[invoice.status]}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Customer</p>
                <p className="font-medium">{invoice.customerName}</p>
                {invoice.customerEmail && (
                  <p className="text-muted-foreground">{invoice.customerEmail}</p>
                )}
              </div>
              <div>
                <p className="text-muted-foreground">Issue Date</p>
                <p>{new Date(invoice.issueDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Due Date</p>
                <p>{new Date(invoice.dueDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Amount</p>
                <p className="font-bold text-lg">{formatCurrency(invoice.totalAmount, invoice.currency)}</p>
              </div>
            </div>
            {invoice.notes && (
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="text-sm">{invoice.notes}</p>
              </div>
            )}
            {invoice.quote && (
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground">Related Quote</p>
                <p className="text-sm">{invoice.quote.quoteNumber}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {invoice.status === "DRAFT" && (
              <Button variant="outline" className="w-full" onClick={() => updateStatus("SENT")}>
                <Send className="mr-2 h-4 w-4" />
                Mark as Sent
              </Button>
            )}
            {(invoice.status === "SENT" || invoice.status === "VIEWED" || invoice.status === "OVERDUE") && (
              <Button className="w-full" onClick={() => setShowPayDialog(true)}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark as Paid
              </Button>
            )}
            {invoice.status !== "PAID" && invoice.status !== "VOID" && (
              <Button variant="destructive" className="w-full" onClick={() => updateStatus("VOID")}>
                Void Invoice
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          {invoice.lineItems && invoice.lineItems.length > 0 ? (
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
                  {invoice.lineItems.map((item) => (
                    <tr key={item.id} className="border-b">
                      <td className="p-3">{item.description}</td>
                      <td className="text-right p-3">{item.quantity}</td>
                      <td className="text-right p-3">{formatCurrency(item.unitPrice, invoice.currency)}</td>
                      <td className="text-right p-3">{item.taxRate}%</td>
                      <td className="text-right p-3">{formatCurrency(item.total, invoice.currency)}</td>
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
              {formatCurrency(invoice.totalAmount - invoice.taxAmount, invoice.currency)}
            </div>
            <div>
              <span className="text-muted-foreground">Tax:</span>{" "}
              {formatCurrency(invoice.taxAmount, invoice.currency)}
            </div>
            <div className="font-bold">
              <span>Total:</span> {formatCurrency(invoice.totalAmount, invoice.currency)}
            </div>
          </div>
        </CardContent>
      </Card>

      {invoice.payments && invoice.payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {invoice.payments.map((payment) => (
                <div key={payment.id} className="flex justify-between items-center p-3 border rounded-md">
                  <div>
                    <p className="font-medium">{formatCurrency(payment.amount, invoice.currency)}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(payment.paymentDate).toLocaleDateString()} - {payment.paymentMethod}
                      {payment.reference && ` (${payment.reference})`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <Separator className="my-4" />
            <div className="flex justify-between">
              <span>Total Paid:</span>
              <span className="font-bold text-green-600">{formatCurrency(paidAmount, invoice.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span>Remaining:</span>
              <span className={`font-bold ${remainingAmount > 0 ? "text-red-600" : "text-green-600"}`}>
                {formatCurrency(remainingAmount, invoice.currency)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={showPayDialog} onOpenChange={setShowPayDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Paid</DialogTitle>
            <DialogDescription>
              This will mark the invoice as fully paid. Use this when you receive the full payment.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-green-800">
                Amount to be marked as paid: {formatCurrency(remainingAmount, invoice.currency)}
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPayDialog(false)}>
              Cancel
            </Button>
            <Button onClick={markAsPaid} disabled={isPaying}>
              {isPaying ? "Processing..." : "Confirm Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}