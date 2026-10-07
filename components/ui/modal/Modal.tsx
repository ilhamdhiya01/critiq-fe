"use client";

import React, { useEffect } from "react";
import { createPortal } from "react-dom";

import Button from "../button";
import Icon from "../icon/Icon";

interface ModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const Modal = React.memo(
  ({ isOpen, title, onClose, children, footer }: ModalProps) => {
    useEffect(() => {
      if (!isOpen) return;
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
        <div
          role="dialog"
          aria-modal="true"
          className="flex max-h-[85vh] w-full max-w-[520px] flex-col overflow-hidden rounded-lg border border-border-default bg-raised-alt"
        >
          <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
            <span className="font-mono text-[14px] font-semibold text-text-strong">
              {title}
            </span>
            <Button
              type="button"
              variant="icon"
              size="sm"
              fullWidth={false}
              icon={<Icon icon="TbX" size={16} />}
              onClick={onClose}
            />
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>

          {footer && (
            <div className="flex items-center justify-end gap-2.5 border-t border-border-subtle px-5 py-4">
              {footer}
            </div>
          )}
        </div>
      </div>,
      document.body,
    );
  },
);

Modal.displayName = "Modal";

export default Modal;
