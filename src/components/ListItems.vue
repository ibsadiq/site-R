<script setup lang="ts">
import { PlusCircleIcon, Settings2 } from 'lucide-vue-next'
import { ref } from 'vue'
import { Button } from '@/components/ui/button'

interface Props {
  title: string
  items: any[] // Replace 'any' with your specific item type
  addButtonLabel?: string
  showSettings?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  addButtonLabel: 'Add',
  showSettings: true
})

const emit = defineEmits<{
  (e: 'add'): void
  (e: 'settings'): void
  (e: 'select', item: any): void
}>()

const selectedItem = ref<any>(null)
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="flex flex-grow overflow-hidden">
      <!-- List Section -->
      <div class="w-[300px] flex flex-col border-r bg-background">
        <!-- Header -->
        <div class="flex items-center justify-between p-1 border-b border-default">
          <Settings2 
            v-if="showSettings" 
            class="cursor-pointer" 
            @click="emit('settings')" 
          />

          <Button class="text-sm" @click="emit('add')">
            <PlusCircleIcon />
            {{ addButtonLabel }} {{ title }}
          </Button> 
        </div>
        
        <!-- Items List -->
        <div class="overflow-y-auto divide-y">
          <div
            v-for="item in items"
            :key="item.id"
            @click="selectedItem = item; emit('select', item)"
            class="p-4 sm:px-6 text-sm cursor-pointer border-l-2 transition-colors"
            :class="{
              'text-highlighted border-primary bg-primary/10': selectedItem?.id === item.id,
              'text-muted-foreground hover:bg-accent/50': selectedItem?.id !== item.id
            }"
          >
            <slot name="item" :item="item">
              {{ item.name }} <!-- Default display if no slot provided -->
            </slot>
          </div>
        </div>
      </div>

      <!-- Detail Section -->
    
      <div class="flex-1 overflow-y-auto">
        
        <template v-if="selectedItem">
    
          <slot name="action"/>
          
          <slot name="detail" :item="selectedItem">
            <div class="p-4">
              <h2 class="text-xl font-bold">{{ selectedItem.name }}</h2>
              <slot :item="selectedItem" />
            </div>
          </slot>
        </template>
        <template v-else>
          <div class="flex items-center justify-center h-full text-gray-500">
            Select an item to view details
          </div>
        </template>


      </div>
    </div>  
  </div>
</template>