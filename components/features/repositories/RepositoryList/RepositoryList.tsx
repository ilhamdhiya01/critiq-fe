"use client";

import classNames from "classnames";
import React, { useCallback } from "react";

import StateStatus from "@/components/shared/state-status";
import Button from "@/components/ui/button";
import { useDisconnectRepository } from "@/lib/hooks/repositories/useDisconnectRepository";
import { useRepositoryList } from "@/lib/hooks/repositories/useRepositoryList";
import { useRescanRepository } from "@/lib/hooks/repositories/useRescanRepository";
import type { Repository } from "@/lib/types/repository.types";

const RepositoryList = React.memo(() => {
  const { data: repositories, isLoading, isError } = useRepositoryList();
  const { handleDisconnectRepository } = useDisconnectRepository();
  const { handleRescanRepository } = useRescanRepository();

  const handleDisconnect = useCallback(
    (repo: Repository) => {
      handleDisconnectRepository(repo.id);
    },
    [handleDisconnectRepository],
  );

  const handleRescan = useCallback(
    (repo: Repository) => {
      handleRescanRepository(repo.id);
    },
    [handleRescanRepository],
  );

  if (isError) {
    return (
      <StateStatus
        title="Gagal memuat repositori"
        description="Terjadi kesalahan saat mengambil data. Coba muat ulang halaman."
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-16 animate-pulse rounded-lg border border-border-default bg-surface"
          />
        ))}
      </div>
    );
  }

  if (!repositories || repositories.length === 0) {
    return (
      <StateStatus
        title="Belum ada repositori terhubung"
        description="Hubungkan repositori untuk mulai memindai pull request."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {repositories.map((repo) => (
        <RepositoryRow
          key={repo.id}
          repository={repo}
          onDisconnect={handleDisconnect}
          onRescan={handleRescan}
        />
      ))}
    </div>
  );
});

RepositoryList.displayName = "RepositoryList";

interface RepositoryRowProps {
  repository: Repository;
  onDisconnect: (repo: Repository) => void;
  onRescan: (repo: Repository) => void;
}

const RepositoryRow = React.memo(
  ({ repository, onDisconnect, onRescan }: RepositoryRowProps) => {
    return (
      <div className="flex items-center justify-between rounded-lg border border-border-default bg-surface px-4 py-3">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-sm font-semibold text-neutral-50">
            {repository.name}
          </span>
          <span className="text-xs text-text-secondary">
            {repository.language}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={classNames(
              "rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold uppercase",
              {
                "bg-success/10 text-success":
                  repository.qualityGate === "PASSED",
                "bg-danger/10 text-danger": repository.qualityGate === "FAILED",
                "bg-text-muted/10 text-text-muted":
                  repository.qualityGate === null,
              },
            )}
          >
            {repository.qualityGate ?? "NO SCANS"}
          </span>

          <Button
            variant="provider"
            className="px-3 py-1.5 text-xs"
            onClick={() => onRescan(repository)}
            disabled={repository.scanStatus === "scanning"}
          >
            {repository.scanStatus === "scanning" ? "Scanning…" : "Re-scan"}
          </Button>

          <Button
            variant="provider"
            className="px-3 py-1.5 text-xs text-danger"
            onClick={() => onDisconnect(repository)}
          >
            Disconnect
          </Button>
        </div>
      </div>
    );
  },
);

RepositoryRow.displayName = "RepositoryRow";

export default RepositoryList;
