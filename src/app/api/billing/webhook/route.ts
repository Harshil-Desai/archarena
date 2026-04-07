import crypto from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

interface LemonSqueezyWebhookPayload {
  meta?: {
    event_name?: string
    custom_data?: {
      user_id?: string
    }
  }
  data?: {
    id?: string | number
    attributes?: {
      customer_id?: string | number
      variant_id?: string | number
      status?: string
      renews_at?: string | null
      ends_at?: string | null
    }
  }
}

function verifySignature(
  rawBody: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) {
    return false
  }

  const hmac = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex")

  const expected = Buffer.from(hmac, "utf8")
  const received = Buffer.from(signature, "utf8")

  if (expected.length !== received.length) {
    return false
  }

  return crypto.timingSafeEqual(expected, received)
}

function getTierFromVariantId(variantId: string): "PRO" | "PREMIUM" {
  if (variantId === process.env.NEXT_PUBLIC_LEMONSQUEEZY_PRO_VARIANT_ID) {
    return "PRO"
  }

  if (variantId === process.env.NEXT_PUBLIC_LEMONSQUEEZY_PREMIUM_VARIANT_ID) {
    return "PREMIUM"
  }

  console.warn(
    `[webhook] Unknown variantId: ${variantId}, defaulting to PRO`
  )

  return "PRO"
}

function parseDate(value: string | null | undefined): Date | null {
  return value ? new Date(value) : null
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error("[webhook] Missing webhook secret")

    return NextResponse.json(
      { error: "server_misconfigured" },
      { status: 500 }
    )
  }

  const rawBody = await req.text()
  const signature = req.headers.get("x-signature")
  const isValid = verifySignature(rawBody, signature, webhookSecret)

  if (!isValid) {
    console.error("[webhook] Invalid signature")

    return NextResponse.json(
      { error: "invalid_signature" },
      { status: 401 }
    )
  }

  let payload: LemonSqueezyWebhookPayload

  try {
    payload = JSON.parse(rawBody) as LemonSqueezyWebhookPayload
  } catch (error) {
    console.error("[webhook] Invalid JSON payload", error)

    return NextResponse.json(
      { error: "invalid_payload" },
      { status: 400 }
    )
  }

  const eventName = payload.meta?.event_name
  const data = payload.data?.attributes
  const userId = payload.meta?.custom_data?.user_id

  console.log(`[webhook] Event: ${eventName}, userId: ${userId}`)

  if (!userId) {
    console.error("[webhook] No user_id in custom_data")

    return NextResponse.json({ ok: true })
  }

  try {
    switch (eventName) {
      case "order_created": {
        await prisma.user.update({
          where: { id: userId },
          data: {
            lemonSqueezyOrderId: payload.data?.id
              ? String(payload.data.id)
              : null,
            lemonSqueezyCustomerId: data?.customer_id
              ? String(data.customer_id)
              : null,
          },
        })
        break
      }

      case "subscription_created": {
        const variantId = String(data?.variant_id)
        const tier = getTierFromVariantId(variantId)

        await prisma.user.update({
          where: { id: userId },
          data: {
            tier,
            subscriptionId: payload.data?.id ? String(payload.data.id) : null,
            subscriptionStatus: data?.status ?? null,
            subscriptionRenewsAt: parseDate(data?.renews_at),
          },
        })
        break
      }

      case "subscription_updated": {
        const variantId = String(data?.variant_id)
        const tier = getTierFromVariantId(variantId)

        await prisma.user.update({
          where: { id: userId },
          data: {
            tier,
            subscriptionStatus: data?.status ?? null,
            subscriptionRenewsAt: parseDate(data?.renews_at),
            subscriptionEndsAt: parseDate(data?.ends_at),
          },
        })
        break
      }

      case "subscription_cancelled": {
        await prisma.user.update({
          where: { id: userId },
          data: {
            subscriptionStatus: "cancelled",
            subscriptionEndsAt: parseDate(data?.ends_at),
          },
        })
        break
      }

      case "subscription_expired": {
        await prisma.user.update({
          where: { id: userId },
          data: {
            tier: "FREE",
            subscriptionStatus: "expired",
          },
        })
        break
      }

      default: {
        console.log(`[webhook] Unhandled event: ${eventName}`)
      }
    }
  } catch (error) {
    console.error(`[webhook] DB update failed for ${eventName}:`, error)

    return NextResponse.json(
      { error: "db_update_failed" },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true })
}
