<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
const props = defineProps({
  country: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: 'Enter a location',
  },
  disabled: {
    type: Boolean,
    default: false,
  }
});

const emit = defineEmits(['place-selected', 'error']);

const autocompleteInput = ref(null);
const searchQuery = ref('');
const selectedPlace = ref(null);
let autocomplete = null;

const apiKey = import.meta.env.VITE_PLACES_KEY;

const loadGoogleMapsScript = () => {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => setTimeout(resolve, 100);
    script.onerror = (error) => reject(new Error('Failed to load Google Maps script: ' + error));
    
    document.head.appendChild(script);
  });
};

const initAutocomplete = () => {
  if (!autocompleteInput.value) {
    console.error('Autocomplete input element not found');
    return;
  }

  const options = {
    types: ['geocode', 'establishment'],
    fields: ['formatted_address', 'geometry', 'name', 'place_id'],
  };

  if (props.country) {
    options.componentRestrictions = { country: props.country };
  }

  if (autocomplete) {
    google.maps.event.clearInstanceListeners(autocomplete);
  }

  try {
    autocomplete = new google.maps.places.Autocomplete(
      autocompleteInput.value,
      options
    );

    autocomplete.addListener('place_changed', handlePlaceSelect);
    console.log('Autocomplete initialized successfully');
  } catch (error) {
    console.error('Error initializing autocomplete:', error);
    emit('error', error);
  }
};

const handlePlaceSelect = () => {
  const place = autocomplete.getPlace();
  
  if (!place.geometry) {
    console.warn('No geometry found for selected place');
    emit('error', new Error('No geometry found for selected place'));
    return;
  }

  console.log('Selected place details:', place);
  console.log('Latitude:', place.geometry.location.lat());
  console.log('Longitude:', place.geometry.location.lng());

  selectedPlace.value = place;
  searchQuery.value = place.formatted_address || place.name;
  
  emit('place-selected', {
    place_id: place.place_id,
    formatted_address: place.formatted_address || place.name,
    latitude: place.geometry.location.lat(),
    longitude: place.geometry.location.lng(),
  });
};

const handleInput = () => {
  selectedPlace.value = null;
};

const handleFocus = () => {
  if (!autocomplete) {
    initAutocomplete();
  }
};

onMounted(async () => {
  try {
    await loadGoogleMapsScript();
    await initAutocomplete();
  } catch (error) {
    console.error('Failed to initialize places autocomplete:', error);
    emit('error', error);
  }
});

onUnmounted(() => {
  if (autocomplete) {
    google.maps.event.clearInstanceListeners(autocomplete);
  }
});

watch(() => props.country, (newCountry) => {
  if (autocomplete) {
    autocomplete.setComponentRestrictions({
      country: newCountry || []
    });
  }
});
</script>

<template>
  <div class="google-places-autocomplete">  
    <input
      ref="autocompleteInput"
      v-model="searchQuery"
      :placeholder="placeholder"
      class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      @input="handleInput"
      @focus="handleFocus"
      @keydown.enter.prevent
      autocomplete="off"
      :disabled="disabled"
    />
  </div>
</template>