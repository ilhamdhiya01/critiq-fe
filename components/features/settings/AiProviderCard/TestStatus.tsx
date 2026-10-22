import React from "react";

import Notice from "@/components/ui/notice";
import {
  AI_TEST_ERROR_MESSAGE,
  AI_TEST_RATE_LIMIT_MESSAGE,
  AI_TEST_WARNING_MESSAGE,
} from "@/const/ai-settings.constant";
import { formatDateTime } from "@/lib/helpers/date.helper";
import type { AiTestOutcome } from "@/lib/hooks/ai-settings/useTestAiConnection";
import type { AiLastTest } from "@/lib/types/ai-settings.types";

interface TestStatusProps {
  outcome: AiTestOutcome | null;
  lastTest: AiLastTest | null;
  showSaved: boolean;
}

const formatLatency = (ms: number) => `${ms.toLocaleString("id-ID")} ms`;

const TestStatus = React.memo(
  ({ outcome, lastTest, showSaved }: TestStatusProps) => {
    const result = outcome?.kind === "result" ? outcome.result : null;
    // A fresh result speaks for itself; otherwise the saved last test does
    // (which keeps only the code, not the BE's message).
    const warningCode = result ? result.warning?.code : lastTest?.warning;
    const warningMessage = warningCode
      ? (AI_TEST_WARNING_MESSAGE[warningCode] ?? result?.warning?.message)
      : undefined;

    return (
      <div className="flex min-w-0 flex-1 basis-70 flex-col gap-1.25 wrap-anywhere">
        {outcome?.kind === "rate_limited" && (
          <span className="text-xs leading-normal text-warning-light">
            {AI_TEST_RATE_LIMIT_MESSAGE}
          </span>
        )}
        {result?.ok && (
          <span className="text-xs leading-normal text-success-light">
            ✓ Koneksi berhasil · {formatLatency(result.latencyMs)}
            {result.model && ` · ${result.model}`} · output{" "}
            {result.structuredOutput}
          </span>
        )}
        {result && !result.ok && result.error && (
          <span className="text-xs leading-normal text-danger-light">
            ✗ {AI_TEST_ERROR_MESSAGE[result.error.code] ?? result.error.message}{" "}
            ({result.error.code})
          </span>
        )}
        {warningMessage && (
          <Notice tone="note" icon="TbInfoCircle">
            {warningMessage}
          </Notice>
        )}
        {lastTest && (
          <span className="font-mono text-[11px] text-text-muted">
            Terakhir dites {formatDateTime(lastTest.at)} ·{" "}
            {lastTest.ok ? "OK" : "gagal"} · {formatLatency(lastTest.latencyMs)}
            {lastTest.model && ` · ${lastTest.model}`}
          </span>
        )}
        {showSaved && (
          <span className="text-xs text-success-light">
            ✓ Pengaturan AI tersimpan.
          </span>
        )}
      </div>
    );
  },
);

TestStatus.displayName = "TestStatus";

export default TestStatus;
