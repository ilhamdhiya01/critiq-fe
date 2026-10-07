import React from "react";

const ORGANIZATION = {
  name: "Cititex Engineering",
  slug: "cititex-engineering",
  myRole: "ADMIN",
  memberCount: 5,
};

const OrganizationCard = React.memo(() => {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border-subtle bg-surface p-5">
      <span className="font-mono text-[13px] font-semibold text-text-strong">
        Organization
      </span>

      <div className="grid grid-cols-[140px_1fr] items-center gap-y-3 text-[12.5px]">
        <span className="text-text-secondary">Name</span>
        <span className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary-500/20 font-mono text-[11px] font-bold text-primary-300">
            {ORGANIZATION.name.charAt(0)}
            {ORGANIZATION.name.split(" ")[1]?.charAt(0) ?? ""}
          </span>
          <span className="font-semibold text-neutral-100">
            {ORGANIZATION.name}
          </span>
        </span>

        <span className="text-text-secondary">URL</span>
        <span className="font-mono text-neutral-100">
          critiq.app/{ORGANIZATION.slug}
        </span>

        <span className="text-text-secondary">Your role</span>
        <span className="flex items-center gap-2.5">
          <span className="rounded-full border border-primary-500/45 bg-primary-500/12 px-2.5 py-0.5 font-mono text-[10.5px] font-semibold text-primary-300">
            {ORGANIZATION.myRole}
          </span>
          <span className="text-text-faint">
            roles are per organization — you may hold a different one elsewhere
          </span>
        </span>

        <span className="text-text-secondary">Members</span>
        <span className="text-neutral-100">{ORGANIZATION.memberCount}</span>
      </div>

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
