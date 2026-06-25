import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen w-full overflow-x-hidden box-border">
      <Header />
      <main className="pt-16 flex-1 w-full">{children}</main>
      <Footer />
    </div>
  );
}
