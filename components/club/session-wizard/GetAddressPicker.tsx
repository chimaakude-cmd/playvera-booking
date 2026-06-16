"use client";

import type { UkAddressOption } from "@/lib/getaddress-io";

type GetAddressPickerProps = {
  addresses: UkAddressOption[];
  selectedAddressId?: string | null;
  onSelectAddress: (address: UkAddressOption) => void;
  onEnterManually: () => void;
};

export function GetAddressPicker({
  addresses,
  selectedAddressId,
  onSelectAddress,
  onEnterManually,
}: GetAddressPickerProps) {
  return (
    <div className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
      <div>
        <h3 className="text-sm font-semibold text-zinc-900">
          Choose the correct address
        </h3>
        <p className="mt-1 text-sm text-zinc-600">
          Select the venue address for this postcode, or enter it manually.
        </p>
      </div>

      {addresses.length > 0 ? (
        <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
          {addresses.map((address) => {
            const isSelected = selectedAddressId === address.id;

            return (
              <button
                key={address.id}
                type="button"
                onClick={() => onSelectAddress(address)}
                className={`w-full rounded-lg border px-4 py-3 text-left transition-colors ${
                  isSelected
                    ? "border-pink-300 bg-pink-50"
                    : "border-zinc-200 bg-white hover:border-zinc-300"
                }`}
              >
                {address.venueName ? (
                  <p className="text-sm font-semibold text-zinc-900">
                    {address.venueName}
                  </p>
                ) : null}
                <p
                  className={`text-sm text-zinc-700 ${
                    address.venueName ? "mt-1" : "font-medium text-zinc-900"
                  }`}
                >
                  {address.addressLine1}
                </p>
                {address.addressLine2 ? (
                  <p className="mt-1 text-sm text-zinc-600">{address.addressLine2}</p>
                ) : null}
                <p className="mt-1 text-xs text-zinc-500">
                  {[address.townCity, address.postcode].filter(Boolean).join(" · ")}
                </p>
              </button>
            );
          })}
        </div>
      ) : null}

      <button
        type="button"
        onClick={onEnterManually}
        className="w-full rounded-lg border border-dashed border-zinc-300 bg-white px-4 py-3 text-left text-sm font-semibold text-zinc-800 transition-colors hover:border-zinc-400 hover:bg-zinc-50"
      >
        Enter address manually
      </button>
    </div>
  );
}
