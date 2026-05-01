export { default } from "next-auth/middleware"

export const config = { 
  matcher: [
    "/dashboard/:path*", 
    "/leads/:path*", 
    "/quotes/:path*", 
    "/invoices/:path*", 
    "/settings/:path*"
  ] 
}
