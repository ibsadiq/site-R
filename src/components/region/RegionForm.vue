<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { DialogDescription, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { FormField, FormLabel, FormItem, FormControl, FormMessage } from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup
} from "@/components/ui/select";
import { Input } from '@/components/ui/input'
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import * as z from "zod";
import axiosInstance from "@/utils/axiosInstance"
import { Loader2 } from 'lucide-vue-next';
import { Icon } from '@iconify/vue';

interface Cluster {
  id?: number;
  name: string;
}

interface Region {
  id?: number;
  name: string;
  country: number;
  country_name: string;
  creation_date: string;
  last_update: string;
  clusters: Cluster[];
  clusters_count: number;
}

interface Country {
  id: number;
  name: string;
}

interface Props {
  initialRegion?: Region | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'success'): void;
}>();

const isLoading = ref(false);
const countries = ref<Country[]>([]);

// Fetch countries
const fetchCountries = async () => {
  try {
    const response = await axiosInstance.get('/countries/');
    countries.value = response.data.map((country: Country) => ({
      id: country.id,
      name: country.name
    }));
  } catch (error) {
    console.log('Error fetching countries:', error);
  }
};

const formSchema = toTypedSchema(
  z.object({
    id: z.number().optional(),
    name: z.string().min(3).max(255),
    country: z.string(),
    clusters: z.array(
      z.object({
        id: z.number().optional(),
        name: z.string().min(3).max(255)
      })
    ).optional()
  })
)

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    id: undefined,
    name: '',
    country: '',
    clusters: []
  }
})

const clusterInputs = ref<Cluster[]>([{ name: '' }]);

const updateClusters = () => {
  const validClusters = clusterInputs.value
    .map(cluster => ({ 
      id: cluster.id, 
      name: cluster.name.trim() 
    }))
    .filter(cluster => cluster.name !== '');
  
  form.setFieldValue('clusters', validClusters);
};

const addCluster = () => {
  clusterInputs.value.push({ name: '' });
  updateClusters();
};

const removeCluster = (index: number) => {
  clusterInputs.value.splice(index, 1);
  updateClusters();
};

// Initialize form with existing region data
const initializeForm = (region: Region) => {
  form.setValues({
    id: region.id,
    name: region.name,
    country: region.country?.toString() || '',
    clusters: region.clusters || []
  });
  
  // Initialize cluster inputs
  if (region.clusters && region.clusters.length > 0) {
    clusterInputs.value = [...region.clusters];
  } else {
    clusterInputs.value = [{ name: '' }];
  }
};

// Watch for prop changes
watch(() => props.initialRegion, (newRegion) => {
  if (newRegion) {
    initializeForm(newRegion);
  } else {
    // Reset form for new region
    form.resetForm();
    clusterInputs.value = [{ name: '' }];
  }
}, { immediate: true });

// Submit handler
const onSubmit = form.handleSubmit(async (values) => {
  isLoading.value = true;
  try {
    // Prepare clusters data
    const clustersData = values.clusters?.map(cluster => ({
      id: cluster.id,
      name: cluster.name
    })) || [];

    const regionData = {
      name: values.name,
      country: parseInt(values.country),
      clusters: clustersData
    };

    if (values.id) {
      await axiosInstance.put(`/regions/${values.id}/`, regionData);
      console.log('Region updated successfully!');
    } else {
      await axiosInstance.post('/regions/', regionData);
      console.log('Region added successfully!');
    }
    
    emit('success');
  } catch (error) {
    console.error('Error saving region:', error);
  } finally {
    isLoading.value = false;
  }
});

onMounted(() => {
  fetchCountries();
});
</script>

<template>
  <DialogHeader>
    <DialogTitle>
      {{ form.values.id ? 'Edit Region' : 'Add Region' }}
    </DialogTitle>
    <DialogDescription>
      {{ form.values.id ? 'Manage region details and clusters' : 'Add a new region and clusters' }}
    </DialogDescription>
  </DialogHeader>

  <form @submit.prevent="onSubmit" class="space-y-4">

    <FormField v-slot="{ field }" name="country">
      <FormItem>
        <FormLabel>Country</FormLabel>
        <Select v-bind="field" v-model="form.values.country">
          <FormControl>
            <SelectTrigger>
              <SelectValue placeholder="Select a country" />
            </SelectTrigger>
          </FormControl>
          <SelectContent :usePortal="false">
            <SelectGroup>
              <SelectItem
                v-for="country in countries"
                :key="country.id"
                :value="String(country.id)"
              >
                {{ country.name }}
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <FormMessage />
      </FormItem>
    </FormField>

    <!-- Region Name -->
    <FormField name="name" v-slot="{ field }">
      <FormItem>
        <FormLabel>Region Name</FormLabel>
        <FormControl>
          <Input type="text" v-bind="field" v-model="form.values.name" placeholder="Enter region name" />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <!-- Clusters -->
    <FormField v-slot="{ field }" name="clusters">
      <FormItem>
        <FormLabel class="mb-2 flex">Clusters</FormLabel>
        <div v-for="(cluster, index) in clusterInputs" :key="index" class="border p-4 rounded">
          <div class="flex items-center gap-4">
            <div class="flex-grow">
              <Input 
                v-model="cluster.name" 
                placeholder="Enter cluster name"
                @update:modelValue="updateClusters"
                class="bg-background"
              />
            </div>
            <div class="flex items-center space-x-2">
              <Button 
                variant="outline"
                size="sm"
                @click="removeCluster(index)" 
                class="ml-2 text-red-600 hover:text-red-500"
                type="button"
              >
                <Icon icon="weui:delete-outlined" class="w-4 h-4 mr-2" />
                Remove
              </Button>
            </div>
          </div>
        </div>

        <Button 
          variant="outline" 
          size="sm"
          @click="addCluster"
          class="w-fit"
          type="button"
        >
          <Icon icon="mdi:plus" class="w-4 h-4 mr-2"/>
          Add Cluster
        </Button>
        <FormMessage />
      </FormItem>
    </FormField>

    <!-- Actions -->
    <div class="flex justify-end gap-4">
      <Button type="submit" variant="default" :disabled="isLoading">
        <Loader2 v-if="isLoading" class="w-4 h-4 mr-2 animate-spin" />
        {{ isLoading ? (form.values.id ? 'Updating...' : 'Adding...') : (form.values.id ? 'Update Region' : 'Add Region') }}
      </Button>

      <DialogClose asChild> 
        <Button variant="outline">
          Cancel
        </Button>
      </DialogClose>
    </div>
  </form>
</template>