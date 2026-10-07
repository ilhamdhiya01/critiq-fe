import React from "react";

import Checkbox from "@/components/ui/checkbox";
import { formatDateTime } from "@/lib/helpers/date.helper";
import type { AiConsent } from "@/lib/types/ai-settings.types";

interface ConsentFieldProps {
  checked: boolean;
  savedConsent: AiConsent;
  onToggle: () => void;
}

const ConsentField = React.memo(
  ({ checked, savedConsent, onToggle }: ConsentFieldProps) => {
    return (
      <>
        <label className="flex cursor-pointer items-start gap-2.5 select-none">
          <Checkbox
            variant="primary"
            checked={checked}
            onChange={onToggle}
            className="mt-px"
          />
          <span className="flex flex-col gap-1">
            <span className="text-[12.5px] text-text-strong">
              Izinkan mengirim isi diff ke provider AI yang dipilih
            </span>
            <span className="text-[11.5px] leading-normal text-text-faint">
              Diff kode PR dikirim ke pihak ketiga (provider di atas) untuk
              dianalisis. Tanpa izin ini, hanya static rules yang berjalan.
            </span>
          </span>
        </label>
        {checked && savedConsent.granted && (
          <span className="pl-6.5 text-[11px] text-text-muted">
            Diaktifkan oleh {savedConsent.by.name} pada{" "}
            {formatDateTime(savedConsent.at)}
          </span>
        )}
      </>
    );
  },
);

ConsentField.displayName = "ConsentField";

export default ConsentField;
