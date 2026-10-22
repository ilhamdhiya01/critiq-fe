import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import type { AiCredentialStatus } from "@/lib/types/ai-settings.types";

import ApiKeyField from "../ApiKeyField";

const renderField = (
  props: Partial<{
    value: string;
    credential: AiCredentialStatus | undefined;
    isKeyOptional: boolean;
    canDeleteKey: boolean;
    keyFormat: string;
  }> = {},
) => {
  const onChange = vi.fn();
  const onDeleteKey = vi.fn();
  render(
    <ApiKeyField
      value={props.value ?? ""}
      credential={props.credential}
      isKeyOptional={props.isKeyOptional ?? false}
      canDeleteKey={props.canDeleteKey ?? false}
      keyFormat={props.keyFormat}
      onChange={onChange}
      onDeleteKey={onDeleteKey}
    />,
  );
  return { onChange, onDeleteKey };
};

describe("ApiKeyField", () => {
  it("keeps a stored key and offers to replace or delete it", () => {
    const { onDeleteKey } = renderField({
      credential: { hasKey: true, last4: "9xyz" },
      canDeleteKey: true,
    });

    expect(screen.getByText("Key tersimpan · …9xyz")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Tersimpan (…9xyz) — isi untuk mengganti"),
    ).toHaveValue("");

    fireEvent.click(screen.getByRole("button", { name: "Hapus key" }));
    expect(onDeleteKey).toHaveBeenCalledTimes(1);
  });

  it("hides Hapus key when the stored key belongs to an unsaved provider", () => {
    renderField({
      credential: { hasKey: true, last4: "9xyz" },
      canDeleteKey: false,
    });

    expect(screen.getByText("Key tersimpan · …9xyz")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("asks for a key when none is stored", () => {
    const { onChange } = renderField();

    expect(
      screen.getByText("Belum ada key untuk provider ini"),
    ).toBeInTheDocument();
    const input = screen.getByPlaceholderText("Tempel API key");
    expect(input).toHaveAttribute("type", "password");

    fireEvent.change(input, { target: { value: "sk-123" } });
    expect(onChange).toHaveBeenCalledWith("sk-123");
  });

  it("hints the provider's key format while no key is stored", () => {
    renderField({ keyFormat: "AIza…" });

    expect(screen.getByPlaceholderText("AIza…")).toBeInTheDocument();
  });

  it("marks the key optional for gateways that don't need one", () => {
    renderField({ isKeyOptional: true });

    expect(screen.getByPlaceholderText("Opsional")).toBeInTheDocument();
  });
});
