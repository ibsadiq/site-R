<template>
    <div v-if="route.meta.layout ==='auth'">
        <AuthLayout>
            <RouterView />
        </AuthLayout>
    </div>
    <div v-else>
        <DefaultLayout>
            <RouterView />
        </DefaultLayout>
    </div>
</template>
<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router';
const route = useRoute();
import AuthLayout from '@/layouts/AuthLayout.vue';
import DefaultLayout from './layouts/DefaultLayout.vue';
import { onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();

onMounted(() => {
    if (auth.isAuthenticated) {
        console.log('User is authenticated');
        auth.fetchUserInfo();
    }
});
</script>