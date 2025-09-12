<template>
  <div ref="mapContainer" class="map-container" style="height: 300px; width: 100%;"></div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import L from 'leaflet'
import "leaflet/dist/leaflet.css"

const props = defineProps({
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  boundary: { type: Number, default: 50 },
  zoom: { type: Number, default: 16 },
})

const mapContainer = ref(null)
let mapInstance = null
let marker = null
let circle = null

onMounted(() => {
  mapInstance = L.map(mapContainer.value).setView([props.latitude, props.longitude], props.zoom)

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(mapInstance)

  marker = L.marker([props.latitude, props.longitude]).addTo(mapInstance)
  circle = L.circle([props.latitude, props.longitude], {
    radius: props.boundary,
    color: "#3388ff",
    weight: 2,
    fillColor: "#3388ff",
    fillOpacity: 0.2
  }).addTo(mapInstance)

  marker.bindPopup(`
    <strong>Latitude:</strong> ${props.latitude}<br/>
    <strong>Longitude:</strong> ${props.longitude}<br/>
    <strong>Boundary Radius:</strong> ${props.boundary}m
  `)
})

// Watch for prop changes (reactive updates)
watch(() => [props.latitude, props.longitude, props.boundary], ([lat, lng, boundary]) => {
  if (mapInstance) {
    marker.setLatLng([lat, lng])
    circle.setLatLng([lat, lng])
    circle.setRadius(boundary)
    mapInstance.setView([lat, lng])
  }
})
</script>

<style>
.map-container {
  position: relative;
  z-index: 0;
}
</style>
