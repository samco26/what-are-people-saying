import { sourceInfo, type SourceId } from "@/lib/types";

/* Decorative mark; each containing control or section supplies an accessible name. */
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
