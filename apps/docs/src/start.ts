import { createCsrfMiddleware, createStart } from "@tanstack/react-start";

// Reject cross-site calls to server functions (the docs page loader is one).
const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

export const startInstance = createStart(() => ({
  requestMiddleware: [csrfMiddleware],
}));
