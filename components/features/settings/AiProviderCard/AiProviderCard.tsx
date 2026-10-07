"use client";

import classNames from "classnames";
import React, { useCallback, useState } from "react";

import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Modal from "@/components/ui/modal";

const MASKED_API_KEY = "sk-ant-••••••••••••••••••4Kd2";

type ProviderId = "anthropic" | "openai" | "google" | "self-hosted";

const PROVIDERS: {
  id: ProviderId;
  name: string;
  description: string;
}[] = [
  {
    id: "anthropic",
    name: "Anthropic · Claude",
    description: "Strongest code reasoning · recommended",
  },
  {
    id: "openai",
    name: "OpenAI · GPT",
    description: "Broad ecosystem, fast responses",
  },
  {
    id: "google",
    name: "Google · Gemini",
    description: "Large context window for big diffs",
  },
  {
    id: "self-hosted",
    name: "Self-hosted · vLLM",
    description: "Diffs never leave your VPC",
  },
];

const MODELS = ["claude-sonnet-4-5", "claude-haiku-4-5"];
const CURRENT_PROVIDER: ProviderId = "anthropic";

const AiProviderCard = React.memo(() => {
  const [isRotating, setIsRotating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] =
    useState<ProviderId>(CURRENT_PROVIDER);
  const [selectedModel, setSelectedModel] = useState(MODELS[0]);

  const handleRotate = useCallback(() => {
    setIsRotating(true);
    setTimeout(() => setIsRotating(false), 800);
  }, []);

  const handleOpenModal = useCallback(() => setIsModalOpen(true), []);
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedProvider(CURRENT_PROVIDER);
    setSelectedModel(MODELS[0]);
  }, []);
  const handleSaveProvider = useCallback(() => setIsModalOpen(false), []);

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border-subtle bg-surface p-5">
      <span className="font-mono text-[13px] font-semibold text-text-strong">
        AI Provider
      </span>

      <div className="grid grid-cols-[140px_1fr] items-center gap-y-3 text-[12.5px]">
        <span className="text-text-secondary">Provider</span>
        <span className="flex items-center gap-2.5">
          <span className="rounded-full border border-primary-500/45 bg-primary-500/12 px-2.5 py-0.5 font-mono text-[10.5px] font-semibold text-primary-300">
            Anthropic · Claude
          </span>
          <button
            type="button"
            onClick={handleOpenModal}
            className="cursor-pointer text-[11.5px] text-info hover:underline"
          >
            change
          </button>
        </span>

        <span className="text-text-secondary">Model</span>
        <span className="font-mono text-neutral-100">claude-sonnet-4-5</span>

        <span className="text-text-secondary">API key</span>
        <span className="flex items-center gap-2.5">
          <Input
            readOnly
            value={MASKED_API_KEY}
            className="font-mono text-xs text-neutral-100"
          />
          <Button
            type="button"
            variant="secondary"
            size="md"
            fullWidth={false}
            onClick={handleRotate}
            disabled={isRotating}
            className="shrink-0 font-mono"
          >
            {isRotating ? "Rotating…" : "Rotate"}
          </Button>
        </span>

        <span className="text-text-secondary">Review scope</span>
        <span className="flex items-center gap-2">
          <span className="text-neutral-100">Critical severity only</span>
          <span className="rounded-full border border-border-default bg-raised px-2 py-0.5 font-mono text-[10px] text-text-secondary">
            MVP
          </span>
        </span>
      </div>

      <Modal
        isOpen={isModalOpen}
        title="Change AI Provider"
        onClose={handleCloseModal}
        footer={
          <>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              fullWidth={false}
              onClick={handleCloseModal}
              className="font-mono"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              fullWidth={false}
              onClick={handleSaveProvider}
            >
              Save Provider
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col overflow-hidden rounded-lg border border-border-default">
            {PROVIDERS.map((provider) => (
              <button
                key={provider.id}
                type="button"
                onClick={() => setSelectedProvider(provider.id)}
                className={classNames(
                  "flex cursor-pointer items-center justify-between gap-3 border-b border-border-row px-4 py-3 text-left last:border-b-0",
                  selectedProvider === provider.id
                    ? "bg-primary-500/12"
                    : "hover:bg-raised",
                )}
              >
                <span className="flex items-center gap-3">
                  <span
                    className={classNames(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2",
                      selectedProvider === provider.id
                        ? "border-primary-400"
                        : "border-border-default",
                    )}
                  >
                    {selectedProvider === provider.id && (
                      <span className="h-1.5 w-1.5 rounded-full bg-primary-400" />
                    )}
                  </span>
                  <span className="flex flex-col gap-0.5">
                    <span className="text-[13px] font-semibold text-neutral-100">
                      {provider.name}
                    </span>
                    <span className="text-[11.5px] text-text-faint">
                      {provider.description}
                    </span>
                  </span>
                </span>
                {provider.id === CURRENT_PROVIDER && (
                  <span className="shrink-0 rounded-full border border-border-default px-2 py-0.5 font-mono text-[10px] text-text-secondary">
                    CURRENT
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[10.5px] tracking-[.06em] text-text-muted uppercase">
              Model
            </span>
            <div className="flex gap-2">
              {MODELS.map((model) => (
                <button
                  key={model}
                  type="button"
                  onClick={() => setSelectedModel(model)}
                  className={classNames(
                    "cursor-pointer rounded-md border px-3 py-1.5 font-mono text-[11.5px]",
                    selectedModel === model
                      ? "border-primary-500/45 bg-primary-500/12 text-primary-300"
                      : "border-border-default text-text-secondary hover:bg-raised",
                  )}
                >
                  {model}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[10.5px] tracking-[.06em] text-text-muted uppercase">
              API Key
            </span>
            <Input
              placeholder="leave blank to keep current key"
              className="font-mono text-[12px]"
            />
            <span className="text-[11px] text-text-faint">
              From console.anthropic.com — stored encrypted, never logged.
            </span>
          </div>

          <p className="text-[11.5px] text-text-faint">
            Switching providers only changes who runs the AI analysis.
            Static-analysis scanning, branch policies and manual approval are
            unaffected.
          </p>
        </div>
      </Modal>
    </div>
  );
});

AiProviderCard.displayName = "AiProviderCard";

export default AiProviderCard;
