import { NextRequest, NextResponse } from "next/server";
import {
  createAdminProvider,
  type CreateAdminProviderInput,
} from "@/lib/admin/provider-create";
import { fetchAdminProvidersList } from "@/lib/admin/providers-data";

export async function GET() {
  const result = await fetchAdminProvidersList();
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateAdminProviderInput & {
      mode?: "create" | "invite";
    };

    if (!body.clubName?.trim()) {
      return NextResponse.json(
        { error: "Provider name is required." },
        { status: 400 },
      );
    }

    if (!body.organisationType) {
      return NextResponse.json(
        { error: "Account type is required." },
        { status: 400 },
      );
    }

    if (body.mode === "invite" && !body.email?.trim()) {
      return NextResponse.json(
        { error: "Email is required to invite a provider." },
        { status: 400 },
      );
    }

    const result = await createAdminProvider(body);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(
      {
        providerId: result.providerId,
        onboardingLink: result.onboardingLink,
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to create provider." },
      { status: 400 },
    );
  }
}
