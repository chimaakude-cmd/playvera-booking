"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  Gift,
  MapPin,
  Megaphone,
  Tag,
  Users,
  type LucideIcon,
} from "lucide-react";
import {
  CAMPAIGN_TYPE_DEFINITIONS,
  getClubCampaigns,
  removeClubCampaign,
  type CampaignAudienceType,
  type ClubCampaign,
} from "@/lib/club-communications/campaigns";
import { CampaignBuilderModal } from "./CampaignBuilderModal";
import { CampaignHistoryTable } from "./CampaignHistoryTable";

const CAMPAIGN_ICONS: Record<CampaignAudienceType, LucideIcon> = {
  all_parents: Users,
  by_activity: Calendar,
  by_venue: MapPin,
  by_age_group: Users,
  promo_code: Tag,
  holiday_camp: Gift,
};

type CampaignsSectionProps = {
  canManage: boolean;
};

function AvailableBadge() {
  return (
    <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-[11px] font-semibold text-teal-700 ring-1 ring-inset ring-teal-600/15">
      Available
    </span>
  );
}

function CampaignTypeCard({
  id,
  title,
  description,
  buttonLabel,
  canManage,
  onOpen,
}: {
  id: CampaignAudienceType;
  title: string;
  description: string;
  buttonLabel: string;
  canManage: boolean;
  onOpen: (type: CampaignAudienceType) => void;
}) {
  const Icon = CAMPAIGN_ICONS[id];

  return (
    <article className="flex h-full flex-col rounded-xl border border-zinc-200/80 bg-white p-4 shadow-sm transition-shadow duration-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 ring-1 ring-inset ring-teal-600/15">
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <AvailableBadge />
      </div>

      <h3 className="mt-4 text-sm font-semibold text-zinc-900">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-6 text-zinc-500">
        {description}
      </p>

      {canManage ? (
        <button
          type="button"
          onClick={() => onOpen(id)}
          className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700"
        >
          {buttonLabel}
        </button>
      ) : (
        <p className="mt-4 text-xs leading-5 text-zinc-500">
          Manager or owner access required to create campaigns.
        </p>
      )}
    </article>
  );
}

export function CampaignsSection({ canManage }: CampaignsSectionProps) {
  const [campaigns, setCampaigns] = useState<ClubCampaign[]>([]);
  const [activeAudienceType, setActiveAudienceType] =
    useState<CampaignAudienceType | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [undoCampaignId, setUndoCampaignId] = useState<string | null>(null);
  const [undoSecondsLeft, setUndoSecondsLeft] = useState(0);

  useEffect(() => {
    setCampaigns(getClubCampaigns());
  }, []);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!undoCampaignId || undoSecondsLeft <= 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      setUndoSecondsLeft((current) => current - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [undoCampaignId, undoSecondsLeft]);

  useEffect(() => {
    if (undoSecondsLeft === 0 && undoCampaignId) {
      setUndoCampaignId(null);
    }
  }, [undoSecondsLeft, undoCampaignId]);

  function handleSent(campaign: ClubCampaign) {
    setCampaigns(getClubCampaigns());
    void campaign;
  }

  function handleUndoStart(campaignId: string) {
    setUndoCampaignId(campaignId);
    setUndoSecondsLeft(60);
  }

  function handleUndo() {
    if (!undoCampaignId) {
      return;
    }

    removeClubCampaign(undoCampaignId);
    setCampaigns(getClubCampaigns());
    setUndoCampaignId(null);
    setUndoSecondsLeft(0);
    setToast("Campaign send undone");
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start gap-3 rounded-xl border border-zinc-200/80 bg-gradient-to-br from-teal-50/40 to-white p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-700 ring-1 ring-inset ring-teal-600/15">
          <Megaphone className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <h3 className="text-base font-semibold text-zinc-900">Campaigns</h3>
          <p className="mt-1 text-sm leading-6 text-zinc-500">
            Send updates and offers to the right parents without manual
            messaging.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CAMPAIGN_TYPE_DEFINITIONS.map((campaign) => (
          <CampaignTypeCard
            key={campaign.id}
            id={campaign.id}
            title={campaign.title}
            description={campaign.description}
            buttonLabel={campaign.buttonLabel}
            canManage={canManage}
            onOpen={setActiveAudienceType}
          />
        ))}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-zinc-900">Campaign history</h3>
        <p className="mt-1 text-xs text-zinc-500">
          Past and scheduled campaigns for this club.
        </p>
        <div className="mt-4">
          <CampaignHistoryTable campaigns={campaigns} />
        </div>
      </div>

      <CampaignBuilderModal
        open={activeAudienceType !== null}
        audienceType={activeAudienceType}
        canManage={canManage}
        onClose={() => setActiveAudienceType(null)}
        onSent={handleSent}
        onToast={setToast}
        onUndoStart={handleUndoStart}
      />

      {toast ? (
        <div className="fixed bottom-6 right-6 z-[60] rounded-xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      ) : null}

      {undoCampaignId && undoSecondsLeft > 0 ? (
        <div className="fixed bottom-20 right-6 z-[60] flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm shadow-lg">
          <span className="text-zinc-600">
            Sent — undo within {undoSecondsLeft}s
          </span>
          <button
            type="button"
            onClick={handleUndo}
            className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700"
          >
            Undo send
          </button>
        </div>
      ) : null}
    </div>
  );
}
