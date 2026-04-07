import { NextRequest, NextResponse } from "next/server"
import { createCheckout } from "@lemonsqueezy/lemonsqueezy.js"
import { auth } from "@/auth"
import { initLemonSqueezy } from "@/lib/lemonsqueezy"

export async function POST(req: NextRequest) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "unauthorized" },
      { status: 401 }
    )
  }

  const { variantId }: { variantId?: string | number } = await req.json()

  if (!variantId) {
    return NextResponse.json(
      { error: "variantId is required" },
      { status: 400 }
    )
  }

  const storeId = process.env.LEMONSQUEEZY_STORE_ID
  const appUrl = process.env.NEXTAUTH_URL

  if (!storeId || !appUrl) {
    console.error("[checkout] Missing LemonSqueezy configuration")

    return NextResponse.json(
      { error: "checkout_failed" },
      { status: 500 }
    )
  }

  initLemonSqueezy()

  try {
    const checkout = await createCheckout(storeId, variantId, {
      checkoutOptions: {
        embed: false,
        media: false,
      },
      checkoutData: {
        email: session.user.email ?? undefined,
        custom: {
          user_id: session.user.id,
        },
      },
      productOptions: {
        redirectUrl: new URL("/billing/success", appUrl).toString(),
        receiptButtonText: "Back to SysDraw",
        receiptThankYouNote:
          "Thanks for upgrading! Your Pro features are now active.",
      },
    })

    const url = checkout.data?.data.attributes.url

    if (!url) {
      throw new Error("No checkout URL returned")
    }

    return NextResponse.json({ url })
  } catch (error) {
    console.error("[checkout]", error)

    return NextResponse.json(
      { error: "checkout_failed" },
      { status: 500 }
    )
  }
}
