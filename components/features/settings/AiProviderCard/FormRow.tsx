import React from "react";

import FieldError from "@/components/ui/field-error";

interface FormRowProps {
  label: string;
  helper?: React.ReactNode;
  error?: string;
  children: React.ReactNode;
}

const FormRow = React.memo(
  ({ label, helper, error, children }: FormRowProps) => {
    return (
      <div className="flex flex-wrap items-start gap-3">
        <span className="w-35 flex-none pt-2 text-[12.5px] text-text-secondary">
          {label}
        </span>
        <div className="flex min-w-0 flex-1 basis-80 flex-col gap-2">
          {children}
          {helper && <p className="text-[11px] text-text-muted">{helper}</p>}
          {error && <FieldError withIcon={false}>{error}</FieldError>}
        </div>
      </div>
    );
  },
);

FormRow.displayName = "FormRow";

export default FormRow;
