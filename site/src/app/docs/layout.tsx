"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { Footer } from "@/components/Footer";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="lg:pl-64">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          <article className="prose prose-zinc dark:prose-invert max-w-none">
            {children}
          </article>
        </div>
        <Footer />
      </main>
    </div>
  );
}
