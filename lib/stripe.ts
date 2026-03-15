import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    stripeInstance = new Stripe(key, { apiVersion: "2026-02-25.clover" as const });
  }
  return stripeInstance;
}

/** 캔들 팩 정의: 100원 = 1 캔들 */
export const CANDLE_PACKS = [
  { id: "pack_100",  candles: 100,  price_krw: 10_000 },
  { id: "pack_300",  candles: 300,  price_krw: 30_000 },
  { id: "pack_500",  candles: 500,  price_krw: 50_000 },
  { id: "pack_1000", candles: 1000, price_krw: 100_000 },
] as const;

export type CandlePackId = (typeof CANDLE_PACKS)[number]["id"];

export function getCandlePack(id: string) {
  return CANDLE_PACKS.find((p) => p.id === id) ?? null;
}
