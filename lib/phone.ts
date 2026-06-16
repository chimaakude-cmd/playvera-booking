export type PhoneCountry = {
  code: string;
  dialCode: string;
  label: string;
};

/** Common countries for onboarding contact numbers. UK is the default. */
export const PHONE_COUNTRIES: PhoneCountry[] = [
  { code: "GB", dialCode: "+44", label: "United Kingdom" },
  { code: "IE", dialCode: "+353", label: "Ireland" },
  { code: "US", dialCode: "+1", label: "United States" },
  { code: "CA", dialCode: "+1", label: "Canada" },
  { code: "AU", dialCode: "+61", label: "Australia" },
  { code: "NZ", dialCode: "+64", label: "New Zealand" },
  { code: "DE", dialCode: "+49", label: "Germany" },
  { code: "FR", dialCode: "+33", label: "France" },
  { code: "ES", dialCode: "+34", label: "Spain" },
  { code: "IT", dialCode: "+39", label: "Italy" },
  { code: "NL", dialCode: "+31", label: "Netherlands" },
  { code: "BE", dialCode: "+32", label: "Belgium" },
  { code: "IN", dialCode: "+91", label: "India" },
  { code: "NG", dialCode: "+234", label: "Nigeria" },
  { code: "ZA", dialCode: "+27", label: "South Africa" },
  { code: "AE", dialCode: "+971", label: "United Arab Emirates" },
];

export const DEFAULT_PHONE_COUNTRY = "GB";

export function getPhoneCountry(code: string): PhoneCountry {
  return (
    PHONE_COUNTRIES.find((country) => country.code === code) ??
    PHONE_COUNTRIES[0]
  );
}

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/** Strip display formatting; keep national digits for storage/validation. */
export function normalizeNationalPhoneDigits(country: string, value: string): string {
  let digits = digitsOnly(value);

  if (country === "GB") {
    if (digits.startsWith("44") && digits.length > 2) {
      digits = `0${digits.slice(2)}`;
    }
    return digits.slice(0, 11);
  }

  if (country === "US" || country === "CA") {
    if (digits.startsWith("1") && digits.length > 10) {
      digits = digits.slice(1);
    }
    return digits.slice(0, 10);
  }

  if (country === "IE") {
    if (digits.startsWith("353") && digits.length > 3) {
      digits = `0${digits.slice(3)}`;
    }
    return digits.slice(0, 10);
  }

  return digits.slice(0, 15);
}

/** Format national number as the user types (display only). */
export function formatPhoneNumber(country: string, raw: string): string {
  const digits = normalizeNationalPhoneDigits(country, raw);

  switch (country) {
    case "GB": {
      if (!digits) {
        return "";
      }
      if (digits.startsWith("07")) {
        if (digits.length <= 5) {
          return digits;
        }
        if (digits.length <= 8) {
          return `${digits.slice(0, 5)} ${digits.slice(5)}`;
        }
        return `${digits.slice(0, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 11)}`.trim();
      }
      if (digits.length <= 4) {
        return digits;
      }
      if (digits.length <= 7) {
        return `${digits.slice(0, 4)} ${digits.slice(4)}`;
      }
      return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 11)}`.trim();
    }
    case "US":
    case "CA": {
      if (!digits) {
        return "";
      }
      if (digits.length <= 3) {
        return digits;
      }
      if (digits.length <= 6) {
        return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
      }
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }
    case "IE": {
      if (!digits) {
        return "";
      }
      if (digits.length <= 3) {
        return digits;
      }
      if (digits.length <= 6) {
        return `${digits.slice(0, 3)} ${digits.slice(3)}`;
      }
      return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)}`.trim();
    }
    default: {
      return digits.replace(/(\d{3})(?=\d)/g, "$1 ").trim();
    }
  }
}

export function validatePhone(country: string, number: string): boolean {
  const digits = normalizeNationalPhoneDigits(country, number);

  switch (country) {
    case "GB":
      return (
        (digits.length === 11 && digits.startsWith("07")) ||
        (digits.length === 11 && digits.startsWith("0") && !digits.startsWith("07")) ||
        (digits.length === 10 && /^7\d{9}$/.test(digits))
      );
    case "US":
    case "CA":
      return digits.length === 10;
    case "IE":
      return digits.length >= 9 && digits.length <= 10;
    default:
      return digits.length >= 7 && digits.length <= 15;
  }
}

export function formatPhoneForDisplay(country: string, number: string): string {
  const countryMeta = getPhoneCountry(country);
  const formatted = formatPhoneNumber(country, number);
  if (!formatted) {
    return "";
  }
  return `${countryMeta.dialCode} ${formatted}`;
}
