"use client";

import {
  calculateRemainingSessionCost,
  createEmptyTicket,
  fromTicketPaymentType,
  getActiveWizardDates,
  getRemainingSessionCount,
  isTicketPriceEditable,
  parsePriceFromTicketName,
  SESSION_TICKET_SUBSCRIPTION_ENABLED,
  toTicketPaymentType,
  TicketPaymentType,
  WizardFormData,
} from "@/lib/session-wizard";
import { formatMoney, SessionTicket, TicketPriceType } from "@/lib/sessions";
import { sessionHasPaidTickets } from "@/lib/club-setup/guards";
import { ActivityPaymentProviderFields } from "./ActivityPaymentProviderFields";
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

const paymentTypeOptions: Array<{
  value: TicketPaymentType;
  label: string;
  disabled?: boolean;
}> = [
  { value: "one_off", label: "One-off payment" },
  {
    value: "monthly_subscription",
    label: SESSION_TICKET_SUBSCRIPTION_ENABLED
      ? "Monthly subscription"
      : "Monthly subscription (Coming soon)",
    disabled: !SESSION_TICKET_SUBSCRIPTION_ENABLED,
  },
  { value: "free_session", label: "Free session" },
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

function oneOffPriceHint(
  priceType: TicketPriceType,
  bookingStructure: WizardFormData["bookingStructure"],
): string | undefined {
  if (priceType === "term_block") {
    return "One fixed price for the whole block.";
  }
  if (priceType === "per_session") {
    return bookingStructure === "block"
      ? "Parents pay only for remaining sessions if joining part-way through."
      : "Parents pay this amount per session.";
  }
  return undefined;
}

export function TicketsStep({ data, onChange }: TicketsStepProps) {
  const activeDates = getActiveWizardDates(data);
  const remainingCount = getRemainingSessionCount(activeDates);
  const showPaymentProvider =
    data.paymentModel === "subscription" || sessionHasPaidTickets(data);

  function addTicket() {
    onChange({ tickets: [...data.tickets, createEmptyTicket()] });
  }

  function removeTicket(ticketId: string) {
    onChange({ tickets: data.tickets.filter((ticket) => ticket.id !== ticketId) });
  }

  function handlePaymentTypeChange(
    ticketId: string,
    paymentType: TicketPaymentType,
  ) {
    const priceType = fromTicketPaymentType(paymentType, data.bookingStructure);
    const updates: Partial<SessionTicket> = { priceType };

    if (!isTicketPriceEditable(priceType)) {
      updates.price = 0;
    }

    onChange({
      tickets: updateTicket(data.tickets, ticketId, updates),
    });
  }

  function handleTicketNameChange(ticket: SessionTicket, name: string) {
    const updates: Partial<SessionTicket> = { name };

    if (isTicketPriceEditable(ticket.priceType)) {
      const parsedPrice = parsePriceFromTicketName(name);
      if (parsedPrice !== null && ticket.price === 0) {
        updates.price = parsedPrice;
      }
    }

    onChange({
      tickets: updateTicket(data.tickets, ticket.id, updates),
    });
  }

  return (
    <StepSection
      title="Tickets & pricing"
      description="Set up how parents book and pay for this session."
    >
      {showPaymentProvider ? (
        <ActivityPaymentProviderFields
          value={data.paymentProvider}
          onChange={(paymentProvider) => onChange({ paymentProvider })}
        />
      ) : null}

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
            const paymentType = toTicketPaymentType(ticket.priceType);
            const priceEditable = isTicketPriceEditable(ticket.priceType);
            const priceHint = priceEditable
              ? oneOffPriceHint(ticket.priceType, data.bookingStructure)
              : paymentType === "monthly_subscription"
                ? "Recurring billing is not available yet."
                : "No payment required.";
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
                        handleTicketNameChange(ticket, event.target.value)
                      }
                      placeholder="e.g. Full term, Drop-in, Monthly subscription – £20"
                      className={wizardInputClassName}
                    />
                  </WizardField>

                  <WizardField
                    label="Description"
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

                  <WizardField label="Payment type" htmlFor={`ticket-type-${ticket.id}`}>
                    <select
                      id={`ticket-type-${ticket.id}`}
                      value={paymentType}
                      onChange={(event) =>
                        handlePaymentTypeChange(
                          ticket.id,
                          event.target.value as TicketPaymentType,
                        )
                      }
                      className={wizardInputClassName}
                    >
                      {paymentTypeOptions.map((option) => (
                        <option
                          key={option.value}
                          value={option.value}
                          disabled={option.disabled}
                        >
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </WizardField>

                  <WizardField
                    label="Price"
                    htmlFor={`ticket-price-${ticket.id}`}
                    hint={priceHint}
                  >
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-sm text-zinc-500">
                        £
                      </span>
                      <input
                        id={`ticket-price-${ticket.id}`}
                        type="number"
                        min={0}
                        step="0.01"
                        value={priceEditable ? ticket.price : 0}
                        disabled={!priceEditable}
                        onChange={(event) =>
                          onChange({
                            tickets: updateTicket(data.tickets, ticket.id, {
                              price: Number(event.target.value),
                            }),
                          })
                        }
                        className={`${wizardInputClassName} pl-8 disabled:bg-zinc-100 disabled:text-zinc-500`}
                      />
                    </div>
                  </WizardField>

                  {remainingCost !== null ? (
                    <div className="rounded-xl border border-pink-200 bg-pink-50 px-4 py-3 text-sm text-pink-900">
                      Remaining-session cost if joining today:{" "}
                      <strong>{formatMoney(remainingCost)}</strong> (
                      {remainingCount} × {formatMoney(ticket.price)})
                    </div>
                  ) : null}

                  <fieldset className="space-y-3">
                    <legend className="text-sm font-medium text-zinc-900">
                      Display options
                    </legend>
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
                          Show limited spaces badge
                        </span>
                        <span className="mt-1 block text-xs text-zinc-500">
                          Display &ldquo;Limited spaces remaining&rdquo; to parents when
                          capacity is low.
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
                          Show popularity badge
                        </span>
                        <span className="mt-1 block text-xs text-zinc-500">
                          Display &ldquo;Recently booked&rdquo; or &ldquo;Popular
                          choice&rdquo;.
                        </span>
                      </span>
                    </label>
                  </fieldset>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </StepSection>
  );
}
