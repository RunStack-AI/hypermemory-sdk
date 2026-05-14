/**
 * @hypermemory/visualizer-core
 *
 * Framework-agnostic graph visualization for HyperMemory knowledge graphs.
 * Provides two viewer classes that mount to any DOM element:
 *
 * - **CosmographViewer** — GPU-accelerated 2D visualization with hyperedge hulls
 * - **ForceGraph3DViewer** — Three.js 3D visualization with camera fly-to
 *
 * @packageDocumentation
 */

export { CosmographViewer } from "./cosmograph/index.js";
export { ForceGraph3DViewer } from "./force-graph-3d/index.js";
export { convexHull, paddedHullPath } from "./cosmograph/hull.js";
export { getNodeColor, NODE_COLORS } from "./shared/colors.js";
export { DEFAULT_SIMULATION } from "./cosmograph/config.js";
export { DEFAULT_3D_CONFIG } from "./force-graph-3d/config.js";
export type { CosmographSimulationConfig, CosmographViewerOptions } from "./cosmograph/config.js";
export type { ForceGraph3DOptions } from "./force-graph-3d/config.js";
export type { BaseViewerOptions, GraphLink, GraphNode, HyperedgeHull } from "./shared/types.js";
