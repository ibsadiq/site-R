<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Edit, Trash, Loader2, Cog, Blocks} from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogScrollContent, DialogTrigger, DialogContent,
  DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose
} from '@/components/ui/dialog';
import ListItems from '@/components/ListItems.vue';
import axiosInstance from "@/utils/axiosInstance"
import {formatDate} from '@/utils/formatDate';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ModelForm from '@/components/model/ModelForm.vue';

interface Model {
  id: number;
  name: string;
  description: string;
  manufacturer: number;
  manufacturer_name: string;
  creation_date: string;
  last_update: string;
}

const models = ref<Model[]>([]);
const loading = ref(false);
const isEditDialogOpen = ref(false);
const isDeleteDialogOpen = ref(false);
const deleteLoading = ref(false);
const selectedItem = ref<Model | null>(null);

const fetchModels = async () => {
  loading.value = true;
  try {
    const response = await axiosInstance.get('/models');
    models.value = response.data;
  } catch (error) {
    console.error('Error fetching models:', error);
  } finally {
    loading.value = false;
  }
};

function handleSelect(model: Model) {
  selectedItem.value = model;
}

function handleEdit() {
  if (selectedItem.value) {
    isEditDialogOpen.value = true;
  }
}

const handleEditSuccess = async () => {
  isEditDialogOpen.value = false;
  selectedItem.value = null;
  fetchModels(); // refresh after edit
};

const handleDelete = () => {
  if (selectedItem.value) {
    isDeleteDialogOpen.value = true;
  }
};

const confirmDelete = async () => {
  if (!selectedItem.value) return;
  deleteLoading.value = true;
  try {
    await axiosInstance.delete(`/models/${selectedItem.value.id}`);
    isDeleteDialogOpen.value = false;
    selectedItem.value = null;
    fetchModels(); // refresh after delete
  } catch (error) {
    console.error('Error deleting model:', error);
  } finally {
    deleteLoading.value = false;
  }
};

const handleRefresh = () => {
  fetchModels();
};

onMounted(() => {
  fetchModels();
});
</script>

<template>
  <ListItems
    :items="models"
    :loading="loading"
    title="Model"
    @select="handleSelect"
    :selected-item="selectedItem"
    addButtonTitle="New"
    dialogClass="sm:max-w-[600px]"
    @refresh="handleRefresh"
    :form-component="ModelForm"
    >
    <template #item="{ item }">
      <div class="flex items-center justify-between w-full">
        <div class="flex flex-col">
          <div class="font-medium">{{ item.name }}</div>
        </div>
      </div>
      <div class="text-sm text-muted-foreground">{{ item.manufacturer_name }}</div>
    </template>

    <template #action="{ selectedItem: selected }">
      <div class="flex p-1.5 justify-end border-b gap-2 border-default bg-background">
        <!-- Edit -->
        <Dialog v-model:open="isEditDialogOpen">
          <DialogTrigger as-child>
            <Button variant="outline" size="sm" @click="handleEdit" :disabled="!selected || loading">
              <Edit class="w-4 h-4 mr-1" />
              Edit
            </Button>
          </DialogTrigger>
          <DialogScrollContent class="sm:max-w-[800px]" @interact-outside="(event) => event.preventDefault()">
            <DialogContent>
              <ManufacturerForm :initialManufacturer="selected" @success="handleEditSuccess" />
            </DialogContent>
          </DialogScrollContent>
        </Dialog>

        <!-- Delete -->
        <Dialog v-model:open="isDeleteDialogOpen">
          <DialogTrigger as-child>
            <Button variant="destructive" size="sm" @click="handleDelete" :disabled="!selected || loading || deleteLoading">
              <Loader2 v-if="deleteLoading" class="w-4 h-4 mr-2 animate-spin" />
              <Trash v-else class="w-4 h-4 mr-1" />
              Delete
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Delete</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete the model "{{ selected?.name }}"? 
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose as-child>
                <Button variant="outline" :disabled="deleteLoading">Cancel</Button>
              </DialogClose>
              <Button variant="destructive" @click="confirmDelete" :disabled="deleteLoading">
                <Loader2 v-if="deleteLoading" class="w-4 h-4 mr-2 animate-spin" />
                Delete Model
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </template>

     <template #detail="{ item }">
      <div v-if="item" class="flex flex-col gap-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle>{{ item.name }}</CardTitle>
  
          </CardHeader>
          <CardContent class="space-y-2">

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div class="space-y-2">
                <label class="text-sm font-medium text-gray-600 dark:text-gray-400">Name</label>
                <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ item.name }}</p>
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium text-gray-600 dark:text-gray-400">Manufacturer</label>
                <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ item.manufacturer }}</p>
              </div>
            </div>

            <p><strong>Created:</strong> {{ item.creation_date ? formatDate(item.creation_date) : 'N/A' }}</p>
            <p><strong>Last Update:</strong> {{ item.last_update ? formatDate(item.last_update) : 'N/A' }}</p>
          </CardContent>
        </Card>
      </div>
    </template>
  </ListItems>

</template>