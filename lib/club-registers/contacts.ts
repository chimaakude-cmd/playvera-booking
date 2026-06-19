import { getBookings } from "@/lib/bookings";
import { getWaitlistEntriesForSession } from "@/lib/waitlist/storage";
import { ACTIVE_WAITLIST_STATUSES } from "@/lib/waitlist/types";
import { filterRegisterBookings } from "./filters";

export type ParentContact = {
  name: string;
  email: string;
  phone: string;
};

function uniqueContacts(contacts: ParentContact[]): ParentContact[] {
  const seen = new Set<string>();
  const result: ParentContact[] = [];

  for (const contact of contacts) {
    const key = contact.email.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(contact);
  }

  return result;
}

export function getBookedParentContacts(sessionId: string): ParentContact[] {
  const bookings = filterRegisterBookings(
    getBookings().filter((booking) => booking.sessionId === sessionId),
  );

  return uniqueContacts(
    bookings.map((booking) => ({
      name: booking.parentName,
      email: booking.email,
      phone: booking.emergencyContact.trim(),
    })),
  );
}

export function getWaitlistParentContacts(sessionId: string): ParentContact[] {
  return uniqueContacts(
    getWaitlistEntriesForSession(sessionId)
      .filter((entry) => ACTIVE_WAITLIST_STATUSES.includes(entry.status))
      .map((entry) => ({
        name: entry.parentName,
        email: entry.email,
        phone: entry.emergencyContact.trim(),
      })),
  );
}

export function buildParentMailto(
  contacts: ParentContact[],
  subject: string,
  body: string,
): string {
  if (contacts.length === 0) {
    return "";
  }

  const bcc = contacts
    .map((contact) => contact.email.trim())
    .filter(Boolean)
    .join(",");

  return `mailto:?bcc=${encodeURIComponent(bcc)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function copyContactEmails(contacts: ParentContact[]): string {
  return contacts
    .map((contact) => contact.email.trim())
    .filter(Boolean)
    .join(", ");
}

export function copyContactPhones(contacts: ParentContact[]): string {
  return contacts
    .map((contact) => contact.phone.trim())
    .filter(Boolean)
    .join(", ");
}
