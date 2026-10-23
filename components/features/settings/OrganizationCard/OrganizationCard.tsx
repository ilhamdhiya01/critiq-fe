"use client";

import React from "react";

import DetailRow from "@/components/shared/detail-row";
import Badge from "@/components/ui/badge";
import { useActiveOrg } from "@/lib/hooks/organisation/useActiveOrg";
import { useAppHost } from "@/lib/hooks/useAppHost";
import { ROUTES } from "@/routes";

import OrganizationCardSkeleton from "./OrganizationCardSkeleton";

const getOrgInitials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");

const OrganizationCard = React.memo(() => {
  const { membership, isLoading, isError } = useActiveOrg();
  const appHost = useAppHost();

  const renderBody = () => {
    if (isError) {
      return (
        <p className="text-[12.5px] text-danger-light">
          Gagal memuat data organisasi. Coba muat ulang halaman.
        </p>
      );
    }
    if (isLoading) return <OrganizationCardSkeleton />;
    if (!membership) {
      return (
        <p className="text-[12.5px] text-text-secondary">
          Organisasi tidak ditemukan.
        </p>
      );
    }

    const { organization, role } = membership;

    return (
      <div className="flex flex-col gap-3">
        <DetailRow label="Name">
          <span className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary-500/20 font-mono text-[11px] font-bold text-primary-300">
              {getOrgInitials(organization.name)}
            </span>
            <span className="min-w-0 font-semibold wrap-anywhere text-neutral-100">
              {organization.name}
            </span>
          </span>
        </DetailRow>

        <DetailRow label="URL">
          <span className="font-mono wrap-anywhere text-neutral-100">
            {appHost}
            {ROUTES.dashboard(organization.slug)}
          </span>
        </DetailRow>

        <DetailRow label="Your role">
          <span className="flex items-center gap-2.5">
            <Badge tone="primary">{role}</Badge>
            <span className="text-text-faint">
              roles are per organization — you may hold a different one
              elsewhere
            </span>
          </span>
        </DetailRow>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border-subtle bg-surface p-5">
      <span className="font-mono text-[13px] font-semibold text-text-strong">
        Organization
      </span>

      {renderBody()}

      <p className="border-t border-border-row pt-3 text-[11.5px] text-text-faint">
        Connected repositories, GitLab instances, members, branch policies and
        the audit log all belong to this organization and are never visible to
        other organizations on Critiq.
      </p>
    </div>
  );
});

OrganizationCard.displayName = "OrganizationCard";

export default OrganizationCard;
