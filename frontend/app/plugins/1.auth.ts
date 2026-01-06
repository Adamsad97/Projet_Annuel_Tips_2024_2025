export default defineNuxtPlugin({
  name: 'auth-init',
  parallel: false,
  async setup() {
    const authStore = useAuthStore();

    if (!import.meta.client) return;
    if (authStore.isInitialized) return;

    await authStore.initializeAuth();
  },
});
