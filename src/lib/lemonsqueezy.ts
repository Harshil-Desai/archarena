import { lemonSqueezySetup } from "@lemonsqueezy/lemonsqueezy.js";

let isLemonSqueezyInitialized = false;

export function initLemonSqueezy(): void {
  if (isLemonSqueezyInitialized) {
    return;
  }

  const apiKey = process.env.LEMONSQUEEZY_API_KEY;

  if (!apiKey) {
    throw new Error("LEMONSQUEEZY_API_KEY is not set");
  }

  lemonSqueezySetup({
    apiKey,
    onError(error) {
      console.error("[LemonSqueezy]", error);
    },
  });

  isLemonSqueezyInitialized = true;
}
