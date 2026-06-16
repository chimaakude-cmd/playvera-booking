import { adminListDataSource } from "@/lib/admin/data-source";
import { createSupabaseServerClient } from "@/lib/supabase";

export type AdminSupportThreadRow = {
  id: string;
  context: string;
  status: string;
  subject: string;
  contactName: string;
  contactEmail: string;
  lastMessagePreview: string;
  lastMessageAt: string;
  createdAt: string;
};

export type AdminSupportThreadsResult = {
  threads: AdminSupportThreadRow[];
  dataSource: "supabase" | "env_missing";
};

type SupportThreadRow = {
  id: string;
  context: string;
  status: string;
  subject: string;
  contact_name: string;
  contact_email: string;
  last_message_preview: string;
  last_message_at: string;
  created_at: string;
  archived: boolean;
};

function mapSupportThreadRow(row: SupportThreadRow): AdminSupportThreadRow {
  return {
    id: row.id,
    context: row.context,
    status: row.status,
    subject: row.subject.trim() || "Support request",
    contactName: row.contact_name.trim() || "—",
    contactEmail: row.contact_email.trim() || "—",
    lastMessagePreview: row.last_message_preview.trim() || "—",
    lastMessageAt: row.last_message_at,
    createdAt: row.created_at,
  };
}

async function fetchSupportThreadRows(): Promise<SupportThreadRow[] | null> {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("support_threads")
    .select(
      `
        id,
        context,
        status,
        subject,
        contact_name,
        contact_email,
        last_message_preview,
        last_message_at,
        created_at,
        archived
      `,
    )
    .eq("archived", false)
    .order("last_message_at", { ascending: false });

  if (error) {
    console.error("[Admin support] Failed to load threads:", error.message);
    return null;
  }

  return (data ?? []) as SupportThreadRow[];
}

export async function fetchAdminSupportThreads(): Promise<AdminSupportThreadsResult> {
  const dataSource = adminListDataSource();
  if (dataSource === "env_missing") {
    return { threads: [], dataSource: "env_missing" };
  }

  const rows = await fetchSupportThreadRows();

  return {
    threads: (rows ?? []).map(mapSupportThreadRow),
    dataSource: "supabase",
  };
}
