import { NextResponse } from "next/server";
import {
  GetAddressLookupError,
  GETADDRESS_NO_ADDRESSES_MESSAGE,
  GETADDRESS_NOT_CONFIGURED_MESSAGE,
} from "@/lib/getaddress-io";
import { lookupUkAddressesByPostcodeServer } from "@/lib/getaddress-io-server";

type RouteContext = {
  params: Promise<{ postcode: string }>;
};

function getErrorStatus(message: string): number {
  if (message === GETADDRESS_NOT_CONFIGURED_MESSAGE) {
    return 503;
  }

  if (message === GETADDRESS_NO_ADDRESSES_MESSAGE) {
    return 404;
  }

  return 502;
}

export async function GET(_request: Request, context: RouteContext) {
  const { postcode } = await context.params;

  try {
    const result = await lookupUkAddressesByPostcodeServer(
      decodeURIComponent(postcode),
    );
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof GetAddressLookupError
        ? error.message
        : GETADDRESS_NO_ADDRESSES_MESSAGE;

    if (process.env.NODE_ENV === "development") {
      console.error("[Activora getAddress.io] API route error", {
        postcode,
        message,
        error,
      });
    }

    return NextResponse.json(
      { error: message },
      { status: getErrorStatus(message) },
    );
  }
}
