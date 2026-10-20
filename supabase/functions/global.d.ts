// Ambient type definitions for Supabase Edge Functions / Deno environment
// Ensures TypeScript Language Server in IDEs recognizes Deno globals and URL imports

declare namespace Deno {
  export interface Env {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
    delete(key: string): void;
    toObject(): Record<string, string>;
  }
  export const env: Env;
  export function serve(handler: (req: Request) => Response | Promise<Response>): void;
}

declare module "https://deno.land/std*" {
  export function serve(handler: (req: Request) => Response | Promise<Response>): void;
}

declare module "https://esm.sh/*" {
  export * from "@supabase/supabase-js";
  const content: any;
  export default content;
}

