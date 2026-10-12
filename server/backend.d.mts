export function handle(request: Request): Promise<Response>;
export function transaction<T>(
  fn: (state: Record<string, unknown>) => T,
): Promise<T>;
export function bootstrap(
  email: string,
  name: string,
  password: string,
): Promise<{ id: string; email: string; name: string; role: string }>;
export const config: { id: string; name: string };
