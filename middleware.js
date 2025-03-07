import { NextResponse } from 'next/server';
import { jwtDecode } from 'jwt-decode';

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
  
  // Check if there's an auth token in the session
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
  
  // If the user is not logged in and trying to access protected routes, redirect to login
  if ((isStaffRoute || isAdminRoute) && !isLoggedIn) {
    const redirectUrl = new URL('/staff/login', request.url);
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