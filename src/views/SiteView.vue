<script setup lang="ts">
import { Edit, Trash, Loader2, MapPin, Building2, Users, Globe} from 'lucide-vue-next';
import { ref, onMounted} from 'vue';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogScrollContent, DialogTrigger, DialogContent,
  DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import ListItems from '@/components/ListItems.vue';
import axiosInstance from "@/utils/axiosInstance"
import { formatDate } from '@/utils/formatDate';
import SiteForm from '@/components/site/SiteForm.vue';
import { Badge } from "@/components/ui/badge"
import MapComponent from '@/components/MapComponent.vue';

interface Cluster {
  id: number;
  name: string;
  creation_date: string;
  last_update: string;
}

interface SiteProperties {
  cluster: number;
  cluster_name: Cluster;
  site_type: string;
  status: boolean;
  name: string;
  address: string;
  longitude: number;
  latitude: number;
  boundary: number;
  zones: any[];
  creation_date: string;
  last_update: string;
  url: string;
  users: Array<{
    id: number;
    name: string;
    roles: Array<{ name: string }>;
    is_active: boolean;
  }>;
}

interface Site {
  id: number;
  type: string;
  geometry: {
    type: string;
    coordinates: [number, number];
  };
  properties: SiteProperties;
  creation_date: string;
  last_update: string;
}

interface SiteList {
  id: number;
  name: string;
  status: boolean;
  address: string;
  site_type: string;
}

const sites = ref<SiteList[]>([]);
const loading = ref(false);
const isEditDialogOpen = ref(false);
const isDeleteDialogOpen = ref(false);
const selectedItem = ref<Site | null>(null);
const deleteLoading = ref(false);

const fetchSites = async () => {
  loading.value = true;
  try {
    const response = await axiosInstance.get('/sites/');
    sites.value = response.data;
  } catch (error) {
    console.error('Error fetching sites:', error);
  } finally {
    loading.value = false;
  }
};

const fetchSingleSite = async (siteId: number) => {
  try {
    const response = await axiosInstance.get(`/sites/${siteId}/`);
    selectedItem.value = response.data; // store the full site
  } catch (error) {
    console.error('Error fetching single site:', error);
  }
};

const handleEditSuccess = async () => {
  isEditDialogOpen.value = false;
  
  // Refresh the specific site to get updated data
  if (selectedItem.value) {
    await fetchSingleSite(selectedItem.value.id);
  }
  
  console.log('Site updated successfully!');
};

const handleRefresh = () => {
  fetchSites();
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

async function handleSelect(item: SiteList) {
  await fetchSingleSite(item.id); // fetch full details when clicked
}

const confirmDelete = async () => {
  if (!selectedItem.value) return;
  
  deleteLoading.value = true;

  try {
    await axiosInstance.delete(`/sites/${selectedItem.value.id}/`);
    // Remove the deleted site from the list
    sites.value = sites.value.filter(site => site.id !== selectedItem.value?.id);
    selectedItem.value = null;
    isDeleteDialogOpen.value = false;
  } catch (error) {
    console.error('Error deleting site:', error);
  } finally {
    deleteLoading.value = false;
  }
};

onMounted(() => {
  fetchSites();
});
</script>

<template>
  <ListItems
    title="Site"
    :items="sites"
    :loading="loading"
    addButtonLabel="Add"
    dialogClass="sm:max-w-[800px]"
    :formComponent="SiteForm"
    :selectedItem="selectedItem"
    :icon=Building2
    @select="handleSelect"
    @refresh="handleRefresh"
  >
    <!-- Enhanced list item display with better hierarchy and icons -->
    <template #item="{ item }">
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-3 min-w-0 flex-1">
          <div class="min-w-0 flex-1">
            <div class="truncate text-foreground font-semibold text-lg">{{ item.name }}</div>
            <div class="flex items-center gap-2 mt-1">
              <MapPin class="w-4 h-4 text-gray-400 flex-shrink-0" />
              <!-- Limited address width and improved truncation -->
              <span class="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[200px] md:max-w-[300px]" :title="item.address">
                {{ item.address }}
              </span>
            </div>
            <div class="flex items-center gap-2 mt-1">
              <Building2 class="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span class="text-sm text-gray-600 dark:text-gray-400">{{ item.site_type }}</span>
            </div>
          </div>
        </div>
        <!-- Improved badge container with guaranteed space -->
        <div class="flex-shrink-0 ml-4">
          <Badge 
            :class="item.status ? 'text-green-800' : 'text-gray-800'"
            variant="outline"
            class="font-medium">
            {{ item.status ? 'Active' : 'Inactive' }}
          </Badge>
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
            <SiteForm 
              ref="siteFormRef"
              :initial-site="selected"
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
                Are you sure you want to delete the site "{{ selected?.properties.name }}"? 
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose as-child>
                <Button variant="outline" :disabled="deleteLoading">Cancel</Button>
              </DialogClose>
              <Button variant="destructive" @click="confirmDelete" :disabled="deleteLoading">
                <Loader2 v-if="deleteLoading" class="w-4 h-4 mr-2 animate-spin" />
                Delete Site
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </template>

    <!-- Completely redesigned detail view using Card components instead of Accordions -->
    <template #detail="{ item }">
      <div v-if="item" class="flex flex-col gap-6 p-6">
        <!-- Site Details Card -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Building2 class="w-5 h-5 text-blue-600" />
              Site Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div class="space-y-2">
                <label class="text-sm font-medium text-gray-600 dark:text-gray-400">Site Name</label>
                <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ item.properties.name }}</p>
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium text-gray-600 dark:text-gray-400">Type</label>
                <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ item.properties.site_type }}</p>
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium text-gray-600 dark:text-gray-400">Status</label>
                <div>
                  <Badge :class="item.properties.status ? 'text-green-800' : 'text-gray-800'" variant="outline">
                    {{ item.properties.status ? 'Active' : 'Inactive' }}
                  </Badge>
                </div>
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium text-gray-600 dark:text-gray-400">Cluster</label>
                <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ item.properties.cluster_name?.name || 'N/A' }}</p>
              </div>
            </div>
            <div class="mt-6 pt-6 border-t">
              <div class="space-y-2">
                <label class="text-sm font-medium text-gray-600 dark:text-gray-400">Address</label>
                <p class="text-gray-900 dark:text-gray-100">{{ item.properties.address }}</p>
              </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t">
              <div class="space-y-2">
                <label class="text-sm font-medium text-gray-600 dark:text-gray-400">Created</label>
                <p class="text-gray-900 dark:text-gray-100">{{ formatDate(item.properties.creation_date) }}</p>
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium text-gray-600 dark:text-gray-400">Last Updated</label>
                <p class="text-gray-900 dark:text-gray-100">{{ formatDate(item.properties.last_update) }}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Location Card -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Globe class="w-5 h-5 text-green-600" />
              Location & Mapping
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div class="space-y-2">
                <label class="text-sm font-medium text-gray-600 dark:text-gray-400">Longitude</label>
                <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ item.properties.longitude }}</p>
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium text-gray-600 dark:text-gray-400">Latitude</label>
                <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ item.properties.latitude }}</p>
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium text-gray-600 dark:text-gray-400">Perimeter Radius</label>
                <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ item.properties.boundary }} metres</p>
              </div>
            </div>
            <div class="border rounded-lg overflow-hidden">
              <MapComponent
                :latitude="item.geometry.coordinates[1]" 
                :longitude="item.geometry.coordinates[0]"
                :boundary="item.properties.boundary"
              />
            </div>
          </CardContent>
        </Card>

        <!-- Users Card -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Users class="w-5 h-5 text-purple-600" />
              Site Users ({{ item.properties.users.length }})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <template v-if="item.properties.users.length > 0">
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="border-b border-gray-200 dark:border-gray-700">
                      <th class="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">#</th>
                      <th class="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Name</th>
                      <th class="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Roles</th>
                      <th class="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr 
                      v-for="(user, index) in item.properties.users" 
                      :key="user.id"
                      class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td class="py-4 px-4 font-medium text-gray-900 dark:text-gray-100">{{ index + 1 }}</td>
                      <td class="py-4 px-4">
                        <div class="flex items-center gap-3">
                          <div class="w-2 h-2 rounded-full flex-shrink-0" 
                               :class="user.is_active ? 'bg-green-500' : 'bg-red-500'">
                          </div>
                          <span class="font-medium text-gray-900 dark:text-gray-100">{{ user.name }}</span>
                        </div>
                      </td>
                      <td class="py-4 px-4">
                        <div class="flex flex-wrap gap-1">
                          <span 
                            v-for="role in user.roles" 
                            :key="role.name" 
                            class="inline-block bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs font-semibold px-2.5 py-0.5 rounded-full"
                          >
                            {{ role.name }}
                          </span>
                        </div>
                      </td>
                      <td class="py-4 px-4">
                        <Badge :class="user.is_active ? 'text-green-800' : 'text-red-800'" variant="outline">
                          {{ user.is_active ? 'Active' : 'Inactive' }}
                        </Badge>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </template>
            <template v-else>
              <div class="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700">
                <Users class="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h4 class="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">No users assigned</h4>
                <p class="text-gray-500 dark:text-gray-500">This site doesn't have any users assigned</p>
              </div>
            </template>
          </CardContent>
        </Card>
      </div>
    </template>
  </ListItems>
</template>
