<script setup lang="ts">
import { Edit, Trash, Loader2, Eye, QrCode, Building2, Box, Cog } from 'lucide-vue-next';
import { ref, onMounted} from 'vue';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogScrollContent, DialogTrigger, DialogContent,
  DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose
} from '@/components/ui/dialog';
import ListItems from '@/components/ListItems.vue';
import axiosInstance from "@/utils/axiosInstance"
import { formatDate } from '@/utils/formatDate';
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import ZoneForm from '@/components/zone/ZoneForm.vue';

interface Asset {
  id: number;
  name: string;
  asset_tag: string;
  system_name: string;
  model_name: string;
  is_in_service: boolean;
  status: string;
}

interface Space {
  id: number;
  name: string;
  status: boolean;
  uuid?: string;
  barcode_image?: string;
  zone_name?: string;
  site_name?: string;
  creation_date?: string;
  last_update?: string;
  assets?: Asset[];
}

interface SpaceDetail extends Space {
  zone: number;
  assets: Asset[];
}

interface Zone {
  id: number;
  name: string;
  status: boolean;
  site: number;
  site_name: string;
  spaces: Space[];
  creation_date: string;
  last_update: string;
}

interface ZoneList {
  id: number;
  name: string;
  status: boolean;
  site_name: string;
  spaces_count: number;
}

const zones = ref<ZoneList[]>([]);
const loading = ref(false);
const deleteLoading = ref(false);
const selectedItem = ref<Zone | null>(null);
const isEditDialogOpen = ref(false);
const isDeleteDialogOpen = ref(false);

// Space dialog state
const isSpaceDialogOpen = ref(false);
const selectedSpace = ref<SpaceDetail | null>(null);
const spaceLoading = ref(false);

// Barcode dialog state
const isBarcodeDialogOpen = ref(false);
const selectedBarcode = ref<string | null>(null);

const fetchZones = async () => {
  loading.value = true;
  try {
    const response = await axiosInstance.get('/zones/');
    zones.value = response.data;
  } catch (err) {
    console.log('Error fetching zones:', err);
  } finally {
    loading.value = false;
  }
};

const fetchSingleZone = async (zoneId: number) => {
  try {
    const response = await axiosInstance.get(`/zones/${zoneId}/`);
    selectedItem.value = response.data as Zone;
    
  } catch (err) {
    console.log('Error fetching zone:', err);
  }
};

// Fetch space details
const fetchSpaceDetails = async (spaceId: number) => {
  spaceLoading.value = true;
  try {
    const response = await axiosInstance.get(`/spaces/${spaceId}/`);
    selectedSpace.value = response.data as SpaceDetail;
  } catch (err) {
    console.log('Error fetching space details:', err);
  } finally {
    spaceLoading.value = false;
  }
};

// Handle space view
const handleViewSpace = async (space: Space) => {
  await fetchSpaceDetails(space.id);
  isSpaceDialogOpen.value = true;
};

const handleViewBarcode = (barcodeImage: string) => {
  selectedBarcode.value = barcodeImage;
  isBarcodeDialogOpen.value = true;
};

const handleEditSuccess = async () => {
  isEditDialogOpen.value = false;
  
  // Refresh the specific zone to get updated data
  if (selectedItem.value) {
    await fetchSingleZone(selectedItem.value.id);
  }
  
  console.log('Zone updated successfully!');
};

const handleRefresh = () => {
  fetchZones();
};

function handleEdit() {
  if (selectedItem.value) {
    isEditDialogOpen.value = true;
  }
}

function handleDelete() {
  if (selectedItem.value) {
    isDeleteDialogOpen.value = true;
  }
}

async function handleSelect(item: ZoneList) {
  await fetchSingleZone(item.id); // fetch full details when clicked
}

const confirmDelete = async () => {
  if (!selectedItem.value) return;
  
  deleteLoading.value = true;

  try {
    await axiosInstance.delete(`/zones/${selectedItem.value.id}/`);
    // Remove the deleted zone from the list
    zones.value = zones.value.filter(zone => zone.id !== selectedItem.value?.id);
    selectedItem.value = null;
    isDeleteDialogOpen.value = false;
  } catch (error) {
    console.error('Error deleting zone:', error);
  } finally {
    deleteLoading.value = false;
  }
};

onMounted(() => {
  fetchZones();
});
</script>

<template>
    <list-items
        title="Zone"
      :items="zones"
      :loading="loading"
      :selectedItem="selectedItem"
      :formComponent="ZoneForm"
      :icon="Building2"
      addButtonLabel="Add"
      dialogClass="sm:max-w-[800px]"
      @select="handleSelect"
      @refresh="handleRefresh"
    >
        <template #item="{item}">
            <!-- Enhanced zone item display with better hierarchy and icons -->
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="min-w-0 flex-1">
                    <div class="truncate text-foreground font-semibold">{{ item.name }}</div>
                    <div class="flex items-center gap-2 mt-1">
                      <Building2 class="w-4 h-4 text-gray-400" />
                      <span class="text-sm text-gray-600 dark:text-gray-400">{{ item.site_name }}</span>
                    </div>
                  </div>
                </div>
                <div class="flex flex-col items-end gap-2">
                  <Badge
                    :class="item.status ? 'text-green-800' : 'text-gray-800'"
                    variant="outline"
                  >
                    {{ item.status ? 'Active' : 'Inactive' }}
                  </Badge>
                  <div class="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-full">
                    {{ item.spaces_count }} {{ item.spaces_count === 1 ? 'space' : 'spaces' }}
                  </div>
                </div>

            </div>
        </template>

        <!-- Actions -->
    <template #action="{ selectedItem: selected }">
      <div class="flex p-1.5 justify-end border-b gap-2 border-default bg-background">
        <!-- Edit -->
        <Dialog v-model:open="isEditDialogOpen">
          <DialogTrigger as-child>
            <Button variant="outline" size="sm" @click="handleEdit" :disabled="!selected || loading">
              <Edit />
              Edit
            </Button>
          </DialogTrigger>
          <DialogScrollContent class="sm:max-w-[800px]" @interact-outside="(event) => event.preventDefault()">
            <ZoneForm 
              ref="zoneFormRef"
              :initial-zone="selected"
              @success="handleEditSuccess"
            />
          </DialogScrollContent>
        </Dialog>

        <!-- Delete -->
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
                Are you sure you want to delete the zone "{{ selected?.name }}"? 
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose as-child>
                <Button variant="outline" :disabled="deleteLoading">Cancel</Button>
              </DialogClose>
              <Button variant="destructive" @click="confirmDelete" :disabled="deleteLoading">
                <Loader2 v-if="deleteLoading" class="w-4 h-4 mr-2 animate-spin" />
                Delete Zone
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </template>

    <!-- Detail view -->
    <template #detail="{ item }">
        <div v-if="item" class="flex flex-col gap-6 p-6">
            <!-- Enhanced zone details with better visual hierarchy -->
            <Card>
              <CardHeader>
                <CardTitle class="flex items-center gap-2">
                  <Building2 class="w-5 h-5 text-blue-600" />
                  Zone Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div class="space-y-2">
                    <label class="text-sm font-medium text-gray-600 dark:text-gray-400">Zone Name</label>
                    <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ item.name }}</p>
                  </div>
                  <div class="space-y-2">
                    <label class="text-sm font-medium text-gray-600 dark:text-gray-400">Site</label>
                    <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ item.site_name }}</p>
                  </div>
                  <div class="space-y-2">
                    <label class="text-sm font-medium text-gray-600 dark:text-gray-400">Status</label>
                    <div>
                      <Badge :class="item.status ? 'text-green-800' : 'text-gray-800'" variant="outline">
                      {{ item.status ? "Active" : "Inactive" }}
                    </Badge>
                    </div>
                    
                  </div>
                  <div class="space-y-2">
                    <label class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Spaces</label>
                    <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ item.spaces.length }}</p>
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

            <Card>
              <CardHeader>
                <CardTitle class="flex items-center gap-2">
                  <Box class="w-5 h-5 text-green-600" />
                  Spaces ({{ item.spaces.length }})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <template v-if="item.spaces.length > 0">
                  <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                      <thead>
                        <tr class="border-b border-gray-200 dark:border-gray-700">
                          <th class="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">#</th>
                          <th class="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Space Name</th>
                          <th class="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Status</th>
                          <th class="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Barcode</th>
                          <th class="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr 
                          v-for="(space, index) in item.spaces" 
                          :key="space.id" 
                          class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          <td class="py-4 px-4 font-medium text-gray-900 dark:text-gray-100">
                            {{ index + 1 }}
                          </td>
                          <td class="py-4 px-4">
                            <div class="flex items-center gap-3">
                             
                              <div>
                                <p class="font-medium text-gray-900 dark:text-gray-100">{{ space.name }}</p>
                                <p class="text-xs text-gray-500 dark:text-gray-400" v-if="space.uuid">
                                  UUID: {{ space.uuid?.substring(0, 8) }}...
                                </p>
                              </div>
                            </div>
                          </td>
                          <td class="py-4 px-4">
                            <Badge :class="space.status ? 'text-green-800' : 'text-gray-800 '" variant="outline">
                              {{ space.status ? 'Active' : 'Inactive' }}
                            </Badge>
                          </td>
                          <td class="py-4 px-4">
                            <Button 
                              v-if="space.barcode_image"
                              variant="outline" 
                              size="sm" 
                              @click="handleViewBarcode(space.barcode_image!)"
                              class="h-8 px-2"
                            >
                              <QrCode class="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <span v-else class="text-xs text-gray-400">No barcode</span>
                          </td>
                          <td class="py-4 px-4">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              @click="handleViewSpace(space)"
                              class="h-8 px-2"
                            >
                              <Eye class="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </template>
                <template v-else>
                  <div class="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700">
                    <MapPin class="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <h4 class="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">No spaces found</h4>
                    <p class="text-gray-500 dark:text-gray-500">This zone doesn't have any spaces assigned</p>
                  </div>
                </template>
              </CardContent>
            </Card>
        </div>
    </template>
  </list-items>

  <!-- Space Detail Dialog -->
  <Dialog v-model:open="isSpaceDialogOpen">
    <DialogContent class="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle v-if="selectedSpace" class="flex items-center gap-2">
          <Box class="w-5 h-5 text-green-600" />
          Space: {{ selectedSpace.name }}
        </DialogTitle>
        <DialogDescription class="flex items-center gap-4">
          <span>Detailed view of space and its assets</span>
          <div v-if="selectedSpace?.zone_name && selectedSpace?.site_name" class="flex items-center gap-2 text-sm bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full">
            <Building2 class="w-4 h-4" />
            {{ selectedSpace.site_name }} → {{ selectedSpace.zone_name }}
          </div>
        </DialogDescription>
      </DialogHeader>

      <div v-if="spaceLoading" class="flex items-center justify-center py-8">
        <Loader2 class="h-8 w-8 animate-spin" />
        <span class="ml-2">Loading space details...</span>
      </div>

      <div v-else-if="selectedSpace" class="space-y-6">
        <!-- Enhanced space details with better layout and barcode display -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Box class="w-5 h-5 text-green-600" />
              Space Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div class="space-y-2">
                <label class="text-sm font-medium text-gray-600 dark:text-gray-400">Name</label>
                <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ selectedSpace.name }}</p>
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium text-gray-600 dark:text-gray-400">Status</label>
                <div>
                  <Badge :class="selectedSpace.status ? 'text-green-800' : 'text-gray-800'" variant="outline">
                    {{ selectedSpace.status ? 'Active' : 'Inactive' }}
                </Badge>
                </div>
              </div>
              <div v-if="selectedSpace.uuid" class="space-y-2">
                <label class="text-sm font-medium text-gray-600 dark:text-gray-400">UUID</label>
                <p class="text-sm font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{{ selectedSpace.uuid }}</p>
              </div>
              <div v-if="selectedSpace.creation_date" class="space-y-2">
                <label class="text-sm font-medium text-gray-600 dark:text-gray-400">Created</label>
                <p class="text-gray-900 dark:text-gray-100">{{ formatDate(selectedSpace.creation_date) }}</p>
              </div>
            </div>
            
            <!-- Barcode section -->
            <div v-if="selectedSpace.barcode_image" class="mt-6 pt-6 border-t">
              <div class="flex items-center justify-between mb-4">
                <label class="text-sm font-medium text-gray-600 dark:text-gray-400">Barcode</label>
                <Button 
                  variant="outline" 
                  size="sm" 
                  @click="handleViewBarcode(selectedSpace.barcode_image!)"
                >
                  <QrCode class="h-4 w-4 mr-2" />
                  View Full Size
                </Button>
              </div>
              <div class="bg-white p-4 rounded-lg border inline-block">
                <img 
                  :src="selectedSpace.barcode_image" 
                  :alt="`Barcode for ${selectedSpace.name}`"
                  class="max-w-[200px] h-auto"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Assets Section -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Cog class="w-5 h-5 text-green-600" />
                Assets ({{ selectedSpace.assets?.length || 0 }})
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div v-if="selectedSpace.assets && selectedSpace.assets.length > 0" class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th class="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">#</th>
                    <th class="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Asset Name</th>
                    <th class="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Asset Tag</th>
                    <th class="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">System</th>
                    <th class="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Model</th>
                    <th class="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Service Status</th>
                    <th class="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr 
                    v-for="(asset, assetIndex) in selectedSpace.assets" 
                    :key="asset.id"
                    class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td class="py-4 px-4 font-medium text-gray-900 dark:text-gray-100">{{ assetIndex + 1 }}</td>
                    <td class="py-4 px-4">
                      <div class="flex items-center gap-3">
                        <div class="w-2 h-2 rounded-full flex-shrink-0" 
                             :class="asset.is_in_service ? 'bg-green-500' : 'bg-red-500'">
                        </div>
                        <span class="font-medium text-gray-900 dark:text-gray-100">{{ asset.name }}</span>
                      </div>
                    </td>
                    <td class="py-4 px-4">
                      <span class="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                        {{ asset.asset_tag || 'N/A' }}
                      </span>
                    </td>
                    <td class="py-4 px-4 text-gray-700 dark:text-gray-300">{{ asset.system_name || 'N/A' }}</td>
                    <td class="py-4 px-4 text-gray-700 dark:text-gray-300">{{ asset.model_name || 'N/A' }}</td>
                    <td class="py-4 px-4">
                      <Badge :class="asset.is_in_service ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'" variant="outline">
                        {{ asset.is_in_service ? 'In Service' : 'Out of Service' }}
                      </Badge>
                    </td>
                    <td class="py-4 px-4">
                      <span class="text-xs px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-medium">
                        {{ asset.status }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div v-else class="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700">
              <Cog class="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h4 class="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">No assets found</h4>
              <p class="text-gray-500 dark:text-gray-500">This space doesn't have any assets assigned</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <DialogFooter>
        <DialogClose as-child>
          <Button variant="outline">Close</Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <!-- Added barcode viewing dialog -->
  <Dialog v-model:open="isBarcodeDialogOpen">
    <DialogContent class="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <QrCode class="w-5 h-5" />
          Barcode View
        </DialogTitle>
        <DialogDescription>
          Full size barcode image
        </DialogDescription>
      </DialogHeader>

      <div v-if="selectedBarcode" class="flex justify-center p-6 bg-white rounded-lg">
        <img 
          :src="selectedBarcode" 
          alt="Barcode"
          class="max-w-full h-auto border rounded"
        />
      </div>

      <DialogFooter>
        <DialogClose as-child>
          <Button variant="outline">Close</Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
