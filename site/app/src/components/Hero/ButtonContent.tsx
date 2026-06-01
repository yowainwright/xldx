import type { ReactNode } from "react";

interface ButtonContentProps {
  label: string;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
}

export function ButtonContent({
  label,
  icon,
  iconPosition = "right",
}: ButtonContentProps) {
  return (
    <>
      {icon && iconPosition === "left" && icon}
      {label}
      {icon && iconPosition === "right" && icon}
    </>
  );
}
