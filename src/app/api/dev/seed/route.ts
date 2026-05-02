import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { addDays, subDays } from "date-fns";

export async function POST() {
  try {
    // Only allow seeding in development mode
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { success: false, error: "Seeding is only allowed in development" },
        { status: 403 }
      );
    }

    // 1. Create a Demo Business
    const business = await prisma.business.upsert({
      where: { email: "demo@cashflowos.com" },
      update: {},
      create: {
        name: "Demo Services Ltd",
        email: "demo@cashflowos.com",
        phone: "+1 555 0123",
        address: "123 Business Way, Tech City",
        currency: "USD",
      },
    });

    // 2. Create a Demo Admin User
    const hashedPassword = await bcrypt.hash("password123", 10);
    const user = await prisma.user.upsert({
      where: { email: "admin@demo.com" },
      update: { businessId: business.id },
      create: {
        name: "Demo Admin",
        email: "admin@demo.com",
        passwordHash: hashedPassword,
        role: "ADMIN",
        businessId: business.id,
      },
    });

    // 3. Create Leads
    const lead1 = await prisma.lead.create({
      data: {
        businessId: business.id,
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        status: "NEW",
        notes: "Interested in monthly maintenance.",
      },
    });

    const lead2 = await prisma.lead.create({
      data: {
        businessId: business.id,
        firstName: "Jane",
        lastName: "Smith",
        email: "jane@company.com",
        status: "CONTACTED",
        notes: "Followed up via phone.",
      },
    });

    const lead3 = await prisma.lead.create({
      data: {
        businessId: business.id,
        firstName: "Robert",
        lastName: "Brown",
        email: "robert@global.net",
        status: "WON",
      },
    });

    // 4. Create Quotes
    const quote1 = await prisma.quote.create({
      data: {
        businessId: business.id,
        leadId: lead1.id,
        customerName: "John Doe",
        customerEmail: "john@example.com",
        quoteNumber: "Q-1001",
        status: "DRAFT",
        issueDate: new Date(),
        expiryDate: addDays(new Date(), 14),
        currency: "USD",
        totalAmount: 1500,
        taxAmount: 150,
      },
    });

    await prisma.lineItem.create({
      data: {
        businessId: business.id,
        parentId: quote1.id,
        parentType: "QUOTE",
        description: "Website Design",
        quantity: 1,
        unitPrice: 1500,
        taxRate: 10,
        total: 1500,
      },
    });

    // 5. Create Invoices
    const invoice1 = await prisma.invoice.create({
      data: {
        businessId: business.id,
        leadId: lead3.id,
        customerName: "Robert Brown",
        customerEmail: "robert@global.net",
        invoiceNumber: "INV-2001",
        status: "PAID",
        issueDate: subDays(new Date(), 10),
        dueDate: subDays(new Date(), 5),
        currency: "USD",
        totalAmount: 500,
        taxAmount: 50,
      },
    });

    const invoice2 = await prisma.invoice.create({
      data: {
        businessId: business.id,
        customerName: "Legacy Client",
        invoiceNumber: "INV-2002",
        status: "OVERDUE",
        issueDate: subDays(new Date(), 45),
        dueDate: subDays(new Date(), 15),
        currency: "USD",
        totalAmount: 2400,
        taxAmount: 240,
      },
    });

    const invoice3 = await prisma.invoice.create({
      data: {
        businessId: business.id,
        customerName: "New Client",
        invoiceNumber: "INV-2003",
        status: "SENT",
        issueDate: new Date(),
        dueDate: addDays(new Date(), 30),
        currency: "USD",
        totalAmount: 1200,
        taxAmount: 120,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully",
      data: {
        businessId: business.id,
        adminEmail: user.email,
        adminPassword: "password123",
      },
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error during seeding" },
      { status: 500 }
    );
  }
}
