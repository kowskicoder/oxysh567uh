import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
class ApiClient {
    constructor() {
        Object.defineProperty(this, "client", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "initData", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ''
        });
        this.client = axios.create({
            baseURL: API_URL,
            timeout: 10000,
        });
        this.client.interceptors.request.use((config) => {
            if (this.initData) {
                config.headers['X-Telegram-Init-Data'] = this.initData;
            }
            return config;
        });
        this.client.interceptors.response.use((response) => response.data, (error) => {
            const message = error.response?.data?.error || error.message || 'An error occurred';
            return Promise.reject(new Error(message));
        });
    }
    setInitData(data) {
        this.initData = data;
    }
    async authenticate(initData) {
        const response = await this.client.post('/api/telegram/mini-app/auth', { initData });
        this.initData = initData;
        return response;
    }
    async getUser() {
        return this.client.get('/api/telegram/mini-app/user');
    }
    async getWallet() {
        return this.client.get('/api/telegram/mini-app/wallet');
    }
    async initiateDeposit(amount) {
        return this.client.post('/api/telegram/mini-app/deposit', { amount });
    }
    async initiateWithdraw(amount) {
        return this.client.post('/api/telegram/mini-app/withdraw', { amount });
    }
    async getEvents(limit = 20, offset = 0, category, status) {
        const params = { limit, offset, ...(category && { category }), ...(status && { status }) };
        return this.client.get('/api/telegram/mini-app/events', { params });
    }
    async getEventDetails(eventId) {
        return this.client.get(`/api/telegram/mini-app/events/${eventId}`);
    }
    async joinEvent(eventId, prediction) {
        return this.client.post(`/api/events/${eventId}/join`, { prediction });
    }
    async leaveEvent(eventId) {
        return this.client.post(`/api/events/${eventId}/leave`);
    }
    async getChallenges() {
        return this.client.get('/api/telegram/mini-app/challenges');
    }
    async createChallenge(data) {
        return this.client.post('/api/telegram/mini-app/challenges/create', data);
    }
    async acceptChallenge(challengeId) {
        return this.client.post(`/api/telegram/mini-app/challenges/${challengeId}/accept`);
    }
    async getStats() {
        return this.client.get('/api/telegram/mini-app/stats');
    }
    async getAchievements() {
        return this.client.get('/api/telegram/mini-app/achievements');
    }
    async getLeaderboard(limit = 50) {
        return this.client.get('/api/telegram/mini-app/leaderboard', { params: { limit } });
    }
    // User discovery & search
    async searchUsers(query) {
        return this.client.get('/api/users/search', { params: { q: query } });
    }
    async getSuggestedUsers() {
        return this.client.get('/api/users/suggestions');
    }
    async getUserProfile(userId) {
        return this.client.get(`/api/users/${userId}/profile`);
    }
}
export const apiClient = new ApiClient();
