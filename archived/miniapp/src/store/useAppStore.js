import { create } from 'zustand';
export const useAppStore = create((set) => ({
    user: null,
    setUser: (user) => set({ user, isAuthenticated: !!user }),
    updateBalance: (amount) => set((state) => ({
        user: state.user ? { ...state.user, balance: state.user.balance + amount } : null,
    })),
    isAuthenticated: false,
    setAuthenticated: (value) => set({ isAuthenticated: value }),
    activeTab: 'wallet',
    setActiveTab: (tab) => set({ activeTab: tab }),
}));
