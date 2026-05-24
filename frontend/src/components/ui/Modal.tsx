/**
 * MODAL - Enterprise Shared Component
 */

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description?: React.ReactNode;
    titleIcon?: React.ReactNode;
    children: React.ReactNode;
    footer?: React.ReactNode;
    size?: "sm" | "md" | "lg" | "xl";
    panelClassName?: string;
    headerClassName?: string;
    bodyClassName?: string;
    footerClassName?: string;
    hideHeader?: boolean;
    hideFooter?: boolean;
    /** Disable closing on backdrop click */
    persistent?: boolean;
    /** Sticky alert or message below the header */
    stickyAlert?: React.ReactNode;
}

const sizeClasses: Record<NonNullable<ModalProps["size"]>, string> = {
    sm: "modal-panel--sm",
    md: "modal-panel--md",
    lg: "modal-panel--lg",
    xl: "modal-panel--xl",
};

export function Modal({
    isOpen,
    onClose,
    title,
    description,
    titleIcon,
    children,
    footer,
    size = "md",
    panelClassName = "",
    headerClassName = "",
    bodyClassName = "",
    footerClassName = "",
    hideHeader = false,
    hideFooter = false,
    persistent = false,
    stickyAlert,
}: ModalProps) {
    const panelRef = useRef<HTMLDivElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const previousFocusRef = useRef<HTMLElement | null>(null);
    const titleId = useId();

    useEffect(() => {
        if (!isOpen) return;

        previousFocusRef.current =
            document.activeElement instanceof HTMLElement ? document.activeElement : null;

        const selector =
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

        const focusTimeout = setTimeout(() => {
            const focusables = panelRef.current?.querySelectorAll<HTMLElement>(selector);
            const initialFocusTarget = focusables?.[0] ?? closeButtonRef.current ?? panelRef.current;
            initialFocusTarget?.focus();
        }, 10);

        return () => {
            clearTimeout(focusTimeout);
            previousFocusRef.current?.focus();
        };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        const selector =
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

        const handleKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                if (!persistent) {
                    event.preventDefault();
                    onClose();
                }
                return;
            }

            if (event.key !== "Tab" || !panelRef.current) {
                return;
            }

            const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(selector));

            if (!nodes.length) {
                event.preventDefault();
                panelRef.current.focus();
                return;
            }

            const first = nodes[0];
            const last = nodes[nodes.length - 1];
            const active = document.activeElement;

            if (event.shiftKey) {
                if (active === first || !panelRef.current.contains(active)) {
                    event.preventDefault();
                    last.focus();
                }
                return;
            }

            if (active === last || !panelRef.current.contains(active)) {
                event.preventDefault();
                first.focus();
            }
        };

        document.addEventListener("keydown", handleKey, true);
        return () => {
            document.removeEventListener("keydown", handleKey, true);
        };
    }, [isOpen, onClose, persistent]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        className="modal-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={persistent ? undefined : onClose}
                        aria-hidden="true"
                    />

                    <div className="modal-positioner" role="dialog" aria-modal="true" aria-labelledby={titleId}>
                        <motion.div
                            ref={panelRef}
                            className={`modal-panel ${sizeClasses[size]} ${panelClassName}`.trim()}
                            tabIndex={-1}
                            initial={{ opacity: 0, scale: 0.95, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.97, y: 4 }}
                            transition={{
                                duration: 0.22,
                                ease: [0.16, 1, 0.3, 1],
                            }}
                        >
                            {hideHeader ? <h2 id={titleId} className="sr-only">{title}</h2> : null}

                            {!hideHeader && (
                                <>
                                    <div className={`modal-header ${headerClassName}`.trim()}>
                                        <div className="modal-header__meta">
                                            {titleIcon ? <div className="modal-title-icon">{titleIcon}</div> : null}
                                            <div className="modal-header__copy">
                                                <h2 id={titleId} className="modal-title">{title}</h2>
                                                {description ? <p className="modal-description">{description}</p> : null}
                                            </div>
                                        </div>
                                        <motion.button
                                            ref={closeButtonRef}
                                            className="modal-close-btn"
                                            onClick={persistent ? undefined : onClose}
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.95 }}
                                            aria-label="إغلاق"
                                            disabled={persistent}
                                        >
                                            <X className="w-4 h-4" />
                                        </motion.button>
                                    </div>
                                    <div className="modal-divider" />
                                </>
                            )}

                            {stickyAlert && (
                                <div className="modal-sticky-alert">
                                    {stickyAlert}
                                </div>
                            )}

                            <div className={`modal-body ${bodyClassName}`.trim()}>{children}</div>

                            {!hideFooter && footer && (
                                <>
                                    <div className="modal-divider" />
                                    <div className={`modal-footer ${footerClassName}`.trim()}>{footer}</div>
                                </>
                            )}
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}

export default Modal;
