<script setup lang="ts">
import { Edit, Trash } from 'lucide-vue-next';
import { ref, onMounted } from 'vue';
import { Button } from '@/components/ui/button';
import { Dialog, DialogScrollContent, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import ListItems from '@/components/ListItems.vue';
import RegionForm from '@/components/region/RegionForm.vue';
import axiosInstance from "@/utils/axiosInstance"

const loading = ref(false);
const selectedItem = ref<Region | null>(null);
const isEditDialogOpen = ref(false);
const isDeleteDialogOpen = ref(false);
const regionFormRef = ref();

interface Cluster {
  id?: number;
  name: string;
}

interface Region {
  id: number;
  name: string;
  country: number;
  country_name: string;
  creation_date: string;
  last_update: string;
  clusters: Cluster[];
  clusters_count: number;
}

const regions = ref<Region[]>([]);

const fetchRegions = async () => {
  loading.value = true
  try {
    const response = await axiosInstance.get('/regions/');
    regions.value = response.data;
  } catch (err) {
    console.log('Error fetching regions:', err);
  } finally {
    loading.value = false;
  }
};

function handleAdd() {
  console.log('Add new region clicked')
}

function handleSelect(item: Region) {
  selectedItem.value = item;
}

function handleEdit() {
  if (selectedItem.value) {
    isEditDialogOpen.value = true;
  }
}

const handleEditSuccess = () => {
  isEditDialogOpen.value = false;
  fetchRegions(); // Refresh the list
  // Optionally show success message
  console.log('Region updated successfully!');
};

function handleDelete() {
  if (selectedItem.value) {
    isDeleteDialogOpen.value = true;
  }
}

const confirmDelete = async () => {
  if (!selectedItem.value) return;
  
  try {
    await axiosInstance.delete(`/api/v1/regions/${selectedItem.value.id}/`);
    console.log('Region deleted successfully!');
    
    // Remove from local array
    regions.value = regions.value.filter(region => region.id !== selectedItem.value?.id);
    
    // Clear selection if deleted item was selected
    selectedItem.value = null;
    
    isDeleteDialogOpen.value = false;
    
    // Optionally show success message
  } catch (error) {
    console.error('Error deleting region:', error);
    // Optionally show error message
  }
};

onMounted(() => {
  fetchRegions();
});
</script>

<template>
  <ListItems
    title="Region"
    :items="regions"
    addButtonLabel="New"
    dialogClass="sm:max-w-[800px]"
    @add="handleAdd"
    @select="handleSelect"
    :formComponent="RegionForm"
  >
    <template #item="{ item }">
      <div class="flex items-center justify-between">
        <div class="text-foreground font-semibold">{{ item.name }}</div>
      </div>
      <div class="mt-2 text-sm text-gray-500 ">
        <p>{{ item.country_name }}</p>
        <p>{{ item.clusters_count }} {{ item.clusters_count === 1 ? 'cluster' : 'clusters' }}</p>
      </div>
    </template>

    <template #action>
      <div class="flex p-1.5 justify-end border-b gap-2 border-default bg-background">
        <!-- Edit Dialog -->
        <Dialog v-model:open="isEditDialogOpen">
          <DialogTrigger as-child>
            <Button variant="outline" size="sm" @click="handleEdit" :disabled="!selectedItem">
              <Edit />
              Edit
            </Button>
          </DialogTrigger>
          <DialogScrollContent class="sm:max-w-[800px]">
            <RegionForm 
              ref="regionFormRef"
              :initial-region="selectedItem"
              @success="handleEditSuccess"
            />
          </DialogScrollContent>
        </Dialog>

        <!-- Delete Confirmation Dialog -->
        <Dialog v-model:open="isDeleteDialogOpen">
          <DialogTrigger as-child>
            <Button variant="destructive" size="sm" @click="handleDelete" :disabled="!selectedItem">
              <Trash />
              Delete
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Delete</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete the region "{{ selectedItem?.name }}"? 
                This action cannot be undone and will also delete all associated clusters.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose as-child>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button variant="destructive" @click="confirmDelete">
                Delete Region
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </template>

    <!-- Detail view -->
    <template #detail="{ item }">
      <div class="flex flex-col gap-4 p-6">
        <Accordion type="single" collapsible default-value="details" class="w-full bg-background border rounded-lg">
          <AccordionItem value="details">
            <AccordionTrigger class="text-sm font-semibold p-2">Details</AccordionTrigger>
            <AccordionContent class="border-t">
              <div class="p-4">
                <p class="text-sm text-muted-foreground">Region Name: {{ item.name }}</p>
                <p class="text-sm text-muted-foreground">Country: {{ item.country_name }}</p>
                <p class="text-sm text-muted-foreground">Created: {{ new Date(item.creation_date).toLocaleDateString() }}</p>
                <p class="text-sm text-muted-foreground">Last Updated: {{ new Date(item.last_update).toLocaleDateString() }}</p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Accordion type="single" collapsible class="w-full bg-background border rounded-lg">
          <AccordionItem value="clusters">
            <AccordionTrigger class="text-sm font-semibold p-2">
              Clusters ({{ item.clusters_count }})
            </AccordionTrigger>
            <AccordionContent class="border-t">
              <div class="p-4">
                <div v-if="item.clusters && item.clusters.length > 0" class="space-y-2">
                  <div 
                    v-for="cluster in item.clusters" 
                    :key="cluster.id || cluster.name"
                    class="p-2 bg-gray-50 rounded border"
                  >
                    {{ cluster.name }}
                  </div>
                </div>
                <p v-else class="text-gray-500">No clusters available for this region.</p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </template>
  </ListItems>
</template>