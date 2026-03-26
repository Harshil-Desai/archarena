import { LIMITS } from "./limits";

export interface DesignPrompt {
    id: string;
    title: string;
    description: string;
    difficulty: "easy" | "medium" | "hard";
    category: string;
    followUpHints: string[];
    scoringCriteria: string[];  // NEW — what the scoring model checks
    timeLimit: number;
  }
  
  export const PROMPTS: DesignPrompt[] = [
    {
      id: "url-shortener",
      title: "Design a URL Shortener",
      description: "Handle millions of redirects per day with analytics.",
      difficulty: "easy",
      category: "infra",
      followUpHints: ["hash collisions", "custom aliases", "analytics at scale"],
      scoringCriteria: [
        "Has a hashing strategy defined",
        "Caching layer present for hot URLs",
        "Database choice justified",
        "Redirect latency addressed",
        "Analytics pipeline separated from core flow",
      ],
      timeLimit: 2400,
    },
    {
      id: "twitter-feed",
      title: "Design Twitter's Feed",
      description: "Fan-out on write vs read, ranking, real-time updates.",
      difficulty: "hard",
      category: "feed",
      followUpHints: ["celebrity problem", "ranking algorithm", "eventual consistency"],
      scoringCriteria: [
        "Fan-out strategy chosen and justified",
        "Cache warming addressed for celebrities",
        "Feed ranking mechanism defined",
        "Real-time delivery mechanism present",
        "Storage tiering for old tweets",
      ],
      timeLimit: 3000,
    },
    // prompts to be added later
  ];

  export const FREE_PROMPT_COUNT = LIMITS.free.promptCount;