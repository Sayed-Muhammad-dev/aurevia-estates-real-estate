import { Button } from "@/components/ui/button";

export function StateCard({
  title,
  description,
  actionLabel,
  actionHref,
  action,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  action?: () => void;
}) {
  return (
    <div className="rounded-[2rem] border border-dashed border-line bg-panel/70 p-10 text-center">
      <h3 className="font-display text-3xl text-foreground">{title}</h3>
      <p className="mx-auto mt-3 max-w-xl text-muted">{description}</p>
      {actionLabel ? (
        <div className="mt-6">
          <Button href={actionHref} onClick={action} variant="secondary">
            {actionLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
