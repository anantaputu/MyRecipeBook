<template>
  <teleport to="body">
    <transition :css="false" @enter="handleOverlayEnter" @leave="handleOverlayLeave">
      <div
        v-if="open"
        class="fixed inset-0 z-50 overflow-hidden bg-[radial-gradient(circle_at_top,rgba(246,204,171,0.16),transparent_24%),rgba(34,16,11,0.94)] px-2 py-2 text-white backdrop-blur-md sm:px-4 sm:py-4 lg:px-6 lg:py-5"
      >
        <div class="mx-auto flex h-full max-w-7xl flex-col rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(115,56,31,0.20),rgba(49,23,16,0.28))] p-2 shadow-cover backdrop-blur-xl sm:p-3">
          <div class="relative flex min-h-0 flex-1 flex-col">
            <button
              ref="closeButton"
              type="button"
              class="absolute right-2 top-2 z-30 rounded-full border border-white/12 bg-slate-950/45 p-3 text-white transition hover:bg-slate-950/60 sm:right-3 sm:top-3"
              aria-label="Close reader"
              @click="emitClose"
            >
              <X class="h-5 w-5" />
            </button>

            <div
              class="pointer-events-none absolute left-1/2 top-2 z-30 -translate-x-1/2 rounded-full border border-white/10 bg-slate-950/45 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80 sm:top-3 sm:px-4"
            >
              {{ singlePageMode ? 'Page' : 'Spread' }} {{ currentViewNumber }} / {{ totalViews }}
            </div>

            <div
              v-if="loading"
              class="absolute inset-0 z-20 flex flex-col items-center justify-center gap-5 rounded-[24px] bg-slate-950/72"
            >
              <div ref="spinner" class="h-14 w-14 rounded-full border-2 border-white/15 border-t-[#d97a4f]" />
              <div class="text-center">
                <p class="text-sm font-semibold uppercase tracking-[0.28em] text-white/55">
                  Loading pages
                </p>
                <p class="mt-2 text-sm text-white/70">
                  Preparing image spreads...
                </p>
              </div>
            </div>

            <div
              class="grid flex-1 min-h-0 gap-2 sm:gap-3"
              :class="singlePageMode ? 'grid-cols-1' : 'lg:grid-cols-[auto_1fr_auto] lg:items-center'"
            >
              <button
                type="button"
                class="absolute left-2 top-1/2 z-30 hidden h-12 w-12 -translate-y-1/2 items-center justify-center self-center rounded-full border border-white/10 bg-slate-950/45 text-white transition hover:bg-slate-950/60 disabled:cursor-not-allowed disabled:opacity-35 lg:flex"
                :disabled="currentPageIndex === 0 || loading || transitionActive"
                @click="goToPrevious"
              >
                <ChevronLeft class="h-5 w-5" />
              </button>

              <div
                class="relative min-h-0 overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,246,239,0.10),rgba(255,255,255,0.02))] p-1 sm:p-2"
                @touchstart.passive="onTouchStart"
                @touchend.passive="onTouchEnd"
              >
                <div class="flex h-full min-h-[320px] items-center justify-center py-1 sm:min-h-[360px]">
                  <div class="relative flex w-full max-w-full items-center justify-center" :style="pageStageStyle">
                    <article
                      v-if="displayedPages.length"
                      ref="pageCard"
                      class="relative w-full max-w-full overflow-visible rounded-[24px] bg-[#f8efe5] p-2 shadow-cover sm:p-4"
                    >
                      <div
                        class="pointer-events-none absolute inset-y-3 left-1/2 hidden w-10 -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(85,47,28,0.18),rgba(85,47,28,0.08)_38%,transparent_74%)] blur-md lg:block"
                        :class="singlePageMode ? 'lg:hidden' : ''"
                      />
                      <div
                        class="pointer-events-none absolute inset-y-5 left-1/2 hidden w-px -translate-x-1/2 bg-[#d8c4b2] lg:block"
                        :class="singlePageMode ? 'lg:hidden' : ''"
                      />
                      <div
                        class="pointer-events-none absolute inset-y-4 left-1/2 hidden w-16 -translate-x-1/2 bg-[linear-gradient(90deg,transparent,rgba(68,37,23,0.12),transparent)] lg:block"
                        :class="singlePageMode ? 'lg:hidden' : ''"
                      />

                      <div
                        class="grid items-start gap-2 transition-opacity duration-200 sm:gap-3"
                        :class="[
                          turnTransition ? 'opacity-0' : 'opacity-100',
                          singlePageMode ? 'grid-cols-1' : 'grid-cols-2',
                        ]"
                      >
                        <div
                          v-for="page in displayedPages"
                          :key="`${page.id}-${renderCycle}`"
                          class="reader-page-turn relative overflow-hidden rounded-[18px] bg-white shadow-[inset_0_0_0_1px_rgba(15,23,42,0.06)]"
                          :class="singlePageMode ? 'mx-auto w-full max-w-[26rem]' : 'w-full'"
                          :style="{ aspectRatio: `${page.width} / ${page.height}` }"
                        >
                          <img :src="page.src" alt="" class="block h-full w-full object-cover" />
                          <div class="pointer-events-none absolute inset-y-0 left-0 w-5 bg-[linear-gradient(90deg,rgba(33,19,14,0.08),transparent)]" />
                          <div class="pointer-events-none absolute inset-y-0 right-0 w-5 bg-[linear-gradient(270deg,rgba(33,19,14,0.06),transparent)]" />
                          <div class="pointer-events-none absolute bottom-3 right-3 rounded-full bg-slate-950/76 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80">
                            {{ pageNumber(page.id) }}
                          </div>
                        </div>
                      </div>

                      <div
                        v-if="turnTransition"
                        ref="transitionOverlay"
                        class="pointer-events-none absolute inset-2 z-20 grid items-start gap-2 sm:inset-4 sm:gap-3"
                        :class="turnTransition.singlePageMode ? 'grid-cols-1' : 'grid-cols-2'"
                      >
                        <div
                          v-for="(page, index) in turnTransition.fromPages"
                          :key="`from-${page.id}-${turnTransition.key}`"
                          :ref="(el) => registerTransitionRef('from', el, index)"
                          class="reader-page-turn relative overflow-hidden rounded-[18px] bg-white shadow-[0_18px_24px_rgba(53,29,18,0.12)]"
                          :class="turnTransition.singlePageMode ? 'mx-auto w-full max-w-[26rem]' : 'w-full'"
                          :style="{ aspectRatio: `${page.width} / ${page.height}` }"
                        >
                          <img :src="page.src" alt="" class="block h-full w-full object-cover" />
                        </div>
                        <div
                          v-for="(page, index) in turnTransition.toPages"
                          :key="`to-${page.id}-${turnTransition.key}`"
                          :ref="(el) => registerTransitionRef('to', el, index)"
                          class="reader-page-turn absolute inset-y-0 overflow-hidden rounded-[18px] bg-white shadow-[0_18px_24px_rgba(53,29,18,0.12)]"
                          :class="[
                            turnTransition.singlePageMode ? 'mx-auto w-full max-w-[26rem] left-0 right-0' : transitionToSheetClass(index),
                          ]"
                          :style="{ aspectRatio: `${page.width} / ${page.height}` }"
                        >
                          <img :src="page.src" alt="" class="block h-full w-full object-cover" />
                        </div>
                      </div>
                    </article>
                  </div>
                </div>
              </div>

              <button
                type="button"
                class="absolute right-2 top-1/2 z-30 hidden h-12 w-12 -translate-y-1/2 items-center justify-center self-center rounded-full border border-white/10 bg-slate-950/45 text-white transition hover:bg-slate-950/60 disabled:cursor-not-allowed disabled:opacity-35 lg:flex"
                :disabled="!canAdvance || loading || transitionActive"
                @click="goToNext"
              >
                <ChevronRight class="h-5 w-5" />
              </button>
            </div>

            <div class="pointer-events-none absolute inset-x-0 bottom-3 z-30 flex justify-center px-3 lg:hidden">
              <div class="pointer-events-auto flex items-center gap-3 rounded-full border border-white/10 bg-slate-950/45 px-3 py-2 shadow-lg backdrop-blur">
                <button
                  type="button"
                  class="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/12 disabled:cursor-not-allowed disabled:opacity-35"
                  :disabled="currentPageIndex === 0 || loading || transitionActive"
                  @click="goToPrevious"
                >
                  <ChevronLeft class="h-4 w-4" />
                </button>
                <button
                  type="button"
                  class="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/12 disabled:cursor-not-allowed disabled:opacity-35"
                  :disabled="!canAdvance || loading || transitionActive"
                  @click="goToNext"
                >
                  <ChevronRight class="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { gsap } from 'gsap'
import { ChevronLeft, ChevronRight, X } from 'lucide-vue-next'

const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: 'Recipe Book' },
  pages: { type: Array, default: () => [] },
})

const emit = defineEmits(['close'])

const closeButton = ref(null)
const spinner = ref(null)
const pageCard = ref(null)
const transitionOverlay = ref(null)
const transitionFromRefs = ref([])
const transitionToRefs = ref([])
const viewportWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1280)
const currentPageIndex = ref(0)
const touchStartX = ref(0)
const turnTransition = ref(null)
const transitionActive = ref(false)
const loading = ref(false)
let spinnerTween
let pageTurnToken = 0

const singlePageMode = computed(() => viewportWidth.value < 1024)
const navigationStep = computed(() => (singlePageMode.value ? 1 : 2))
const displayedPages = computed(() =>
  props.pages.slice(currentPageIndex.value, currentPageIndex.value + navigationStep.value),
)
const canAdvance = computed(
  () => currentPageIndex.value + navigationStep.value < props.pages.length,
)
const totalViews = computed(() =>
  Math.max(1, Math.ceil(props.pages.length / navigationStep.value)),
)
const currentViewNumber = computed(
  () => Math.floor(currentPageIndex.value / navigationStep.value) + 1,
)
const baseAspectRatio = computed(() => {
  const page = props.pages[0]
  return page ? page.width / page.height : 810 / 1440
})
const spreadAspectRatio = computed(() =>
  singlePageMode.value ? baseAspectRatio.value : (baseAspectRatio.value * 2) + 0.03,
)
const pageStageStyle = computed(() => ({
  width: singlePageMode.value
    ? `min(100%, calc((100dvh - 8rem) * ${baseAspectRatio.value}))`
    : `min(100%, calc((100dvh - 5rem) * ${spreadAspectRatio.value}))`,
  maxWidth: singlePageMode.value ? '32rem' : '64rem',
}))

const registerTransitionRef = (type, element, index) => {
  if (!element) return
  if (type === 'from') {
    transitionFromRefs.value[index] = element
    return
  }
  transitionToRefs.value[index] = element
}

const playTimeline = (timeline) =>
  new Promise((resolve) => {
    timeline.eventCallback('onComplete', resolve)
    timeline.play(0)
  })

const preloadImages = async () => {
  loading.value = true
  spinnerTween?.kill()
  if (spinner.value) {
    spinnerTween = gsap.to(spinner.value, { rotate: 360, duration: 0.9, repeat: -1, ease: 'none' })
  }
  try {
    await Promise.all(
      props.pages.map(
        (page) =>
          new Promise((resolve, reject) => {
            const image = new Image()
            image.onload = resolve
            image.onerror = reject
            image.src = page.src
          }),
      ),
    )
  } finally {
    spinnerTween?.kill()
    spinnerTween = null
    loading.value = false
  }
}

const pageNumber = (id) => {
  const index = props.pages.findIndex((page) => page.id === id)
  return index + 1
}

const transitionToSheetClass = (index) => (
  index === 0 ? 'left-0 w-[calc(50%-0.375rem)]' : 'right-0 w-[calc(50%-0.375rem)]'
)

const resetReader = () => {
  currentPageIndex.value = 0
  turnTransition.value = null
  transitionActive.value = false
  transitionFromRefs.value = []
  transitionToRefs.value = []
  pageTurnToken += 1
}

const animateSpreadIntro = () => {
  if (!pageCard.value) return
  gsap.fromTo(
    pageCard.value,
    { opacity: 0, y: 18, scale: 0.988 },
    { opacity: 1, y: 0, scale: 1, duration: 0.48, ease: 'power3.out' },
  )
}

const animatePageTurn = async (direction, nextIndex) => {
  const token = ++pageTurnToken
  transitionActive.value = true
  turnTransition.value = {
    key: token,
    direction,
    fromPages: displayedPages.value.map((page) => ({ ...page })),
    toPages: props.pages.slice(nextIndex, nextIndex + navigationStep.value).map((page) => ({ ...page })),
    singlePageMode: singlePageMode.value,
  }

  await nextTick()

  const fromPanels = transitionFromRefs.value.filter(Boolean)
  const toPanels = transitionToRefs.value.filter(Boolean)
  const fromTurningPanel = direction === 'next' ? fromPanels[fromPanels.length - 1] : fromPanels[0]
  const toTurningPanel = direction === 'next' ? toPanels[0] : toPanels[toPanels.length - 1]

  toPanels.forEach((panel) => {
    gsap.set(panel, {
      opacity: 0.92,
      scale: 0.992,
      filter: 'drop-shadow(0 20px 28px rgba(53, 29, 18, 0.18))',
    })
  })

  if (toTurningPanel) {
    gsap.set(toTurningPanel, {
      rotateY: direction === 'next' ? 96 : -96,
      xPercent: direction === 'next' ? 6 : -6,
      transformPerspective: 2000,
      transformOrigin: direction === 'next' ? 'right center' : 'left center',
    })
  }

  const timeline = gsap.timeline({ paused: true })

  if (fromTurningPanel) {
    timeline.to(fromTurningPanel, {
      rotateY: direction === 'next' ? -104 : 104,
      xPercent: direction === 'next' ? -8 : 8,
      scale: 0.988,
      filter: 'drop-shadow(0 28px 36px rgba(53, 29, 18, 0.22))',
      transformPerspective: 2000,
      transformOrigin: direction === 'next' ? 'left center' : 'right center',
      duration: 0.62,
      ease: 'power1.inOut',
      force3D: true,
    }, 0)
  }

  if (toTurningPanel) {
    timeline.to(toTurningPanel, {
      rotateY: 0,
      xPercent: 0,
      scale: 1,
      opacity: 1,
      duration: 0.74,
      ease: 'power2.out',
      force3D: true,
    }, 0.12)
  }

  if (transitionOverlay.value) {
    timeline.to(transitionOverlay.value, {
      opacity: 0,
      duration: 0.18,
      ease: 'power1.out',
    }, 0.58)
  }

  await playTimeline(timeline)
  if (token !== pageTurnToken) return
  currentPageIndex.value = nextIndex
  turnTransition.value = null
  transitionActive.value = false
  transitionFromRefs.value = []
  transitionToRefs.value = []
}

const goToNext = async () => {
  if (!canAdvance.value || transitionActive.value || loading.value) return
  await animatePageTurn('next', currentPageIndex.value + navigationStep.value)
}

const goToPrevious = async () => {
  if (currentPageIndex.value === 0 || transitionActive.value || loading.value) return
  await animatePageTurn('previous', Math.max(0, currentPageIndex.value - navigationStep.value))
}

const onTouchStart = (event) => {
  touchStartX.value = event.changedTouches[0]?.clientX ?? 0
}

const onTouchEnd = (event) => {
  const endX = event.changedTouches[0]?.clientX ?? 0
  const delta = endX - touchStartX.value
  if (Math.abs(delta) < 40 || transitionActive.value || loading.value) return
  if (delta < 0) {
    goToNext()
    return
  }
  goToPrevious()
}

const emitClose = () => emit('close')

const handleOverlayEnter = (element, done) => {
  gsap.fromTo(element, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power2.out', onComplete: done })
}

const handleOverlayLeave = (element, done) => {
  const timeline = gsap.timeline({ onComplete: done })
  timeline.to(closeButton.value, { scale: 0.82, opacity: 0, duration: 0.18, ease: 'power2.in' })
  timeline.to(element, { opacity: 0, duration: 0.24, ease: 'power2.inOut' }, '-=0.08')
}

const handleKeydown = (event) => {
  if (!props.open) return
  if (event.key === 'Escape') {
    emitClose()
    return
  }
  if (event.key === 'ArrowRight') {
    goToNext()
    return
  }
  if (event.key === 'ArrowLeft') goToPrevious()
}

const handleResize = () => {
  viewportWidth.value = window.innerWidth
}

watch(
  singlePageMode,
  (isSinglePage) => {
    if (isSinglePage || currentPageIndex.value % 2 === 0) return
    currentPageIndex.value -= 1
  },
)

watch(
  () => props.open,
  async (isOpen) => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    if (isOpen) {
      resetReader()
      window.addEventListener('keydown', handleKeydown)
      window.addEventListener('resize', handleResize)
      handleResize()
      await preloadImages()
      animateSpreadIntro()
      return
    }
    window.removeEventListener('keydown', handleKeydown)
    window.removeEventListener('resize', handleResize)
  },
)

onBeforeUnmount(() => {
  document.body.style.overflow = ''
  spinnerTween?.kill()
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('resize', handleResize)
})
</script>
