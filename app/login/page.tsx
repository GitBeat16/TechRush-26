import { Suspense } from "react";
import { LoginView } from "@/components/auth/LoginView";

/** Server Component — provides the Suspense boundary useSearchParams needs. */
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginView />
    </Suspense>
  );
}

function LoginFallback() {
  return (
    <div className="mx-auto grid min-h-screen w-full max-w-[1200px] items-center gap-8 px-4 py-8 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:px-8">
      <div className="hidden h-96 rounded-clay-xl bg-clay-surface/60 lg:block" />
      <div className="h-[32rem] rounded-clay-xl bg-clay-surface/70 shadow-clay-sm" />
    </div>
  );
}
