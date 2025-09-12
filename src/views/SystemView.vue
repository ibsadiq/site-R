<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Edit, Trash, Loader2, Eye, Building2, Box, Cog, Blocks} from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogScrollContent, DialogTrigger, DialogContent,
  DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose
} from '@/components/ui/dialog';
import ListItems from '@/components/ListItems.vue';
import axiosInstance from "@/utils/axiosInstance"
import {formatDate} from '@/utils/formatDate';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import SystemForm from '@/components/system/SystemForm.vue';

interface Asset {
  id: number;
  name: string;
  asset_tag: string;
  model_name: string;
  is_in_service: boolean;
  status: string;
  space_name?: string;
  zone_name?: string;
  site_name?: string;
}

interface Component {
  id?: number;
  name: string;
  description: string;
  system: number;
  created_at: string;
  updated_at: string;
}

interface SystemList {
  id: number;
  name: string;
  description: string;
  components_count: number;
}

interface System {
  id: number;
  name: string;
  description: string;
  components: Component[];
  assets: Asset[];
  created_at: string;
  updated_at: string;
}

const systems = ref<SystemList[]>([]);
const loading = ref(false);
const deleteLoading = ref(false);
const selectedItem = ref<System | null>(null);
const isEditDialogOpen = ref(false);
const isDeleteDialogOpen = ref(false);

// Component dialog state
const isComponentDialogOpen = ref(false);
const selectedComponent = ref<Component | null>(null);
const componentLoading = ref(false);

const fetchSystems = async () => {
    loading.value = true;
    try {
        const response = await axiosInstance.get('/systems/');
        systems.value = response.data;
    } catch (error) {
        console.error('Error fetching systems:', error);
    } finally {
        loading.value = false;
    }
};

const fetchSingleSystem = async (systemId: number) => {
    loading.value = true;
    try {
        const response = await axiosInstance.get(`/systems/${systemId}/`);
        selectedItem.value = response.data as System;
    } catch (error) {
        console.error('Error fetching system:', error);
    } finally {
        loading.value = false;
    }
};

// Fetch component details (if you have a component detail endpoint)
const fetchComponentDetails = async (componentId: number) => {
  componentLoading.value = true;
  try {
    const response = await axiosInstance.get(`/components/${componentId}/`);
    selectedComponent.value = response.data as Component;
  } catch (err) {
    console.log('Error fetching component details:', err);
  } finally {
    componentLoading.value = false;
  }
};

// Handle component view
const handleViewComponent = async (component: Component) => {
  if (component.id) {
    await fetchComponentDetails(component.id);
    isComponentDialogOpen.value = true;
  }
};

async function handleSelect(item: SystemList) {
  await fetchSingleSystem(item.id);
}

function handleEdit() {
  if (selectedItem.value) {
    isEditDialogOpen.value = true;
  }
}

const handleEditSuccess = async () => {
  isEditDialogOpen.value = false;
  
  // Refresh the specific system to get updated data
  if (selectedItem.value) {
    await fetchSingleSystem(selectedItem.value.id);
  }
  
  console.log('System updated successfully!');
};

const handleRefresh = () => {
  fetchSystems();
};

function handleDelete() {
  if (selectedItem.value) {
    isDeleteDialogOpen.value = true;
  }
}

const confirmDelete = async () => {
  if (!selectedItem.value) return;
  
  deleteLoading.value = true;
  try {
    await axiosInstance.delete(`/systems/${selectedItem.value.id}/`);
    console.log('System deleted successfully!');
    
    systems.value = systems.value.filter(system => system.id !== selectedItem.value?.id);
    selectedItem.value = null;
    isDeleteDialogOpen.value = false;
  } catch (error) {
    console.error('Error deleting system:', error);
  } finally {
    deleteLoading.value = false;
  }
};

onMounted(() => {
  fetchSystems();
});
</script>

<template>
  <ListItems
    title="System"
    :items="systems"
    :formComponent="SystemForm"
    :loading="loading"
    :selectedItem="selectedItem"
    :icon="Cog"
    addButtonLabel="New"
    dialogClass="sm:max-w-[800px]"
    @select="handleSelect"
    @refresh="handleRefresh"
  >
    <template #item="{ item }">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="min-w-0 flex-1">
            <div class="truncate text-foreground font-semibold">{{ item.name }}</div>
          </div>
        </div>
        </div>

        <div class="flex flex-col">
          <div class="text-sm text-gray-600 dark:text-gray-400 pt-2">
            {{ item.components_count }} {{ item.components_count === 1 ? 'component' : 'components' }}
          </div>
        </div>
      
    </template>

    <!-- Actions -->
    <template #action="{ selectedItem: selected }">
      <div class="flex p-1.5 justify-end gap-2 border-b border-default bg-background">
        <!-- Edit -->
        <Dialog v-model:open="isEditDialogOpen">
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              :disabled="!selected || loading"
              @click="handleEdit"
            >
              <Edit />
              Edit
            </Button>
          </DialogTrigger>
          <DialogScrollContent class="sm:max-w-[800px]" @interact-outside="(event) => event.preventDefault()">
            <SystemForm 
              :initial-system="selected" 
              @success="handleEditSuccess" 
              @cancel="isEditDialogOpen = false"
            />
          </DialogScrollContent>
        </Dialog>
        
        <!-- Delete -->
        <Dialog v-model:open="isDeleteDialogOpen">
          <DialogTrigger as-child>
            <Button 
              variant="destructive" 
              size="sm" 
              @click="handleDelete" 
              :disabled="!selected || loading || deleteLoading"
            >
              <Loader2 v-if="deleteLoading" class="w-4 h-4 mr-2 animate-spin" />
              <Trash v-else />
              Delete
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Delete</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete the system "{{ selected?.name }}"? 
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose as-child>
                <Button variant="outline" :disabled="deleteLoading">Cancel</Button>
              </DialogClose>
              <Button variant="destructive" @click="confirmDelete" :disabled="deleteLoading">
                <Loader2 v-if="deleteLoading" class="w-4 h-4 mr-2 animate-spin" />
                Delete System
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </template>

    <!-- Detail view -->
    <template #detail="{ item }">
      <div v-if="item" class="flex flex-col gap-6 p-6">
        <!-- Enhanced system details -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Cog class="h-5 w-5 text-blue-600" />
              System Details
            </CardTitle>
            <CardDescription>Basic information about this system</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div class="space-y-2">
                <label class="text-sm font-medium text-gray-600 dark:text-gray-400">System Name</label>
                <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ item.name }}</p>
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium text-gray-600 dark:text-gray-400">Description</label>
                <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ item.description || 'No description' }}</p>
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium text-gray-600 dark:text-gray-400">Components</label>
                <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ item.components.length }}</p>
              </div>
            </div>
            <div class="mt-6 pt-6 border-t">
              <div class="space-y-2">
                <label class="text-sm font-medium text-gray-600 dark:text-gray-400">Address</label>
                <p class="text-gray-900 dark:text-gray-100">{{ item.description }}</p>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t">
              <div class="space-y-2">
                <label class="text-sm font-medium text-gray-600 dark:text-gray-400">Created</label>
                <p class="text-gray-900 dark:text-gray-100">{{ formatDate(item.creation_date) }}</p>
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium text-gray-600 dark:text-gray-400">Last Updated</label>
                <p class="text-gray-900 dark:text-gray-100">{{ formatDate(item.last_update) }}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Components Section -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Blocks class="w-5 h-5 text-green-600" />
              Components ({{ item.components.length }})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <template v-if="item.components.length > 0">
              <div class="overflow-x-auto rounded-lg border">
                <table class="w-full">
                  <thead class="bg-muted/50">
                    <tr class="border-b ">
                      <th class="text-left text-sm py-3 px-4 font-medium text-muted-foreground">#</th>
                      <th class="text-left text-sm py-3 px-4 font-medium text-muted-foreground">Component Name</th>
                      <th class="text-left text-sm py-3 px-4 font-medium text-muted-foreground">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr 
                      v-for="(component, index) in item.components" 
                      :key="component.id" 
                      class="hover:bg-muted/25 transition-colors">
                      <td class="py-3 px-4 font-medium text-sm">
                        {{ index + 1 }}
                      </td>
                      <td class="py-3 px-4">
                        <div class="flex items-center gap-3">
                          <div>
                            <p class="font-medium text-sm">{{ component.name }}</p>
                          </div>
                        </div>
                      </td>
                      <td class="py-3 px-4">
                        <div class="flex items-center gap-3">
                          <div>
                            <p class="font-medium text-sm">{{ component.description }}</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </template>
            <template v-else>
              <div class="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700">
                <Blocks class="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h4 class="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">No components found</h4>
                <p class="text-gray-500 dark:text-gray-500">This system doesn't have any components assigned</p>
              </div>
            </template>
          </CardContent>
        </Card>

      
      </div>
    </template>
  </ListItems>
</template>