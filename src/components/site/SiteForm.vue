<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
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
import { Textarea } from '@/components/ui/textarea'
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import * as z from "zod";
import axiosInstance from "@/utils/axiosInstance"
import { Loader2 } from 'lucide-vue-next';
import { toast } from 'vue-sonner';
import PlacesAutocomplete from '@/components/PlacesAutoComplete.vue';

interface Site {
  id: number
  type: string
  geometry: {
    type: string
    coordinates: [number, number]
  }
  properties: {
    cluster: number
    site_type: string
    status: boolean
    name: string
    address: string
    boundary: number
    longitude: number
    latitude: number
  }
}

interface Country {
  id: number;
  name: string;
  code: string;
}

interface Region {
  id: number;
  name: string;
}

interface Cluster {
  id: number;
  name: string;
}

interface Place {
  formatted_address: string;
  latitude: number;
  longitude: number;
}

interface Props {
  initialSite?: Site | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'success'): void;
}>();

const isLoading = ref(false);
const countries = ref<Country[]>([]);
const filteredRegions = ref<Region[]>([]);
const filteredClusters = ref<Cluster[]>([]);

const siteTypes = [
  { value: 'Residential', name: 'Residential' },
  { value: 'Mall', name: 'Mall' },
  { value: 'Commercial', name: 'Commercial' },
  { value: 'Office', name: 'Office' }
];

const selectedCountryCode = computed(() => {
  const selectedCountry = countries.value.find(
    (country) => country.id === Number(form.values.country)
  );
  return selectedCountry ? selectedCountry.code.toLowerCase() : "";
});

// Fetch countries
const fetchCountries = async () => {
  try {
    const response = await axiosInstance.get('/countries/?has_regions=true');
    countries.value = response.data;
  } catch (error) {
    console.log('Error fetching countries:', error);
    toast.error('Error loading countries');
  }
};

const fetchRegions = async (countryId: string) => {
  try {
    const response = await axiosInstance.get(`/regions/?country=${countryId}`);
    filteredRegions.value = response.data;
  } catch (error) {
    console.error('Error fetching regions:', error);
    toast.error('Error loading regions');
  }
};

const fetchClusters = async (regionId: string) => {
  try {
    const response = await axiosInstance.get(`/clusters/?region=${regionId}`);
    filteredClusters.value = response.data;
  } catch (error) {
    console.error('Error fetching clusters:', error);
    toast.error('Error loading clusters');
  }
};

const formSchema = toTypedSchema(
  z.object({
    id: z.number().optional(),
    name: z.string().min(2).max(100),
    country: z.string().min(1, "Country is required"),
    region: z.string().min(1, "Region is required"),
    cluster: z.string().min(1, "Cluster is required"),
    site_type: z.string().min(1, "Site type is required"),
    address: z.string().min(1, "Address is required"),
    latitude: z.number(),
    longitude: z.number(),
    boundary: z.number().positive().default(50),
    status: z.union([z.string(), z.boolean()]).default(true)
  })
)

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    id: undefined,
    name: '',
    country: '',
    region: '',
    cluster: '',
    site_type: '',
    address: '',
    latitude: 0,
    longitude: 0,
    boundary: 50,
    status: 'true'
  }
})

const handleCountryChange = async (countryId: string) => {
  try {
    form.setFieldValue("region", "");
    form.setFieldValue("cluster", "");
    filteredRegions.value = [];
    filteredClusters.value = [];

    if (countryId) {
      await fetchRegions(countryId);
    }
  } catch (error) {
    toast.error("Error loading regions");
  }
};

const handleRegionChange = async (regionId: string) => {
  try {
    form.setFieldValue("cluster", "");
    filteredClusters.value = [];

    if (regionId) {
      await fetchClusters(regionId);
    }
  } catch (error) {
    toast.error("Error loading clusters");
  }
};

const handlePlaceSelected = (placeDetails: Place) => {
  form.setFieldValue("address", placeDetails.formatted_address);
  form.setFieldValue("latitude", placeDetails.latitude);
  form.setFieldValue("longitude", placeDetails.longitude);
};

const handlePlacesError = (error: Error) => {
  console.error("Places Autocomplete Error:", error);
  toast.error(error.message);
};

// Initialize form with existing site data
const initializeForm = async (site: Site) => {
  // First, find the country, region, and cluster chain
  try {
    // Find the cluster and its region
    const clusterResponse = await axiosInstance.get(`/clusters/${site.properties.cluster}/`);
    const cluster = clusterResponse.data;
    
    // Find the region and its country
    const regionResponse = await axiosInstance.get(`/regions/${cluster.region}/`);
    const region = regionResponse.data;

    // Load the cascading data
    await fetchRegions(String(region.country));
    await fetchClusters(String(region.id));

    form.setValues({
      id: site.id,
      name: site.properties.name,
      country: String(region.country),
      region: String(region.id),
      cluster: String(site.properties.cluster),
      site_type: site.properties.site_type,
      address: site.properties.address,
      latitude: site.geometry.coordinates[1],
      longitude: site.geometry.coordinates[0],
      boundary: site.properties.boundary,
      status: String(site.properties.status)
    });
  } catch (error) {
    console.error('Error initializing form:', error);
    toast.error('Error loading site data');
  }
};

// Watch for prop changes
watch(() => props.initialSite, (newSite) => {
  if (newSite) {
    initializeForm(newSite);
  } else {
    // Reset form for new site
    form.resetForm();
    filteredRegions.value = [];
    filteredClusters.value = [];
  }
}, { immediate: true });

// Submit handler
const onSubmit = form.handleSubmit(async (values) => {
  isLoading.value = true;
  try {
    const siteData = {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [Number(values.longitude), Number(values.latitude)],
      },
      properties: {
        name: values.name,
        address: values.address,
        site_type: values.site_type,
        cluster: Number(values.cluster),
        status: values.status === 'true',
        boundary: Number(values.boundary),
        longitude: Number(values.longitude),
        latitude: Number(values.latitude),
      },
    };

    if (values.id) {
      await axiosInstance.put(`/sites/${values.id}/`, siteData);
      toast.success('Site updated successfully!');
    } else {
      await axiosInstance.post('/sites/', siteData);
      toast.success('Site added successfully!');
    }
    
    emit('success');
  } catch (error: any) {
    const errorType = error?.response?.data?.error?.replace(/[\[\]']/g, '').split(',')[0];
    const errorDetails = error?.response?.data?.details?.replace(/[\[\]']/g, '');
    
    toast.error(
      `Failed to ${values.id ? 'update' : 'add'} site: ${errorType || 'Unknown error'}`,
      { description: errorDetails || 'An unexpected error occurred' }
    );
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
      {{ form.values.id ? 'Edit Site' : 'Add Site' }}
    </DialogTitle>
    <DialogDescription>
      {{ form.values.id ? 'Update site details and location' : 'Add a new site with location details' }}
    </DialogDescription>
  </DialogHeader>

  <form @submit.prevent="onSubmit" class="space-y-4">
    <!-- Country and Region Selection -->
    <div class="grid grid-cols-2 gap-4">
      <FormField v-slot="{ field }" name="country">
        <FormItem>
          <FormLabel class="required">Country</FormLabel>
          <Select v-bind="field" v-model="form.values.country" @update:modelValue="handleCountryChange">
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

      <FormField v-slot="{ field }" name="region">
        <FormItem>
          <FormLabel class="required">Region</FormLabel>
          <Select
            v-bind="field"
            v-model="form.values.region"
            @update:modelValue="handleRegionChange"
            :disabled="!form.values.country"
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select a region" />
              </SelectTrigger>
            </FormControl>
            <SelectContent :usePortal="false">
              <SelectGroup>
                <SelectItem
                  v-for="region in filteredRegions"
                  :key="region.id"
                  :value="String(region.id)"
                >
                  {{ region.name }}
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      </FormField>
    </div>

    <!-- Cluster and Site Type -->
    <div class="grid grid-cols-2 gap-4">
      <FormField v-slot="{ field }" name="cluster">
        <FormItem>
          <FormLabel class="required">Cluster</FormLabel>
          <Select v-bind="field" v-model="form.values.cluster" :disabled="!form.values.region">
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select a cluster" />
              </SelectTrigger>
            </FormControl>
            <SelectContent :usePortal="false">
              <SelectGroup>
                <SelectItem
                  v-for="cluster in filteredClusters"
                  :key="cluster.id"
                  :value="String(cluster.id)"
                >
                  {{ cluster.name }}
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      </FormField>

      <FormField v-slot="{ field }" name="site_type">
        <FormItem>
          <FormLabel class="required">Site Type</FormLabel>
          <Select v-bind="field" v-model="form.values.site_type">
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select site type" />
              </SelectTrigger>
            </FormControl>
            <SelectContent :usePortal="false">
              <SelectGroup>
                <SelectItem
                  v-for="type in siteTypes"
                  :key="type.value"
                  :value="type.value"
                >
                  {{ type.name }}
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      </FormField>
    </div>

    <!-- Site Name -->
    <FormField name="name" v-slot="{ field }">
      <FormItem>
        <FormLabel class="required">Site Name</FormLabel>
        <FormControl>
          <Input type="text" v-bind="field" v-model="form.values.name" placeholder="Enter site name" />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <!-- Address with Places Autocomplete (for new sites) or Textarea (for existing sites) -->
    <FormField v-slot="{ field }" name="address">
      <FormItem>
        <FormLabel class="required">Address</FormLabel>
        <FormControl>
          <PlacesAutocomplete
            v-if="!form.values.id"
            :country="selectedCountryCode"
            @place-selected="handlePlaceSelected"
            @error="handlePlacesError"
            v-bind="field"
            :disabled="!form.values.country"
          />
          <Textarea 
            v-else
            v-bind="field" 
            v-model="form.values.address"
            placeholder="Enter address" 
            :rows="3" 
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <!-- Location Information -->
    <div class="grid grid-cols-3 gap-4">
      <FormField v-slot="{ field }" name="longitude">
        <FormItem>
          <FormLabel>Longitude</FormLabel>
          <FormControl>
            <Input v-model="form.values.longitude" v-bind="field" type="number" step="any" />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>

      <FormField v-slot="{ field }" name="latitude">
        <FormItem>
          <FormLabel>Latitude</FormLabel>
          <FormControl>
            <Input v-model="form.values.latitude" v-bind="field" type="number" step="any" />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>

      <FormField v-slot="{ field }" name="boundary">
        <FormItem>
          <FormLabel>Boundary (meters)</FormLabel>
          <FormControl>
            <Input v-model="form.values.boundary" v-bind="field" type="number" step="any" />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>
    </div>

    <!-- Status -->
    <FormField v-slot="{ field }" name="status">
      <FormItem>
        <FormLabel>Status</FormLabel>
        <Select v-bind="field" v-model="form.values.status">
          <FormControl>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
          </FormControl>
          <SelectContent :usePortal="false">
            <SelectGroup>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <FormMessage />
      </FormItem>
    </FormField>

    <!-- Actions -->
    <div class="flex justify-end gap-4">
      <DialogClose asChild> 
        <Button variant="outline">
          Cancel
        </Button>
      </DialogClose>
      
      <Button type="submit" variant="default" :disabled="isLoading">
        <Loader2 v-if="isLoading" class="w-4 h-4 mr-2 animate-spin" />
        {{ isLoading ? (form.values.id ? 'Updating...' : 'Adding...') : (form.values.id ? 'Update Site' : 'Add Site') }}
      </Button>
    </div>
  </form>
</template>

<style scoped>
.required::after {
  content: "*";
  color: red;
  margin-left: 4px;
}
</style>