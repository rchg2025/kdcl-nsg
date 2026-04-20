import { withAuth } from "next-auth/middleware"

export default withAuth({
  callbacks: {
    authorized: ({ req, token }) => {
      const path = req.nextUrl.pathname
      
      if (path.startsWith("/admin") && token?.role !== "ADMIN") return false
      if (path.startsWith("/supervisor") && !["ADMIN", "SUPERVISOR"].includes(token?.role as string)) return false
      if (path.startsWith("/collaborator") && !["ADMIN", "COLLABORATOR"].includes(token?.role as string)) return false
      if (path.startsWith("/investigator") && !["ADMIN", "INVESTIGATOR"].includes(token?.role as string)) return false
      
      return !!token
    }
  }
})

export const config = { matcher: ["/admin/:path*", "/supervisor/:path*", "/collaborator/:path*", "/investigator/:path*"] }
