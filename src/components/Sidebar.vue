<script setup lang="ts">
import type { SidebarProps } from '@/components/ui/sidebar'

import {
  AudioWaveform,
  BookMarked,
  Command,
  GalleryVerticalEnd,
  Building2,
  LayoutDashboard,
  Settings,
  Users
} from 'lucide-vue-next'
import NavMain from '@/components/NavMain.vue'
import NavProjects from '@/components/NavBottom.vue'
import NavUser from '@/components/NavUser.vue'
// import TeamSwitcher from '@/components/TeamSwitcher.vue'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'

const props = withDefaults(defineProps<SidebarProps>(), {
  collapsible: 'icon',
})

// This is sample data.
const data = {
  user: {
    name: 'shadcn',
    email: 'm@example.com',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'Acme Inc',
      logo: GalleryVerticalEnd,
      plan: 'Enterprise',
    },
    {
      name: 'Acme Corp.',
      logo: AudioWaveform,
      plan: 'Startup',
    },
    {
      name: 'Evil Corp.',
      logo: Command,
      plan: 'Free',
    },
  ],
  navMain: [
    {
      title: 'Dashboard',
      url: '/',
      icon: LayoutDashboard
    },
    {
      title: 'Facility',
      url: '#',
      icon: Building2,
      items: [
        {
          title: 'Regions',
          url: '/regions',
        },
        
        {
          title: 'Sites',
          url: '#',
        },
        {
          title: 'Zones',
          url: '#',
        },
        {
          title: 'Spaces',
          url: '#',
        },
      ],
    },
    {
      title: 'Systems',
      url: '#',
      icon: Settings,
      items: [
        {
          title: 'Systems',
          url: '#',
        },
        {
          title: 'Models',
          url: '#',
        },
        {
          title: 'Assets',
          url: '#',
        },
      ],
    },
    {
      title: 'Users',
      url: '#',
      icon: Users,
      items: [
        {
          title: 'Users',
          url: '#',
        },
        {
          title: 'Attendance Report',
          url: '#',
        },
        {
          title: 'Usage Report',
          url: '#',
        },
        
       
      ],
    },
  ],
  projects: [
    {
      title: 'Reference',
      url: '#',
      icon: BookMarked,
      items:[
        {
          title:'Vendors',
          url:'/vendors'
        },
        {
          title:'Manufacturers',
          url:"/manufacturers"
        }
      ]
    },
 
  ],
}
</script>

<template>
  <Sidebar v-bind="props">
    <SidebarHeader>
      <!-- <TeamSwitcher :teams="data.teams" />

      <div class="flex justify-center">
          <img src="assets/images/logo.png" alt="Logo" class="pl-4 pr-4"/>
      </div> -->
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" as-child>
            <a href="#" class="flex items-center">
              <div class="flex items-center justify-center ">
                <img 
                  src="@/assets/images/justlogo.png?height=24&width=24" 
                  alt="Logo" 
                  class="size-8 rounded"
                />
              </div>
              <div class="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
                <span class="font-bold text-3xl text-sidebar-foreground/80">site-R</span>
              </div>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
    <SidebarContent>
      <NavMain :items="data.navMain" />
      <NavProjects :items="data.projects" />
    </SidebarContent>
    <SidebarFooter>
      <NavUser :user="data.user" />
    </SidebarFooter>
    <SidebarRail />
  </Sidebar>
</template>
