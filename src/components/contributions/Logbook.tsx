"use client";

import Image from "next/image";
import { formatCurrency, formatDateID, getInitials } from "@/lib/utils";
import { NotebookPen, Pencil, Plus, Minus } from "lucide-react";
import type { Contribution } from "@/types/database";

export default function Logbook({
  contributions,
  currentUserId,
  onEditEntry,
}: {
  contributions: Contribution[];
  currentUserId?: string;
  onEditEntry?: (entry: Contribution) => void;
}) {
  if (contributions.length === 0) {
    return (
      <div className="flex flex-col items-center text-center py-12 px-4">
        <NotebookPen className="size-9 text-pink-soft mb-3" />
        <p className="text-ink-soft text-sm">
          Logbook masih kosong. Catatan tabungan pertama akan muncul di sini.
        </p>
      </div>
    );
  }

  const grouped = new Map<string, Contribution[]>();
  for (const c of contributions) {
    const key = c.contributed_on;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(c);
  }
  const sortedDates = Array.from(grouped.keys()).sort((a, b) => b.localeCompare(a));

  return (
    <div className="relative">
      <div className="absolute left-[15px] top-2 bottom-2 w-px bg-pink-soft" />
      <ul className="flex flex-col gap-6">
        {sortedDates.map((date) => {
          const entries = grouped.get(date)!;
          const deposits = entries.filter((e) => e.type !== "withdrawal");
          const withdrawals = entries.filter((e) => e.type === "withdrawal");
          const dayNet =
            deposits.reduce((s, e) => s + Number(e.amount), 0) -
            withdrawals.reduce((s, e) => s + Number(e.amount), 0);

          return (
            <li key={date} className="relative pl-9">
              <div className="absolute left-0 top-0.5 size-[31px] rounded-full bg-pink-strong border-4 border-cream flex items-center justify-center">
                <span className="size-2 rounded-full bg-white" />
              </div>
              <div className="flex items-baseline justify-between mb-2">
                <span className="font-semibold text-ink text-sm">{formatDateID(date)}</span>
                <span className={`text-xs font-semibold ${dayNet >= 0 ? "text-mint" : "text-amber"}`}>
                  {dayNet >= 0 ? "+" : ""}{formatCurrency(dayNet)}
                </span>
              </div>
              <ul className="flex flex-col gap-2">
                {entries.map((entry) => {
                  const isWithdrawal = entry.type === "withdrawal";
                  return (
                    <li
                      key={entry.id}
                      className={`flex items-center gap-3 border rounded-xl px-3.5 py-2.5 ${
                        isWithdrawal
                          ? "bg-amber-soft/40 border-amber/30"
                          : "bg-glass border-pink-soft/60"
                      }`}
                    >
                      {/* Avatar / type icon */}
                      <div className="relative shrink-0">
                        {entry.profile?.avatar_url ? (
                          <Image
                            src={entry.profile.avatar_url}
                            alt=""
                            width={28}
                            height={28}
                            className="size-7 rounded-full object-cover"
                          />
                        ) : (
                          <div className="size-7 rounded-full bg-pink-soft flex items-center justify-center text-[10px] font-semibold text-pink-deep">
                            {getInitials(entry.profile?.full_name)}
                          </div>
                        )}
                        <div className={`absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full flex items-center justify-center ${isWithdrawal ? "bg-amber" : "bg-mint"}`}>
                          {isWithdrawal
                            ? <Minus className="size-2 text-white" />
                            : <Plus className="size-2 text-white" />
                          }
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-ink font-medium truncate">
                          {entry.profile?.full_name ?? "Anggota"}
                          {isWithdrawal && (
                            <span className="ml-1.5 text-[10px] font-semibold text-amber bg-amber-soft px-1.5 py-0.5 rounded-full">
                              dipakai
                            </span>
                          )}
                        </p>
                        {entry.note && (
                          <p className="text-xs text-ink-soft truncate">{entry.note}</p>
                        )}
                      </div>

                      <span className={`text-sm font-semibold shrink-0 ${isWithdrawal ? "text-amber" : "text-mint"}`}>
                        {isWithdrawal ? "-" : "+"}{formatCurrency(Number(entry.amount))}
                      </span>

                      {onEditEntry && entry.user_id === currentUserId && (
                        <button
                          onClick={() => onEditEntry(entry)}
                          aria-label="Edit catatan"
                          className="shrink-0 size-6 flex items-center justify-center rounded-full text-ink-soft hover:bg-peach hover:text-pink-deep transition-colors"
                        >
                          <Pencil className="size-3" />
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        })}
      </ul>
    </div>
  );
}