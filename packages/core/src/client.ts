/**
 * HyperMemoryClient — the main SDK client for interacting with the HyperMemory hypergraph.
 *
 * @example
 * ```typescript
 * import { HyperMemoryClient } from "@hypermemory/core";
 *
 * const hm = new HyperMemoryClient({ apiKey: "hm_your_api_key" });
 *
 * await hm.store({ key: "tech_react", description: "React — UI library", node_type: "technology" });
 * const results = await hm.recall({ query: "frontend frameworks" });
 * ```
 */

import { HttpClient } from "./http.js";
import type {
	AddRelationshipsRequest,
	ClientOptions,
	ExportOptions,
	FindRelatedRequest,
	ForgetResponse,
	IngestRequest,
	IngestResponse,
	NodeRelationship,
	OverviewResponse,
	PublicGraphResponse,
	RateLimitInfo,
	RecallRequest,
	RecallResponse,
	StoreRequest,
	StoreResponse,
	TimelineReadRequest,
	TimelineReadResponse,
	TimelineWriteRequest,
	TimelineWriteResponse,
	UpdateRequest,
	UpdateResponse,
} from "./types.js";

const DEFAULT_BASE_URL = "https://api.hypermemory.io";
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_TIMEOUT = 30_000;

export class HyperMemoryClient {
	private readonly http: HttpClient;

	constructor(options: ClientOptions) {
		if (!options.apiKey) {
			throw new Error("apiKey is required — provide your hm_* API key");
		}

		this.http = new HttpClient({
			baseUrl: options.baseUrl ?? DEFAULT_BASE_URL,
			apiKey: options.apiKey,
			maxRetries: options.maxRetries ?? DEFAULT_MAX_RETRIES,
			timeout: options.timeout ?? DEFAULT_TIMEOUT,
			onRequest: options.onRequest,
		});
	}

	/**
	 * Store a new node in the hypergraph.
	 *
	 * @param request - Node data including key, description, and optional relationships
	 * @returns Confirmation of storage with detected types
	 *
	 * @throws {AuthenticationError} Invalid API key
	 * @throws {ValidationError} Missing required fields
	 * @throws {RateLimitError} Write rate limit exceeded
	 * @throws {PlanLimitError} Monthly node limit reached
	 *
	 * @example
	 * ```typescript
	 * const result = await hm.store({
	 *   key: "person_jane",
	 *   description: "Jane Doe — senior engineer at Acme Corp",
	 *   node_type: "person",
	 *   relationships: [{ to_key: "org_acme", relationship: "works at" }],
	 * });
	 * ```
	 */
	async store(request: StoreRequest): Promise<StoreResponse> {
		return this.http.request<StoreResponse>({
			method: "POST",
			path: "/api/v1/memory/store",
			body: request,
		});
	}

	/**
	 * Search the hypergraph using semantic or keyword matching.
	 *
	 * @param request - Query parameters
	 * @returns Ranked results with relevance scores
	 *
	 * @throws {AuthenticationError} Invalid API key
	 * @throws {RateLimitError} Read rate limit exceeded
	 *
	 * @example
	 * ```typescript
	 * const results = await hm.recall({ query: "machine learning frameworks", max_results: 5 });
	 * for (const r of results.results) {
	 *   console.log(`${r.key}: ${r.description} (score: ${r.score})`);
	 * }
	 * ```
	 */
	async recall(request: RecallRequest): Promise<RecallResponse> {
		return this.http.request<RecallResponse>({
			method: "POST",
			path: "/api/v1/memory/recall",
			body: request,
		});
	}

	/**
	 * Update an existing node in the hypergraph.
	 *
	 * @param request - Fields to update (only provided fields are changed)
	 * @returns Confirmation with any newly detected types
	 *
	 * @throws {AuthenticationError} Invalid API key
	 * @throws {NotFoundError} Node with the given key does not exist
	 * @throws {RateLimitError} Write rate limit exceeded
	 *
	 * @example
	 * ```typescript
	 * await hm.update({ key: "person_jane", description: "Jane Doe — CTO at Acme Corp" });
	 * ```
	 */
	async update(request: UpdateRequest): Promise<UpdateResponse> {
		return this.http.request<UpdateResponse>({
			method: "POST",
			path: "/api/v1/memory/update",
			body: request,
		});
	}

	/**
	 * Delete a node from the hypergraph.
	 *
	 * @param key - Node key to delete
	 * @param cascade - Whether to also delete orphaned relationships (default: false)
	 * @returns Deletion confirmation
	 *
	 * @throws {AuthenticationError} Invalid API key
	 * @throws {NotFoundError} Node does not exist
	 * @throws {RateLimitError} Write rate limit exceeded
	 *
	 * @example
	 * ```typescript
	 * await hm.forget("person_old_contact", true); // cascade delete
	 * ```
	 */
	async forget(key: string, cascade: boolean = false): Promise<ForgetResponse> {
		return this.http.request<ForgetResponse>({
			method: "POST",
			path: "/api/v1/memory/forget",
			body: { key, cascade },
		});
	}

	/**
	 * Get a high-level overview of the hypergraph.
	 *
	 * @returns Node/edge/hyperedge counts and type list
	 *
	 * @throws {AuthenticationError} Invalid API key
	 *
	 * @example
	 * ```typescript
	 * const overview = await hm.overview();
	 * console.log(`${overview.nodes} nodes, ${overview.edges} edges`);
	 * ```
	 */
	async overview(): Promise<OverviewResponse> {
		return this.http.request<OverviewResponse>({
			method: "GET",
			path: "/api/v1/memory/overview",
		});
	}

	/**
	 * Ingest unstructured text into the hypergraph.
	 * Automatically extracts entities and relationships.
	 *
	 * @param request - Text to ingest with optional context
	 * @returns Counts of created/updated nodes and edges
	 *
	 * @throws {AuthenticationError} Invalid API key
	 * @throws {RateLimitError} Ingest rate limit exceeded
	 * @throws {PlanLimitError} Monthly ingest limit reached
	 *
	 * @example
	 * ```typescript
	 * const result = await hm.ingest({
	 *   text: "Jane joined Acme Corp as CTO in 2025. She previously worked at Google.",
	 *   context: "career update",
	 * });
	 * console.log(`Created ${result.nodes_created} nodes, ${result.edges_created} edges`);
	 * ```
	 */
	async ingest(request: IngestRequest): Promise<IngestResponse> {
		return this.http.request<IngestResponse>({
			method: "POST",
			path: "/api/v1/memory/ingest",
			body: request,
		});
	}

	/**
	 * Get relationships for a specific node.
	 *
	 * @param key - Node key to get relationships for
	 * @param pattern - Optional regex pattern to filter relationship types
	 * @returns Array of relationships connected to the node
	 *
	 * @throws {AuthenticationError} Invalid API key
	 * @throws {NotFoundError} Node does not exist
	 *
	 * @example
	 * ```typescript
	 * const rels = await hm.getRelationships("person_jane");
	 * for (const r of rels) {
	 *   console.log(`${r.from_key} —[${r.relationship}]→ ${r.to_key}`);
	 * }
	 * ```
	 */
	async getRelationships(key: string, pattern?: string): Promise<NodeRelationship[]> {
		const params: Record<string, string> = {};
		if (pattern) params.pattern = pattern;
		return this.http.request<NodeRelationship[]>({
			method: "GET",
			path: `/api/v1/memory/relationships/${encodeURIComponent(key)}`,
			params,
		});
	}

	/**
	 * Add relationships between existing nodes.
	 *
	 * @param request - Relationships to create
	 * @returns Confirmation
	 *
	 * @throws {AuthenticationError} Invalid API key
	 * @throws {ValidationError} Invalid node keys
	 * @throws {RateLimitError} Write rate limit exceeded
	 *
	 * @example
	 * ```typescript
	 * await hm.addRelationships({
	 *   relationships: [
	 *     { from_key: "person_jane", to_key: "tech_rust", relationship: "is learning" },
	 *   ],
	 * });
	 * ```
	 */
	async addRelationships(request: AddRelationshipsRequest): Promise<{ created: number }> {
		return this.http.request<{ created: number }>({
			method: "POST",
			path: "/api/v1/memory/relationships",
			body: request,
		});
	}

	/**
	 * Find related nodes via graph traversal from a starting node.
	 *
	 * @param request - Traversal parameters
	 * @returns Related nodes with relationship paths
	 *
	 * @throws {AuthenticationError} Invalid API key
	 * @throws {NotFoundError} Start node does not exist
	 *
	 * @example
	 * ```typescript
	 * const related = await hm.findRelated({
	 *   start_node: "person_jane",
	 *   query: "technologies",
	 *   max_nodes: 20,
	 * });
	 * ```
	 */
	async findRelated(request: FindRelatedRequest): Promise<RecallResponse> {
		return this.http.request<RecallResponse>({
			method: "POST",
			path: "/api/v1/memory/find-related",
			body: request,
		});
	}

	/**
	 * Write a timeline event.
	 *
	 * @param request - Event summary and optional metadata
	 * @returns Write confirmation with timestamp
	 *
	 * @throws {AuthenticationError} Invalid API key
	 * @throws {RateLimitError} Write rate limit exceeded
	 *
	 * @example
	 * ```typescript
	 * await hm.timelineWrite({ summary: "User completed onboarding", meta: { step: 5 } });
	 * ```
	 */
	async timelineWrite(request: TimelineWriteRequest): Promise<TimelineWriteResponse> {
		return this.http.request<TimelineWriteResponse>({
			method: "POST",
			path: "/api/v1/memory/timeline/write",
			body: request,
		});
	}

	/**
	 * Read timeline events with optional filtering.
	 *
	 * @param request - Filter parameters
	 * @returns Matching timeline events
	 *
	 * @throws {AuthenticationError} Invalid API key
	 *
	 * @example
	 * ```typescript
	 * const timeline = await hm.timelineRead({ period: "7d", limit: 20 });
	 * for (const event of timeline.events) {
	 *   console.log(`[${event.timestamp}] ${event.summary}`);
	 * }
	 * ```
	 */
	async timelineRead(request: TimelineReadRequest = {}): Promise<TimelineReadResponse> {
		return this.http.request<TimelineReadResponse>({
			method: "POST",
			path: "/api/v1/memory/timeline",
			body: request,
		});
	}

	/**
	 * Export the entire graph as JSON or CSV.
	 *
	 * @param options - Export format options
	 * @returns Full graph data
	 *
	 * @throws {AuthenticationError} Invalid API key
	 *
	 * @example
	 * ```typescript
	 * const data = await hm.exportGraph({ format: "json", include_data: true });
	 * ```
	 */
	async exportGraph(options?: ExportOptions): Promise<PublicGraphResponse> {
		const params: Record<string, string> = {};
		if (options?.format) params.format = options.format;
		if (options?.include_data) params.include_data = "true";
		return this.http.request<PublicGraphResponse>({
			method: "GET",
			path: "/api/v1/memory/export",
			params,
		});
	}

	/**
	 * Get a public graph by its ID (no authentication required for public graphs).
	 *
	 * @param graphId - Graph identifier (e.g. "graph:abc123")
	 * @returns Nodes and links of the public graph
	 *
	 * @throws {NotFoundError} Graph does not exist or is not public
	 *
	 * @example
	 * ```typescript
	 * const graph = await hm.getPublicGraph("graph:abc123");
	 * console.log(`${graph.nodes.length} nodes, ${graph.links.length} links`);
	 * ```
	 */
	async getPublicGraph(graphId: string): Promise<PublicGraphResponse> {
		return this.http.request<PublicGraphResponse>({
			method: "GET",
			path: `/api/graphs/${encodeURIComponent(graphId)}/public`,
		});
	}

	/**
	 * Get current rate limit information from the most recent API call.
	 *
	 * @returns Rate limit info or null if no requests have been made
	 */
	getRateLimit(): RateLimitInfo | null {
		return this.http.lastRateLimit;
	}
}
