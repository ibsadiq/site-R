<script setup lang="ts">
import AppSidebar from '@/components/Sidebar.vue'
import { Separator } from '@/components/ui/separator'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { ref, onMounted } from 'vue'
import { Moon, Sun, Languages, Bell, X } from 'lucide-vue-next'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

const isDark = ref(false)

const toggleDarkMode = () => {
  isDark.value = !isDark.value
  if (isDark.value) {
    document.documentElement.classList.add('dark')
    localStorage.setItem('theme', 'dark')
  } else {
    document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', 'light')
  }
}

const currentLanguage = ref('en')
const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' }
]

const switchLanguage = (langCode: string) => {
  currentLanguage.value = langCode
  localStorage.setItem('language', langCode)
  // Here you would typically integrate with your i18n library
  console.log(`Switched to language: ${langCode}`)
}

const notificationCount = ref(3)
const showNotifications = ref(false)

const toggleNotifications = () => {
  showNotifications.value = !showNotifications.value
}

const closeNotifications = () => {
  showNotifications.value = false
}

const clearNotifications = () => {
  notificationCount.value = 0
  // Optionally: clear actual notifications list
  closeNotifications()
}

onMounted(() => {
  // Initialize dark mode
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    isDark.value = true
    document.documentElement.classList.add('dark')
  }
  
  // Initialize language
  const savedLanguage = localStorage.getItem('language')
  if (savedLanguage) {
    currentLanguage.value = savedLanguage
  }
})
</script>

<template>
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset>
      <header
        class="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b border-default"
      >
        <div class="flex items-center gap-2 px-4">
          <SidebarTrigger class="-ml-1" />
          <Separator orientation="vertical" class="mr-2 h-4" />
          <h3 class="text-lg font-semibold">
            <!-- Display the current route title or name -->
          </h3>
        </div>
        
        <div class="flex items-center gap-2 ml-auto px-4">
          <!-- Notifications -->
          <div class="relative">
            <button
              @click="toggleNotifications"
              class="relative inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10"
            >
              <Bell class="h-4 w-4" />
              <span v-if="notificationCount > 0" class="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                {{ notificationCount > 9 ? '9+' : notificationCount }}
              </span>
              <span class="sr-only">View notifications</span>
            </button>
            
            <!-- Notification dropdown -->
            <div
              v-if="showNotifications"
              class="absolute right-0 top-full mt-1 w-80 rounded-md border bg-popover p-1 text-popover-foreground shadow-md z-50"
            >
              <div class="flex items-center justify-between px-3 py-2 border-b">
                <h4 class="font-semibold">Notifications</h4>
                <button @click="closeNotifications" class="p-1 rounded hover:bg-accent">
                  <X class="h-4 w-4" />
                </button>
              </div>
              <div class="max-h-64 overflow-y-auto">
                <div class="p-3 hover:bg-accent rounded-sm cursor-pointer">
                  <p class="text-sm font-medium">New message received</p>
                  <p class="text-xs text-muted-foreground">2 minutes ago</p>
                </div>
                <div class="p-3 hover:bg-accent rounded-sm cursor-pointer">
                  <p class="text-sm font-medium">System update available</p>
                  <p class="text-xs text-muted-foreground">1 hour ago</p>
                </div>
                <div class="p-3 hover:bg-accent rounded-sm cursor-pointer">
                  <p class="text-sm font-medium">Task completed successfully</p>
                  <p class="text-xs text-muted-foreground">3 hours ago</p>
                </div>
              </div>
              <div class="flex items-center justify-between px-3 py-2 border-t">
                <button class="text-sm text-primary hover:underline">View all</button>
                <button @click="clearNotifications" class="text-sm text-red-500 hover:underline">Clear all</button>
              </div>
            </div>
          </div>

          <!-- Language Switcher using Popover -->
          <Popover>
            <PopoverTrigger as-child>
              <button
                class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10"
              >
                <Languages class="h-4 w-4" />
                <span class="sr-only">Switch language</span>
              </button>
            </PopoverTrigger>
            <PopoverContent class="w-48 p-1">
              <button
                v-for="lang in languages"
                :key="lang.code"
                @click="switchLanguage(lang.code)"
                class="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                :class="{ 'bg-accent text-accent-foreground': currentLanguage === lang.code }"
              >
                {{ lang.name }}
                <span v-if="currentLanguage === lang.code" class="ml-auto">✓</span>
              </button>
            </PopoverContent>
          </Popover>

          <!-- Dark Mode Toggle -->
          <button
            @click="toggleDarkMode"
            class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10"
          >
            <Sun v-if="isDark" class="h-4 w-4" />
            <Moon v-else class="h-4 w-4" />
            <span class="sr-only">Toggle theme</span>
          </button>
        </div>
      </header>

      <!-- Page content will render here -->
      <div class="flex flex-1 flex-col gap-4 pt-0 bg-green-50/50 dark:bg-green-950/20">
        <slot />
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>
