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
import { Loader2, Plus, Trash2 } from 'lucide-vue-next';
import { toast } from 'vue-sonner';

interface Site {
  id: number;
  name: string;
}

interface Space {
  id?: number;
  name: string;
  status: boolean;
}

interface Zone {
  id: number;
  name: string;
  site: number;
  status: boolean;
  spaces: Space[];
}

interface Props {
  initialZone?: Zone | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'success'): void;
}>();

const isLoading = ref(false);
const sites = ref<Site[]>([]);

// FIXED: Use the same approach as the working form - separate space inputs
const spaceInputs = ref<{ id?: number; name: string; status: string }[]>([]);

const formSchema = toTypedSchema(
  z.object({
    id: z.number().optional(),
    name: z.string().min(2).max(100),
    site: z.string().min(1, "Site is required"),
    status: z.string().default('true'),
    spaces: z.array(z.string()).default([]), // Changed to array of strings like working version
  })
)

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    id: undefined,
    name: '',
    site: '',
    status: 'true',
    spaces: [],
  },
});

const fetchSites = async () => {
  try {
    const response = await axiosInstance.get("/sites/");
    sites.value = response.data;
  } catch (error) {
    console.error('Error fetching sites:', error);
    toast.error("Error loading sites");
  }
};

const updateSpaces = () => {
  form.setFieldValue(
    "spaces",
    spaceInputs.value
      .map((space) => space.name)
      .filter((name) => name.trim() !== "")
  );
};

// FIXED: Space management functions like the working version
const addSpace = () => {
  spaceInputs.value.push({ name: '', status: 'true' });
  updateSpaces();
};

const removeSpace = (index: number) => {
  spaceInputs.value.splice(index, 1);
  updateSpaces();
};

// Initialize form with existing zone data
const initializeForm = async (zone: Zone) => {
  form.setValues({
    id: zone.id,
    name: zone.name,
    site: String(zone.site),
    status: String(zone.status),
    spaces: zone.spaces.map(space => space.name),
  });
  
  // Initialize space inputs
  spaceInputs.value = zone.spaces.map(space => ({
    id: space.id,
    name: space.name,
    status: String(space.status)
  }));
};

// Watch for prop changes
watch(() => props.initialZone, (newZone) => {
  if (newZone) {
    initializeForm(newZone);
  } else {
    // Reset form for new zone
    form.resetForm();
    form.setFieldValue('spaces', []);
    spaceInputs.value = []; // Reset space inputs
  }
}, { immediate: true });

// FIXED: Submit handler using the same pattern as working version
const onSubmit = form.handleSubmit(async (values) => {
  isLoading.value = true;
  try {
    const zoneData = {
      name: values.name,
      site: Number(values.site),
      status: values.status === 'true',
      // Use the same pattern as working version
      spaces: spaceInputs.value
        .map((space) => ({
          ...(space.id && { id: space.id }),
          name: space.name,
          status: space.status === 'true'
        }))
        .filter((space) => space.name.trim() !== ""),
    };

    console.log('Submitting zone data:', zoneData);

    if (values.id) {
      await axiosInstance.put(`/zones/${values.id}/`, zoneData);
      toast.success('Zone updated successfully!');
    } else {
      await axiosInstance.post('/zones/', zoneData);
      toast.success('Zone added successfully!');
    }
    
    emit('success');
  } catch (error: any) {
    console.error('Error submitting zone:', error);
    const errorType = error?.response?.data?.error?.replace(/[\[\]']/g, '').split(',')[0];
    const errorDetails = error?.response?.data?.details?.replace(/[\[\]']/g, '');
    
    toast.error(
      `Failed to ${values.id ? 'update' : 'add'} zone: ${errorType || 'Unknown error'}`,
      { description: errorDetails || 'An unexpected error occurred' }
    );
  } finally {
    isLoading.value = false;
  }
});

onMounted(() => {
  fetchSites();
});
</script>

<template>
  <DialogHeader>
    <DialogTitle>
      {{ form.values.id ? 'Edit Zone' : 'Add Zone' }}
    </DialogTitle>
    <DialogDescription>
      {{ form.values.id ? 'Update zone details and spaces' : 'Add a new zone with spaces' }}
    </DialogDescription>
  </DialogHeader>

  <form @submit.prevent="onSubmit" class="space-y-4">
    <!-- Site Selection -->
    <FormField v-slot="{ field }" name="site">
      <FormItem>
        <FormLabel class="required">Site</FormLabel>
        <Select v-bind="field" v-model="form.values.site">
          <FormControl>
            <SelectTrigger>
              <SelectValue placeholder="Select a site" />
            </SelectTrigger>
          </FormControl>
          <SelectContent :usePortal="false">
            <SelectGroup>
              <SelectItem
                v-for="site in sites"
                :key="site.id"
                :value="String(site.id)"
              >
                {{ site.name }}
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <FormMessage />
      </FormItem>
    </FormField>

     <!-- Zone Name -->
    <FormField name="name" v-slot="{ field }">
      <FormItem>
        <FormLabel class="required">Zone Name</FormLabel>
        <FormControl>
          <Input type="text" v-bind="field" v-model="form.values.name" placeholder="Enter zone name" />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

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

    <!-- FIXED: Spaces Section using the same pattern as working version -->
    <div class="space-y-4">
      <FormField v-slot="{ field }" name="spaces">
        <FormItem>
          <FormLabel class="mb-2 flex">Spaces</FormLabel>
          
          <div
            v-for="(space, index) in spaceInputs"
            :key="index"
            class="border p-4 rounded-lg bg-gray-50"
          >
            <div class="flex items-center gap-4">
              <div class="flex-grow grid grid-cols-2 gap-3">
                <!-- Space Name -->
                <div>
                  <label class="text-sm font-medium leading-none">
                    Space Name
                  </label>
                  <Input
                    v-model="space.name"
                    placeholder="Enter space name"
                    @update:modelValue="updateSpaces"
                    autocomplete="off"
                    class="mt-2"
                  />
                </div>

                <!-- Space Status -->
                <div>
                  <label class="text-sm font-medium leading-none">
                    Status
                  </label>
                  <Select v-model="space.status">
                    <SelectTrigger class="mt-2">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent :usePortal="false">
                      <SelectGroup>
                        <SelectItem value="true">Active</SelectItem>
                        <SelectItem value="false">Inactive</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <!-- Remove Space Button -->
              <Button
                variant="outline"
                size="sm"
                @click="removeSpace(index)"
                class="ml-2 text-red-600 hover:text-red-500"
                type="button"
              >
                <Trash2 class="w-4 h-4 mr-2" />
                Remove
              </Button>
            </div>
          </div>

          <Button variant="outline" size="sm" @click="addSpace" class="w-fit" type="button">
            <Plus class="w-4 h-4 mr-2" />
            Add Space
          </Button>
          
          <FormMessage />
        </FormItem>
      </FormField>
    </div>

    <!-- Actions -->
    <div class="flex justify-end gap-4 pt-4 border-t">
      <DialogClose asChild> 
        <Button variant="outline" :disabled="isLoading">
          Cancel
        </Button>
      </DialogClose>
      
      <Button type="submit" variant="default" :disabled="isLoading">
        <Loader2 v-if="isLoading" class="w-4 h-4 mr-2 animate-spin" />
        {{ isLoading ? (form.values.id ? 'Updating...' : 'Adding...') : (form.values.id ? 'Update Zone' : 'Add Zone') }}
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