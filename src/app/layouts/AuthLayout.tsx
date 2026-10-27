import { Outlet } from "react-router";
import { AppLogo } from "@/components/AppLogo";

export function AuthLayout() {
  return (
    <div className="flex min-h-dvh flex-col items-center px-4 py-10 sm:justify-center sm:py-16">
      <header className="mb-8">
        <AppLogo />
      </header>
      <main className="w-full max-w-auth">
        <Outlet />
      </main>
    </div>
  );
}
