/**
 * @runstack-ai/hypermemory-core
 *
 * Official HyperMemory SDK for building applications on the HyperMemory hypergraph.
 * Store, recall, traverse, and visualize interconnected knowledge.
 *
 * @packageDocumentation
 */

export { HyperMemoryClient } from "./client.js";
export type { MethodOptions } from "./client.js";
export { HttpClient } from "./http.js";
export type { HttpClientOptions, RequestOptions } from "./http.js";
export {
	AuthenticationError,
	BadRequestError,
	ForbiddenError,
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
	AddRelationshipsResponse,
	BinaryEdge,
	ClientOptions,
	ExportOptions,
	ExportResponse,
	FindRelatedRequest,
	FindRelatedResponse,
	FindRelatedResult,
	ForgetResponse,
	GraphLink,
	GraphNode,
	HyperedgeDetail,
	IngestRequest,
	IngestResponse,
	NodeRelationshipsResponse,
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
