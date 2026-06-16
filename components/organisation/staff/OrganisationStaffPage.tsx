"use client";

import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/club/EmptyState";
import { LoadingState } from "@/components/club/LoadingState";
import { PageHeader } from "@/components/club/PageHeader";
import { DashboardSection } from "@/components/club/dashboard/DashboardCards";
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
import {
  changeOrgStaffRole,
  DEFAULT_ORG_STAFF_FILTERS,
  filterOrgStaff,
  formatOrgLastActive,
  getOrgStaff,
  getOrgStaffBySection,
  ORG_STAFF_ROLE_LABELS,
  removeOrgStaffMember,
  resendOrgStaffInvite,
  type OrgStaffFilters,
  type OrgStaffMember,
  type OrgStaffRole,
} from "@/lib/organisation";

function staffStatusTone(
  status: OrgStaffMember["status"],
): "emerald" | "amber" | "zinc" {
  if (status === "active") return "emerald";
  if (status === "invited") return "amber";
  return "zinc";
}

function StaffTable({
  rows,
  showInviteActions,
  onAction,
}: {
  rows: OrgStaffMember[];
  showInviteActions?: boolean;
  onAction: (message: string) => void;
}) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-zinc-500">No team members in this section.</p>
    );
  }

  return (
    <OrgTableWrapper>
      <OrgTable
        columns={[
          "Name",
          "Email",
          "Role",
          "Assigned club(s)",
          "Status",
          "Last active",
          "Actions",
        ]}
      >
        {rows.map((member) => (
          <tr key={member.id} className="hover:bg-zinc-50/50">
            <td className="px-4 py-3 font-medium text-zinc-900">{member.name}</td>
            <td className="px-4 py-3 text-zinc-600">{member.email}</td>
            <td className="px-4 py-3">
              <OrgStatusBadge label={ORG_STAFF_ROLE_LABELS[member.role]} tone="violet" />
            </td>
            <td className="px-4 py-3 text-zinc-600">
              {member.assignedClubs.join(", ")}
            </td>
            <td className="px-4 py-3">
              <OrgStatusBadge
                label={member.status}
                tone={staffStatusTone(member.status)}
              />
            </td>
            <td className="px-4 py-3 text-zinc-600 whitespace-nowrap">
              {formatOrgLastActive(member.lastActiveAt)}
            </td>
            <td className="px-4 py-3">
              <div className="flex min-w-[220px] flex-wrap gap-x-2 gap-y-1">
                {showInviteActions ? (
                  <>
                    <OrgActionLink
                      onClick={() => {
                        resendOrgStaffInvite(member.id);
                        onAction(`Invite resent to ${member.email}.`);
                      }}
                    >
                      Resend invite
                    </OrgActionLink>
                    <OrgActionLink
                      variant="danger"
                      onClick={() => {
                        removeOrgStaffMember(member.id);
                        onAction(`${member.name} removed.`);
                      }}
                    >
                      Remove
                    </OrgActionLink>
                  </>
                ) : (
                  <>
                    <OrgActionLink
                      onClick={() => onAction(`Invite sent to ${member.email}.`)}
                    >
                      Invite
                    </OrgActionLink>
                    <OrgActionLink
                      onClick={() => {
                        const nextRole: OrgStaffRole =
                          member.role === "coach"
                            ? "club_manager"
                            : "coach";
                        changeOrgStaffRole(member.id, nextRole);
                        onAction(`Role updated for ${member.name}.`);
                      }}
                    >
                      Change role
                    </OrgActionLink>
                    {member.role !== "organisation_owner" ? (
                      <OrgActionLink
                        variant="danger"
                        onClick={() => {
                          removeOrgStaffMember(member.id);
                          onAction(`${member.name} removed.`);
                        }}
                      >
                        Remove
                      </OrgActionLink>
                    ) : null}
                  </>
                )}
              </div>
            </td>
          </tr>
        ))}
      </OrgTable>
    </OrgTableWrapper>
  );
}

export function OrganisationStaffPage() {
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<OrgStaffFilters>(
    DEFAULT_ORG_STAFF_FILTERS,
  );
  const [message, setMessage] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [staff, setStaff] = useState<OrgStaffMember[]>([]);

  const filtered = useMemo(
    () => filterOrgStaff(staff, filters),
    [staff, filters],
  );

  const sections = useMemo(() => getOrgStaffBySection(filtered), [filtered]);

  useEffect(() => {
    setStaff(getOrgStaff());
    setLoading(false);
  }, [refreshKey]);

  function updateFilter<K extends keyof OrgStaffFilters>(
    key: K,
    value: OrgStaffFilters[K],
  ) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function handleAction(text: string) {
    setMessage(text);
    setRefreshKey((k) => k + 1);
  }

  if (loading) {
    return <LoadingState message="Loading organisation staff..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff"
        description="Head office team, franchisee club users, and pending invites across your network."
        action={
          <button
            type="button"
            onClick={() => handleAction("Invite form opened (demo).")}
            className="rounded-xl bg-violet-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-800"
          >
            Invite staff member
          </button>
        }
      />

      <OrgToast message={message} />

      <OrgFilterPanel>
        <OrgFilterField label="Search" className="sm:col-span-2">
          <input
            type="search"
            value={filters.query}
            onChange={(e) => updateFilter("query", e.target.value)}
            placeholder="Name, email, or club"
            className={orgInputClass}
          />
        </OrgFilterField>
        <OrgFilterField label="Role">
          <select
            value={filters.role}
            onChange={(e) =>
              updateFilter("role", e.target.value as OrgStaffFilters["role"])
            }
            className={orgSelectClass}
          >
            <option value="all">All roles</option>
            {Object.entries(ORG_STAFF_ROLE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </OrgFilterField>
        <OrgFilterField label="Section">
          <select
            value={filters.section}
            onChange={(e) =>
              updateFilter(
                "section",
                e.target.value as OrgStaffFilters["section"],
              )
            }
            className={orgSelectClass}
          >
            <option value="all">All sections</option>
            <option value="head_office">Head office team</option>
            <option value="franchisee">Franchisee club users</option>
            <option value="pending">Pending invites</option>
          </select>
        </OrgFilterField>
      </OrgFilterPanel>

      {staff.length === 0 ? (
        <EmptyState
          title="No staff yet"
          description="Invite head office and franchisee club users to manage your network."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No matching staff"
          description="Try adjusting your filters to see more results."
        />
      ) : (
        <div className="space-y-6">
          {(filters.section === "all" || filters.section === "head_office") &&
          sections.headOffice.length > 0 ? (
            <DashboardSection
              title="Head office team"
              description="Organisation owners, managers, finance, and support admins."
            >
              <StaffTable rows={sections.headOffice} onAction={handleAction} />
            </DashboardSection>
          ) : null}

          {(filters.section === "all" || filters.section === "franchisee") &&
          sections.franchisee.length > 0 ? (
            <DashboardSection
              title="Franchisee club users"
              description="Club managers and coaches assigned to franchisee locations."
            >
              <StaffTable rows={sections.franchisee} onAction={handleAction} />
            </DashboardSection>
          ) : null}

          {(filters.section === "all" || filters.section === "pending") &&
          sections.pending.length > 0 ? (
            <DashboardSection
              title="Pending invites"
              description="Invitations awaiting acceptance."
            >
              <StaffTable
                rows={sections.pending}
                showInviteActions
                onAction={handleAction}
              />
            </DashboardSection>
          ) : null}
        </div>
      )}
    </div>
  );
}
