"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  Check,
  Copy,
  Download,
  Eye,
  LayoutGrid,
  MoreHorizontal,
  Send,
  Share2,
  Sparkles,
  Star,
  Upload,
  X,
} from "lucide-react";
import { TemplatePreviewPanel } from "@/components/message-templates/TemplatePreviewPanel";
import { useModalDismiss } from "@/lib/hooks/use-modal-dismiss";
import { getCurrentClubRole, roleHasPermission } from "@/lib/club-team";
import {
  PACK_CATEGORY_LABELS,
  downloadTemplatesJson,
  duplicatePack,
  getAllPacks,
  getInstalledPackIds,
  getOrganisationDefaultPackId,
  getProviderId,
  importClubTemplates,
  installPack,
  saveAsOrganisationDefault,
  type ExportedClubTemplates,
  type PackCategory,
  type PackFeaturedExample,
  type PackTemplateDefinition,
  type TemplatePackDefinition,
} from "@/lib/message-templates";

type TemplateLibrarySectionProps = {
  canEdit: boolean;
};

const ALL_CATEGORIES: PackCategory[] = [
  "BOOKING",
  "PAYMENTS",
  "REMINDERS",
  "MARKETING",
  "SUPPORT",
  "REVIEWS",
  "CAMPS",
  "EMERGENCY",
];

function CategoryPill({ category }: { category: PackCategory }) {
  return (
    <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-600">
      {PACK_CATEGORY_LABELS[category]}
    </span>
  );
}

function PreviewModal({
  open,
  pack,
  template,
  featuredExample,
  onClose,
  onTestSend,
}: {
  open: boolean;
  pack: TemplatePackDefinition | null;
  template: PackTemplateDefinition | null;
  featuredExample: PackFeaturedExample | null;
  onClose: () => void;
  onTestSend: () => void;
}) {
  useModalDismiss(open, onClose);

  if (!open || !pack) {
    return null;
  }

  const previewTemplate = template
    ? {
        subject: template.subject,
        body: template.body,
        channel: template.channels?.[0] ?? ("email" as const),
        channels: template.channels ?? ["email"],
      }
    : featuredExample
      ? {
          subject: featuredExample.subject,
          body: featuredExample.body,
          channel: "email" as const,
          channels: ["email" as const],
        }
      : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close preview"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-zinc-100 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-600">
              Email preview
            </p>
            <h2 className="mt-1 text-lg font-semibold text-zinc-900">
              {template?.name ?? featuredExample?.label ?? pack.name}
            </h2>
            <p className="mt-0.5 text-sm text-zinc-500">{pack.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {previewTemplate ? (
            <TemplatePreviewPanel template={previewTemplate} accent="teal" />
          ) : (
            <p className="text-sm text-zinc-500">Select a template to preview.</p>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-zinc-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => {
              onTestSend();
              onClose();
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
          >
            <Send className="h-4 w-4" />
            Test send
          </button>
        </div>
      </div>
    </div>
  );
}

function PackActionsMenu({
  pack,
  canEdit,
  isOrgDefault,
  onDuplicate,
  onSaveDefault,
  onShare,
  onExport,
}: {
  pack: TemplatePackDefinition;
  canEdit: boolean;
  isOrgDefault: boolean;
  onDuplicate: () => void;
  onSaveDefault: () => void;
  onShare: () => void;
  onExport: () => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleClick(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (!canEdit) {
    return null;
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="rounded-lg border border-zinc-200 p-2 text-zinc-500 hover:bg-zinc-50"
        aria-label="Pack actions"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-10 mt-1 w-52 rounded-xl border border-zinc-200 bg-white py-1 shadow-lg">
          <button
            type="button"
            onClick={() => {
              onDuplicate();
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50"
          >
            <Copy className="h-4 w-4 text-zinc-400" />
            Duplicate pack
          </button>
          <button
            type="button"
            onClick={() => {
              onSaveDefault();
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50"
          >
            <Star className="h-4 w-4 text-zinc-400" />
            {isOrgDefault ? "Organisation default" : "Save as org default"}
          </button>
          <button
            type="button"
            onClick={() => {
              onShare();
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50"
          >
            <Share2 className="h-4 w-4 text-zinc-400" />
            Share with franchise
          </button>
          <button
            type="button"
            onClick={() => {
              onExport();
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50"
          >
            <Download className="h-4 w-4 text-zinc-400" />
            Export templates
          </button>
        </div>
      ) : null}
    </div>
  );
}

function PackCard({
  pack,
  installed,
  isOrgDefault,
  canEdit,
  onInstall,
  onPreviewTemplate,
  onPreviewFeatured,
  onDuplicate,
  onSaveDefault,
  onShare,
  onExport,
}: {
  pack: TemplatePackDefinition;
  installed: boolean;
  isOrgDefault: boolean;
  canEdit: boolean;
  onInstall: () => void;
  onPreviewTemplate: (template: PackTemplateDefinition) => void;
  onPreviewFeatured: () => void;
  onDuplicate: () => void;
  onSaveDefault: () => void;
  onShare: () => void;
  onExport: () => void;
}) {
  const previewTemplate = pack.featuredExample
    ? null
    : pack.templates[0] ?? null;

  return (
    <article
      className={`group flex h-full flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-200 hover:shadow-md ${
        installed
          ? "border-teal-200 ring-1 ring-teal-100"
          : "border-zinc-200/80"
      }`}
    >
      <div className="relative bg-gradient-to-br from-teal-600 via-teal-700 to-zinc-900 px-5 py-5 text-white">
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 ring-1 ring-inset ring-white/20">
            <LayoutGrid className="h-5 w-5" aria-hidden />
          </div>
          <div className="flex items-center gap-2">
            {pack.isAutoInstalled ? (
              <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset ring-white/25">
                Auto-installed
              </span>
            ) : null}
            {pack.isDefault ? (
              <span className="rounded-full bg-amber-400/90 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-950">
                Default
              </span>
            ) : null}
            {installed ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/90 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-950">
                <Check className="h-3 w-3" />
                Installed
              </span>
            ) : null}
          </div>
        </div>

        <h3 className="mt-4 text-base font-semibold leading-snug">{pack.name}</h3>
        <p className="mt-1.5 text-sm leading-5 text-teal-50/90">{pack.description}</p>

        {pack.sports?.length ? (
          <p className="mt-3 text-xs text-teal-100/80">
            {pack.sports.join(" · ")}
          </p>
        ) : null}

        <p className="mt-2 text-xs font-medium text-teal-100/70">
          Tone: {pack.tone}
        </p>
      </div>

      <div className="flex flex-1 flex-col px-5 py-4">
        <div className="flex flex-wrap gap-1.5">
          {pack.categories.slice(0, 4).map((category) => (
            <CategoryPill key={category} category={category} />
          ))}
          {pack.categories.length > 4 ? (
            <span className="rounded-md bg-zinc-50 px-2 py-0.5 text-[10px] font-semibold text-zinc-500">
              +{pack.categories.length - 4}
            </span>
          ) : null}
        </div>

        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Included templates ({pack.templates.length})
          </p>
          <ul className="mt-2 max-h-28 space-y-1 overflow-y-auto text-sm text-zinc-600">
            {pack.templates.map((template) => (
              <li key={template.id} className="flex items-center gap-2">
                <span className="h-1 w-1 shrink-0 rounded-full bg-teal-500" />
                <button
                  type="button"
                  onClick={() => onPreviewTemplate(template)}
                  className="truncate text-left hover:text-teal-700 hover:underline"
                >
                  {template.name}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {pack.featuredExample ? (
          <button
            type="button"
            onClick={onPreviewFeatured}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-800"
          >
            <BookOpen className="h-3.5 w-3.5" />
            Preview: {pack.featuredExample.label}
          </button>
        ) : previewTemplate ? (
          <button
            type="button"
            onClick={() => onPreviewTemplate(previewTemplate)}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-800"
          >
            <Eye className="h-3.5 w-3.5" />
            Preview sample email
          </button>
        ) : null}

        <div className="mt-auto flex items-center gap-2 pt-5">
          {canEdit ? (
            <>
              <button
                type="button"
                onClick={onInstall}
                disabled={installed && pack.isAutoInstalled}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Sparkles className="h-4 w-4" />
                {installed ? "Reinstall pack" : "Install pack"}
              </button>
              <PackActionsMenu
                pack={pack}
                canEdit={canEdit}
                isOrgDefault={isOrgDefault}
                onDuplicate={onDuplicate}
                onSaveDefault={onSaveDefault}
                onShare={onShare}
                onExport={onExport}
              />
            </>
          ) : (
            <p className="text-xs text-zinc-500">
              View-only access — contact a manager to install packs.
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

export function TemplateLibrarySection({ canEdit }: TemplateLibrarySectionProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeCategory, setActiveCategory] = useState<PackCategory | "ALL">("ALL");
  const [previewPack, setPreviewPack] = useState<TemplatePackDefinition | null>(
    null,
  );
  const [previewTemplate, setPreviewTemplate] =
    useState<PackTemplateDefinition | null>(null);
  const [previewFeatured, setPreviewFeatured] =
    useState<PackFeaturedExample | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const role = getCurrentClubRole();
  const canSetOrgDefault = roleHasPermission(role, "manage_communications");

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const packs = useMemo(() => {
    void refreshKey;
    return getAllPacks();
  }, [refreshKey]);

  const installedIds = useMemo(() => {
    void refreshKey;
    return new Set(getInstalledPackIds());
  }, [refreshKey]);

  const orgDefaultPackId = useMemo(() => {
    void refreshKey;
    return getOrganisationDefaultPackId();
  }, [refreshKey]);

  const filteredPacks = useMemo(() => {
    if (activeCategory === "ALL") {
      return packs;
    }

    return packs.filter((pack) => pack.categories.includes(activeCategory));
  }, [packs, activeCategory]);

  function refresh() {
    setRefreshKey((current) => current + 1);
  }

  function handleInstall(packId: string) {
    if (!canEdit) {
      return;
    }

    const providerId = getProviderId();
    const result = installPack(providerId, packId);

    if (result.success) {
      setToast(
        `Pack installed — ${result.templatesActive} templates active`,
      );
      refresh();
    } else {
      setToast(result.error);
    }
  }

  function handleDuplicate(packId: string) {
    const duplicate = duplicatePack(packId);

    if (duplicate) {
      setToast(`Duplicated as "${duplicate.name}"`);
      refresh();
    }
  }

  function handleSaveDefault(packId: string) {
    if (!canSetOrgDefault) {
      setToast("Manager or owner role required to set organisation default");
      return;
    }

    saveAsOrganisationDefault(packId);
    setToast("Saved as organisation default pack");
    refresh();
  }

  function handleShare() {
    setToast("Share request queued — franchise network sync coming soon");
  }

  function handleExport(packId: string) {
    downloadTemplatesJson(getProviderId(), packId);
    setToast("Templates exported as JSON");
  }

  function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result)) as ExportedClubTemplates;

        if (data.version !== 1) {
          setToast("Unsupported template file version");
          return;
        }

        const { imported } = importClubTemplates(data);
        setToast(`Imported ${imported} templates`);
        refresh();
      } catch {
        setToast("Could not read template file — check JSON format");
      }
    };

    reader.readAsText(file);
    event.target.value = "";
  }

  function openPreview(
    pack: TemplatePackDefinition,
    template: PackTemplateDefinition | null,
    featured: PackFeaturedExample | null,
  ) {
    setPreviewPack(pack);
    setPreviewTemplate(template);
    setPreviewFeatured(featured);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 rounded-2xl border border-teal-100 bg-gradient-to-r from-teal-50/80 via-white to-zinc-50 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-teal-600" />
            <h3 className="text-base font-semibold text-zinc-900">
              Communications app store
            </h3>
          </div>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-600">
            Install a complete message pack in one click. Templates merge into
            your club overrides — customise any template after installing.
          </p>
        </div>

        {canEdit ? (
          <div className="flex shrink-0 gap-2">
            <input
              ref={importInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={handleImport}
            />
            <button
              type="button"
              onClick={() => importInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              <Upload className="h-4 w-4" />
              Import
            </button>
            <button
              type="button"
              onClick={() => {
                downloadTemplatesJson();
                setToast("All club templates exported");
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              <Download className="h-4 w-4" />
              Export all
            </button>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveCategory("ALL")}
          className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
            activeCategory === "ALL"
              ? "bg-teal-600 text-white"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          }`}
        >
          All packs
        </button>
        {ALL_CATEGORIES.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setActiveCategory(category)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              activeCategory === category
                ? "bg-teal-600 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            {PACK_CATEGORY_LABELS[category]}
          </button>
        ))}
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {filteredPacks.map((pack) => (
          <PackCard
            key={pack.id}
            pack={pack}
            installed={installedIds.has(pack.id) || Boolean(pack.isAutoInstalled)}
            isOrgDefault={orgDefaultPackId === pack.id}
            canEdit={canEdit}
            onInstall={() => handleInstall(pack.id)}
            onPreviewTemplate={(template) => openPreview(pack, template, null)}
            onPreviewFeatured={() =>
              openPreview(pack, null, pack.featuredExample ?? null)
            }
            onDuplicate={() => handleDuplicate(pack.id)}
            onSaveDefault={() => handleSaveDefault(pack.id)}
            onShare={handleShare}
            onExport={() => handleExport(pack.id)}
          />
        ))}
      </div>

      {filteredPacks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 px-6 py-12 text-center">
          <p className="text-sm font-medium text-zinc-700">
            No packs match this category
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            Try a different filter or import a custom pack.
          </p>
        </div>
      ) : null}

      <PreviewModal
        open={previewPack !== null}
        pack={previewPack}
        template={previewTemplate}
        featuredExample={previewFeatured}
        onClose={() => {
          setPreviewPack(null);
          setPreviewTemplate(null);
          setPreviewFeatured(null);
        }}
        onTestSend={() =>
          setToast("Test email sent to your club inbox (demo mode)")
        }
      />

      {toast ? (
        <div className="fixed bottom-6 right-6 z-[60] rounded-xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      ) : null}
    </div>
  );
}
