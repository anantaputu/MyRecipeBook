<template>
  <main class="min-h-screen bg-ink-950 px-4 py-4 text-white sm:px-6 lg:px-8">
    <section
      class="mx-auto flex min-h-[calc(100vh-2rem)] max-w-7xl overflow-hidden rounded-[32px] bg-white shadow-panel"
    >
      <BookDetail />
    </section>
  </main>
</template>

<script setup>
import BookDetail from './BookDetail.vue'
</script>
