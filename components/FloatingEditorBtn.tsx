import { useState } from "react";
import { Shield, ShieldOff } from "lucide-react";
import { useEditor } from "@/hooks/useEditor";
import EditorLoginModal from "./EditorLoginModal";

export default function FloatingEditorBtn() {
  const { isEditor, logout } = useEditor();
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => (isEditor ? logout() : setShowModal(true))}
        title={isEditor ? "ออกจากโหมด Editor" : "เข้าโหมด Editor"}
        className={`fixed bottom-20 right-4 z-50 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all md:bottom-4 ${
          isEditor
            ? "bg-violet-600 text-white hover:bg-violet-700"
            : "glass text-slate-500 hover:bg-white/70"
        }`}>
        {isEditor ? <ShieldOff size={20} /> : <Shield size={20} />}
      </button>
      {showModal && <EditorLoginModal onClose={() => setShowModal(false)} />}
    </>
  );
}
