<script setup lang="ts">
import { PlusCircleIcon, Settings2 } from 'lucide-vue-next'
import { Dialog, DialogScrollContent, DialogTrigger } from '@/components/ui/dialog'
import { ref, shallowRef, computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from "@/components/ui/scroll-area"

interface Props {
  title: string
  items: any[]
  addButtonLabel?: string
  showSettings?: boolean
  dialogClass?: string
  formComponent: any
  loading?: boolean
  selectedItem?: any
  icon?:any
}

const page = ref(1);
const itemsPerPage = 10;

const paginatedItems = computed(() => {
  const start = (page.value - 1) * itemsPerPage;
  return props.items.slice(start, start + itemsPerPage);
});

const startIndex = computed(() => (page.value - 1) * itemsPerPage);
const endIndex = computed(() => Math.min(startIndex.value + itemsPerPage, props.items.length));

const props = withDefaults(defineProps<Props>(), {
  addButtonLabel: 'Add',
  showSettings: true,
  loading: false,
  selectedItem: null
})
const formComponent = shallowRef(props.formComponent)

const emit = defineEmits<{
  (e: 'add', component: any): void
  (e: 'settings'): void
  (e: 'select', item: any): void
  (e: 'refresh'): void
}>()

const selectItem = (item: any) => {
  emit('select', item)
}

const isDialogOpen = ref(false)

const handleFormSuccess = () => {
  isDialogOpen.value = false
  emit('refresh')
}

const previousPage = () => {
  if (page.value > 1) {
    page.value--
  }
}

const nextPage = () => {
  if (endIndex.value < props.items.length) {
    page.value++
  }
}
</script>

<template>
  <!-- Main container with fixed height -->
  <div class="flex flex-col h-full max-h-full">
    <div class="flex flex-grow min-h-0">
      <!-- Left sidebar with fixed width -->
      <div class="w-[300px] flex flex-col border-r bg-background min-h-0">
        <!-- Header - fixed, no scroll -->
        <div class="flex items-center justify-between p-1 border-b border-default flex-shrink-0">
          <Settings2 
            v-if="showSettings" 
            class="cursor-pointer" 
            @click="emit('settings')" 
          />

          <Dialog v-model:open="isDialogOpen">
            <DialogTrigger as-child>
              <Button class="text-sm" @click="emit('add', formComponent)" :disabled="loading">
                <PlusCircleIcon />
                {{ addButtonLabel }}
              </Button>
            </DialogTrigger>
            <DialogScrollContent :class="dialogClass" @interact-outside="(event) => event.preventDefault()">
              <component :is="formComponent" @success="handleFormSuccess" />
            </DialogScrollContent>
          </Dialog>
        </div>
 
        <!-- Scrollable content area -->
        <div class="flex-1 min-h-0">
          <template v-if="loading">
            <div class="p-4 space-y-4">
              <div v-for="n in 5" :key="n">
                <Skeleton class="h-4 w-3/4 mb-2" />
                <Skeleton class="h-4 w-1/2" />
              </div>
            </div>
          </template>

          <template v-else>
            <template v-if="props.items.length === 0">
              <div class="flex flex-col items-center justify-center h-full text-center p-8">
                <div class="text-gray-400 mb-4">
                  <PlusCircleIcon class="w-12 h-12 mx-auto mb-3" />
                </div>
                <h3 class="text-lg font-semibold text-gray-600 mb-2">No {{ title.toLowerCase() }} yet</h3>
                <p class="text-gray-500 mb-6">Get started by adding your first {{ title.toLowerCase() }}</p>
              </div>
            </template>
          <template v-else>
            <ScrollArea class="h-full">
              <div class="divide-y">
                <div
                  v-for="item in paginatedItems"
                  :key="item.id"
                  @click="selectItem(item)"
                  class="p-4 sm:px-6 text-sm cursor-pointer border-l-2 transition-colors"
                  :class="{
                    'text-highlighted border-primary bg-primary/10': props.selectedItem?.id === item.id,
                    'text-muted-foreground hover:bg-accent/50': props.selectedItem?.id !== item.id
                  }"
                >
                  <slot name="item" :item="item">
                    {{ item.name }}
                  </slot>
                </div>
                <!-- Bottom spacing -->
                <div class="h-[100px]"></div>
              </div>
            </ScrollArea>
          </template>
          </template>
        
        </div>

        <!-- Footer - fixed, no scroll -->
        <div v-if="props.items.length > 0"
          class="border-t bg-gray-50 dark:bg-gray-800 w-full p-2 text-center text-sm text-gray-500 shadow flex-shrink-0"> 
          <p>Showing {{ startIndex + 1 }} to {{ endIndex }} of {{ props.items.length }}</p>
          <div v-if="props.items.length > itemsPerPage" class="flex justify-center gap-4 mt-2">
            <Button variant="ghost" class="text-sm h-8 focus:outline-none" @click="previousPage" :disabled="page === 1">
              Previous
            </Button>
            <Button variant="ghost" class="text-sm h-8 focus:outline-none" @click="nextPage" :disabled="endIndex >= props.items.length">
              Next
            </Button>
          </div>
        </div>
      </div>

      <!-- Right detail panel -->
      <div class="flex-1 flex flex-col min-h-0">
        <template v-if="props.selectedItem">
          <!-- Action bar - fixed, no scroll -->
          <div class="flex-shrink-0">
            <slot name="action" :selectedItem="props.selectedItem" :onRefresh="() => emit('refresh')" />
          </div>
          
          <!-- Scrollable detail content -->
          <div class="flex-1 min-h-0">
            <ScrollArea class="h-full">
              <slot name="detail" :item="props.selectedItem">
                <div class="p-4">
                  <h2 class="text-xl font-bold">{{ props.selectedItem.name }}</h2>
                  <slot :item="props.selectedItem" />
                </div>
              </slot>
            </ScrollArea>
          </div>
        </template>
        
        <template v-else>
          <div class="flex flex-col items-center justify-center h-full text-center p-8">
            <div class="text-gray-400 mb-2">
              <icon class="w-12 h-12 mx-auto" />
            </div>
            <div class="text-gray-500 mb-6">
              Select  {{ title.toLowerCase() }} to view details
            </div>
          </div>
        </template>
      </div>
    </div>  
  </div>
</template>