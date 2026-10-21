import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { SEARCH_LIMIT, SEARCH_STALE_MS } from "@/const/search.constant";
import { isSearchableQuery } from "@/lib/helpers/search.helper";
import { getGlobalSearch } from "@/services/search.service";

import { searchKeys } from "./queryKeys";

// `query` should already be debounced. Never calls the BE for an empty (or
// too long) query; the previous results stay while the next ones load.
export const useGlobalSearch = (orgId: string | undefined, query: string) => {
  const q = query.trim();

  return useQuery({
    queryKey: searchKeys.query(orgId ?? "", q),
    queryFn: ({ signal }) =>
      getGlobalSearch(orgId as string, q, { limit: SEARCH_LIMIT, signal }),
    select: (response) => response.data,
    enabled: !!orgId && isSearchableQuery(q),
    staleTime: SEARCH_STALE_MS,
    placeholderData: keepPreviousData,
    retry: false,
  });
};
