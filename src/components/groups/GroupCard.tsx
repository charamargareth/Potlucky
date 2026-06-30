import Link from "next/link";
import Card from "@/components/ui/Card";
import { formatCurrencyShort } from "@/lib/utils";
import { Users, CheckCircle2 } from "lucide-react";
import type { GroupWithStats } from "@/types/database";

const periodLabelMap = {
  daily: "Harian",
  weekly: "Mingguan",
  monthly: "Bulanan",
};

export default function GroupCard({ group }: { group: GroupWithStats }) {
  const pct = Math.min(100, Math.round(group.progress_pct));

  return (
    <Link href={`/groups/${group.id}`}>
      <Card className="p-5 hover:border-pink-strong/60 transition-colors cursor-pointer h-full flex flex-col">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-display text-lg text-ink leading-tight">
              {group.name}
            </h3>
            <span className="text-xs text-ink-soft">
              Target {periodLabelMap[group.period_type]}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-ink-soft bg-peach px-2.5 py-1 rounded-full">
            <Users className="size-3.5" />
            {group.member_count}
          </div>
        </div>

        <div className="mt-auto">
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="font-semibold text-ink text-[15px]">
              {formatCurrencyShort(group.total_saved)}
            </span>
            <span className="text-xs text-ink-soft">
              dari {formatCurrencyShort(group.target_amount)}
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-peach overflow-hidden">
            <div
              className="h-full rounded-full bg-pink-strong transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>

          {group.members_contributed_today > 0 && (
            <div className="flex items-center gap-1.5 mt-3 text-xs text-mint font-medium">
              <CheckCircle2 className="size-3.5" />
              {group.members_contributed_today} orang sudah nabung hari ini
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}
