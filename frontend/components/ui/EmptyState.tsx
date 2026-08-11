"use client";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && (
        <div className="mb-4 p-3 rounded-full bg-zinc-800/60 text-zinc-500">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-semibold text-zinc-300 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-zinc-500 max-w-xs">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
