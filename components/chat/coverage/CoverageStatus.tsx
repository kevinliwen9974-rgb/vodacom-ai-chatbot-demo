"use client";

type Props = {
  label: string;
  available: boolean;
};

export function CoverageStatus({ label, available }: Props) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="flex items-center gap-2">
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            available ? "bg-[#3d8c00]" : "bg-[#c45c26]"
          }`}
          aria-hidden
        />
        <span className="text-sm font-semibold">{label}</span>
      </div>
      <span
        className={`text-xs font-semibold ${
          available ? "text-[#2f6d00]" : "text-[#9a4a1c]"
        }`}
      >
        {available ? "Available" : "Unavailable"}
      </span>
    </div>
  );
}
