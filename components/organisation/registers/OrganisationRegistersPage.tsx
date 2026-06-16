"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/club/EmptyState";
import { LoadingState } from "@/components/club/LoadingState";
import { PageHeader } from "@/components/club/PageHeader";
import {
  OrgActionLink,
  OrgFilterField,
  OrgFilterPanel,
  OrgStatusBadge,
  OrgTable,
  OrgTableWrapper,
  OrgToast,
  orgInputClass,
  orgSelectClass,
} from "@/components/organisation/shared/OrgUi";
import { PaginationControls } from "@/components/ui/PaginationControls";
import {
  DEFAULT_ORG_REGISTER_FILTERS,
  filterOrgRegisters,
  getOrgRegisterFilterOptions,
  getOrgRegisters,
  type OrgRegisterFilters,
  type OrgRegisterSession,
} from "@/lib/organisation";
import { paginateItems } from "@/lib/pagination";

function registerTone(
  status: OrgRegisterSession["status"],
): "emerald" | "amber" | "sky" {
  if (status === "closed") return "emerald";
  if (status === "in_progress") return "sky";
  return "amber";
}

export function OrganisationRegistersPage() {
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<OrgRegisterFilters>(
    DEFAULT_ORG_REGISTER_FILTERS,
  );
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState<string | null>(null);
  const [registers, setRegisters] = useState<OrgRegisterSession[]>([]);

  const filterOptions = useMemo(
    () => getOrgRegisterFilterOptions(registers),
    [registers],
  );

  const filtered = useMemo(
    () => filterOrgRegisters(registers, filters),
    [registers, filters],
  );

  const pagination = useMemo(
    () => paginateItems(filtered, page, 8),
    [filtered, page],
  );

  useEffect(() => {
    setRegisters(getOrgRegisters());
    setLoading(false);
  }, []);

  function updateFilter<K extends keyof OrgRegisterFilters>(
    key: K,
    value: OrgRegisterFilters[K],
  ) {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  }

  function stubAction(label: string) {
    setMessage(`${label} (demo action).`);
  }

  if (loading) {
    return <LoadingState message="Loading network registers..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Registers"
        description="Session registers and attendance across all franchisee clubs."
      />

      <OrgToast message={message} />

      <OrgFilterPanel>
        <OrgFilterField label="Date">
          <input
            type="date"
            value={filters.date}
            onChange={(e) => updateFilter("date", e.target.value)}
            className={orgInputClass}
          />
        </OrgFilterField>
        <OrgFilterField label="Franchisee club">
          <select
            value={filters.clubId}
            onChange={(e) => updateFilter("clubId", e.target.value)}
            className={orgSelectClass}
          >
            <option value="all">All clubs</option>
            {filterOptions.clubs.map((club) => (
              <option key={club.id} value={club.id}>
                {club.name}
              </option>
            ))}
          </select>
        </OrgFilterField>
        <OrgFilterField label="Activity">
          <select
            value={filters.activity}
            onChange={(e) => updateFilter("activity", e.target.value)}
            className={orgSelectClass}
          >
            <option value="all">All activities</option>
            {filterOptions.activities.map((activity) => (
              <option key={activity} value={activity}>
                {activity}
              </option>
            ))}
          </select>
        </OrgFilterField>
        <OrgFilterField label="Venue">
          <select
            value={filters.venue}
            onChange={(e) => updateFilter("venue", e.target.value)}
            className={orgSelectClass}
          >
            <option value="all">All venues</option>
            {filterOptions.venues.map((venue) => (
              <option key={venue} value={venue}>
                {venue}
              </option>
            ))}
          </select>
        </OrgFilterField>
      </OrgFilterPanel>

      {registers.length === 0 ? (
        <EmptyState
          title="No registers yet"
          description="Session registers from franchisee clubs will appear here."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No matching registers"
          description="Try adjusting your filters to see more results."
        />
      ) : (
        <OrgTableWrapper
          pagination={
            <PaginationControls
              page={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems}
              startIndex={pagination.startIndex}
              endIndex={pagination.endIndex}
              onPageChange={setPage}
            />
          }
        >
          <OrgTable
            columns={[
              "Session",
              "Franchisee club",
              "Date / time",
              "Booked",
              "Present",
              "Absent",
              "Medical flags",
              "Register status",
              "Actions",
            ]}
          >
            {pagination.items.map((row) => (
              <tr key={row.id} className="hover:bg-zinc-50/50">
                <td className="px-4 py-3">
                  <p className="font-medium text-zinc-900">{row.sessionTitle}</p>
                  <p className="text-xs text-zinc-500">{row.venue}</p>
                </td>
                <td className="px-4 py-3 text-zinc-600">{row.franchiseeClubName}</td>
                <td className="px-4 py-3 text-zinc-600 whitespace-nowrap">
                  {row.date} · {row.timeLabel}
                </td>
                <td className="px-4 py-3 text-zinc-600">{row.booked}</td>
                <td className="px-4 py-3 text-emerald-700">{row.present}</td>
                <td className="px-4 py-3 text-rose-700">{row.absent}</td>
                <td className="px-4 py-3 text-zinc-600">
                  {row.medicalFlags > 0 ? (
                    <span className="font-medium text-amber-700">
                      {row.medicalFlags}
                    </span>
                  ) : (
                    "0"
                  )}
                </td>
                <td className="px-4 py-3">
                  <OrgStatusBadge
                    label={row.status.replace("_", " ")}
                    tone={registerTone(row.status)}
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex min-w-[180px] flex-wrap gap-x-2 gap-y-1">
                    <Link
                      href={`/club/registers?session=${row.id}`}
                      className="text-xs font-semibold text-violet-700 hover:text-violet-900"
                    >
                      Open register
                    </Link>
                    <OrgActionLink onClick={() => stubAction("Export register")}>
                      Export
                    </OrgActionLink>
                    <OrgActionLink onClick={() => stubAction("Print register")}>
                      Print
                    </OrgActionLink>
                  </div>
                </td>
              </tr>
            ))}
          </OrgTable>
        </OrgTableWrapper>
      )}
    </div>
  );
}
