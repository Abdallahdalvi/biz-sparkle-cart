import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getAdminProductSourceLabels } from "@/lib/admin.functions";

export function useAdminProductSources(token: string | undefined, slugs: string[]) {
  const getLabels = useServerFn(getAdminProductSourceLabels);
  const [loaded, setLoaded] = useState<{
    key: string;
    labels: Record<string, string | null>;
  }>();
  const key = JSON.stringify(slugs);
  useEffect(() => {
    const requested: string[] = JSON.parse(key);
    if (!token || !requested.length) return;
    let active = true;
    void getLabels({ data: { token, slugs: requested } })
      .then((labels) => {
        if (active) setLoaded({ key, labels });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [key, token, getLabels]);
  return token && loaded?.key === key ? loaded.labels : undefined;
}
