<script setup lang="ts">
import { Edit, Trash } from 'lucide-vue-next';
import { ref } from 'vue';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import ListItems from '@/components/ListItems.vue';


const regions = ref([
  { id: 1, name: 'North America', description: 'Includes US and Canada' },
  { id: 2, name: 'Europe', description: 'EU countries' },
  { id: 3, name: 'Africa', description:'All African Countries'},
])


function handleAdd() {
  console.log('Add new region clicked')
}

</script>

<template>
  <ListItems
    title="Region"
    :items="regions"
    addButtonLabel="New"
    @add="handleAdd"
    @select="console.log('Selected:', $event)"
  >
    <template #item="{ item }">
      <div class="text-foreground font-semibold">{{ item.name }}</div>
      <div class="text-xs text-muted-foreground">{{ item.description }}</div>
    </template>

    <template #action>
      <div class="flex p-1.5 justify-end border-b gap-2 border-default bg-background">
          <Button variant="outline" size="sm">
            <Edit />
            Edit
          </Button>
          <Button variant="destructive"size="sm">
            <Trash />
            Delete
          </Button>
      </div>
    </template>

    <!-- Detail view -->
    <template #detail="{ item }">
      <!-- <div class="p-6">
        <h2 class="text-2xl font-bold mb-4">{{ item.name }}</h2>
        <p>{{ item.description }}</p>
        
      </div>  -->
      <div class="flex flex-col gap-4 p-6">
        
        <Accordion type="single" collapsible default-value="details" class="w-full bg-background border rounded-lg">
          <AccordionItem value="details">
            <AccordionTrigger class="text-sm font-semibold p-2">Details</AccordionTrigger>
            <AccordionContent class="border-t">
                <div class="p-4">
                  <p class="text-sm text-muted-foreground">Region Name: {{ item.name }}</p>
                  <p class="text-sm text-muted-foreground">Description: {{ item.description }}</p>
                </div>
              
             
            </AccordionContent>
          </AccordionItem>
          
        </Accordion>

        <Accordion type="single" collapsible class="w-full bg-background border rounded-lg">
          <AccordionItem value="clusters">
            <AccordionTrigger class="text-sm font-semibold p-2">Clusters</AccordionTrigger>
            <AccordionContent class="border-t">
              <div class="p-4">
                <p>No clusters available for this region.</p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

      </div>
    </template>
    
  </ListItems>
</template>