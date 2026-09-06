"use client";

import React from "react";

import Input from "@/components/ui/input";

import StepCard from "../StepCard";

interface OrganizationStepProps {
  orgName: string;
  onOrgNameChange: (value: string) => void;
  footer?: React.ReactNode;
}

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const OrganizationStep = React.memo(
  ({ orgName, onOrgNameChange, footer }: OrganizationStepProps) => {
    const slug = slugify(orgName) || "your-org";

    return (
      <StepCard
        title="Name your organization"
        description="This will be the name of your organization in Critiq. You are its Admin. Rename it anytime."
        footer={footer}
      >
        <Input
          value={orgName}
          onChange={(e) => onOrgNameChange(e.target.value)}
          placeholder="e.g. Cititex Engineering"
          autoFocus
        />
        <div className="flex items-center gap-2 font-mono text-[11.5px]">
          <span className="text-text-muted">URL</span>
          <span className="text-primary-400">critiq.app/{slug}</span>
        </div>
        <div className="flex gap-2.5 rounded-[7px] border border-primary-800 bg-primary-950 px-3.5 py-3">
          <span className="text-[12px] leading-[1.55] text-neutral-300">
            You are the{" "}
            <span className="font-semibold text-neutral-50">Admin</span> of this
            organization. Repositories, members and policies stay inside it —
            invite teammates later from Settings → Members.
          </span>
        </div>
      </StepCard>
    );
  },
);

OrganizationStep.displayName = "OrganizationStep";

export default OrganizationStep;
