"use client";

import React, { useCallback, useMemo, useState } from "react";

import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Modal from "@/components/ui/modal";
import { MIN_DAILY_TOKEN_BUDGET } from "@/const/ai-settings.constant";
import {
  buildAiSettingsUpdate,
  getSavedFormValues,
  validateAiForm,
} from "@/lib/helpers/ai-settings.helper";
import { useAiModels } from "@/lib/hooks/ai-settings/useAiModels";
import { useTestAiConnection } from "@/lib/hooks/ai-settings/useTestAiConnection";
import { useUpdateAiSettings } from "@/lib/hooks/ai-settings/useUpdateAiSettings";
import type {
  AiFieldErrors,
  AiFormValues,
  AiLocale,
  AiProviderId,
  AiSettingsAdmin,
} from "@/lib/types/ai-settings.types";

import SettingsChip from "../SettingsChip";
import ApiKeyField from "./ApiKeyField";
import ConsentField from "./ConsentField";
import FormRow from "./FormRow";
import LocaleToggle from "./LocaleToggle";
import ModelPicker from "./ModelPicker";
import ProviderPicker from "./ProviderPicker";
import TestStatus from "./TestStatus";

type ConfirmAction = "delete-key" | "revoke-consent";

interface AiProviderFormProps {
  orgId: string;
  settings: AiSettingsAdmin;
}

const AiProviderForm = React.memo(
  ({ orgId, settings }: AiProviderFormProps) => {
    // Only edited fields live here; everything else reads from the saved
    // settings, so a background refetch never wipes unsaved edits.
    const [draft, setDraft] = useState<Partial<AiFormValues>>({});
    const [apiKey, setApiKey] = useState("");
    const [customModelChoice, setCustomModelChoice] = useState<boolean | null>(
      null,
    );
    const [clientErrors, setClientErrors] = useState<AiFieldErrors>({});
    const [showSaved, setShowSaved] = useState(false);
    const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(
      null,
    );
    // Model and base URL last chosen per provider, so switching away and back
    // restores the selection instead of falling back to the default model.
    const [providerMemory, setProviderMemory] = useState<
      Partial<Record<AiProviderId, { model: string; baseUrl: string }>>
    >({});

    const {
      handleUpdateAiSettings,
      isSaving,
      saveFieldErrors,
      clearSaveFieldErrors,
    } = useUpdateAiSettings(orgId);
    const { handleTestAiConnection, isTesting, testOutcome } =
      useTestAiConnection(orgId);

    const values = useMemo<AiFormValues>(
      () => ({ ...getSavedFormValues(settings), ...draft }),
      [settings, draft],
    );

    const option = settings.providers.find(
      (provider) => provider.id === values.provider,
    );
    const credential = values.provider
      ? settings.credentials[values.provider]
      : undefined;
    const hasStoredKey = !!credential?.hasKey;
    const canDeleteKey = hasStoredKey && values.provider === settings.provider;

    const {
      modelList,
      isLoadingModels,
      modelsFieldErrors,
      modelsErrorMessage,
    } = useAiModels(orgId, {
      option,
      apiKey,
      baseUrl: values.baseUrl,
      storedBaseUrl: credential?.baseUrl ?? "",
    });

    // A saved model that the provider no longer lists opens the free-text
    // input automatically.
    const isCustomModel =
      customModelChoice ??
      (!!values.model &&
        !!modelList &&
        !modelList.models.some((model) => model.id === values.model));

    const errors: AiFieldErrors = {
      ...modelsFieldErrors,
      ...saveFieldErrors,
      ...clientErrors,
    };

    const update = useMemo(
      () => buildAiSettingsUpdate(settings, values, apiKey, option),
      [settings, values, apiKey, option],
    );
    const isDirty = Object.keys(update).length > 0;

    const resetFeedback = useCallback(() => {
      setClientErrors({});
      clearSaveFieldErrors();
      setShowSaved(false);
    }, [clearSaveFieldErrors]);

    const updateDraft = useCallback(
      (patch: Partial<AiFormValues>) => {
        setDraft((current) => ({ ...current, ...patch }));
        resetFeedback();
      },
      [resetFeedback],
    );

    const handleSelectProvider = useCallback(
      (id: AiProviderId) => {
        const next = settings.providers.find((provider) => provider.id === id);
        const current = values.provider;
        if (id === current || !next?.available) return;

        if (current) {
          setProviderMemory((memory) => ({
            ...memory,
            [current]: { model: values.model, baseUrl: values.baseUrl },
          }));
        }

        const isSavedProvider = id === settings.provider;
        const remembered = providerMemory[id];

        updateDraft({
          provider: id,
          model:
            remembered?.model ??
            (isSavedProvider ? settings.model : null) ??
            next.defaultModel ??
            "",
          baseUrl:
            remembered?.baseUrl ??
            (isSavedProvider
              ? settings.baseUrl
              : settings.credentials[id]?.baseUrl) ??
            "",
        });
        setApiKey("");
        setCustomModelChoice(null);
      },
      [
        settings,
        values.provider,
        values.model,
        values.baseUrl,
        providerMemory,
        updateDraft,
      ],
    );

    const handleApiKeyChange = useCallback(
      (value: string) => {
        setApiKey(value);
        resetFeedback();
      },
      [resetFeedback],
    );

    const handleSelectModel = useCallback(
      (id: string) => {
        setCustomModelChoice(false);
        updateDraft({ model: id });
      },
      [updateDraft],
    );

    const handleSelectCustomModel = useCallback(
      () => setCustomModelChoice(true),
      [],
    );

    const handleCustomModelChange = useCallback(
      (value: string) => updateDraft({ model: value.trim() }),
      [updateDraft],
    );

    const handleConsentToggle = useCallback(() => {
      if (values.consent && settings.consent.granted) {
        setConfirmAction("revoke-consent");
        return;
      }
      updateDraft({ consent: !values.consent });
    }, [values.consent, settings.consent.granted, updateDraft]);

    const handleLocaleChange = useCallback(
      (locale: AiLocale) => updateDraft({ locale }),
      [updateDraft],
    );

    const handleDeleteKey = useCallback(
      () => setConfirmAction("delete-key"),
      [],
    );

    const handleCloseConfirm = useCallback(() => setConfirmAction(null), []);

    const handleConfirm = async () => {
      if (confirmAction === "revoke-consent") {
        updateDraft({ consent: false });
        setConfirmAction(null);
        return;
      }

      try {
        await handleUpdateAiSettings({ apiKey: "" });
        setApiKey("");
      } catch {
        // Surfaced by the mutation hook (field error or toast).
      } finally {
        setConfirmAction(null);
      }
    };

    const handleTest = () => {
      if (!values.provider) return;
      setShowSaved(false);
      handleTestAiConnection({
        provider: values.provider,
        model: values.model || undefined,
        baseUrl: option?.needsBaseUrl ? values.baseUrl : undefined,
        apiKey: apiKey || undefined,
      });
    };

    const handleSave = async () => {
      const validationErrors = validateAiForm(
        values,
        apiKey,
        option,
        hasStoredKey,
      );
      if (Object.keys(validationErrors).length > 0) {
        setClientErrors(validationErrors);
        return;
      }

      try {
        await handleUpdateAiSettings(update);
        setDraft({});
        setProviderMemory({});
        setApiKey("");
        setCustomModelChoice(null);
        setShowSaved(true);
      } catch {
        // Surfaced by the mutation hook (field error or toast).
      }
    };

    return (
      <>
        <div className="flex flex-col gap-4">
          <FormRow label="Provider" error={errors.provider}>
            <ProviderPicker
              providers={settings.providers}
              selected={values.provider}
              onSelect={handleSelectProvider}
            />
          </FormRow>

          {option && (
            <>
              {option.needsBaseUrl && (
                <FormRow
                  label="Base URL"
                  helper="Endpoint OpenAI-compatible, wajib https://."
                  error={errors.baseUrl}
                >
                  <Input
                    value={values.baseUrl}
                    onChange={(e) =>
                      updateDraft({ baseUrl: e.target.value.trim() })
                    }
                    placeholder="https://gateway.example.com/v1"
                    error={errors.baseUrl}
                    className="px-3 py-2.25 font-mono text-xs"
                  />
                </FormRow>
              )}

              <FormRow
                label="API key"
                helper={
                  option.keyOptional
                    ? "Opsional untuk gateway yang tidak memakai key."
                    : undefined
                }
                error={errors.apiKey}
              >
                <ApiKeyField
                  value={apiKey}
                  credential={credential}
                  isKeyOptional={!!option.keyOptional}
                  canDeleteKey={canDeleteKey}
                  error={errors.apiKey}
                  onChange={handleApiKeyChange}
                  onDeleteKey={handleDeleteKey}
                />
              </FormRow>

              <FormRow
                label="Model"
                error={errors.model ?? modelsErrorMessage ?? undefined}
              >
                <ModelPicker
                  modelList={modelList}
                  isLoading={isLoadingModels}
                  selectedModel={values.model}
                  isCustom={isCustomModel}
                  error={errors.model}
                  onSelectModel={handleSelectModel}
                  onSelectCustom={handleSelectCustomModel}
                  onCustomChange={handleCustomModelChange}
                />
              </FormRow>
            </>
          )}

          <FormRow label="Izin data">
            <ConsentField
              checked={values.consent}
              savedConsent={settings.consent}
              onToggle={handleConsentToggle}
            />
          </FormRow>

          <FormRow label="Bahasa summary">
            <LocaleToggle value={values.locale} onChange={handleLocaleChange} />
          </FormRow>

          <FormRow
            label="Budget token harian"
            helper="Minimal 10.000 token per hari untuk organisasi ini."
            error={errors.dailyTokenBudget}
          >
            <Input
              type="number"
              min={MIN_DAILY_TOKEN_BUDGET}
              step={10_000}
              value={
                Number.isNaN(values.dailyTokenBudget)
                  ? ""
                  : values.dailyTokenBudget
              }
              onChange={(e) =>
                updateDraft({ dailyTokenBudget: e.target.valueAsNumber })
              }
              error={errors.dailyTokenBudget}
              className="max-w-55 px-3 py-2.25 font-mono text-xs"
            />
          </FormRow>

          <div className="grid grid-cols-[140px_1fr] items-center gap-3 text-[12.5px]">
            <span className="text-text-secondary">Review scope</span>
            <span className="flex items-center gap-2 text-neutral-300">
              Critical severity only
              <SettingsChip>MVP</SettingsChip>
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-3.5 border-t border-border-row pt-3.5">
          <TestStatus
            outcome={testOutcome}
            lastTest={settings.lastTest}
            showSaved={showSaved}
          />
          <div className="flex gap-2.5">
            <Button
              type="button"
              variant="secondary"
              size="md"
              fullWidth={false}
              onClick={handleTest}
              disabled={!values.provider || isTesting}
            >
              {isTesting ? "Menguji…" : "Test connection"}
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              fullWidth={false}
              onClick={handleSave}
              disabled={!isDirty || isSaving}
            >
              {isSaving ? "Menyimpan…" : "Simpan"}
            </Button>
          </div>
        </div>

        <Modal
          isOpen={confirmAction !== null}
          title={
            confirmAction === "delete-key" ? "Hapus API key" : "Cabut izin data"
          }
          onClose={handleCloseConfirm}
          footer={
            <>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                fullWidth={false}
                onClick={handleCloseConfirm}
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                fullWidth={false}
                onClick={handleConfirm}
                isLoading={isSaving}
              >
                {confirmAction === "delete-key" ? "Hapus key" : "Cabut izin"}
              </Button>
            </>
          }
        >
          <p className="text-[12.5px] leading-relaxed text-text-secondary">
            {confirmAction === "delete-key"
              ? `Hapus API key ${option?.label ?? ""}? Review AI dengan provider ini akan gagal sampai key baru diisi.`
              : "Cabut izin mengirim diff? Review AI berhenti setelah disimpan; static rules tetap berjalan."}
          </p>
        </Modal>
      </>
    );
  },
);

AiProviderForm.displayName = "AiProviderForm";

export default AiProviderForm;
