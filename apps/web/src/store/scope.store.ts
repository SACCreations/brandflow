'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ScopeCustomer {
  id: string;
  name: string;
}

export interface ScopeProject {
  id: string;
  name: string;
  customerId?: string | null;
}

export interface ScopeBrand {
  id: string;
  name: string;
}

interface ScopeState {
  customer: ScopeCustomer | null;
  project: ScopeProject | null;
  brand: ScopeBrand | null;

  setCustomer: (customer: ScopeCustomer | null) => void;
  setProject: (project: ScopeProject | null) => void;
  setBrand: (brand: ScopeBrand | null) => void;
  clearScope: () => void;

  /** Returns query params object for API calls based on current scope */
  scopeParams: () => Record<string, string>;
}

export const useScopeStore = create<ScopeState>()(
  persist(
    (set, get) => ({
      customer: null,
      project: null,
      brand: null,

      setCustomer: (customer) =>
        set({ customer, project: null, brand: null }),

      setProject: (project) =>
        set({ project, brand: null }),

      setBrand: (brand) =>
        set({ brand }),

      clearScope: () =>
        set({ customer: null, project: null, brand: null }),

      scopeParams: () => {
        const { customer, project, brand } = get();
        const params: Record<string, string> = {};
        if (customer) params.customerId = customer.id;
        if (project) params.projectId = project.id;
        if (brand) params.brandId = brand.id;
        return params;
      },
    }),
    {
      name: 'brandflow-scope',
      partialize: (state) => ({
        customer: state.customer,
        project: state.project,
        brand: state.brand,
      }),
    },
  ),
);
