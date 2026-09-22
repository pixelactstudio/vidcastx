import { createFileRoute, Outlet, redirect, useRouter } from "@tanstack/react-router";

import { getSession } from "#app/lib/auth.functions";

export const Route = createFileRoute("/_protected")({
  beforeLoad: async ({ location }) => {
    const session = await getSession();

    if (!session) {
      throw redirect({ to: "/auth/login", search: { redirect: location.href } });
    }

    if (!session.user.hasOrganization && !location.pathname.startsWith("/onboarding")) {
      throw redirect({ to: "/onboarding" });
    }

    return { session };
  },

  component: () => <Outlet />,

  pendingComponent: () => (
    <div className="flex min-h-screen items-center justify-center">
      <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
    </div>
  ),

  errorComponent: ({ error }) => {
    const router = useRouter();
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-4 text-center">
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <p className="text-muted-foreground">{error instanceof Error ? error.message : "Unexpected error"}</p>
          <button
            onClick={() => {
              void router.invalidate();
            }}
            className="bg-primary text-primary-foreground px-4 py-2 text-sm"
          >
            Try again
          </button>
        </div>
      </div>
    );
  },
});
