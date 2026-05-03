import { useState, useCallback } from "react";
import { Route, Switch } from "wouter";
import { EditorContext } from "@/hooks/useEditor";
import TopBar from "@/components/TopBar";
import Sidebar from "@/components/Sidebar";
import BottomBar from "@/components/BottomBar";
import FloatingEditorBtn from "@/components/FloatingEditorBtn";
import Dashboard from "@/pages/Dashboard";
import CategoryPage from "@/pages/CategoryPage";
import FormPage from "@/pages/FormPage";
import SettingsPage from "@/pages/SettingsPage";
import IssuesPage from "@/pages/IssuesPage";

export default function App() {
  const [isEditor, setIsEditor] = useState(() => !!localStorage.getItem("editor_token"));
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("editor_token"));
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const login = useCallback(async (password: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth?action=login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) return false;
      const { token: t } = await res.json();
      localStorage.setItem("editor_token", t);
      setToken(t);
      setIsEditor(true);
      return true;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("editor_token");
    setToken(null);
    setIsEditor(false);
  }, []);

  return (
    <EditorContext.Provider value={{ isEditor, token, login, logout }}>
      <div className="flex flex-col min-h-dvh">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 p-4 md:p-6 max-w-5xl mx-auto w-full pb-24">
          <Switch>
            <Route path="/"                component={Dashboard} />
            <Route path="/category/:id"    component={CategoryPage} />
            <Route path="/form/:id"        component={FormPage} />
            <Route path="/issues"          component={IssuesPage} />
            <Route path="/settings"        component={SettingsPage} />
            <Route>
              <div className="glass-card p-8 text-center mt-12">
                <p className="text-2xl font-semibold" style={{ color: "var(--tx-primary)" }}>ไม่พบหน้านี้</p>
              </div>
            </Route>
          </Switch>
        </main>
        <BottomBar />
        <FloatingEditorBtn />
      </div>
    </EditorContext.Provider>
  );
}
