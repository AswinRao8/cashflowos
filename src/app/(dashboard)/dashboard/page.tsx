import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

async function getDashboardData() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.businessId) {
    return null;
  }

  try {
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/dashboard/summary`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data;
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  const metrics = [
    {
      title: "Monthly Revenue",
      value: data ? `$${data.monthlyRevenue.toLocaleString()}` : "$0",
      description: "Collected this month",
    },
    {
      title: "Outstanding",
      value: data ? `$${data.outstandingPayments.toLocaleString()}` : "$0",
      description: "Awaiting payment",
    },
    {
      title: "Overdue",
      value: data ? `$${data.overdueInvoices.toLocaleString()}` : "$0",
      description: "Needs follow-up",
    },
    {
      title: "Conversion Rate",
      value: data ? `${data.conversionRate}%` : "0%",
      description: "Leads to won",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>
        <p className="text-sm text-muted-foreground">
          Overview of your business performance
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground">
                {metric.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Create a new lead or invoice to get started
            </p>
            <div className="flex gap-2">
              <a
                href="/leads"
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Add Lead
              </a>
              <a
                href="/invoices"
                className="inline-flex items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
              >
                Create Invoice
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}