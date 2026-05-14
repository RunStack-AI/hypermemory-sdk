/**
 * HyperMemoryClient — the main SDK client for interacting with the HyperMemory hypergraph.
 *
 * @example
 * ```typescript
 * import { HyperMemoryClient } from "@runstack-ai/hypermemory-core";
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
	AddRelationshipsResponse,
	ClientOptions,
	ExportOptions,
	ExportResponse,
	FindRelatedRequest,
	FindRelatedResponse,
	ForgetResponse,
	IngestRequest,
	IngestResponse,
	NodeRelationshipsResponse,
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

/**
 * Per-call options accepted by every client method.
 *
 * @example
 * ```typescript
 * const ac = new AbortController();
 * const results = await hm.recall({ query: "..." }, { signal: ac.signal });
 * // ac.abort() to cancel
 * ```
 */
export interface MethodOptions {
	/** AbortSignal for cancellation */
	signal?: AbortSignal;
}

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
	 * Target keys (`to_key`) in relationships may reference existing nodes or new ones —
	 * non-existent targets are created as placeholder nodes.
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
	async store(request: StoreRequest, options?: MethodOptions): Promise<StoreResponse> {
		return this.http.request<StoreResponse>({
			method: "POST",
			path: "/api/v1/memory/store",
			body: request,
			signal: options?.signal,
		});
	}

	/**
	 * Search the hypergraph using semantic or keyword matching.
	 *
	 * Pass `force_regex: true` to disable semantic search and use regex matching
	 * against keys/descriptions. Pass `session_id` to scope results to a session.
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
	async recall(request: RecallRequest, options?: MethodOptions): Promise<RecallResponse> {
		return this.http.request<RecallResponse>({
			method: "POST",
			path: "/api/v1/memory/recall",
			body: request,
			signal: options?.signal,
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
	async update(request: UpdateRequest, options?: MethodOptions): Promise<UpdateResponse> {
		return this.http.request<UpdateResponse>({
			method: "POST",
			path: "/api/v1/memory/update",
			body: request,
			signal: options?.signal,
		});
	}

	/**
	 * Delete a node from the hypergraph.
	 *
	 * @param key - Node key to delete
	 * @param cascade - Whether to also delete orphaned relationships (default: true)
	 * @returns Deletion confirmation
	 *
	 * @throws {AuthenticationError} Invalid API key
	 * @throws {NotFoundError} Node does not exist
	 * @throws {RateLimitError} Write rate limit exceeded
	 *
	 * @example
	 * ```typescript
	 * await hm.forget("person_old_contact"); // cascade delete (default)
	 * await hm.forget("person_old_contact", false); // delete node only
	 * ```
	 */
	async forget(key: string, cascade = true, options?: MethodOptions): Promise<ForgetResponse> {
		return this.http.request<ForgetResponse>({
			method: "POST",
			path: "/api/v1/memory/forget",
			body: { key, cascade },
			signal: options?.signal,
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
	async overview(options?: MethodOptions): Promise<OverviewResponse> {
		return this.http.request<OverviewResponse>({
			method: "GET",
			path: "/api/v1/memory/overview",
			signal: options?.signal,
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
	 * console.log(`Created ${result.nodes_created} nodes, ${result.edges_created ?? 0} edges`);
	 * ```
	 */
	async ingest(request: IngestRequest, options?: MethodOptions): Promise<IngestResponse> {
		return this.http.request<IngestResponse>({
			method: "POST",
			path: "/api/v1/memory/ingest",
			body: request,
			signal: options?.signal,
		});
	}

	/**
	 * Get relationships for a specific node (both binary edges and hyperedges).
	 *
	 * @param key - Node key to get relationships for
	 * @param pattern - Optional regex pattern to filter relationship types
	 * @returns Binary edges and hyperedges connected to the node
	 *
	 * @throws {AuthenticationError} Invalid API key
	 * @throws {NotFoundError} Node does not exist
	 *
	 * @example
	 * ```typescript
	 * const rels = await hm.getRelationships("person_jane");
	 * for (const e of rels.binary_edges) {
	 *   console.log(`${e.in_node} —[${e.relationship}]→ ${e.out_node}`);
	 * }
	 * for (const h of rels.hyperedges) {
	 *   console.log(`Hyperedge: ${h.relationship} — ${h.participants.join(", ")}`);
	 * }
	 * ```
	 */
	async getRelationships(
		key: string,
		pattern?: string,
		options?: MethodOptions,
	): Promise<NodeRelationshipsResponse> {
		const params: Record<string, string> = {};
		if (pattern) params.pattern = pattern;
		return this.http.request<NodeRelationshipsResponse>({
			method: "GET",
			path: `/api/v1/memory/relationships/${encodeURIComponent(key)}`,
			params,
			signal: options?.signal,
		});
	}

	/**
	 * Add relationships between existing nodes.
	 *
	 * @param request - Relationships to create (binary or hyperedge via participant_keys)
	 * @returns Created relationships and any errors
	 *
	 * @throws {AuthenticationError} Invalid API key
	 * @throws {ValidationError} Invalid node keys
	 * @throws {RateLimitError} Write rate limit exceeded
	 *
	 * @example
	 * ```typescript
	 * const result = await hm.addRelationships({
	 *   relationships: [
	 *     { from_key: "person_jane", to_key: "tech_rust", relationship: "is learning" },
	 *   ],
	 * });
	 * console.log(`Created: ${result.created.length}, Errors: ${result.errors.length}`);
	 * ```
	 */
	async addRelationships(
		request: AddRelationshipsRequest,
		options?: MethodOptions,
	): Promise<AddRelationshipsResponse> {
		return this.http.request<AddRelationshipsResponse>({
			method: "POST",
			path: "/api/v1/memory/relationships",
			body: request,
			signal: options?.signal,
		});
	}

	/**
	 * Find related nodes via graph traversal from a starting node.
	 *
	 * @param request - Traversal parameters
	 * @returns Related nodes with relationship paths and optional scores
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
	 * for (const r of related.results) {
	 *   console.log(`${r.key}: ${r.description} (hop: ${r.hop})`);
	 * }
	 * ```
	 */
	async findRelated(request: FindRelatedRequest, options?: MethodOptions): Promise<FindRelatedResponse> {
		return this.http.request<FindRelatedResponse>({
			method: "POST",
			path: "/api/v1/memory/find-related",
			body: request,
			signal: options?.signal,
		});
	}

	/**
	 * Write a timeline event.
	 *
	 * @param request - Event summary and optional metadata
	 * @returns Created event with ID and timestamp
	 *
	 * @throws {AuthenticationError} Invalid API key
	 *
	 * @example
	 * ```typescript
	 * const event = await hm.timelineWrite({ summary: "User completed onboarding", meta: { step: 5 } });
	 * console.log(`Event ${event.id} created at ${event.ts}`);
	 * ```
	 */
	async timelineWrite(
		request: TimelineWriteRequest,
		options?: MethodOptions,
	): Promise<TimelineWriteResponse> {
		return this.http.request<TimelineWriteResponse>({
			method: "POST",
			path: "/api/v1/memory/timeline/write",
			body: request,
			signal: options?.signal,
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
	 *   console.log(`[${event.ts}] ${event.summary} (${event.source})`);
	 * }
	 * ```
	 */
	async timelineRead(
		request: TimelineReadRequest = {},
		options?: MethodOptions,
	): Promise<TimelineReadResponse> {
		return this.http.request<TimelineReadResponse>({
			method: "POST",
			path: "/api/v1/memory/timeline",
			body: request,
			signal: options?.signal,
		});
	}

	/**
	 * Export the entire graph as JSON.
	 *
	 * The response `data` field contains the full exported graph as a JSON string.
	 * Parse it to access nodes, edges, hyperedges, and ontology.
	 *
	 * @param exportOptions - Export options (ontology, session data)
	 * @returns Export metadata and the full graph data as a JSON string
	 *
	 * @throws {AuthenticationError} Invalid API key
	 *
	 * @example
	 * ```typescript
	 * const result = await hm.exportGraph({ include_ontology: true });
	 * console.log(`Exported ${result.node_count} nodes in ${result.duration_seconds}s`);
	 * const graph = JSON.parse(result.data);
	 * ```
	 */
	async exportGraph(
		exportOptions?: ExportOptions,
		options?: MethodOptions,
	): Promise<ExportResponse> {
		const params: Record<string, string> = {};
		if (exportOptions?.include_ontology !== undefined) params.include_ontology = String(exportOptions.include_ontology);
		if (exportOptions?.include_session_data) params.include_session_data = "true";
		return this.http.request<ExportResponse>({
			method: "GET",
			path: "/api/v1/memory/export",
			params,
			signal: options?.signal,
		});
	}

	/**
	 * Get a graph by its ID. Requires a valid `hm_*` API key.
	 * The graph must have `api_access` enabled and belong to the same account as the key.
	 *
	 * @param graphId - Graph identifier (e.g. "graph:abc123")
	 * @returns Nodes and links of the graph
	 *
	 * @throws {AuthenticationError} Invalid API key
	 * @throws {ForbiddenError} API access not enabled or key doesn't own this graph
	 * @throws {NotFoundError} Graph does not exist
	 *
	 * @example
	 * ```typescript
	 * const graph = await hm.getPublicGraph("graph:abc123");
	 * console.log(`${graph.nodes.length} nodes, ${graph.links.length} links`);
	 * ```
	 */
	async getPublicGraph(graphId: string, options?: MethodOptions): Promise<PublicGraphResponse> {
		return this.http.request<PublicGraphResponse>({
			method: "GET",
			path: `/api/v1/graphs/${encodeURIComponent(graphId)}/public`,
			signal: options?.signal,
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
