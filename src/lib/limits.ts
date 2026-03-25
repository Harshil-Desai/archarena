export const LIMITS = {
    free: {
      aiHintsPerSession: 5,
      scoresPerSession: 1,       // one final score per session
      promptCount: 5,
      sessionTTLSeconds: 7200,   // 2 hours in Redis
    },
    pro: {
      aiHintsPerSession: Infinity,
      scoresPerSession: Infinity,
      promptCount: Infinity,
      sessionTTLSeconds: null,   // persisted to DB
    },
  } as const;