"use client";

import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/club/EmptyState";
import { LoadingState } from "@/components/club/LoadingState";
import { PageHeader } from "@/components/club/PageHeader";
import { DashboardStatCard } from "@/components/club/dashboard/DashboardCards";
import {
  OrgActionLink,
  OrgFilterField,
  OrgFilterPanel,
  OrgTable,
  OrgTableWrapper,
  OrgToast,
  orgInputClass,
  orgSelectClass,
} from "@/components/organisation/shared/OrgUi";
import { PaginationControls } from "@/components/ui/PaginationControls";
import {
  DEFAULT_ORG_CUSTOMER_FILTERS,
  filterOrgCustomers,
  formatOrgCurrency,
  formatOrgDate,
  getOrgCustomerFilterOptions,
  getOrgCustomerMetrics,
  getOrgCustomers,
  type OrgCustomer,
  type OrgCustomerFilters,
} from "@/lib/organisation";
import { paginateItems } from "@/lib/pagination";

export function OrganisationCustomersPage() {
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<OrgCustomerFilters>(
    DEFAULT_ORG_CUSTOMER_FILTERS,
  );
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState<string | null>(null);
  const [customers, setCustomers] = useState<OrgCustomer[]>([]);

  const metrics = useMemo(() => getOrgCustomerMetrics(customers), [customers]);
  const filterOptions = useMemo(
    () => getOrgCustomerFilterOptions(customers),
    [customers],
  );

  const filtered = useMemo(
    () => filterOrgCustomers(customers, filters),
    [customers, filters],
  );

  const pagination = useMemo(
    () => paginateItems(filtered, page, 8),
    [filtered, page],
  );

  useEffect(() => {
    setCustomers(getOrgCustomers());
    setLoading(false);
  }, []);

  function updateFilter<K extends keyof OrgCustomerFilters>(
    key: K,
    value: OrgCustomerFilters[K],
  ) {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  }

  function stubAction(label: string) {
    setMessage(`${label} (demo action).`);
  }

  if (loading) {
    return <LoadingState message="Loading network customers..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Parent and carer profiles aggregated across your franchise network."
      />

      <OrgToast message={message} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard
          label="Total customers"
          value={String(metrics.total)}
          hint="Unique parent accounts"
          accent="violet"
        />
        <DashboardStatCard
          label="Active customers"
          value={String(metrics.active)}
          hint="Recent or ongoing bookings"
          accent="teal"
        />
        <DashboardStatCard
          label="Repeat customers"
          value={String(metrics.repeat)}
          hint="More than one booking"
          accent="amber"
        />
        <DashboardStatCard
          label="Average spend"
          value={formatOrgCurrency(metrics.avgSpendPence)}
          hint="Lifetime per customer"
          accent="slate"
        />
      </div>

      <OrgFilterPanel>
        <OrgFilterField label="Search" className="sm:col-span-2">
          <input
            type="search"
            value={filters.query}
            onChange={(e) => updateFilter("query", e.target.value)}
            placeholder="Parent, child, email, or phone"
            className={orgInputClass}
          />
        </OrgFilterField>
        <OrgFilterField label="Franchisee club">
          <select
            value={filters.clubName}
            onChange={(e) => updateFilter("clubName", e.target.value)}
            className={orgSelectClass}
          >
            <option value="all">All clubs</option>
            {filterOptions.clubs.map((club) => (
              <option key={club} value={club}>
                {club}
              </option>
            ))}
          </select>
        </OrgFilterField>
      </OrgFilterPanel>

      {customers.length === 0 ? (
        <EmptyState
          title="No customers yet"
          description="Customer profiles from franchisee bookings will appear here."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No matching customers"
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
              "Parent / carer",
              "Children",
              "Email",
              "Phone",
              "Franchisee clubs used",
              "Total bookings",
              "Total spend",
              "Last booking",
              "Actions",
            ]}
          >
            {pagination.items.map((customer) => (
              <tr key={customer.id} className="hover:bg-zinc-50/50">
                <td className="px-4 py-3 font-medium text-zinc-900">
                  {customer.parentName}
                </td>
                <td className="px-4 py-3 text-zinc-600">
                  {customer.children.join(", ")}
                </td>
                <td className="px-4 py-3 text-zinc-600">{customer.email}</td>
                <td className="px-4 py-3 text-zinc-600 whitespace-nowrap">
                  {customer.phone}
                </td>
                <td className="px-4 py-3 text-zinc-600">
                  {customer.franchiseeClubs.join(" · ")}
                </td>
                <td className="px-4 py-3 text-zinc-600">
                  {customer.totalBookings}
                </td>
                <td className="px-4 py-3 text-zinc-600">
                  {formatOrgCurrency(customer.totalSpendPence)}
                </td>
                <td className="px-4 py-3 text-zinc-600 whitespace-nowrap">
                  {formatOrgDate(customer.lastBookingDate)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex min-w-[220px] flex-wrap gap-x-2 gap-y-1">
                    <OrgActionLink
                      onClick={() => stubAction(`View ${customer.parentName}`)}
                    >
                      View profile
                    </OrgActionLink>
                    <OrgActionLink
                      onClick={() => stubAction(`Message ${customer.parentName}`)}
                    >
                      Message
                    </OrgActionLink>
                    <OrgActionLink onClick={() => stubAction("Refund booking")}>
                      Refund booking
                    </OrgActionLink>
                    <OrgActionLink
                      onClick={() => stubAction("View booking history")}
                    >
                      View booking history
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
