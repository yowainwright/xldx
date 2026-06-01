import { useState, useEffect } from "react";
import { Download, LogIn, LogOut, Loader2 } from "lucide-react";
import { DEMO_TABS } from "./constants";
import {
  downloadBlob,
  getStoredAuth,
  setStoredAuth,
  clearStoredAuth,
  openAuthPopup,
  generateInBrowser,
  generateInWorker,
  generateOnNode,
} from "./utils";
import type { DemoEnvironment, AuthState } from "./types";

export function Demo() {
  const [activeTab, setActiveTab] = useState<DemoEnvironment>("browser");
  const [loading, setLoading] = useState(false);
  const [auth, setAuth] = useState<AuthState>({ token: null, login: null });

  useEffect(() => {
    setAuth(getStoredAuth());

    const handleMessage = (e: MessageEvent) => {
      if (e.data?.token && e.data?.login) {
        const newAuth = { token: e.data.token, login: e.data.login };
        setAuth(newAuth);
        setStoredAuth(newAuth);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const handleLogout = () => {
    clearStoredAuth();
    setAuth({ token: null, login: null });
  };

  const handleGenerate = async () => {
    setLoading(true);

    try {
      let blob: Blob;
      let filename: string;

      if (activeTab === "browser") {
        blob = await generateInBrowser();
        filename = "demo-browser.xlsx";
      } else if (activeTab === "worker") {
        blob = await generateInWorker();
        filename = "demo-worker.xlsx";
      } else {
        if (!auth.token) {
          openAuthPopup();
          setLoading(false);
          return;
        }
        blob = await generateOnNode(auth.token);
        filename = "demo-node.xlsx";
      }

      downloadBlob(blob, filename);
    } catch (error) {
      console.error("Generation failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const activeTabData = DEMO_TABS.find((t) => t.id === activeTab)!;
  const needsAuth = activeTab === "node" && !auth.token;

  return (
    <section className="px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <h2 className="text-center text-3xl font-bold">Try It Out</h2>
        <p className="mt-4 text-center text-muted-foreground">
          Generate an Excel file in different environments.
        </p>

        <div className="mt-10 overflow-hidden rounded-lg border border-border">
          <div className="flex border-b border-border bg-muted/50">
            {DEMO_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "border-b-2 border-primary bg-background text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            <p className="text-sm text-muted-foreground">
              {activeTabData.description}
            </p>

            {activeTab === "node" && (
              <div className="mt-4 flex items-center gap-2 text-sm">
                {auth.login ? (
                  <>
                    <span className="text-muted-foreground">
                      Logged in as{" "}
                      <span className="font-medium text-foreground">
                        {auth.login}
                      </span>
                    </span>
                    <button
                      onClick={handleLogout}
                      className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                    >
                      <LogOut className="h-3 w-3" />
                      Logout
                    </button>
                  </>
                ) : (
                  <span className="text-muted-foreground">Not logged in</span>
                )}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : needsAuth ? (
                <LogIn className="h-4 w-4" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {loading
                ? "Generating..."
                : needsAuth
                  ? "Login with GitHub"
                  : "Download Excel"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
