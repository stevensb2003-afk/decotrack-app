

"use client";

// This layout is now a simple pass-through component.
// All authentication, loading, and redirection logic is handled globally by the AuthProvider.
// This prevents conditional hook rendering errors within the dashboard section.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
