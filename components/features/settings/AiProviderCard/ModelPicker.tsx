import classNames from "classnames";
import React from "react";

import Icon from "@/components/ui/icon/Icon";
import Input from "@/components/ui/input";
import Spinner from "@/components/ui/spinner";
import { AI_MODELS_WARNING_MESSAGE } from "@/const/ai-settings.constant";
import { formatContextWindow } from "@/lib/helpers/ai-settings.helper";
import type { AiModel, AiModelList } from "@/lib/types/ai-settings.types";

const CUSTOM_MODEL_VALUE = "__custom__";

interface ModelPickerProps {
  modelList: AiModelList | undefined;
  isLoading: boolean;
  selectedModel: string;
  isCustom: boolean;
  error?: string;
  onSelectModel: (id: string) => void;
  onSelectCustom: () => void;
  onCustomChange: (value: string) => void;
}

// Native <option> can only hold text, so badges are folded into the label.
const getOptionLabel = (model: AiModel): string =>
  [
    model.label === model.id ? model.id : `${model.label} (${model.id})`,
    model.recommended && "Disarankan",
    model.contextWindow !== null && formatContextWindow(model.contextWindow),
  ]
    .filter(Boolean)
    .join(" · ");

const ModelPicker = React.memo(
  ({
    modelList,
    isLoading,
    selectedModel,
    isCustom,
    error,
    onSelectModel,
    onSelectCustom,
    onCustomChange,
  }: ModelPickerProps) => {
    const models = modelList?.models ?? [];
    const warning = modelList?.source === "catalog" ? modelList.warning : null;
    const value = isCustom ? CUSTOM_MODEL_VALUE : selectedModel;

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (e.target.value === CUSTOM_MODEL_VALUE) {
        onSelectCustom();
        return;
      }
      onSelectModel(e.target.value);
    };

    return (
      <>
        <div className="relative">
          <select
            aria-label="Model"
            value={isLoading ? "" : value}
            onChange={handleChange}
            disabled={isLoading}
            className={classNames(
              "w-full cursor-pointer appearance-none rounded-[7px] border bg-raised py-2.25 pr-9 pl-3 font-mono text-xs text-neutral-100 scheme-dark transition-colors outline-none focus:border-primary-500 disabled:cursor-wait disabled:text-text-secondary",
              error ? "border-danger" : "border-border-default",
            )}
          >
            {isLoading ? (
              <option value="">Memuat daftar model…</option>
            ) : (
              <>
                <option value="" disabled>
                  Pilih model
                </option>
                {models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {getOptionLabel(model)}
                  </option>
                ))}
                <option value={CUSTOM_MODEL_VALUE}>Model lain…</option>
              </>
            )}
          </select>
          {isLoading ? (
            <Spinner
              size={14}
              className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-primary-400"
            />
          ) : (
            <Icon
              icon="TbChevronDown"
              size={14}
              className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-text-muted"
            />
          )}
        </div>

        {isCustom && !isLoading && (
          <Input
            value={selectedModel}
            onChange={(e) => onCustomChange(e.target.value)}
            placeholder="ID model, mis. gpt-4o-mini"
            className="px-3 py-2.25 font-mono text-xs"
          />
        )}

        {warning && (
          <p className="text-[11px] text-text-secondary">
            ⓘ Daftar bawaan —{" "}
            {AI_MODELS_WARNING_MESSAGE[warning.code] ?? warning.message}
          </p>
        )}
      </>
    );
  },
);

ModelPicker.displayName = "ModelPicker";

export default ModelPicker;
