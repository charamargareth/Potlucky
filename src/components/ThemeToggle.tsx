"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="size-9" />;

  const options: { value: string; icon: typeof Sun; label: string }[] = [
    { value: "light", icon: Sun, label: "Light" },
    { value: "dark", icon: Moon, label: "Dark" },
    { value: "system", icon: Monitor, label: "System" },
  ];

  const current = options.find((o) => o.value === theme) ?? options[2];
  const Icon = current.icon;

  function cycle() {
    const idx = options.findIndex((o) => o.value === theme);
    const next = options[(idx + 1) % options.length];
    setTheme(next.value);
  }

  return (
    <button
      onClick={cycle}
      aria-label={`Tema: ${current.label}. Klik untuk ganti.`}
      title={`Tema: ${current.label}`}
      className="size-9 flex items-center justify-center rounded-full text-ink-soft hover:bg-peach hover:text-pink-deep transition-colors"
    >
      <Icon className="size-5" />
    </button>
  );
}