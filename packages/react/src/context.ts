import { createContext } from "react";
import type { HyperMemoryClient } from "@hypermemory/core";

export const HyperMemoryContext = createContext<HyperMemoryClient | null>(null);
