"use client";

import {
  calculateRemainingSessionCost,
  createEmptyTicket,
  getActiveWizardDates,
  getRemainingSessionCount,
  WizardFormData,
} from "@/lib/session-wizard";
import {
  formatMoney,
  formatTicketPriceType,
  SessionTicket,
  TicketPriceType,
} from "@/lib/sessions";
import {
  StepSection,
  StepperButton,
  WizardField,
  wizardInputClassName,
  wizardTextareaClassName,
} from "./shared";

type TicketsStepProps = {
  data: WizardFormData;
  onChange: (updates: Partial<WizardFormData>) => void;
};

const priceTypeOptions: TicketPriceType[] = [
  "free",
  "per_session",
  "term_block",
  "subscription",
  "free_trial",
];

function updateTicket(
  tickets: SessionTicket[],
  ticketId: string,
  updates: Partial<SessionTicket>,
): SessionTicket[] {
  return tickets.map((ticket) =>
    ticket.id === ticketId ? { ...ticket, ...updates } : ticket,
  );
}

export function TicketsStep({ data, onChange }: TicketsStepProps) {
  const activeDates = getActiveWizardDates(data);
  const remainingCount = getRemainingSessionCount(activeDates);

  function addTicket() {
    onChange({ tickets: [...data.tickets, createEmptyTicket()] });
  }

  function removeTicket(ticketId: string) {
    onChange({ tickets: data.tickets.filter((ticket) => ticket.id !== ticketId) });
  }

  function handlePriceTypeChange(ticketId: string, priceType: TicketPriceType) {
    const updates: Partial<SessionTicket> = { priceType };

    if (
      priceType === "free" ||
      priceType === "free_trial" ||
      priceType === "subscription"
    ) {
      updates.price = 0;
    }

    onChange({
      tickets: updateTicket(data.tickets, ticketId, updates),
    });
  }

  return (
    <StepSection
      title="Tickets & pricing"
      description="Create ticket options for parents. Per-session tickets auto-calculate remaining-session cost."
    >
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600 sm:p-5">
        <p>
          <strong className="text-zinc-900">Block price</strong> — one fixed price
          for the whole block.
        </p>
        <p className="mt-2">
          <strong className="text-zinc-900">Per session</strong> — parents pay only
          for remaining sessions if joining part-way through.
        </p>
        <p className="mt-2">
          <strong className="text-zinc-900">Subscription</strong> — placeholder for
          recurring membership billing (payments coming later).
        </p>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-zinc-500">
          {remainingCount} remaining session{remainingCount === 1 ? "" : "s"} from
          today
        </p>
        <StepperButton onClick={addTicket}>Add ticket</StepperButton>
      </div>

      {data.tickets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-white px-4 py-10 text-center text-sm text-zinc-500">
          No tickets yet. Add at least one ticket option to continue.
        </div>
      ) : (
        <div className="space-y-4">
          {data.tickets.map((ticket, index) => {
            const priceLocked =
              ticket.priceType === "free" ||
              ticket.priceType === "free_trial" ||
              ticket.priceType === "subscription";
            const remainingCost =
              ticket.priceType === "per_session"
                ? calculateRemainingSessionCost(ticket.price, activeDates)
                : null;

            return (
              <article
                key={ticket.id}
                className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-zinc-900">
                    Ticket {index + 1}
                  </h3>
                  <button
                    type="button"
                    onClick={() => removeTicket(ticket.id)}
                    className="text-sm font-medium text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>

                <div className="grid gap-4">
                  <WizardField label="Ticket name" htmlFor={`ticket-name-${ticket.id}`}>
                    <input
                      id={`ticket-name-${ticket.id}`}
                      value={ticket.name}
                      onChange={(event) =>
                        onChange({
                          tickets: updateTicket(data.tickets, ticket.id, {
                            name: event.target.value,
                          }),
                        })
                      }
                      placeholder="e.g. Full term, Drop-in, Free trial"
                      className={wizardInputClassName}
                    />
                  </WizardField>

                  <WizardField
                    label="Ticket description"
                    htmlFor={`ticket-description-${ticket.id}`}
                  >
                    <textarea
                      id={`ticket-description-${ticket.id}`}
                      value={ticket.description}
                      onChange={(event) =>
                        onChange({
                          tickets: updateTicket(data.tickets, ticket.id, {
                            description: event.target.value,
                          }),
                        })
                      }
                      placeholder="Explain who this ticket is for and what it includes."
                      className={wizardTextareaClassName}
                    />
                  </WizardField>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <WizardField label="Price type" htmlFor={`ticket-type-${ticket.id}`}>
                      <select
                        id={`ticket-type-${ticket.id}`}
                        value={ticket.priceType}
                        onChange={(event) =>
                          handlePriceTypeChange(
                            ticket.id,
                            event.target.value as TicketPriceType,
                          )
                        }
                        className={wizardInputClassName}
                      >
                        {priceTypeOptions.map((option) => (
                          <option key={option} value={option}>
                            {formatTicketPriceType(option)}
                          </option>
                        ))}
                      </select>
                    </WizardField>

                    <WizardField
                      label="Price amount"
                      htmlFor={`ticket-price-${ticket.id}`}
                      hint={
                        priceLocked
                          ? ticket.priceType === "subscription"
                            ? "Subscription billing coming later"
                            : "Automatically set to £0"
                          : undefined
                      }
                    >
                      <input
                        id={`ticket-price-${ticket.id}`}
                        type="number"
                        min={0}
                        step="0.01"
                        value={priceLocked ? 0 : ticket.price}
                        disabled={priceLocked}
                        onChange={(event) =>
                          onChange({
                            tickets: updateTicket(data.tickets, ticket.id, {
                              price: Number(event.target.value),
                            }),
                          })
                        }
                        className={`${wizardInputClassName} disabled:bg-zinc-100 disabled:text-zinc-500`}
                      />
                    </WizardField>
                  </div>

                  {remainingCost !== null ? (
                    <div className="rounded-xl border border-pink-200 bg-pink-50 px-4 py-3 text-sm text-pink-900">
                      Remaining-session cost if joining today:{" "}
                      <strong>{formatMoney(remainingCost)}</strong> (
                      {remainingCount} × {formatMoney(ticket.price)})
                    </div>
                  ) : null}

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex items-start gap-3 rounded-xl border border-zinc-200 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={ticket.lowSpacesTrigger}
                        onChange={(event) =>
                          onChange({
                            tickets: updateTicket(data.tickets, ticket.id, {
                              lowSpacesTrigger: event.target.checked,
                            }),
                          })
                        }
                        className="mt-1 h-4 w-4 rounded border-zinc-300 text-pink-600 focus:ring-pink-500"
                      />
                      <span>
                        <span className="block text-sm font-medium text-zinc-900">
                          Low spaces trigger
                        </span>
                        <span className="mt-1 block text-xs text-zinc-500">
                          Show urgency when 5 or fewer places remain.
                        </span>
                      </span>
                    </label>

                    <label className="flex items-start gap-3 rounded-xl border border-zinc-200 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={ticket.recentBookingFlag}
                        onChange={(event) =>
                          onChange({
                            tickets: updateTicket(data.tickets, ticket.id, {
                              recentBookingFlag: event.target.checked,
                            }),
                          })
                        }
                        className="mt-1 h-4 w-4 rounded border-zinc-300 text-pink-600 focus:ring-pink-500"
                      />
                      <span>
                        <span className="block text-sm font-medium text-zinc-900">
                          Recent booking flag
                        </span>
                        <span className="mt-1 block text-xs text-zinc-500">
                          Placeholder for future map promotional messages.
                        </span>
                      </span>
                    </label>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </StepSection>
  );
}
