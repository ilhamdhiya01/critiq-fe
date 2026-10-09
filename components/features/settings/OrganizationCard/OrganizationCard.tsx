"use client";

import { useParams } from "next/navigation";
import React from "react";

import Badge from "@/components/ui/badge";
import { useOrgBySlug } from "@/lib/hooks/organisation/useOrgBySlug";

import OrganizationCardSkeleton from "./OrganizationCardSkeleton";

const getOrgInitials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");

const OrganizationCard = React.memo(() => {
  const params = useParams<{ slug: string }>();
  const { membership, isLoading, isError } = useOrgBySlug(params.slug);

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
      <div className="grid grid-cols-[140px_1fr] items-center gap-y-3 text-[12.5px]">
        <span className="text-text-secondary">Name</span>
        <span className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary-500/20 font-mono text-[11px] font-bold text-primary-300">
            {getOrgInitials(organization.name)}
          </span>
          <span className="font-semibold text-neutral-100">
            {organization.name}
          </span>
        </span>

        <span className="text-text-secondary">URL</span>
        <span className="font-mono text-neutral-100">
          critiq.app/{organization.slug}
        </span>

        <span className="text-text-secondary">Your role</span>
        <span className="flex items-center gap-2.5">
          <Badge tone="primary">{role}</Badge>
          <span className="text-text-faint">
            roles are per organization — you may hold a different one elsewhere
          </span>
        </span>
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
