<script setup lang="ts">
import { ref, watch } from 'vue'
import { DialogDescription, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { FormField, FormLabel, FormItem, FormControl, FormMessage } from '@/components/ui/form'

import { Input } from '@/components/ui/input'
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import * as z from "zod";
import { Textarea } from '@/components/ui/textarea';
import axiosInstance from "@/utils/axiosInstance"
import { Loader2, Plus, Trash2 } from 'lucide-vue-next';
import { toast } from 'vue-sonner';

interface Component {
  id?: number;
  name: string;
  description: string;
}

interface System {
  id: number;
  name: string;
  description: string;
  components: Component[];
}

interface Props {
  initialSystem?: System | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'success'): void;
}>();

const isLoading = ref(false);

const componentInputs = ref<Component[]>(Array(2).fill(null).map(() => ({ 
  name: '', 
  description: '' 
})));

// Relaxed validation schema - validate properly on submit instead
const formSchema = toTypedSchema(
  z.object({
    id: z.number().optional(),
    name: z.string().min(2, "Name must be at least 2 characters").max(100),
    description: z.string().optional().or(z.literal('')),
    components: z.array(
      z.object({
        id: z.number().optional(),
        name: z.string().max(100), // No minimum during editing
        description: z.string().optional().or(z.literal('')),
      })
    ).optional() // Make components optional during form validation
  })
);

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    id: undefined,
    name: '',
    description: '',
    components: [],
  }
});

const updateComponents = () => {
  form.setFieldValue(
    "components",
    componentInputs.value.map(c => ({
      ...(c.id && { id: c.id }),
      name: c.name,
      description: c.description
    }))
  );
};

const addComponentInput = () => {
  componentInputs.value.push({ name: '', description: '' });
  updateComponents();
};

const removeComponentInput = (index: number) => {
  if (componentInputs.value.length > 1) {
    componentInputs.value.splice(index, 1);
    updateComponents();
  }
};

const initializeForm = async (system: System) => {
  form.setValues({
    id: system.id,
    name: system.name,
    description: system.description || '',
    components: system.components || [],
  });
  componentInputs.value = system.components && system.components.length > 0 ? 
    system.components.map(c => ({ 
      id: c.id,
      name: c.name, 
      description: c.description || '' 
    })) : 
    [{ name: '', description: '' }, { name: '', description: '' }];
  updateComponents();
};

watch(() => props.initialSystem, (newSystem) => {
  if (newSystem) {
    initializeForm(newSystem);
  } else {
    form.resetForm();
    componentInputs.value = [{ name: '', description: '' }, { name: '', description: '' }];
    updateComponents();
  }
}, { immediate: true });

const onSubmit = form.handleSubmit(async (values) => {
  isLoading.value = true;
  try {
    // Filter and validate components at submit time
    const validComponents = componentInputs.value
      .filter((component) => component.name.trim() !== "")
      .map((component) => ({
        ...(component.id && { id: component.id }),
        name: component.name.trim(),
        description: component.description?.trim() || ''
      }));

    // Custom validation
    if (validComponents.length === 0) {
      toast.error("At least one component with a name is required");
      isLoading.value = false;
      return;
    }

    // Check minimum length
    const invalidComponents = validComponents.filter(c => c.name.length < 2);
    if (invalidComponents.length > 0) {
      toast.error("All component names must have at least 2 characters");
      isLoading.value = false;
      return;
    }

    const systemData = {
      name: values.name.trim(),
      description: values.description?.trim() || '',
      components: validComponents,
    };

    console.log('Submitting system data:', systemData);
    if (values.id) {
      await axiosInstance.put(`/systems/${values.id}/`, systemData);
      toast.success("System updated successfully");
    } else {
      await axiosInstance.post('/systems/', systemData);
      toast.success("System created successfully");
    }
    emit('success');
  }
  catch (error) {
    console.error('Error submitting form:', error);
    toast.error("Error submitting form");
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <DialogHeader>
    <DialogTitle>
      {{ form.values.id ? 'Edit System' : 'Add System' }}
    </DialogTitle>
    <DialogDescription class="mb-4">
      {{ form.values.id ? 'Update the details of the system.' : 'Fill in the details to create a new system.' }}
    </DialogDescription>
  </DialogHeader>

  <form @submit="onSubmit" class="space-y-6">
    <FormField name="name" v-slot="{ field }">
      <FormItem>
        <FormLabel class="required">Name</FormLabel>
        <FormControl>
          <Input v-bind="field" v-model="form.values.name" placeholder="Enter system name" />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <FormField name="description" v-slot="{ field }">
      <FormItem>
        <FormLabel>Description</FormLabel>
        <FormControl>
          <Textarea v-bind="field" v-model="form.values.description" placeholder="Enter system description" rows="3" />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <div class="space-y-4">
      <FormField v-slot="{field}" name="components">
        <FormItem>
          <FormLabel class="required">Components</FormLabel>
          <div v-for="(component, index) in componentInputs" :key="index" class="border p-4 rounded-lg">
            <div class="flex flex-col gap-2 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <span class="text-sm text-gray-500">Component {{ index + 1 }}</span>
              <div class="space-y-2">
                <Input 
                  v-model="component.name" 
                  placeholder="Enter component name (min. 2 characters)"
                  @update:modelValue="updateComponents"
                  autocomplete="off"
                />
                <Textarea
                  v-model="component.description"
                  @update:modelValue="updateComponents"
                  placeholder="Enter component description"
                  :rows="2"
                  autocomplete="off"
                />
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                type="button"
                class="self-end text-red-600 hover:text-red-500"
                @click="removeComponentInput(index)"
                :disabled="componentInputs.length <= 1">
                <Trash2 class="h-4 w-4" />
                Remove
              </Button>
            </div>
          </div>
        
          <Button 
            variant="outline" 
            size="sm" 
            class="w-fit mt-2"
            @click="addComponentInput"
            type="button">
            <Plus class="h-4 w-4 mr-2" />
            Add Component
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
      <Button type="submit" :disabled="isLoading">
        <Loader2 v-if="isLoading" class="h-4 w-4 mr-2 animate-spin" />
        {{ isLoading ? (form.values.id ? 'Updating...' : 'Creating...') : (form.values.id ? 'Update System' : 'Create System') }}
      </Button>
    </div>
  </form>
</template>