import { apiClient } from './apiClient';

let dashboardInflight: Promise<any> | null = null;

/** Coalesce concurrent /progress/dashboard requests into one in-flight call. */
export function fetchDashboardOnce() {
  if (!dashboardInflight) {
    dashboardInflight = apiClient.get('/progress/dashboard').finally(() => {
      dashboardInflight = null;
    });
  }
  return dashboardInflight;
}
