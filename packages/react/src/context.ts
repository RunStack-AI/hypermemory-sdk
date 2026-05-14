"use client";

import type { HyperMemoryClient } from "@hypermemory/core";
import { createContext } from "react";

export const HyperMemoryContext = createContext<HyperMemoryClient | null>(null);
