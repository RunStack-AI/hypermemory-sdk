"use client";

import type { HyperMemoryClient } from "@runstack-ai/hypermemory-core";
import { createContext } from "react";

export const HyperMemoryContext = createContext<HyperMemoryClient | null>(null);
