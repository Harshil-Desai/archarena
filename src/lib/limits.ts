export const LIMITS = {
    free: {
      aiHintsPerSession: 5,
      aiHintsPerDay: 10,
      scoresPerSession: 1,
      scoresPerDay: 3,
      promptCount: 5,
      sessionTTLSeconds: 7200,   // 2 hours in Redis
    },
    pro: {
      aiHintsPerSession: Infinity,
      aiHintsPerDay: 100,
      scoresPerSession: Infinity,
      scoresPerDay: 20,
      promptCount: Infinity,
      sessionTTLSeconds: null,   // persisted to DB
    },
  } as const;