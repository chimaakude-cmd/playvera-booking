import type { Booking } from "@/lib/bookings";

type DemoCustomerSeed = {
  parentName: string;
  email: string;
  phone: string;
  children: Array<{
    name: string;
    age: number;
    medical?: string;
    allergies?: string;
  }>;
};

export const DEMO_CUSTOMERS_SEED: DemoCustomerSeed[] = [
  {
    parentName: "Helen Carter",
    email: "helen.carter@example.com",
    phone: "07700 900 101",
    children: [{ name: "Mia Carter", age: 8, allergies: "Peanuts" }],
  },
  {
    parentName: "James Okonkwo",
    email: "james.okonkwo@example.com",
    phone: "07700 900 202",
    children: [{ name: "Noah Okonkwo", age: 10 }],
  },
  {
    parentName: "Sarah Mitchell",
    email: "sarah.mitchell@example.com",
    phone: "07700 900 303",
    children: [
      { name: "Ella Mitchell", age: 7 },
      { name: "Leo Mitchell", age: 9, medical: "Asthma inhaler" },
    ],
  },
  {
    parentName: "David Hughes",
    email: "david.hughes@example.com",
    phone: "07700 900 404",
    children: [{ name: "Amelia Hughes", age: 6 }],
  },
  {
    parentName: "Priya Sharma",
    email: "priya.sharma@example.com",
    phone: "07700 900 505",
    children: [{ name: "Arjun Sharma", age: 11 }],
  },
];

export function buildDemoCustomerBookings(): Map<
  string,
  { parentName: string; phone: string; bookings: Booking[] }
> {
  const byEmail = new Map<
    string,
    { parentName: string; phone: string; bookings: Booking[] }
  >();

  for (const seed of DEMO_CUSTOMERS_SEED) {
    byEmail.set(seed.email, {
      parentName: seed.parentName,
      phone: seed.phone,
      bookings: seed.children.map((child, index) => ({
        id: `seed-${seed.email}-${index}`,
        sessionId: "demo-session",
        sessionTitle:
          index % 2 === 0 ? "Junior Football Skills" : "Holiday Multi-Sports",
        providerName: "Riverside Sports Centre",
        day: "saturday",
        startTime: "10:00",
        endTime: "11:00",
        pricePaid: 18 + index * 2,
        parentName: seed.parentName,
        email: seed.email,
        childName: child.name,
        childAge: child.age,
        emergencyContact: seed.phone,
        status: index === 2 ? "refund_requested" : "confirmed",
        createdAt: new Date(
          Date.now() - index * 7 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        medicalConditions: child.medical ?? "",
        allergies: child.allergies ?? "",
        photoConsentSession: index !== 1,
      })),
    });
  }

  return byEmail;
}
