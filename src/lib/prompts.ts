import { LIMITS } from "./limits";

export interface DesignPrompt {
  id: string;
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  category: string;
  followUpHints: string[];
  scoringCriteria: string[]; // NEW — what the scoring model checks
  timeLimit: number;
}

export const PROMPTS: DesignPrompt[] = [
  {
    id: "rate-limiter",
    title: "Design a Rate Limiter",
    description:
      "Prevent service abuse by limiting the number of requests a user or IP can make. Handle distributed state across multiple server instances.",
    difficulty: "medium",
    category: "infra",
    followUpHints: [
      "Token Bucket vs Leaky Bucket",
      "Distributed cache (Redis) for state",
      "Atomic operations (INCR/EXPIRE)",
    ],
    scoringCriteria: [
      "Algorithm choice justification",
      "Distributed concurrency handling",
      "Low-latency impact on request path",
      "Fail-open vs Fail-closed strategy",
    ],
    timeLimit: 2100,
  },
  {
    id: "url-shortener",
    title: "Design a URL Shortener",
    description:
      "Build a system like Bitly. Generate short, unique aliases for long URLs and redirect users with 301/302 status codes at scale.",
    difficulty: "easy",
    category: "infra",
    followUpHints: [
      "Base62 encoding for unique keys",
      "Database indexing for fast lookups",
      "Cache eviction (LRU) for hot URLs",
    ],
    scoringCriteria: [
      "ID generation strategy (collision handling)",
      "Redirection status code choice",
      "Scaling read vs write throughput",
      "Data cleanup/expiration strategy",
    ],
    timeLimit: 1800,
  },
  {
    id: "youtube",
    title: "Design a Video Platform",
    description:
      "Handle massive video uploads, transcoding into multiple formats, and adaptive bitrate streaming to millions of concurrent viewers.",
    difficulty: "hard",
    category: "infra",
    followUpHints: [
      "Content Delivery Networks (CDNs)",
      "Asynchronous transcoding pipelines",
      "Adaptive bitrate (HLS/DASH)",
    ],
    scoringCriteria: [
      "Video chunking and storage strategy",
      "Multi-tiered caching (Edge vs Core)",
      "Upload resumeability and reliability",
      "Search and recommendation metadata scaling",
    ],
    timeLimit: 3000,
  },
  {
    id: "leaderboard",
    title: "Global Leaderboard",
    description:
      "Design a real-time leaderboard for a mobile game with millions of players. Update rankings instantly and handle massive write spikes.",
    difficulty: "easy",
    category: "social",
    followUpHints: [
      "Redis Sorted Sets (ZSET)",
      "Partitioning by game/region",
      "Batched updates to reduce load",
    ],
    scoringCriteria: [
      "In-memory store justification",
      "Complexity of rank retrieval (O(log N))",
      "Handling 'The Celebrity Problem' with spikes",
      "Data persistence vs freshness trade-offs",
    ],
    timeLimit: 1800,
  },
  {
    id: "bookmyshow",
    title: "Ticket Booking System",
    description:
      "Handle high-concurrency seat selection and payments for popular movies. Prevent double-booking and maintain strict transaction ACID properties.",
    difficulty: "medium",
    category: "infra",
    followUpHints: [
      "Distributed locks (Redis/Zookeeper)",
      "Optimistic vs Pessimistic locking",
      "Idempotent payment processing",
    ],
    scoringCriteria: [
      "Transaction isolation levels",
      "Locking strategy for seat selection",
      "Handling partial failures (Payment vs Reservation)",
      "Horizontal scaling of inventory service",
    ],
    timeLimit: 2400,
  },
  {
    id: "pastebin",
    title: "Design a Pastebin",
    description:
      "A simple text storage service. Users upload text blobs and receive unique URLs. Focus on object storage and link expiration.",
    difficulty: "easy",
    category: "infra",
    followUpHints: [
      "Object storage (S3/R2) vs DB blobs",
      "Custom unique ID generation",
      "Automatic data TTL (Time-To-Live)",
    ],
    scoringCriteria: [
      "Storage cost optimization",
      "Read vs Write path separation",
      "Key collision handling",
      "Traffic throttling for expensive objects",
    ],
    timeLimit: 1500,
  },
  {
    id: "twitter-feed",
    title: "Twitter Feed (Newsfeed)",
    description:
      "Design a system to generate and serve personalized timelines. Handle fan-out for celebrities with millions of followers.",
    difficulty: "hard",
    category: "social",
    followUpHints: [
      "Push vs Pull (Fan-out on write/read)",
      "Hybrid approach for celebrities",
      "Cache-aside for timeline storage",
    ],
    scoringCriteria: [
      "Latency of feed generation",
      "Storage of the social graph",
      "Consistency vs Availability trade-offs",
      "Media (images/vids) delivery strategy",
    ],
    timeLimit: 2700,
  },
  {
    id: "chat-app",
    title: "Real-Time Chat App",
    description:
      "Build a system like WhatsApp or Slack. Support 1:1 and group chats, online/offline status, and message read receipts.",
    difficulty: "medium",
    category: "social",
    followUpHints: [
      "WebSockets for persistent connections",
      "Message queueing (RabbitMQ/SQS)",
      "Presence service for online status",
    ],
    scoringCriteria: [
      "Message ordering and delivery guarantees",
      "Scaling persistent connections",
      "Push notification vs Polling mechanics",
      "Conflict resolution in group history",
    ],
    timeLimit: 2400,
  },
  {
    id: "kafka",
    title: "Distributed Message Queue",
    description:
      "Build a high-throughput, fault-tolerant message queue. Focus on sequential disk I/O and replication strategies.",
    difficulty: "hard",
    category: "infra",
    followUpHints: [
      "Log-structured storage",
      "Leader-follower replication (ISR)",
      "Zero-copy optimization",
    ],
    scoringCriteria: [
      "Throughput vs Latency optimizations",
      "Consumer group rebalancing logic",
      "Disk I/O performance (Random vs Sequential)",
      "Coordination service (Zookeeper/Kraft)",
    ],
    timeLimit: 3300,
  },
  {
    id: "parking-lot",
    title: "Parking Lot System",
    description:
      "Design a small-scale park management system. Focus on relational modeling, concurrency, and searching for free spots.",
    difficulty: "easy",
    category: "infra",
    followUpHints: [
      "Entity-Relationship (ER) modeling",
      "Database row-level locking",
      "Indexing frequently searched fields",
    ],
    scoringCriteria: [
      "Normalization of the data schema",
      "Handling 'Spot Selection' race conditions",
      "Payment calculation logic (Rate models)",
      "Scalability for multi-floor/multi-city",
    ],
    timeLimit: 1800,
  },
  {
    id: "web-crawler",
    title: "Distributed Web Crawler",
    description:
      "Crawl billions of web pages. Handle duplicate content, politeness policies, and DNS caching at massive scale.",
    difficulty: "medium",
    category: "infra",
    followUpHints: [
      "Bloom filters for deduplication",
      "URL frontier management",
      "Robots.txt politeness policy",
    ],
    scoringCriteria: [
      "Distributed frontier architecture",
      "Deduplication efficiency (SimHash etc)",
      "DNS resolution scaling",
      "Storage of crawling state (Checkpointing)",
    ],
    timeLimit: 2700,
  },
  {
    id: "collaborative-doc",
    title: "Collaborative Whiteboard",
    description:
      "Design a real-time collaborative tool like Figma or Google Docs. Synchronize state across many users with low latency.",
    difficulty: "hard",
    category: "social",
    followUpHints: [
      "OT (Operational Transformation)",
      "CRDTs (Conflict-Free Replicated Data Types)",
      "WebSocket delta sync",
    ],
    scoringCriteria: [
      "Conflict resolution strategy (Choice & Why)",
      "Offline editing and reconciliation",
      "State synchronization overhead",
      "Undo/Redo history management",
    ],
    timeLimit: 3300,
  },
  {
    id: "notification-system",
    title: "Notification System",
    description:
      "Build a multi-channel notification engine (email, push, SMS). Ensure reliability with retries, rate-limiting, and opt-outs.",
    difficulty: "medium",
    category: "infra",
    followUpHints: [
      "Pub/Sub for fan-out",
      "Retry with exponential backoff",
      "Third-party provider decoupling",
    ],
    scoringCriteria: [
      "Guaranteed delivery (At least once)",
      "User preference/opt-out management",
      "Rate-limiting and batching",
      "Payload templates and localization",
    ],
    timeLimit: 2100,
  },
  {
    id: "uber",
    title: "Ride-Sharing App",
    description:
      "Design a system to match riders with drivers in real-time. Process massive location telemetry and geospatial indexing.",
    difficulty: "hard",
    category: "social",
    followUpHints: [
      "Geohashing vs QuadTrees",
      "High-frequency location ingestion",
      "Dispatching algorithms (Greedy vs etc)",
    ],
    scoringCriteria: [
      "Geospatial query optimization",
      "Read/Write splitting for telemetry",
      "Dynamic pricing engine triggers",
      "Match-making latency and accuracy",
    ],
    timeLimit: 3000,
  },
];

export const FREE_PROMPT_COUNT = LIMITS.free.promptCount;