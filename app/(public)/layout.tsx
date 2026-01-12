import { PropsWithChildren } from 'react';

// Public layout - no auth required
export default function PublicLayout({ children }: PropsWithChildren) {
  return <>{children}</>;
}
