// src/main.tsx
// ลำดับของ Provider สำคัญมาก:
//   QueryClientProvider  → ต้องอยู่นอกสุด (React Query ทั้งหมดต้องใช้)
//   EditorProvider       → อยู่ถัดมา (ทุก route ต้องรู้ว่า isEditor หรือเปล่า)
//   Router (App)         → อยู่ใน

import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { EditorProvider } from "@/hooks/useEditor";
import App from "./App";
import "./index.css";

// ตั้งค่า QueryClient:
//   retry: 1      → ถ้า fetch ล้มเหลวให้ลองใหม่แค่ 1 ครั้ง (ไม่ต้องรอนาน)
//   staleTime: 30s → ข้อมูลเก่ากว่า 30 วิถึงจะ refetch ใหม่
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 30,
      refetchOnWindowFocus: false, // ไม่ refetch ทุกครั้งที่สลับ tab
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <EditorProvider>
        <App />
      </EditorProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
