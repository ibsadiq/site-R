<script setup lang="ts">
import { reactive, onMounted, watch } from 'vue'
import { ChevronRight, type LucideIcon } from 'lucide-vue-next'
import { RouterLink, useRoute } from 'vue-router'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar'

const route = useRoute()

const props = defineProps<{
  items: {
    title: string
    url: string
    icon: LucideIcon
    items?: { title: string; url: string }[]
  }[]
}>()

// Controlled open state per top-level item (index-based to avoid duplicate-title issues)
const openMap = reactive<Record<number, boolean>>({})

function initOpenMap() {
  for (let i = 0; i < props.items.length; i++) {
    const item = props.items[i]
    if (item.items?.length) {
      // Only set if not initialized yet (preserves user toggle if already set)
      if (openMap[i] === undefined) {
        openMap[i] = item.items.some(sub => route.path.startsWith(sub.url))
      }
    }
  }
}

onMounted(() => initOpenMap())

// If items change, ensure openMap entries exist
watch(() => props.items, () => initOpenMap(), { deep: true })

// When route changes, ensure parent opens if we're inside that route
watch(
  () => route.path,
  (newPath) => {
    for (let i = 0; i < props.items.length; i++) {
      const item = props.items[i]
      if (item.items?.length) {
        // Open the parent if the current route is inside any of its children
        openMap[i] = item.items.some(sub => newPath.startsWith(sub.url))
      }
    }
  }
)

function isActiveLink(link: string) {
  return route.path === link
}
</script>

<template>
  <SidebarGroup class="group-data-[collapsible=icon]:hidden">
    <SidebarGroupLabel>References</SidebarGroupLabel>
    <SidebarMenu>
      <template v-for="(item, idx) in items" :key="item.title">
        <Collapsible
          v-if="item.items && item.items.length > 0"
          as-child
          v-model:open="openMap[idx]"
          class="group/collapsible"
        >
          <SidebarMenuItem>
            <CollapsibleTrigger as-child>
              <SidebarMenuButton :tooltip="item.title">
                <component :is="item.icon" v-if="item.icon" />
                <span>{{ item.title }}</span>
                <ChevronRight
                  class="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
                />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                <SidebarMenuSubItem
                  v-for="subItem in item.items"
                  :key="subItem.title"
                >
                  <SidebarMenuSubButton as-child :is-active="isActiveLink(subItem.url)">
                    <RouterLink :to="subItem.url">
                      <span>{{ subItem.title }}</span>
                    </RouterLink>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>

        <SidebarMenuItem v-else>
          <SidebarMenuButton as-child :tooltip="item.title" :is-active="isActiveLink(item.url)">
            <RouterLink :to="item.url">
              <component :is="item.icon" v-if="item.icon" />
              <span>{{ item.title }}</span>
            </RouterLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </template>
    </SidebarMenu>
  </SidebarGroup>
</template>