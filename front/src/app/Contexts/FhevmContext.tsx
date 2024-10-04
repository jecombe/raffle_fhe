"use client";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { initFhevm, createInstance, FhevmInstance } from "fhevmjs";
import { createFhevmInstance, getInstance, init } from "../../fhevmjs";

export const FhevmContext = createContext<IFhevmContext | undefined>(undefined);

export interface IFhevmContext {
  instance: FhevmInstance | null;
  createInstance: () => Promise<void>;
}

export function FhevmProvider({ children }: { children: React.ReactNode }) {
  const [fhevmInstance, setFhevmInstance] = useState<FhevmInstance | null>(null);

  const initInstance = useCallback(async () => {
    await init();
    await createFhevmInstance();
    const instance = getInstance();
    console.log("Instance initialized:", instance);
    setFhevmInstance(instance);
  }, []);

  useEffect(() => {
    void initInstance();
  }, [initInstance]);

  return (
    <FhevmContext.Provider value={{ instance: fhevmInstance, createInstance: initInstance }}>
      {children}
    </FhevmContext.Provider>
  );
}
