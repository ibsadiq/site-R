<script setup lang="ts">
import { ref, watch } from 'vue'
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



interface Manufacturer{
    id: number;
    name: string;
}
interface Props {
  initialManufacturer?: Manufacturer | null;
}
const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'success'): void;
}>();

const isLoading = ref(false);


const formSchema = toTypedSchema(
  z.object({
    id: z.number().optional(),
    name: z.string().min(2, "Name must be at least 2 characters").max(100),
  })
);

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    id: undefined,
    name:'',
  },
});

const initializeForm = async (manufacturer: Manufacturer) => {
    try {

        form.setValues({
            id: manufacturer.id,
            name: manufacturer.name,
        });
    } catch (error) {
        console.error('Error initializing form:', error);
    }
}

watch(() => props.initialManufacturer, (newVal) => {
    if (newVal) {
        initializeForm(newVal);
    } else {
        form.resetForm();
    }
}, { immediate: true });

const onSubmit = form.handleSubmit(async (values) => {
  isLoading.value = true;
  try {
    if (values.id) {
      // Update existing manufacturer
      await axiosInstance.put(`/manufacturers/${values.id}/`, {
        name: values.name,
      });
    } else {
      // Create new manufacturer
      await axiosInstance.post('/manufacturers/', {
        name: values.name,
      });
    }
    emit('success');
    form.resetForm();
  } catch (error) {
    console.error('Error submitting form:', error);
  } finally {
    isLoading.value = false;
  }
});
</script>
<template>
    <DialogHeader>
        <DialogTitle>
            {{  form.values.id ? 'Edit Manufacturer' : 'New Manufacturer' }}
        </DialogTitle>
        <DialogDescription>
            {{ form.values.id ? 'Update the details of the manufacturer.' : 'Fill in the details to add a new manufacturer.' }}
        </DialogDescription>
    </DialogHeader>
    
    <form @submit.prevent="onSubmit" class="space-y-4">

        <FormField v-slot="{ field }" name="name">
            <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                    <Input v-bind="field" v-model="form.values.name" placeholder="Manufacturer Name" />
                </FormControl>
                <FormMessage />
            </FormItem>
        </FormField>

        <div class="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" :disabled="isLoading">
                Cancel
            </Button>
            <Button type="submit" variant="default" :disabled="isLoading">
                <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin"/>
                {{ isLoading ? (form.values.id ? 'Update' : 'Create' ) : (form.values.id ? 'Update' : 'Create' ) }}
            </Button>
        </div>
    </form>

</template>