import { HTMLAttributes } from "react";

export default function Card({
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`bg-glass border border-pink-soft/70 rounded-3xl shadow-[0_4px_24px_-8px_rgba(224,71,106,0.15)] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
