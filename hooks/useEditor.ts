import { createContext, useContext } from "react";

export interface EditorContextType {
  isEditor: boolean;
  token: string | null;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
}

export const EditorContext = createContext<EditorContextType>({
  isEditor: false,
  token: null,
  login: async () => false,
  logout: () => {},
});

export const useEditor = () => useContext(EditorContext);
