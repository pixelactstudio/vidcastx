import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

import { APP_NAME } from "#docs/lib/shared";

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: APP_NAME,
    },
  };
}
