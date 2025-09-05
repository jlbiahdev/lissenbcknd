import React from "react";
import clsx from "clsx";

/**
 * IconButton
 * - Conserve la même API qu’avant : { onClick, title, ariaLabel, children, className }
 * - Ajoute les props optionnelles: disabled, type, onKeyDown
 */
export default function IconButton({
  onClick,
  title,
  ariaLabel,
  children,
  className = "",
  disabled = false,
  type = "button",
  onKeyDown,
}) {
  return (
    <button
      type={type}
      className={clsx("icon-btn", className)}
      onClick={onClick}
      title={title}
      aria-label={ariaLabel || title}
      disabled={disabled}
      onKeyDown={onKeyDown}
    >
      {children}
    </button>
  );
}
