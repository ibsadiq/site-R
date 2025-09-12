<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore} from "@/stores/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const email = ref('')
const password = ref('')
const auth = useAuthStore()
const router = useRouter()

const isLoading = ref(false)
const errorMessage = ref('')

async function handleLogin() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    await auth.login({email: email.value, password: password.value})
    await router.push('/') // or wherever you want to redirect
  } catch (error: any) {
    errorMessage.value = 'Invalid email or password'
  } finally {
    isLoading.value = false
  }
}

</script>


<template>
<div class="w-full min-h-screen lg:grid lg:grid-cols-3">
    <div class="flex items-center justify-center py-12">
      <div class="mx-auto grid w-[350px] gap-6">
        <div class="grid gap-2 text-center">
          <h1 class="text-3xl font-bold">
            Login
          </h1>
          <p class="text-balance text-muted-foreground">
            Enter your email below to login to your account
          </p>
        </div>
        <form @submit.prevent="handleLogin" class="grid gap-4">
  <div class="grid gap-2">
    <Label for="email">Email</Label>
    <Input
      id="email"
      type="email"
      placeholder="m@example.com"
      required
      v-model="email"
    />
  </div>
  <div class="grid gap-2">
    <div class="flex items-center">
      <Label for="password">Password</Label>
      <a
        href="/forgot-password"
        class="ml-auto inline-block text-sm underline"
      >
        Forgot your password?
      </a>
    </div>
    <Input id="password" type="password" required v-model="password" />
  </div>

  <Button type="submit" class="w-full" :disabled="isLoading">
    <span v-if="isLoading">Logging in...</span>
    <span v-else>Login</span>
  </Button>

  <Button variant="outline" class="w-full" type="button">
    Login with Google
  </Button>

  <p v-if="errorMessage" class="text-sm text-red-500 text-center">
    {{ errorMessage }}
  </p>
        </form>

        <div class="mt-4 text-center text-sm">
          Don't have an account?
          <a href="#" class="underline">
            Sign up
          </a>
        </div>
      </div>
    </div>
    <div class="hidden bg-muted lg:col-span-2 lg:block">
      <!-- <img
        src="https://placehold.co/600x400@2x.png"
        alt="Image"
        width="1920"
        height="1080"
        class="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
      > -->
      <div class="flex h-full bg-muted items-center justify-center">
        
      </div>
    </div>
  </div>
</template>
