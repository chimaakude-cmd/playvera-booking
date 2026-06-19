"use client";

import {
  bookingStructureLabels,
  formatAttendeePreview,
} from "@/lib/attendee-criteria";
import {
  formatSessionDateLabel,
  formatSessionTimeLabel,
  formatSubscriptionConfigSummary,
  getActiveWizardDates,
  SESSION_PAYMENT_MODEL_LABELS,
  SUBSCRIPTION_CANCELLATION_LABELS,
  SUBSCRIPTION_JOINING_OPTION_LABELS,
  summarizeTickets,
  WizardFormData,
} from "@/lib/session-wizard";
import {
  buildSessionLocationLabel,
  venueFormToSessionVenue,
} from "@/lib/session-location";
import { SessionImage, SessionImageStrip } from "@/components/sessions/SessionImage";

type ReviewStepProps = {
  data: WizardFormData;
};

export function ReviewStep({ data }: ReviewStepProps) {
  const activeDates = getActiveWizardDates(data);
  const capacities = activeDates.map((date) => date.capacity);
  const minCapacity = capacities.length ? Math.min(...capacities) : data.defaultCapacity;
  const maxCapacity = capacities.length ? Math.max(...capacities) : data.defaultCapacity;
  const venue = venueFormToSessionVenue(data.venue);
  const addressPreview = [
    venue.addressLine1,
    venue.addressLine2,
    [venue.townCity, venue.postcode].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">Final review</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Check everything before publishing your session to parents.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        <div className="relative aspect-[21/9] bg-zinc-100">
          <SessionImage
            imageId={data.mainImage}
            alt={data.sessionTitle || "Session preview"}
            className="h-full w-full object-cover"
          />
        </div>
        {data.extraImages.length > 0 ? (
          <div className="flex gap-2 overflow-x-auto border-t border-zinc-100 p-3">
            {data.extraImages.map((imageId) => (
              <div
                key={imageId}
                className="h-16 w-24 shrink-0 overflow-hidden rounded-lg border border-zinc-200"
              >
                <SessionImage
                  imageId={imageId}
                  alt="Gallery preview"
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="flex gap-4">
            <SessionImageStrip
              mainImageId={data.mainImage}
              galleryImageIds={data.extraImages}
              alt={data.sessionTitle || "Session"}
              className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-zinc-200"
            />
            <div className="min-w-0">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                Session summary
              </h3>
              <p className="mt-2 font-semibold text-zinc-900">{data.sessionTitle}</p>
            </div>
          </div>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-zinc-500">Payment model</dt>
              <dd className="font-medium text-zinc-900">
                {data.paymentModel
                  ? SESSION_PAYMENT_MODEL_LABELS[data.paymentModel]
                  : "Not set"}
              </dd>
            </div>
            {data.paymentModel === "subscription" ? (
              <div>
                <dt className="text-zinc-500">Subscription billing</dt>
                <dd className="font-medium text-zinc-900">
                  {formatSubscriptionConfigSummary(data.subscriptionConfig)}
                </dd>
                <dd className="mt-1 text-xs text-zinc-500">
                  Joining:{" "}
                  {
                    SUBSCRIPTION_JOINING_OPTION_LABELS[
                      data.subscriptionConfig.joiningOption
                    ]
                  }
                  {" · "}
                  Cancellation:{" "}
                  {
                    SUBSCRIPTION_CANCELLATION_LABELS[
                      data.subscriptionConfig.cancellationPolicy
                    ]
                  }
                  {" · "}
                  Pause: {data.subscriptionConfig.pauseEnabled ? "On" : "Off"}
                  {" · "}
                  Retry failed payments:{" "}
                  {data.subscriptionConfig.retryFailedPayments ? "On" : "Off"}
                </dd>
              </div>
            ) : null}
            <div>
              <dt className="text-zinc-500">Booking structure</dt>
              <dd className="font-medium text-zinc-900">
                {data.bookingStructure
                  ? bookingStructureLabels[data.bookingStructure]
                  : "Not set"}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">Who can attend</dt>
              <dd className="font-medium text-zinc-900">
                {formatAttendeePreview(data.attendeeCriteria)}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">Description</dt>
              <dd className="text-zinc-700">{data.description}</dd>
            </div>
          </dl>
        </article>

        <article className="rounded-2xl border border-zinc-200 bg-white p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Location
          </h3>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-zinc-500">Venue</dt>
              <dd className="font-medium text-zinc-900">
                {buildSessionLocationLabel(venue)}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">Address</dt>
              <dd className="text-zinc-700">{addressPreview}</dd>
            </div>
            {venue.locationNotes ? (
              <div>
                <dt className="text-zinc-500">Notes</dt>
                <dd className="text-zinc-700">{venue.locationNotes}</dd>
              </div>
            ) : null}
          </dl>
        </article>

        <article className="rounded-2xl border border-zinc-200 bg-white p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Dates ({activeDates.length})
          </h3>
          <ul className="mt-4 max-h-48 space-y-2 overflow-y-auto text-sm">
            {activeDates.map((date) => (
              <li
                key={date.id}
                className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2"
              >
                <span className="font-medium text-zinc-900">
                  {formatSessionDateLabel(date.date)}
                </span>
                <span className="text-zinc-500">
                  {formatSessionTimeLabel(date.startTime, date.endTime)}
                </span>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-2xl border border-zinc-200 bg-white p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Tickets
          </h3>
          <p className="mt-4 text-sm text-zinc-700">{summarizeTickets(data)}</p>
        </article>

        <article className="rounded-2xl border border-zinc-200 bg-white p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Capacity
          </h3>
          <p className="mt-4 text-sm text-zinc-700">
            {minCapacity === maxCapacity
              ? `${minCapacity} places per session`
              : `${minCapacity}–${maxCapacity} places per session`}
          </p>
        </article>

        <article className="rounded-2xl border border-zinc-200 bg-white p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Booking questions
          </h3>
          <ul className="mt-4 space-y-2 text-sm text-zinc-700">
            {data.bookingQuestions.filter((q) => q.enabled).length === 0 ? (
              <li>No booking questions enabled.</li>
            ) : (
              data.bookingQuestions
                .filter((q) => q.enabled)
                .map((q) => (
                  <li key={q.id}>
                    {q.label}
                    {q.required ? " (required)" : ""}
                    {q.showOnRegister ? " · on register" : ""}
                  </li>
                ))
            )}
          </ul>
        </article>

        <article className="rounded-2xl border border-zinc-200 bg-white p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Confirmation email
          </h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <p className="whitespace-pre-wrap text-sm text-zinc-700">
              {data.confirmationEmail.welcomeMessage}
            </p>
            <p className="whitespace-pre-wrap text-sm text-zinc-600">
              {data.confirmationEmail.extraInformation}
            </p>
          </div>
        </article>
      </div>
    </section>
  );
}
