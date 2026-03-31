import { createLoader, parseAsInteger } from 'nuqs/server'

export const dashboardSearchParams = {
  week: parseAsInteger.withDefault(0),
}

export const loadDashboardSearchParams = createLoader(dashboardSearchParams)
