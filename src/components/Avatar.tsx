/* eslint-disable @next/next/no-img-element -- URLs de Supabase y vistas previas locales, acotadas por el servidor. */
export function Avatar({
  name,
  src,
  className = "h-10 w-10",
}: {
  name: string;
  src?: string | null;
  className?: string;
}) {
  return (
    <span
      className={
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent font-bold text-accent-ink " +
        className
      }
    >
      {src ? (
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        name.charAt(0).toUpperCase()
      )}
    </span>
  );
}
