// src/App.tsx
import { Route, Switch } from "wouter";
import TopBar from "@/components/TopBar";
import BottomBar from "@/components/BottomBar";
import FooterBar from "@/components/FooterBar";
import FloatingEditorBtn from "@/components/FloatingEditorBtn";
import HomePage from "@/pages/HomePage";
import CategoryPage from "@/pages/CategoryPage";
import FormPage from "@/pages/FormPage";
import IssuesPage from "@/pages/IssuesPage";
import SettingsPage from "@/pages/SettingsPage";

export default function App() {
  return (
    // pb-32 = padding ล่าง เพื่อไม่ให้เนื้อหาถูก BottomBar และ FooterBar บัง
    <div className="min-h-svh flex flex-col">
      <TopBar />

      <main className="flex-1 pb-32 md:pb-20">
        <Switch>
          <Route path="/"                    component={HomePage}     />
          <Route path="/category/:id"        component={CategoryPage} />
          <Route path="/form/:id"            component={FormPage}     />
          <Route path="/issues"              component={IssuesPage}   />
          <Route path="/settings"            component={SettingsPage} />
          {/* Fallback — หน้า 404 */}
          <Route>
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
              <p className="text-6xl">🏥</p>
              <p className="text-xl font-bold" style={{ color: "var(--tx-primary)" }}>
                ไม่พบหน้าที่ต้องการ
              </p>
            </div>
          </Route>
        </Switch>
      </main>

      {/* Navigation bar (mobile) */}
      <BottomBar />

      {/* Footer ข้อมูลหน่วยงาน (ทุก viewport) */}
      <FooterBar />

      {/* ปุ่มล่องหน Editor — fixed ไม่ขึ้นกับ layout flow */}
      <FloatingEditorBtn />
    </div>
  );
}
