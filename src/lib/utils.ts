export function cn(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(" ");
}

export function formatPrice(value: number, mode: "buy" | "rent") {
  if (mode === "rent") {
    return `$${value.toLocaleString()}/mo`;
  }

  return `$${value.toLocaleString()}`;
}

export function formatCompactPrice(value: number) {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(value >= 10000000 ? 1 : 2)}M`;
  }

  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }

  return `$${value}`;
}
