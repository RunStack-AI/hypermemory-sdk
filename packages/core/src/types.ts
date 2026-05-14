/**
 * Request and response types for the HyperMemory Public API.
 * These mirror the server-side tool signatures and response shapes exactly.
 */

// ─── Shared Types ──────────────────────────────────────────────────────────────

/** Relationship between two nodes in the hypergraph. */
export interface Relationship {
	/** Target node key */
	to_key: string;
	/** Human-readable description of the relationship */
	relationship: string;
}

// ─── Request Types ─────────────────────────────────────────────────────────────

/** Request to store a new node in the hypergraph. */
export interface StoreRequest {
	/** Unique identifier for this node */
	key: string;
	/** Human-readable description of the node content */
	description: string;
	/** Arbitrary structured data to attach */
	data?: Record<string, unknown>;
	/** Asset URLs associated with this node */
	assets?: string[];
	/** Semantic type of the node (e.g. "person", "concept", "technology") */
	node_type?: string;
	/** Relationships to create from this node */
	relationships?: Relationship[];
}

/** Request to recall (search) from the hypergraph. */
export interface RecallRequest {
	/** Natural language query or keyword search */
	query: string;
	/** Session identifier for context isolation (default: "default") */
	session_id?: string;
	/** Maximum number of results to return (default: 10) */
	max_results?: number;
	/** Force regex-based search instead of semantic (default: false) */
	force_regex?: boolean;
}

/** Request to update an existing node. */
export interface UpdateRequest {
	/** Node key to update */
	key: string;
	/** Updated description (replaces existing) */
	description?: string;
	/** Updated structured data (replaces existing) */
	data?: Record<string, unknown>;
	/** Updated assets (replaces existing) */
	assets?: string[];
	/** Updated node type */
	node_type?: string;
}

/** Request to find related nodes via graph traversal. */
export interface FindRelatedRequest {
	/** Starting node key for traversal */
	start_node: string;
	/** Optional query to filter/rank traversal results */
	query?: string;
	/** Maximum nodes to return (default: 50) */
	max_nodes?: number;
	/** Maximum traversal depth */
	max_depth?: number;
	/** Regex pattern to filter relationship types */
	relationship_pattern?: string;
	/** Session identifier (default: "default") */
	session_id?: string;
	/** Named lens/perspective for filtering */
	lens?: string;
}

/** Request to ingest unstructured text into the graph. */
export interface IngestRequest {
	/** Unstructured text to parse into graph nodes */
	text: string;
	/** Optional context hint for better entity extraction */
	context?: string;
}

/** Request to write a timeline event. */
export interface TimelineWriteRequest {
	/** Summary of the timeline event */
	summary: string;
	/** Optional metadata attached to the event */
	meta?: Record<string, unknown>;
}

/** Request to read from the timeline. */
export interface TimelineReadRequest {
	/** Query to filter timeline events */
	query?: string;
	/** Filter by related node key */
	node_key?: string;
	/** Time period filter (e.g. "7d", "1m") */
	period?: string;
	/** ISO date start filter */
	start?: string;
	/** ISO date end filter */
	end?: string;
	/** Maximum events to return (default: 50) */
	limit?: number;
}

/** Request to add relationships between existing nodes. */
export interface AddRelationshipsRequest {
	/** Array of relationships to create */
	relationships: Array<{
		from_key: string;
		to_key: string;
		relationship: string;
	}>;
}

/** Options for exporting the graph. */
export interface ExportOptions {
	/** Include ontology types and relations in export (default: true) */
	include_ontology?: boolean;
	/** Include session/access data in export (default: false) */
	include_session_data?: boolean;
}

// ─── Response Types ────────────────────────────────────────────────────────────

/** Response after storing a node. */
export interface StoreResponse {
	/** Key of the stored node */
	stored: string;
	/** Detected or assigned node type */
	type: string | null;
	/** Auto-detected entity types */
	detected?: string[];
	/** Number of relationships created */
	relationships?: number;
	/** Any warnings from the operation */
	warnings?: string[];
}

/** Response from a recall (search) operation. */
export interface RecallResponse {
	/** Matching results ordered by relevance */
	results: RecallResult[];
	/** Total count of results */
	count: number;
	/** Any warnings from the operation */
	warnings?: string[];
}

/** A single recall result. */
export interface RecallResult {
	/** Node key */
	key: string;
	/** Node description */
	description: string;
	/** Relevance score (0-1) */
	score: number;
	/** Expanded context from related nodes */
	expansion_context?: Array<{ key: string; description: string; rel: string }>;
}

/** Response after updating a node. */
export interface UpdateResponse {
	/** Key of the updated node */
	updated: string;
	/** Newly detected entity types */
	detected?: string[];
	/** Any warnings */
	warnings?: string[];
}

/** Response after deleting a node. */
export interface ForgetResponse {
	/** Whether deletion succeeded */
	deleted: boolean;
	/** Key that was deleted */
	key: string;
	/** Whether cascade deletion was performed */
	cascade: boolean;
	/** Any warnings */
	warnings?: string[];
}

/** Response from get_overview. */
export interface OverviewResponse {
	/** Total number of nodes */
	nodes: number;
	/** Total number of edges (relationships) */
	edges: number;
	/** Total number of hyperedges */
	hyperedges: number;
	/** List of distinct node types */
	types: string[];
}

/** Response after ingesting text. */
export interface IngestResponse {
	/** Number of new nodes created */
	nodes_created: number;
	/** Number of existing nodes updated (omitted when nothing was extracted) */
	nodes_updated?: number;
	/** Number of edges created (omitted when nothing was extracted) */
	edges_created?: number;
	/** Number of hyperedges created (omitted when nothing was extracted) */
	hyperedges_created?: number;
	/** Human-readable message (present when extraction yields no entities) */
	message?: string;
}

/** A node in the public graph response. */
export interface GraphNode {
	/** Unique node identifier */
	node_key: string;
	/** Human-readable description */
	description: string;
	/** Semantic type of the node */
	node_type: string;
}

/** A link (edge) in the public graph response. */
export interface GraphLink {
	/** Source node key */
	source: string;
	/** Target node key */
	target: string;
	/** Relationship description */
	relationship: string;
}

/** Full graph response with nodes and links. */
export interface PublicGraphResponse {
	/** All nodes in the graph */
	nodes: GraphNode[];
	/** All links (edges) in the graph */
	links: GraphLink[];
}

/** Response from the graph export endpoint. */
export interface ExportResponse {
	/** Full exported graph as a JSON string */
	data: string;
	/** Number of nodes exported */
	node_count: number;
	/** Number of binary edges exported */
	edge_count: number;
	/** Number of hyperedges exported */
	hyperedge_count: number;
	/** Export duration in seconds */
	duration_seconds: number;
}

/** A single timeline event. */
export interface TimelineEvent {
	/** ISO timestamp */
	ts: string;
	/** Event summary */
	summary: string;
	/** Event source (e.g. "agent") */
	source: string;
	/** Tool that generated the event (if any) */
	tool?: string;
	/** Related node key (if any) */
	node_key?: string;
	/** Event metadata */
	meta?: Record<string, unknown>;
}

/** Response from timeline read. */
export interface TimelineReadResponse {
	events: TimelineEvent[];
	count: number;
}

/** Response from timeline write. */
export interface TimelineWriteResponse {
	/** Auto-generated event ID */
	id: number;
	/** ISO timestamp of the created event */
	ts: string;
	/** The summary that was written */
	summary: string;
}

/** A binary edge (pairwise relationship) for a node. */
export interface BinaryEdge {
	edge_id: string;
	relationship: string | null;
	direction: string | null;
	description: string | null;
	in_node: string;
	out_node: string;
}

/** A hyperedge (N-ary relationship) involving a node. */
export interface HyperedgeDetail {
	hyperedge_id: string;
	relationship: string | null;
	description: string | null;
	participants: string[];
}

/** Response from getRelationships — binary edges and hyperedges for a node. */
export interface NodeRelationshipsResponse {
	/** The node key queried */
	key: string;
	/** Pairwise relationships */
	binary_edges: BinaryEdge[];
	/** N-ary hyperedge relationships */
	hyperedges: HyperedgeDetail[];
}

/** Response from addRelationships. */
export interface AddRelationshipsResponse {
	/** Successfully created relationships (detail objects) */
	created: Array<Record<string, unknown>>;
	/** Relationships that failed to create (error details) */
	errors: Array<Record<string, unknown>>;
}

/** A single result from graph traversal (findRelated). */
export interface FindRelatedResult {
	/** Node key */
	key: string;
	/** Node description */
	description: string;
	/** Relevance score (may be absent in chain traversal) */
	score?: number;
	/** Relationship label from the traversal path */
	rel?: string;
	/** Hop distance from start node */
	hop?: number;
}

/** Response from findRelated graph traversal. */
export interface FindRelatedResponse {
	/** Related nodes found via traversal */
	results: FindRelatedResult[];
	/** Total count of results */
	count: number;
}

// ─── Client Configuration ──────────────────────────────────────────────────────

/** Configuration for the HyperMemoryClient. */
export interface ClientOptions {
	/** User API key (hm_*) */
	apiKey: string;
	/**
	 * Base URL of the HyperMemory API.
	 * @default "https://api.hypermemory.io"
	 */
	baseUrl?: string;
	/** Maximum number of retries on 429/503 (default: 3) */
	maxRetries?: number;
	/** Request timeout in milliseconds (default: 30000) */
	timeout?: number;
	/** Optional logging hook for debugging */
	onRequest?: (method: string, url: string, status: number, durationMs: number) => void;
}

/** Rate limit information extracted from response headers. */
export interface RateLimitInfo {
	limit: number;
	remaining: number;
	resetAt: Date;
}
