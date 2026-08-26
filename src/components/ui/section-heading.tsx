export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
}: {
  eyebrow: string;
  title: string;
  description: string;
  align?: "left" | "center";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <p className="text-sm font-medium uppercase tracking-[0.3em] text-accent">{eyebrow}</p>
      <h2 className="mt-3 font-display text-4xl leading-tight text-foreground md:text-5xl">
        {title}
      </h2>
      <p className="mt-4 text-base leading-7 text-muted md:text-lg">{description}</p>
    </div>
  );
}
