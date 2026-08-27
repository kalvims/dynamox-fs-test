import type { ComponentType } from 'react';

function isReactComponent(value: unknown): value is ComponentType {
  if (typeof value === 'function') {
    return true;
  }

  return Boolean(
    value &&
      typeof value === 'object' &&
      '$$typeof' in (value as Record<string, unknown>)
  );
}

/**
 * Vite 8/Rolldown can expose MUI icon CJS modules as `{ default: Icon }`
 * instead of the component itself. Unwrap so JSX always receives a valid type.
 */
export function resolveMuiIcon(iconModule: unknown): ComponentType {
  if (isReactComponent(iconModule)) {
    return iconModule;
  }

  if (iconModule && typeof iconModule === 'object' && 'default' in iconModule) {
    return resolveMuiIcon((iconModule as { default: unknown }).default);
  }

  throw new Error('Invalid MUI icon module');
}
