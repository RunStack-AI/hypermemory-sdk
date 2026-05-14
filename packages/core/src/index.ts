/**
 * @hypermemory/core
 *
 * Official HyperMemory SDK for building applications on the HyperMemory hypergraph.
 * Store, recall, traverse, and visualize interconnected knowledge.
 *
 * @packageDocumentation
 */

export { HyperMemoryClient } from "./client.js";
export { HttpClient } from "./http.js";
export type { HttpClientOptions, RequestOptions } from "./http.js";
export {
	AuthenticationError,
	HyperMemoryError,
	NetworkError,
	NotFoundError,
	PlanLimitError,
	RateLimitError,
	ServerError,
	TimeoutError,
	ValidationError,
} from "./errors.js";
export type {
	AddRelationshipsRequest,
	ClientOptions,
	ExportOptions,
	FindRelatedRequest,
	ForgetResponse,
	GraphLink,
	GraphNode,
	IngestRequest,
	IngestResponse,
	NodeRelationship,
	OverviewResponse,
	PublicGraphResponse,
	RateLimitInfo,
	RecallRequest,
	RecallResponse,
	RecallResult,
	Relationship,
	StoreRequest,
	StoreResponse,
	TimelineEvent,
	TimelineReadRequest,
	TimelineReadResponse,
	TimelineWriteRequest,
	TimelineWriteResponse,
	UpdateRequest,
	UpdateResponse,
} from "./types.js";
