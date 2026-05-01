import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function getBusinessContext() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.businessId) {
    return null;
  }
  
  return {
    businessId: session.user.businessId,
    userId: session.user.id,
    role: session.user.role,
  };
}

export async function requireBusinessContext() {
  const context = await getBusinessContext();
  
  if (!context) {
    redirect("/login");
  }
  
  return context;
}
