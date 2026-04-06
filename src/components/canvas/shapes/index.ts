import { DatabaseShapeUtil } from "./DatabaseShape";
import { CacheShapeUtil } from "./CacheShape";
import { QueueShapeUtil } from "./QueueShape";
import { ServerShapeUtil } from "./ServerShape";
import { ClientShapeUtil } from "./ClientShape";
import { CDNShapeUtil } from "./CDNShape";
import { GenericShapeUtil } from "./GenericShape";

import { ApiGatewayShapeUtil } from "./ApiGatewayShape";
import { ObjectStorageShapeUtil } from "./ObjectStorageShape";
import { GraphDbShapeUtil } from "./GraphDbShape";
import { LoadBalancerShapeUtil } from "./LoadBalancerShape";
import { WebServerShapeUtil } from "./WebServerShape";
import { AppServerShapeUtil } from "./AppServerShape";
import { RelationalDbShapeUtil } from "./RelationalDbShape";
import { NoSqlDbShapeUtil } from "./NoSqlDbShape";

export const CUSTOM_SHAPE_UTILS = [
  DatabaseShapeUtil,
  CacheShapeUtil,
  QueueShapeUtil,
  ServerShapeUtil,
  ClientShapeUtil,
  CDNShapeUtil,
  GenericShapeUtil,
  ApiGatewayShapeUtil,
  ObjectStorageShapeUtil,
  GraphDbShapeUtil,
  LoadBalancerShapeUtil,
  WebServerShapeUtil,
  AppServerShapeUtil,
  RelationalDbShapeUtil,
  NoSqlDbShapeUtil,
];

// Vendor catalogue — what each shape type supports
export const VENDOR_CATALOGUE = {
  database: ["postgresql", "mysql", "mongodb", "dynamodb", "cassandra", "sqlite"],
  cache: ["redis", "memcached", "elasticache"],
  queue: ["kafka", "rabbitmq", "sqs", "pubsub"],
  server: ["node", "go", "python", "java", "nginx", "loadbalancer"],
  client: ["web", "mobile", "cli", "iot"],
  cdn: ["cloudfront", "cloudflare", "fastly"],
  apiGateway: ["kong", "aws-api-gateway"],
  objectStorage: ["s3", "gcs"],
  graphDb: ["neo4j"],
  loadBalancer: ["alb", "haproxy"],
  webServer: ["nginx", "apache"],
  appServer: ["node", "go", "java"],
  relationalDb: ["postgresql", "mysql"],
  noSqlDb: ["mongodb", "cassandra", "dynamodb"],
} as const;
