import type { IconName } from "@/components/ui/icon/Icon";
import type { RuleTierEngine, RuleTierId } from "@/lib/types/rules.types";

export interface RuleTierMeta {
  title: string;
  description: string;
  icon: IconName;
}

// Label & deskripsi tiap tier quality profile — urutan mengikuti urutan
// tiers yang dikirim BE.
export const RULE_TIER_META: Record<RuleTierId, RuleTierMeta> = {
  secrets: {
    title: "Secrets",
    description:
      "API key, token, password, dan kredensial lain yang ditulis langsung di kode.",
    icon: "TbKey",
  },
  crash: {
    title: "Bug penyebab crash",
    description:
      "Error sintaks, debugger atau breakpoint tertinggal, dan kode yang hampir pasti melempar exception di path utama.",
    icon: "TbBug",
  },
  breaking_change: {
    title: "Breaking change",
    description:
      "Export publik, route, atau field yang dihapus atau diubah tanpa kompatibilitas — bisa merusak pemanggil.",
    icon: "TbAlertTriangle",
  },
  error_handling: {
    title: "Error handling",
    description:
      "Catch kosong dan error yang ditelan di path penting seperti auth, pembayaran, atau penulisan data.",
    icon: "TbShieldX",
  },
  performance: {
    title: "N+1 & performa",
    description:
      "Query per item dan pola berat lain yang jelas tumbuh mengikuti ukuran input pengguna.",
    icon: "TbGauge",
  },
  security: {
    title: "Kerentanan keamanan",
    description:
      "Injeksi SQL/shell, TLS tidak aman, pengecekan auth yang hilang, dan konfigurasi berisiko.",
    icon: "TbShieldCheck",
  },
};

export const RULE_ENGINE_LABEL: Record<RuleTierEngine, string> = {
  static: "Static",
  ai: "AI",
  "static+ai": "Static + AI",
};

// How long a tier opened from search (?tier=) stays highlighted.
export const RULE_TIER_HIGHLIGHT_MS = 2000;

export const getRuleTierElementId = (tier: string) => `rule-tier-${tier}`;

export const RULE_TIER_IDS = Object.keys(RULE_TIER_META) as RuleTierId[];

// Older BE versions may still send tiers that were removed (e.g. "ci").
export const isKnownRuleTier = (id: string): id is RuleTierId =>
  id in RULE_TIER_META;
