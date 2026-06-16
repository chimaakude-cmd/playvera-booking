"use client";

import {
  DEFAULT_PHONE_COUNTRY,
  formatPhoneNumber,
  getPhoneCountry,
  PHONE_COUNTRIES,
} from "@/lib/phone";

type PhoneInputProps = {
  id: string;
  country: string;
  value: string;
  onChange: (country: string, phone: string) => void;
  inputClassName?: string;
  selectClassName?: string;
  disabled?: boolean;
  autoComplete?: string;
};

const defaultInputClassName =
  "min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100";

const defaultSelectClassName =
  "w-[7.5rem] shrink-0 rounded-xl border border-zinc-200 bg-white px-2 py-2.5 text-sm text-zinc-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100 sm:w-[8.5rem]";

export function PhoneInput({
  id,
  country,
  value,
  onChange,
  inputClassName = defaultInputClassName,
  selectClassName = defaultSelectClassName,
  disabled = false,
  autoComplete = "tel-national",
}: PhoneInputProps) {
  const resolvedCountry = country || DEFAULT_PHONE_COUNTRY;

  function handleCountryChange(nextCountry: string) {
    onChange(nextCountry, formatPhoneNumber(nextCountry, value));
  }

  function handlePhoneChange(raw: string) {
    onChange(resolvedCountry, formatPhoneNumber(resolvedCountry, raw));
  }

  const dialCode = getPhoneCountry(resolvedCountry).dialCode;

  return (
    <div className="flex gap-2">
      <label htmlFor={`${id}-country`} className="sr-only">
        Country code
      </label>
      <select
        id={`${id}-country`}
        value={resolvedCountry}
        onChange={(event) => handleCountryChange(event.target.value)}
        disabled={disabled}
        className={selectClassName}
        aria-label="Phone country code"
      >
        {PHONE_COUNTRIES.map((entry) => (
          <option key={entry.code} value={entry.code}>
            {entry.dialCode} {entry.code}
          </option>
        ))}
      </select>
      <input
        id={id}
        type="tel"
        inputMode="tel"
        value={value}
        onChange={(event) => handlePhoneChange(event.target.value)}
        disabled={disabled}
        className={inputClassName}
        autoComplete={autoComplete}
        placeholder={`${dialCode} number`}
        aria-describedby={`${id}-dial-hint`}
      />
      <span id={`${id}-dial-hint`} className="sr-only">
        Enter your phone number without the country code. Selected country:{" "}
        {getPhoneCountry(resolvedCountry).label}.
      </span>
    </div>
  );
}
