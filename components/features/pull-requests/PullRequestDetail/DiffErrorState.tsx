import React from "react";

import GitHubAccessNotice from "@/components/shared/github-access-notice";
import StateStatus from "@/components/shared/state-status";
import { isGitHubAccessError } from "@/lib/helpers/integration.helper";

interface DiffErrorStateProps {
  errorCode: string | null;
}

const DiffErrorState = React.memo(({ errorCode }: DiffErrorStateProps) =>
  isGitHubAccessError(errorCode) ? (
    <GitHubAccessNotice />
  ) : (
    <StateStatus
      title="Gagal memuat diff"
      description="Terjadi kesalahan saat mengambil perubahan file. Coba muat ulang halaman."
    />
  ),
);

DiffErrorState.displayName = "DiffErrorState";

export default DiffErrorState;
