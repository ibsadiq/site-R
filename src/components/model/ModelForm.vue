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


interface Manufacturer {
  id: number;
  name: string;
}
interface Model {
  id?: number;
  name: string;
  description: string;
  manufacturer: number;
  manufacturer_name?: string;
  creation_date?: string;
  last_update?: string;
}

interface Props {
  initialModel?: Model | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'success'): void;
}>();

const isLoading = ref(false);
const manufacturers = ref<Manufacturer[]>([]);

// Fetch manufacturers
const fetchManufacturers = async () => {
  try {
    const response = await axiosInstance.get('/manufacturers/');
    manufacturers.value = response.data.map((manufacturer: Manufacturer) => ({
      id: manufacturer.id,
      name: manufacturer.name
    }));
  } catch (error) {
    console.error('Error fetching manufacturers:', error);
  }
};

const formSchema = z.object({
    id: z.number().optional(),
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    manufacturer: z.string(),
});

const form = useForm({
  validationSchema: toTypedSchema(formSchema),
  initialValues: {
    id: undefined,
    name:'',
    description: '',
    manufacturer: '',
  },
});

watch(() => props.initialModel, (newModel) => {
  if (newModel) {
    form.setValues({
      id: newModel.id,
      name: newModel.name,
      description: newModel.description,
      manufacturer: newModel.manufacturer.toString(),
    });
  } else {
    form.resetForm();
  }
}, { immediate: true });

const onSubmit = form.handleSubmit(async (values) => {  
  isLoading.value = true;
  try {
    if (values.id) {
      // Update existing model
      await axiosInstance.put(`/models/${values.id}`, {
        name: values.name,
        description: values.description,
        manufacturer: parseInt(values.manufacturer),
      });
    } else {
      // Create new model
      await axiosInstance.post('/models/', {
        name: values.name,
        description: values.description,
        manufacturer: parseInt(values.manufacturer),
      });
    }
    emit('success');
  } catch (error) {
    console.error('Error saving model:', error);
  } finally {
    isLoading.value = false;
  }
});

onMounted(() => {
  fetchManufacturers();
});


</script>

<template>
    <DialogHeader>
        <DialogTitle>{{ form.values.id ? 'Edit Model' : 'New Model' }}</DialogTitle>
        <DialogDescription>
            {{ form.values.id ? 'Update the details of the model.' : 'Fill in the details to create a new model.' }}
        </DialogDescription>
    </DialogHeader>

    <form @submit.prevent="onSubmit" class="space-y-4">
        <FormField v-slot="{field}" name="manufacturer">
            <FormItem>
                <FormLabel>Manufacturer</FormLabel>
                <FormControl>
                    <Select v-bind="field" >
                        <SelectTrigger class="w-full">
                            <SelectValue placeholder="Select Manufacturer" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectItem 
                                    v-for="manufacturer in manufacturers" 
                                    :key="manufacturer.id" 
                                    :value="manufacturer.id.toString()"
                                >
                                    {{ manufacturer.name }}
                                </SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </FormControl>
                <FormMessage />
            </FormItem>
        </FormField>
        <FormField v-slot="{field}" name="name">
            <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                    <Input type="text" placeholder="Model Name" v-bind="field" />
                </FormControl>
                <FormMessage />
            </FormItem>
        </FormField>
        <FormField v-slot="{field}" name="description">
            <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                    <Input type="text" placeholder="Model Description" v-bind="field" />
                </FormControl>
                <FormMessage />
            </FormItem>
        </FormField>

        <div class="flex justify-end gap-4">
            <Button variant="outline" type="button" @click="form.resetForm()" :disabled="isLoading">
                Reset
            </Button>
            <Button type="submit" :disabled="isLoading">
                <Loader2 v-if="isLoading" class="w-4 h-4 mr-2 animate-spin" />
                {{ form.values.id ? 'Update Model' : 'Create Model' }}
            </Button>
        </div>
    </form>
</template>