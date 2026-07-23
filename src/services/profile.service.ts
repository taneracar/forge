import { mockDashboard } from "@/mock/user";

export async function getDashboard() {
  return Promise.resolve(mockDashboard);
}
