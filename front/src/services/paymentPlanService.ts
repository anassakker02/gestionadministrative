import { apiRequest } from "@/lib/api";

export interface PaymentPlan {
  id: string;
  name: string;
  anneeScolaire: string;
  installments: Array<{
    percentage: number;
    dueDateOffsetMonths: number;
    description: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

export const paymentPlanService = {
  getPaymentPlanById: async (id: string) => {
    const res = await apiRequest(`/payment-plans/${id}`, "GET");
    return res.data as PaymentPlan;
  },

  getAllPaymentPlans: async () => {
    const res = await apiRequest("/payment-plans", "GET");
    return res.data as PaymentPlan[];
  },

  createPaymentPlan: async (plan: Omit<PaymentPlan, 'id' | 'createdAt' | 'updatedAt'>) => {
    const res = await apiRequest("/payment-plans", "POST", plan);
    return res.data as PaymentPlan;
  },

  updatePaymentPlan: async (id: string, plan: Partial<PaymentPlan>) => {
    const res = await apiRequest(`/payment-plans/${id}`, "PUT", plan);
    return res.data as PaymentPlan;
  },

  deletePaymentPlan: async (id: string) => {
    await apiRequest(`/payment-plans/${id}`, "DELETE");
    return { status: true };
  },
};
