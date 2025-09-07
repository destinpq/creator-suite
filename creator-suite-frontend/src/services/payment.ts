import { request } from '@umijs/max';

export interface PaymentRequest {
  amount: number; // Amount in credits
  currency?: string;
  description?: string;
}

export interface PaymentResponse {
  payment_id: string;
  payment_url: string;
  amount: number;
  currency: string;
  status: string;
}

export interface PaymentStatus {
  payment_id: string;
  status: 'created' | 'pending' | 'completed' | 'failed' | 'cancelled';
  amount: number;
  credits_added?: number;
  created_at: string;
  completed_at?: string;
}

export interface CreditTransaction {
  id: string;
  amount: number;
  transaction_type: 'top_up' | 'video_generation' | 'refund' | 'bonus';
  description: string;
  created_at: string;
  payment_id?: string;
}

export const paymentService = {
  /**
   * Create a new payment for credit top-up
   */
  async createTopUpPayment(credits: number, description?: string): Promise<string> {
    const response = await request('/api/v1/payments/create', {
      method: 'POST',
      data: {
        amount: credits,
        description: description || `Top up ${credits} credits`,
      },
    });
    return response.payment_url;
  },

  /**
   * Get payment status
   */
  async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    return request(`/api/v1/payments/${paymentId}/status`);
  },

  /**
   * Get user's payment history
   */
  async getPaymentHistory(page: number = 1, limit: number = 20) {
    return request('/api/v1/payments/history', {
      params: { page, limit },
    });
  },

  /**
   * Get credit transaction history
   */
  async getCreditHistory(page: number = 1, limit: number = 20): Promise<{
    transactions: CreditTransaction[];
    total: number;
    page: number;
    limit: number;
  }> {
    return request('/api/v1/credits/history', {
      params: { page, limit },
    });
  },

  /**
   * Cancel a pending payment
   */
  async cancelPayment(paymentId: string) {
    return request(`/api/v1/payments/${paymentId}/cancel`, {
      method: 'POST',
    });
  },

  /**
   * Get available credit packages
   */
  async getCreditPackages() {
    return request('/api/v1/payments/packages');
  },

  /**
   * Apply a promo code
   */
  async applyPromoCode(code: string) {
    return request('/api/v1/credits/promo', {
      method: 'POST',
      data: { code },
    });
  },

  /**
   * Get current credit balance
   */
  async getCreditBalance(): Promise<number> {
    const response = await request('/api/v1/credits/balance');
    return response.balance;
  },

  /**
   * Request a refund
   */
  async requestRefund(paymentId: string, reason: string) {
    return request(`/api/v1/payments/${paymentId}/refund`, {
      method: 'POST',
      data: { reason },
    });
  },

  /**
   * Get payment methods
   */
  async getPaymentMethods() {
    return request('/api/v1/payments/methods');
  },

  /**
   * Save payment method
   */
  async savePaymentMethod(methodData: any) {
    return request('/api/v1/payments/methods', {
      method: 'POST',
      data: methodData,
    });
  },

  /**
   * Delete payment method
   */
  async deletePaymentMethod(methodId: string) {
    return request(`/api/v1/payments/methods/${methodId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Get invoice for a payment
   */
  async getInvoice(paymentId: string) {
    return request(`/api/v1/payments/${paymentId}/invoice`, {
      responseType: 'blob',
    });
  },

  /**
   * Subscribe to webhook notifications for payment updates
   */
  async subscribeToPaymentUpdates(callback: (payment: PaymentStatus) => void) {
    // This would typically use WebSocket or Server-Sent Events
    // For now, we'll use polling
    const pollInterval = setInterval(async () => {
      try {
        const pendingPayments = await this.getPaymentHistory(1, 5);
        const pending = pendingPayments.payments?.filter((p: any) => p.status === 'pending');
        
        for (const payment of pending || []) {
          const status = await this.getPaymentStatus(payment.payment_id);
          if (status.status !== 'pending') {
            callback(status);
          }
        }
      } catch (error) {
        console.error('Error polling payment status:', error);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(pollInterval);
  },

  /**
   * Verify payment completion
   */
  async verifyPayment(paymentId: string, signature: string) {
    return request(`/api/v1/payments/${paymentId}/verify`, {
      method: 'POST',
      data: { signature },
    });
  },

  /**
   * Get pricing information
   */
  async getPricing() {
    return request('/api/v1/payments/pricing');
  },

  /**
   * Calculate discount for bulk purchase
   */
  async calculateDiscount(credits: number) {
    return request('/api/v1/payments/discount', {
      params: { credits },
    });
  },

  /**
   * Gift credits to another user
   */
  async giftCredits(recipientId: string, credits: number, message?: string) {
    return request('/api/v1/credits/gift', {
      method: 'POST',
      data: {
        recipient_id: recipientId,
        credits,
        message,
      },
    });
  },

  /**
   * Get referral information
   */
  async getReferralInfo() {
    return request('/api/v1/referral/info');
  },

  /**
   * Create referral link
   */
  async createReferralLink() {
    return request('/api/v1/referral/create', {
      method: 'POST',
    });
  }
};
