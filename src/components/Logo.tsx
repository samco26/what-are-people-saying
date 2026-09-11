import { sourceInfo, type SourceId } from "@/lib/types";

/* A platform's mark, from public/logos. Decorative wherever the platform's
   name is printed beside it, which is everywhere it is used, so alt is
   empty and the name carries the meaning. */
export function Logo({ id, size = 18 }: { id: SourceId; size?: number }) {
  const s = sourceInfo(id);
  return (
    <img
      src={s.logo}
      alt=""
      width={size}
      height={size}
      style={{ width: size, height: size, objectFit: "contain", flex: "0 0 auto" }}
    />
  );
}
