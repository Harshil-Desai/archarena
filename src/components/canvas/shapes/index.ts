import { DatabaseShapeUtil } from "./DatabaseShape";
import { CacheShapeUtil } from "./CacheShape";
import { QueueShapeUtil } from "./QueueShape";
import { ServerShapeUtil } from "./ServerShape";
import { ClientShapeUtil } from "./ClientShape";
import { CDNShapeUtil } from "./CDNShape";

export const CUSTOM_SHAPE_UTILS = [
  DatabaseShapeUtil,
  CacheShapeUtil,
  QueueShapeUtil,
  ServerShapeUtil,
  ClientShapeUtil,
  CDNShapeUtil,
];

// Vendor catalogue — what each shape type supports
export const VENDOR_CATALOGUE = {
  database: ["postgresql", "mysql", "mongodb", "dynamodb", "cassandra", "sqlite"],
  cache:    ["redis", "memcached", "elasticache"],
  queue:    ["kafka", "rabbitmq", "sqs", "pubsub"],
  server:   ["node", "go", "python", "java", "nginx", "loadbalancer"],
  client:   ["web", "mobile", "cli", "iot"],
  cdn:      ["cloudfront", "cloudflare", "fastly"],
} as const;