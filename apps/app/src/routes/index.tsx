import { createFileRoute, redirect } from "@tanstack/react-router";

import { getSession } from "#app/lib/auth.functions";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const session = await getSession();

    throw redirect({ to: session ? "/dashboard" : "/auth/login" });
  },
});
