import Link from "next/link";

type PrivacyAcceptanceCheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
  error?: string | null;
  className?: string;
};

export function PrivacyAcceptanceCheckbox({
  checked,
  onChange,
  id = "privacy-policy-acceptance",
  error = null,
  className = "",
}: PrivacyAcceptanceCheckboxProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className="flex items-start gap-3 text-sm text-zinc-600">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          required
          className="mt-1 h-4 w-4 shrink-0 rounded border-zinc-300 text-teal-600 focus:ring-teal-500"
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <span>
          I have read and agree to the Activora{" "}
          <Link
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-teal-700 underline underline-offset-2 hover:text-teal-900"
          >
            Privacy Policy
          </Link>
          .
        </span>
      </label>
      {error ? (
        <p id={`${id}-error`} className="mt-2 text-sm text-rose-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
