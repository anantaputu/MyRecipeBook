<template>
  <div
    class="relative overflow-hidden rounded-[24px] border border-[#d6b6a2]/40 bg-[#f6ecdf] shadow-[0_24px_60px_rgba(78,42,22,0.22)]"
    :style="{ aspectRatio: imageAspectRatio }"
  >
    <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-[#f6ecdf]">
      <div class="h-12 w-12 animate-spin rounded-full border-2 border-[#d28e67]/20 border-t-[#bf5b35]" />
    </div>

    <img
      v-if="coverImage"
      :src="coverImage"
      :alt="alt"
      class="block h-full w-full object-cover"
    />

    <div
      v-else-if="!loading"
      class="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top,rgba(222,163,126,0.28),transparent_38%),#f6ecdf]"
    >
      <p class="px-8 text-center font-display text-4xl leading-none text-[#b65130]">
        {{ fallbackTitle }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  coverImage: {
    type: String,
    default: '',
  },
  loading: {
    type: Boolean,
    default: false,
  },
  aspectRatio: {
    type: Number,
    default: 9 / 16,
  },
  alt: {
    type: String,
    default: 'Recipe book cover',
  },
  fallbackTitle: {
    type: String,
    default: 'My Recipe Book',
  },
})

const imageAspectRatio = computed(() => `${props.aspectRatio}`)
</script>
