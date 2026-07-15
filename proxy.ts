import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function proxy(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    if (!token) {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }

    // Role-based routing
    const role = token.role as string;

    if ((path.startsWith("/admin") || path.startsWith("/api/admin")) && role !== "ADMIN") {
      if (path.startsWith("/api/admin")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      // Admins only. If not admin, bounce to their respective dashboard
      if (role === "WAITER") return NextResponse.redirect(new URL("/pos", req.url));
      if (role === "CASHIER") return NextResponse.redirect(new URL("/cashier", req.url));
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }

    if (path.startsWith("/pos") && role !== "WAITER" && role !== "ADMIN") {
      if (role === "CASHIER") return NextResponse.redirect(new URL("/cashier", req.url));
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }

    if (path.startsWith("/cashier") && role !== "CASHIER" && role !== "ADMIN") {
      if (role === "WAITER") return NextResponse.redirect(new URL("/pos", req.url));
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }
    
    // Allow access by default if above rules pass
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/admin/:path*", "/pos/:path*", "/cashier/:path*", "/api/admin/:path*"],
};
