<template>
  <div class="grid min-h-full flex-1 lg:grid-cols-[0.9fr_1.4fr]">
    <section
      ref="leftPanel"
      class="relative overflow-hidden bg-[radial-gradient(circle_at_top,rgba(253,224,196,0.42),transparent_26%),linear-gradient(180deg,#7b3a20_0%,#5e2d18_42%,#3d1e12_100%)] px-6 py-8 text-white sm:px-8 lg:px-10 lg:py-10"
    >
      <div
        class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,244,230,0.18),transparent_28%),radial-gradient(circle_at_75%_30%,rgba(245,189,142,0.14),transparent_30%)]"
      />

      <div class="relative flex h-full flex-col">
        <div
          ref="crumbs"
          class="mb-8 flex items-center gap-3 text-[11px] font-semibold tracking-[0.34em] text-white/70"
        >
          <span>{{ bookMeta.category }}</span>
          <span class="h-px w-6 bg-white/30" />
          <span>{{ bookMeta.topic }}</span>
        </div>

        <button
          ref="coverWrap"
          type="button"
          class="group relative mx-auto mb-10 mt-2 w-full max-w-[280px] rounded-[28px] border border-white/10 bg-white/10 p-4 text-left shadow-cover backdrop-blur"
          @click="openReader"
          @mousemove="handleTilt"
          @mouseleave="resetTilt"
        >
          <div
            class="absolute inset-0 rounded-[24px] bg-[linear-gradient(135deg,rgba(255,248,238,0.22),rgba(255,255,255,0.03))]"
          />
          <div
            ref="coverCard"
            class="preserve-3d relative overflow-hidden rounded-[22px] transition-transform duration-300"
          >
            <PdfCover
              :cover-image="coverPreview"
              :loading="coverLoading"
              :aspect-ratio="coverAspectRatio"
              :alt="displayTitle"
              :fallback-title="displayTitle"
            />
          </div>
        </button>

        <div ref="leftMeta" class="mt-auto flex flex-col gap-8 text-sm text-white/78">
          <div class="flex items-center gap-3">
            <span class="text-xs uppercase tracking-[0.28em] text-white/46">Get in touch</span>
            <div class="flex items-center gap-3">
              <button
                v-for="icon in socialIcons"
                :key="icon.label"
                type="button"
                class="rounded-full border border-white/12 bg-white/5 p-2.5 transition duration-200 hover:border-white/30 hover:bg-white/10"
                :aria-label="icon.label"
              >
                <component :is="icon.icon" class="h-4 w-4" />
              </button>
            </div>
          </div>

          <!-- <div class="rounded-[22px] border border-white/10 bg-white/[0.08] p-5 backdrop-blur-sm">
            <p class="text-xs uppercase tracking-[0.28em] text-white/45">
              Format
            </p>
            <div class="mt-4 flex flex-wrap gap-3">
              <span
                v-for="item in availabilityTags"
                :key="item"
                class="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white"
              >
                {{ item }}
              </span>
            </div>
          </div> -->
        </div>
      </div>
    </section>

    <section
      ref="rightPanel"
      class="relative overflow-hidden bg-[linear-gradient(180deg,#fffaf4_0%,#f5ede1_100%)] px-6 py-8 text-slate-900 sm:px-8 lg:px-12 lg:py-10"
    >
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(210,140,96,0.14),transparent_30%)]" />

      <div class="relative flex h-full flex-col">
        <div ref="tabNav" class="flex flex-wrap items-center gap-6 border-b border-[#e8d6c5] pb-4">
          <button
            v-for="tab in recipeTabs"
            :key="tab.id"
            ref="tabRefs"
            type="button"
            class="relative pb-2 text-sm font-semibold transition"
            :class="activeTab === tab.id ? 'text-[#582817]' : 'text-[#b08e78] hover:text-[#85553f]'"
            @click="setActiveTab(tab.id)"
          >
            {{ tab.label }}
          </button>
          <span
            ref="underline"
            class="pointer-events-none absolute bottom-4 left-0 h-[3px] rounded-full bg-[#bf5b35]"
          />
        </div>

        <div ref="contentBlock" class="flex flex-1 flex-col">
          <div class="mt-8 flex items-center justify-between gap-4 text-sm text-[#a9866f]">
            <span>{{ displayYear }}</span>
            <div class="flex items-center gap-2 text-[#c9683e]">
              <Star
                v-for="starIndex in 5"
                :key="starIndex"
                class="h-4 w-4 fill-current"
                :class="starIndex <= Math.round(bookMeta.rating) ? 'opacity-100' : 'opacity-25'"
              />
              <span class="ml-1 text-sm font-semibold text-[#74412c]">
                {{ bookMeta.rating }} / 5
              </span>
              <span class="text-[#b08e78]">({{ totalPagesLabel }})</span>
            </div>
          </div>

          <div class="mt-5">
            <h2 class="max-w-[11ch] font-display text-6xl leading-[0.92] tracking-[-0.03em] text-[#5b2c1a] sm:text-7xl">
              {{ displayTitle }}
            </h2>
            <p class="mt-4 text-lg font-medium text-[#9d7b66]">
              by <span class="text-[#74412c]">{{ displayAuthor }}</span>
            </p>
          </div>

          <transition mode="out-in" @enter="animateTabPanelIn" @leave="animateTabPanelOut">
            <div :key="activeTab" class="mt-10 max-w-2xl">
              <p class="text-[1.08rem] leading-8 text-[#7c5d4a]">
                {{ activePanel.copy }}
              </p>
            </div>
          </transition>

          <div class="mt-8 max-w-2xl">
            <p class="font-display text-[1.85rem] leading-tight text-[#5b2c1a]">
              {{ bookMeta.description }}
            </p>
          </div>

          <div class="mt-8 flex flex-wrap gap-3">
            <div class="rounded-full border border-[#e4c4ac] bg-white/70 px-4 py-2 text-sm font-semibold text-[#8a593f]">
              {{ pageFormatLabel }}
            </div>
            <div class="rounded-full border border-[#e4c4ac] bg-white/70 px-4 py-2 text-sm font-semibold text-[#8a593f]">
              {{ totalPagesLabel }}
            </div>
          </div>

          <div class="mt-auto flex flex-col gap-4 pt-10 sm:flex-row">
            <button
              ref="readButton"
              type="button"
              class="cta-button group flex items-center justify-center gap-3 rounded-full bg-[#bf5b35] px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-white shadow-[0_18px_30px_rgba(191,91,53,0.22)]"
              @mouseenter="handleMagneticEnter"
              @mousemove="handleMagneticMove"
              @mouseleave="handleMagneticLeave"
              @click="openReader"
            >
              <BookOpen class="h-4 w-4 transition group-hover:rotate-6" />
              READ RECIPE
            </button>
          </div>
        </div>
      </div>
    </section>

    <PDFReader
      :open="readerOpen"
      :pdf-url="pdfUrl"
      :title="displayTitle"
      @close="closeReader"
    />
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { gsap } from 'gsap'
import {
  BookOpen,
  Headphones,
  Instagram,
  Facebook,
  Link2,
  Star,
} from 'lucide-vue-next'
import PDFReader from './PDFReader.vue'
import PdfCover from './PdfCover.vue'
import { bookMeta, recipeTabs } from '../data/recipeBook'
import { getPdfPreview } from '../lib/pdf'

const leftPanel = ref(null)
const rightPanel = ref(null)
const crumbs = ref(null)
const coverWrap = ref(null)
const coverCard = ref(null)
const leftMeta = ref(null)
const contentBlock = ref(null)
const tabNav = ref(null)
const tabRefs = ref([])
const underline = ref(null)
const readButton = ref(null)
const listenButton = ref(null)

const activeTab = ref('info')
const readerOpen = ref(false)
const pdfSummary = ref(null)
const coverPreview = ref('')
const coverLoading = ref(true)
const pdfUrl = '/sample-recipe.pdf'
let ctx

const socialIcons = [
  { label: 'Instagram', icon: Instagram },
  { label: 'Facebook', icon: Facebook },
  { label: 'Copy Link', icon: Link2 },
]

const activePanel = computed(
  () => recipeTabs.find((tab) => tab.id === activeTab.value) ?? recipeTabs[0],
)

const displayTitle = computed(() => {
  const title = pdfSummary.value?.title?.trim()

  if (!title || title.toLowerCase().includes('story instagram')) {
    return bookMeta.title
  }

  return title
})

const displayAuthor = computed(() => pdfSummary.value?.author?.trim() || bookMeta.author)
const displayYear = computed(() => pdfSummary.value?.year || bookMeta.year)
const coverAspectRatio = computed(() => pdfSummary.value?.aspectRatio || 9 / 16)
const availabilityTags = computed(() => [
  `${Math.round(pdfSummary.value?.width || 810)} × ${Math.round(pdfSummary.value?.height || 1440)}`,
  'PDF.js + StPageFlip',
  'Interactive Reader',
])
const totalPagesLabel = computed(() => `${pdfSummary.value?.pages || 0} halaman PDF`)
const pageFormatLabel = computed(() => {
  const width = Math.round(pdfSummary.value?.width || 810)
  const height = Math.round(pdfSummary.value?.height || 1440)
  return width === 810 && height === 1440 ? 'Format 9:16' : `Format ${width} × ${height}`
})

const loadPdfCover = async () => {
  coverLoading.value = true

  try {
    const preview = await getPdfPreview(pdfUrl, 0.9)
    pdfSummary.value = preview.summary
    coverPreview.value = preview.cover.src
  } catch {
    pdfSummary.value = null
    coverPreview.value = ''
  } finally {
    coverLoading.value = false
  }
}

const animateEntrance = () => {
  ctx = gsap.context(() => {
    // Stagger the hero panels so the composition feels editorial on first paint.
    gsap.set([leftPanel.value, rightPanel.value], { willChange: 'transform, opacity' })
    gsap
      .timeline({ defaults: { ease: 'power3.out' } })
      .from(leftPanel.value, { x: -72, opacity: 0, duration: 0.92 })
      .from(
        [crumbs.value, coverWrap.value, leftMeta.value],
        { y: 26, opacity: 0, duration: 0.72, stagger: 0.12 },
        '-=0.54',
      )
      .from(
        [tabNav.value, contentBlock.value, readButton.value, listenButton.value],
        { y: 28, opacity: 0, duration: 0.7, stagger: 0.08 },
        '-=0.52',
      )
  })
}

const updateUnderline = () => {
  const currentIndex = recipeTabs.findIndex((tab) => tab.id === activeTab.value)
  const target = tabRefs.value[currentIndex]

  if (!target || !underline.value || !tabNav.value) {
    return
  }

  const navRect = tabNav.value.getBoundingClientRect()
  const targetRect = target.getBoundingClientRect()

  gsap.to(underline.value, {
    x: targetRect.left - navRect.left,
    width: targetRect.width,
    duration: 0.42,
    ease: 'power3.out',
  })
}

const setActiveTab = async (tabId) => {
  activeTab.value = tabId
  await nextTick()
  updateUnderline()
}

const handleTilt = (event) => {
  if (!coverCard.value) {
    return
  }

  // Keep the cover interaction transform-only for a smooth 3D tilt.
  const rect = coverCard.value.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  const rotateY = ((x / rect.width) - 0.5) * 14
  const rotateX = (0.5 - y / rect.height) * 12

  gsap.to(coverCard.value, {
    rotateX,
    rotateY,
    transformPerspective: 1200,
    transformOrigin: 'center',
    duration: 0.28,
    ease: 'power2.out',
  })
}

const resetTilt = () => {
  if (!coverCard.value) {
    return
  }

  gsap.to(coverCard.value, {
    rotateX: 0,
    rotateY: 0,
    duration: 0.42,
    ease: 'power3.out',
  })
}

const handleMagneticEnter = (event) => {
  gsap.to(event.currentTarget, {
    scale: 1.02,
    duration: 0.22,
    ease: 'power2.out',
  })
}

const handleMagneticMove = (event) => {
  const element = event.currentTarget
  const rect = element.getBoundingClientRect()
  const x = event.clientX - rect.left - rect.width / 2
  const y = event.clientY - rect.top - rect.height / 2

  // A restrained pointer follow reads as premium without destabilizing the CTA.
  gsap.to(element, {
    x: x * 0.12,
    y: y * 0.18,
    duration: 0.35,
    ease: 'power3.out',
  })
}

const handleMagneticLeave = (event) => {
  gsap.to(event.currentTarget, {
    x: 0,
    y: 0,
    scale: 1,
    duration: 0.42,
    ease: 'elastic.out(1, 0.4)',
  })
}

const animateTabPanelIn = (element, done) => {
  gsap.fromTo(
    element,
    { y: 18, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.36, ease: 'power2.out', onComplete: done },
  )
}

const animateTabPanelOut = (element, done) => {
  gsap.to(element, {
    y: -12,
    opacity: 0,
    duration: 0.22,
    ease: 'power2.in',
    onComplete: done,
  })
}

const openReader = () => {
  readerOpen.value = true
}

const closeReader = () => {
  readerOpen.value = false
}

onMounted(async () => {
  await loadPdfCover()
  animateEntrance()
  await nextTick()
  updateUnderline()
  window.addEventListener('resize', updateUnderline)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateUnderline)
  ctx?.revert()
})
</script>
