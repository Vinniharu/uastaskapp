import { NextResponse } from 'next/server';
import { jwtDecode } from 'jwt-decode';

// Define routes that should always be accessible whether logged in or not
const publicRoutes = [
  '/',
  '/api',
  '/_next',
  '/favicon.ico',
  '/images',
  '/assets',
];

// Authentication-related API endpoints that should be accessible without auth
const authApiEndpoints = [
  '/auth/register',
  '/auth/login',
];

// Define staff routes that should redirect admins to admin dashboard
const staffOnlyRoutes = [
  '/staff/dashboard',
  '/staff/profile',
  '/staff/tasks',
  '/staff/task-history',
];

// Define routes that require admin role
const adminRoutes = [
  '/admin/dashboard',
  '/admin/staff',
  '/admin/create-task',
  '/admin/current-tasks',
  '/admin/task-history',
  // '/admin/report-logs',
];

// Define routes that should not be accessible when logged in
const authRoutes = [
  '/staff/login',
  '/staff/signup',
  '/admin/login',
];

export function middleware(request) {
  // Get the pathname from the URL
  const { pathname } = request.nextUrl;
  
  // Skip middleware for public static routes and auth API endpoints
  if (
    publicRoutes.some(route => pathname.startsWith(route)) ||
    authApiEndpoints.some(endpoint => pathname.includes(endpoint))
  ) {
    console.log("Middleware: Skipping for public or auth route:", pathname);
    return NextResponse.next();
  }
  
  // Check if there's an auth token in the cookies
  const authToken = request.cookies.get('authToken')?.value;
  const isLoggedIn = !!authToken;
  
  // Get user role from token if available
  let userRole = null;
  if (authToken) {
    try {
      const decoded = jwtDecode(authToken);
      userRole = decoded.role || null;
    } catch (error) {
      console.error('Error decoding token:', error);
      // If token is invalid, clear it and redirect to login
      const response = NextResponse.redirect(new URL('/staff/login', request.url));
      response.cookies.delete('authToken');
      return response;
    }
  }
  
  // Check if the requested route is a staff-only route
  const isStaffRoute = staffOnlyRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
  
  // Check if the requested route is an admin route
  const isAdminRoute = adminRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
  
  // Check if the requested route is an auth route (login/signup)
  const isAuthRoute = authRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
  
  // If user is not logged in and trying to access any protected route, redirect to login
  if (!isLoggedIn && !isAuthRoute && !pathname.startsWith('/api')) {
    const redirectUrl = new URL('/staff/login', request.url);
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }
  
  // If the user is an admin and trying to access staff routes, redirect to admin dashboard
  if (isStaffRoute && userRole === 'admin') {
    const redirectUrl = new URL('/admin/dashboard', request.url);
    return NextResponse.redirect(redirectUrl);
  }
  
  // If the user is not an admin and trying to access admin routes, redirect to staff dashboard
  if (isAdminRoute && userRole !== 'admin') {
    const redirectUrl = new URL('/staff/dashboard', request.url);
    return NextResponse.redirect(redirectUrl);
  }
  
  // If the route is an auth route and the user is logged in, redirect to appropriate dashboard
  if (isAuthRoute && isLoggedIn) {
    const redirectUrl = new URL(
      userRole === 'admin' ? '/admin/dashboard' : '/staff/dashboard', 
      request.url
    );
    return NextResponse.redirect(redirectUrl);
  }
  
  // Continue with the request for non-protected routes or authenticated users
  return NextResponse.next();
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    // Match all routes except static files, api routes, and _next
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 