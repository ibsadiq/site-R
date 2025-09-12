import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import RegionView from '@/views/RegionView.vue'
import SiteView from '@/views/SiteView.vue'
import VendorView from '@/views/VendorView.vue'
import ManufacturerView from '@/views/ManufacturerView.vue'
import ZoneView from '@/views/ZoneView.vue'
import { useAuthStore } from '@/stores/auth'
import SystemView from '@/views/SystemView.vue'
 // Adjust the path as necessary

const routes = [
  {
    path: "/login", 
    name: "Login", 
    component: LoginView, 
    meta: { layout: 'auth', requiresAuth: false }
  },
  { 
    path: "/", 
    name: "Home", 
    component: HomeView, 
    meta: { requiresAuth: true }
  },
  {
    path: "/regions",
    name: "Regions & Clusters",
    component: RegionView,
    meta: { requiresAuth: true }
  },
  {
    path: "/sites",
    name: "Sites",
    component: SiteView,
    meta: { requiresAuth: true }
  },
   {
    path: "/zones",
    name: "Zones & Spaces",
    component: ZoneView,
    meta: { requiresAuth: true }
  },
  {
    path: "/vendors",
    name: "Vendors",
    component: VendorView,
    meta: { requiresAuth: true }
  },
  {
    path: "/manufacturers",
    name: "Manufacturers",
    component: ManufacturerView,
    meta: { requiresAuth: true }
  },
  {
    path: "/systems",
    name: "Systems",
    component: SystemView,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Navigation guard for protected routes
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore() // Move this inside the guard
  
  // Check if route requires authentication
  if (to.meta.requiresAuth) {
    if (!authStore.isAuthenticated) {
      // Redirect to login if not authenticated
      next({
        name: 'Login',
        query: { redirect: to.fullPath }
      })
      return
    }
    
    // Verify token is still valid
    const isValid = await authStore.verifyToken()
    if (!isValid) {
      // Try to refresh token
      const refreshed = await authStore.refreshAccessToken()
      if (!refreshed) {
        // Redirect to login if refresh failed
        next({
          name: 'Login',
          query: { redirect: to.fullPath }
        })
        return
      }
    }
  }
  
  // Redirect authenticated users away from login
  if (to.name === 'Login' && authStore.isAuthenticated) {
    const redirectPath = to.query.redirect || '/'
    next({ path: typeof redirectPath === 'string' ? redirectPath : '/' })
    return
  }
  
  next()
})

export default router;