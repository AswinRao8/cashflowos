/**
 * Simple Email Service Mock/Skeleton
 * In a real application, you would use a service like Resend, SendGrid, or Postmark.
 */

export async function sendEmail({
  to,
  subject,
  body,
}: {
  to: string;
  subject: string;
  body: string;
}) {
  console.log(`[EMAIL MOCK] Sending email to: ${to}`);
  console.log(`[EMAIL MOCK] Subject: ${subject}`);
  console.log(`[EMAIL MOCK] Body: ${body}`);
  
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 100));
  
  return { success: true, messageId: `mock-${Date.now()}` };
}

export async function sendInvoiceReminder({
  customerEmail,
  invoiceNumber,
  dueDate,
  amount,
  currency,
}: {
  customerEmail: string;
  invoiceNumber: string;
  dueDate: string;
  amount: number;
  currency: string;
}) {
  const subject = `Reminder: Invoice ${invoiceNumber} is overdue`;
  const body = `
    Hello,
    
    This is a friendly reminder that invoice ${invoiceNumber} for ${amount} ${currency} was due on ${dueDate}.
    
    Please make a payment at your earliest convenience.
    
    Thank you,
    CashFlowOS Support
  `;
  
  return sendEmail({ to: customerEmail, subject, body });
}
