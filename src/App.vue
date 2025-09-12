<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router';
import { onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import AuthLayout from '@/layouts/AuthLayout.vue';
import DefaultLayout from './layouts/DefaultLayout.vue';

const route = useRoute();
const auth = useAuthStore();

onMounted(async () => {
    // Initialize authentication state
    auth.initializeAuth();
    
    // If user appears to be authenticated, verify and fetch user info
    if (auth.accessToken && auth.refreshToken) {
        const isValid = await auth.verifyToken();
        if (isValid && !auth.user) {
            await auth.fetchUserInfo();
        }
    }
});
</script>

<template>
    <div v-if="route.meta.layout === 'auth'">
        <AuthLayout>
            <RouterView />
        </AuthLayout>
    </div>
    <div v-else>
        <DefaultLayout>
            <RouterView />
        </DefaultLayout>
    </div>
</template> s