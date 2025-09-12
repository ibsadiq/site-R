<script setup lang="ts">
import { Edit, Trash, Loader2, Globe, Building2, MapPin, Calendar, Hash } from 'lucide-vue-next';
import { ref, onMounted } from 'vue';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogScrollContent, DialogTrigger, DialogContent,
  DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose
} from '@/components/ui/dialog';
import ListItems from '@/components/ListItems.vue';
import RegionForm from '@/components/region/RegionForm.vue';
import axiosInstance from "@/utils/axiosInstance"
import {formatDate} from '@/utils/formatDate';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const loading = ref(false);
const deleteLoading = ref(false);
const selectedItem = ref<Region | null>(null);
const isEditDialogOpen = ref(false);
const isDeleteDialogOpen = ref(false);
const regionFormRef = ref();

interface Cluster {
  id?: number;
  name: string;
  sites?: any[]; 
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
  loading.value = true;
  try {
    const response = await axiosInstance.get('/regions/');
    regions.value = response.data;
  } catch (err) {
    console.log('Error fetching regions:', err);
  } finally {
    loading.value = false;
  }
};

const fetchSingleRegion = async (regionId: number) => {
  try {
    const response = await axiosInstance.get(`/regions/${regionId}/`);
    const updatedRegion = response.data;
    
    // Update the region in the list
    const regionIndex = regions.value.findIndex(r => r.id === regionId);
    if (regionIndex !== -1) {
      regions.value[regionIndex] = updatedRegion;
    }
    
    // Update selected item if it's the same region
    if (selectedItem.value?.id === regionId) {
      selectedItem.value = updatedRegion;
    }
  } catch (error) {
    console.error('Error fetching single region:', error);
  }
};

function handleSelect(item: Region) {
  selectedItem.value = item;
}

function handleEdit() {
  if (selectedItem.value) {
    isEditDialogOpen.value = true;
  }
}

const handleEditSuccess = async () => {
  isEditDialogOpen.value = false;
  
  // Refresh the specific region to get updated data
  if (selectedItem.value) {
    await fetchSingleRegion(selectedItem.value.id);
  }
  
  console.log('Region updated successfully!');
};

const handleRefresh = () => {
  fetchRegions();
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
    await axiosInstance.delete(`/regions/${selectedItem.value.id}/`);
    console.log('Region deleted successfully!');
    
    regions.value = regions.value.filter(region => region.id !== selectedItem.value?.id);
    selectedItem.value = null;
    isDeleteDialogOpen.value = false;
  } catch (error) {
    console.error('Error deleting region:', error);
  } finally {
    deleteLoading.value = false;
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
    :loading="loading"
    :selectedItem="selectedItem"
    :icon="Globe"
    addButtonLabel="New"
    dialogClass="sm:max-w-[800px]"
    @select="handleSelect"
    @refresh="handleRefresh"
    :formComponent="RegionForm"
  >
    <!-- List item preview -->
    <template #item="{ item }">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="flex-shrink-0">
            <Globe class="h-5 w-5 text-gray-400" />
          </div>
          <div>
            <div class="text-foreground font-semibold">{{ item.name }}</div>
            <div class="text-sm text-muted-foreground">{{ item.country_name }}</div>
          </div>
        </div>
        <Badge variant="secondary" class="flex-shrink-0">
          {{ item.clusters_count }} {{ item.clusters_count === 1 ? 'cluster' : 'clusters' }}
        </Badge>
      </div>
    </template>

    <!-- Action buttons -->
    <template #action="{ selectedItem: selected }">
      <div class="flex p-1.5 justify-end border-b gap-2 border-default bg-background">
        <!-- Edit Dialog -->
        <Dialog v-model:open="isEditDialogOpen">
          <DialogTrigger as-child>
            <Button variant="outline" size="sm" @click="handleEdit" :disabled="!selected || loading">
              <Edit />
              Edit
            </Button>
          </DialogTrigger>
          <DialogScrollContent class="sm:max-w-[800px]" @interact-outside="(event) => event.preventDefault()">
            <RegionForm 
              ref="regionFormRef"
              :initial-region="selected"
              @success="handleEditSuccess"
            />
          </DialogScrollContent>
        </Dialog>

        <!-- Delete Confirmation Dialog -->
        <Dialog v-model:open="isDeleteDialogOpen">
          <DialogTrigger as-child>
            <Button variant="destructive" size="sm" @click="handleDelete" :disabled="!selected || loading || deleteLoading">
              <Loader2 v-if="deleteLoading" class="w-4 h-4 mr-2 animate-spin" />
              <Trash v-else />
              Delete
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Delete</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete the region "{{ selected?.name }}"? 
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose as-child>
                <Button variant="outline" :disabled="deleteLoading">Cancel</Button>
              </DialogClose>
              <Button variant="destructive" @click="confirmDelete" :disabled="deleteLoading">
                <Loader2 v-if="deleteLoading" class="w-4 h-4 mr-2 animate-spin" />
                Delete Region
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </template>

    <!-- Detail view -->
    <template #detail="{ item }">
      <div class="flex flex-col gap-6 p-6">
        <!-- Details Card -->
        <Card>
          <CardHeader class="pb-3">
            <CardTitle class="flex items-center gap-2 text-lg">
              <Globe class="h-5 w-5 text-blue-600" />
              Region Details
            </CardTitle>
            <CardDescription>Basic information about this region</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="space-y-2">
                <div class="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Hash class="h-4 w-4" />
                  Region Name
                </div>
                <p class="font-semibold">{{ item.name }}</p>
              </div>
              <div class="space-y-2">
                <div class="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <MapPin class="h-4 w-4" />
                  Country
                </div>
                <p class="font-semibold">{{ item.country_name }}</p>
              </div>
              <div class="space-y-2">
                <div class="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Building2 class="h-4 w-4" />
                  Total Clusters
                </div>
                <Badge variant="outline" class="w-fit">
                  {{ item.clusters_count }} {{ item.clusters_count === 1 ? 'cluster' : 'clusters' }}
                </Badge>
              </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div class="space-y-2">
                <div class="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Calendar class="h-4 w-4" />
                  Created
                </div>
                <p class="text-sm">{{ formatDate(item.creation_date) }}</p>
              </div>
              <div class="space-y-2">
                <div class="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Calendar class="h-4 w-4" />
                  Last Updated
                </div>
                <p class="text-sm">{{ formatDate(item.last_update) }}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Clusters Card -->
        <Card>
          <CardHeader class="pb-3">
            <CardTitle class="flex items-center gap-2 text-lg">
              <Building2 class="h-5 w-5 text-green-600" />
              Clusters
              <Badge variant="secondary" class="ml-2">{{ item.clusters_count }}</Badge>
            </CardTitle>
            <CardDescription>All clusters within this region</CardDescription>
          </CardHeader>
          <CardContent>
            <template v-if="item.clusters.length > 0">
              <div class="overflow-hidden rounded-lg border">
                <table class="w-full">
                  <thead class="bg-muted/50">
                    <tr class="border-b">
                      <th class="px-4 py-3 text-left text-sm font-medium text-muted-foreground">#</th>
                      <th class="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Cluster Name</th>
                      <th class="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Sites</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y">
                    <tr v-for="(cluster, index) in item.clusters" :key="cluster.id"
                        class="hover:bg-muted/25 transition-colors">
                      <td class="px-4 py-3 text-sm font-medium">{{ index + 1 }}</td>
                      <td class="px-4 py-3">
                        <div class="flex items-center gap-2">
                          <span class="font-medium">{{ cluster.name }}</span>
                        </div>
                      </td>
                      <td class="px-4 py-3">
                        <div class="space-y-1">
                          <template v-if="cluster.sites && cluster.sites.length > 0">
                            <div v-for="(site, siteIndex) in cluster.sites" :key="site.id" 
                                 class="flex items-center gap-2 text-sm">
                              <span>{{ site.name }}</span>
                            </div>
                          </template>
                          <template v-else>
                            <span class="text-sm text-muted-foreground italic">No sites</span>
                          </template>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </template>
            <template v-else>
              <div class="text-center py-8">
                <Building2 class="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                <p class="text-muted-foreground">No clusters found in this region</p>
              </div>
            </template>
          </CardContent>
        </Card>
      </div>
    </template>
  </ListItems>
</template>
