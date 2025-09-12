<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
  Dialog, DialogScrollContent, DialogTrigger, DialogContent,
  DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose
} from '@/components/ui/dialog';
import ListItems from '@/components/ListItems.vue';
import axiosInstance from "@/utils/axiosInstance"
import {formatDate} from '@/utils/formatDate';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Manufacturer {
  id: number;
  name: string;
  system_name: string;
}
</script>
<template>
  <div class="flex flex-col gap-4 pt-0 bg-green-50/50">
    <div class="flex flex-col gap-4 p-4 bg-white rounded-lg shadow-md">
      <h1 class="text-2xl font-bold mb-4">Manufacturers</h1>
      <p class="mb-4">This is the Manufacturers view where you can manage manufacturer information.</p>
      <!-- Add your manufacturer management components here -->
      <p class="text-muted-foreground">More features coming soon!</p>
    </div>
  </div>
</template>