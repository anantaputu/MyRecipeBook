<template>
  <teleport to="body">
    <transition :css="false" @enter="handleOverlayEnter" @leave="handleOverlayLeave">
      <div
        v-if="open"
        ref="overlay"
        class="fixed inset-0 z-50 overflow-hidden bg-[radial-gradient(circle_at_top,rgba(246,204,171,0.16),transparent_24%),rgba(34,16,11,0.94)] px-3 py-3 text-white backdrop-blur-md sm:px-6 lg:px-8"
      >
        <div class="mx-auto flex h-full max-w-7xl flex-col rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(115,56,31,0.34),rgba(49,23,16,0.4))] p-4 shadow-cover backdrop-blur-xl sm:p-6">
          <header class="flex items-center justify-between gap-4">
            <button
              ref="closeButton"
              type="button"
              class="rounded-full border border-white/12 bg-white/10 p-3 text-white transition hover:bg-white/16"
              aria-label="Close reader"
              @click="emitClose"
            >
              <X class="h-5 w-5" />
            </button>

            <!-- <div class="text-right">
              <p class="text-[11px] font-semibold uppercase tracking-[0.34em] text-white/50">
                Interactive PDF Reader
              </p>
              <p class="mt-1 text-sm text-white/72">
                {{ orientationLabel }} {{ currentSpreadLabel }}
              </p>
            </div> -->
          </header>

          <div class="relative mt-5 flex min-h-0 flex-1 flex-col">
            <div
              v-if="loading || errorMessage"
              class="absolute inset-0 z-30 flex flex-col items-center justify-center gap-5 rounded-[24px] bg-slate-950/72"
            >
              <div
                v-if="loading"
                ref="spinner"
                class="h-14 w-14 rounded-full border-2 border-white/15 border-t-[#d97a4f]"
              />
              <div class="max-w-md text-center">
                <p class="text-sm font-semibold uppercase tracking-[0.28em] text-white/55">
                  {{ errorMessage ? 'Unable to load PDF' : 'Rendering flipbook' }}
                </p>
                <p class="mt-2 text-sm text-white/70">
                  {{ errorMessage || 'Rasterizing PDF pages into optimized image textures...' }}
                </p>
                <button
                  v-if="errorMessage"
                  type="button"
                  class="mt-4 rounded-full bg-[#bf5b35] px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white"
                  @click="loadAndInit"
                >
                  Retry
                </button>
              </div>
            </div>

            <div class="grid flex-1 min-h-0 gap-3 lg:grid-cols-[auto_1fr_auto] lg:items-center">
              <button
                type="button"
                class="hidden h-14 w-14 items-center justify-center self-center rounded-full border border-white/10 bg-white/10 text-white transition hover:bg-white/16 disabled:cursor-not-allowed disabled:opacity-35 lg:flex"
                :disabled="!canGoPrevious || loading"
                @click="flipPrevious"
              >
                <ChevronLeft class="h-5 w-5" />
              </button>

              <div
                ref="viewport"
                class="relative min-h-0 overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,246,239,0.12),rgba(255,255,255,0.03))] p-2 sm:p-4"
              >
                <div class="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_42%)]" />
                <div class="pointer-events-none absolute inset-x-8 bottom-6 top-auto h-8 rounded-full bg-[radial-gradient(circle,rgba(0,0,0,0.36),transparent_72%)] blur-2xl" />

                <div class="relative flex h-full min-h-[320px] items-center justify-center py-2 sm:min-h-[360px]">
                  <div
                    ref="bookFrame"
                    class="pdf-book-frame relative w-full max-w-full"
                    :style="bookFrameStyle"
                  >
                    <div class="pdf-book-stage absolute inset-0 overflow-hidden rounded-[24px]">
                      <div class="pdf-book-stage__lighting absolute inset-0" />
                      <div class="pdf-book-stage__spine absolute inset-y-[5%] left-1/2 -translate-x-1/2 rounded-full" :style="spineShadowStyle" />
                      <div class="pdf-book-stage__depth absolute inset-y-[10%] rounded-[22px]" :style="depthShadowStyle" />

                      <div ref="flipRoot" class="h-full w-full">
                        <div
                          v-for="page in pageTextures"
                          :key="page.key"
                          class="pdf-flip-page"
                          :data-density="page.density"
                        >
                          <div class="pdf-flip-page__sheet">
                            <div class="pdf-flip-page__surface" :style="{ backgroundImage: `url(${page.src})` }" />
                            <div class="pdf-flip-page__grain" />
                            <div class="pdf-flip-page__spine-glow" />
                            <div class="pdf-flip-page__edge-shadow" />
                            <div class="pdf-flip-page__specular" />
                            <span class="pdf-flip-page__number">
                              {{ page.label }}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                class="hidden h-14 w-14 items-center justify-center self-center rounded-full border border-white/10 bg-white/10 text-white transition hover:bg-white/16 disabled:cursor-not-allowed disabled:opacity-35 lg:flex"
                :disabled="!canGoNext || loading"
                @click="flipNext"
              >
                <ChevronRight class="h-5 w-5" />
              </button>
            </div>

            <footer class="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div class="text-sm text-white/68">
                {{ currentSpreadLabel }}
              </div>

              <div class="flex items-center gap-3">
                <button
                  type="button"
                  class="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/16 disabled:cursor-not-allowed disabled:opacity-35"
                  :disabled="!canGoPrevious || loading"
                  @click="flipPrevious"
                >
                  <ChevronLeft class="h-4 w-4" />
                  Previous
                </button>
                <button
                  type="button"
                  class="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/16 disabled:cursor-not-allowed disabled:opacity-35"
                  :disabled="!canGoNext || loading"
                  @click="flipNext"
                >
                  Next
                  <ChevronRight class="h-4 w-4" />
                </button>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { gsap } from 'gsap'
import { PageFlip } from 'page-flip'
import { ChevronLeft, ChevronRight, X } from 'lucide-vue-next'
import { renderPdfPagesToImages } from '../lib/pdf'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  pdfUrl: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    default: 'Recipe Book',
  },
})

const emit = defineEmits(['close'])

const overlay = ref(null)
const closeButton = ref(null)
const spinner = ref(null)
const viewport = ref(null)
const bookFrame = ref(null)
const flipRoot = ref(null)

const loading = ref(false)
const errorMessage = ref('')
const pageTextures = ref([])
const pageSize = ref({ width: 900, height: 1400 })
const currentPageIndex = ref(0)
const currentOrientation = ref('landscape')
const renderState = ref('read')
const bookProgress = ref(0)
const viewportWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1440)

let pageFlipInstance = null
let spinnerTween = null
let pdfAbortToken = 0
let shadowFrame = 0

const isPortrait = computed(() => currentOrientation.value === 'portrait')
const spreadStep = computed(() => (isPortrait.value ? 1 : 2))
const maxStartIndex = computed(() =>
  Math.max(0, pageTextures.value.length - spreadStep.value),
)
const canGoPrevious = computed(() => currentPageIndex.value > 0)
const canGoNext = computed(() => currentPageIndex.value < maxStartIndex.value)
const totalSpreads = computed(() =>
  Math.max(1, Math.ceil(pageTextures.value.length / spreadStep.value)),
)
const currentSpreadNumber = computed(() =>
  Math.min(totalSpreads.value, Math.floor(currentPageIndex.value / spreadStep.value) + 1),
)
const orientationLabel = computed(() =>
  isPortrait.value ? 'Single page mode' : 'Two-page spread',
)
const currentSpreadLabel = computed(() => {
  if (!pageTextures.value.length) {
    return 'Preparing pages'
  }

  const firstPage = currentPageIndex.value + 1
  const secondPage = Math.min(pageTextures.value.length, currentPageIndex.value + spreadStep.value)

  return isPortrait.value
    ? `Page ${firstPage} of ${pageTextures.value.length}`
    : `Spread ${currentSpreadNumber.value} of ${totalSpreads.value} · Pages ${firstPage}-${secondPage}`
})

const aspectRatio = computed(() => pageSize.value.width / pageSize.value.height)
const spreadAspectRatio = computed(() =>
  isPortrait.value ? aspectRatio.value : (aspectRatio.value * 2) + 0.038,
)
const bookFrameStyle = computed(() => ({
  width: isPortrait.value
    ? `min(100%, calc((100dvh - 15rem) * ${aspectRatio.value}))`
    : `min(100%, calc((100dvh - 15rem) * ${spreadAspectRatio.value}))`,
  maxWidth: isPortrait.value ? '32rem' : '72rem',
  aspectRatio: isPortrait.value ? `${aspectRatio.value}` : `${spreadAspectRatio.value}`,
  '--book-progress': bookProgress.value.toFixed(4),
}))
const spineShadowStyle = computed(() => ({
  width: isPortrait.value ? '12%' : '8%',
  background: `radial-gradient(circle at center, rgba(26, 12, 8, ${0.18 + (bookProgress.value * 0.34)}), rgba(26, 12, 8, ${0.1 + (bookProgress.value * 0.18)}) 42%, transparent 78%)`,
  filter: `blur(${18 + (bookProgress.value * 10)}px)`,
  opacity: 0.48 + (bookProgress.value * 0.4),
}))
const depthShadowStyle = computed(() => {
  const width = isPortrait.value ? '72%' : '46%'
  const side = currentPageIndex.value >= maxStartIndex.value ? 'left' : 'right'

  return {
    width,
    [side]: isPortrait.value ? '14%' : '4%',
    background: `linear-gradient(${side === 'right' ? '270deg' : '90deg'}, rgba(30, 14, 10, ${0.08 + (bookProgress.value * 0.18)}), transparent 75%)`,
    opacity: 0.22 + (bookProgress.value * 0.52),
    filter: `blur(${8 + (bookProgress.value * 8)}px)`,
  }
})

const emitClose = () => {
  emit('close')
}

const startSpinner = () => {
  spinnerTween?.kill()

  if (spinner.value) {
    spinnerTween = gsap.to(spinner.value, {
      rotate: 360,
      duration: 0.9,
      repeat: -1,
      ease: 'none',
    })
  }
}

const stopSpinner = () => {
  spinnerTween?.kill()
  spinnerTween = null
}

const syncProgressFromFlip = () => {
  if (!pageFlipInstance) {
    bookProgress.value = 0
    return
  }

  const calculation = pageFlipInstance.getFlipController?.().getCalculation?.()
  const progress = calculation?.getFlippingProgress?.()

  if (typeof progress === 'number' && Number.isFinite(progress)) {
    const normalized = Math.min(1, Math.max(0, progress / 100))
    bookProgress.value = normalized <= 0.5 ? normalized * 2 : (1 - normalized) * 2
    return
  }

  bookProgress.value = renderState.value === 'read' ? 0 : 0.22
}

const stopShadowLoop = () => {
  if (!shadowFrame) {
    return
  }

  cancelAnimationFrame(shadowFrame)
  shadowFrame = 0
}

const startShadowLoop = () => {
  stopShadowLoop()

  const tick = () => {
    syncProgressFromFlip()

    if (renderState.value !== 'read') {
      shadowFrame = requestAnimationFrame(tick)
      return
    }

    shadowFrame = 0
  }

  shadowFrame = requestAnimationFrame(tick)
}

const destroyFlipbook = () => {
  stopShadowLoop()
  pageFlipInstance?.destroy()
  pageFlipInstance = null
}

const resetReaderState = () => {
  errorMessage.value = ''
  pageTextures.value = []
  currentPageIndex.value = 0
  currentOrientation.value = viewportWidth.value < 1024 ? 'portrait' : 'landscape'
  renderState.value = 'read'
  bookProgress.value = 0
}

const buildPageTexture = (page, index, pageCount) => ({
  key: `pdf-page-${index}-${pageCount}`,
  label: String(index + 1).padStart(2, '0'),
  src: page.src,
  density: index === 0 || index === pageCount - 1 ? 'hard' : 'soft',
})

const initFlipbook = async () => {
  destroyFlipbook()
  await nextTick()

  if (!flipRoot.value || !pageTextures.value.length) {
    return
  }

  pageFlipInstance = new PageFlip(flipRoot.value, {
    width: Math.round(pageSize.value.width),
    height: Math.round(pageSize.value.height),
    size: 'stretch',
    minWidth: 280,
    maxWidth: 1200,
    minHeight: 360,
    maxHeight: 1600,
    drawShadow: true,
    maxShadowOpacity: 0.46,
    flippingTime: 960,
    showCover: true,
    usePortrait: true,
    startZIndex: 20,
    autoSize: true,
    mobileScrollSupport: false,
    swipeDistance: 18,
    clickEventForward: true,
    useMouseEvents: true,
    disableFlipByClick: false,
  })

  pageFlipInstance.on('init', ({ data }) => {
    currentPageIndex.value = data.page
    currentOrientation.value = data.mode
  })

  pageFlipInstance.on('flip', ({ data }) => {
    currentPageIndex.value = data
    syncProgressFromFlip()
  })

  pageFlipInstance.on('changeOrientation', ({ data }) => {
    currentOrientation.value = data
    syncProgressFromFlip()
  })

  pageFlipInstance.on('changeState', ({ data }) => {
    renderState.value = data

    if (data === 'read') {
      syncProgressFromFlip()
      return
    }

    startShadowLoop()
  })

  pageFlipInstance.loadFromHTML(flipRoot.value.querySelectorAll('.pdf-flip-page'))
  syncProgressFromFlip()
}

const loadAndInit = async () => {
  const token = ++pdfAbortToken
  destroyFlipbook()
  loading.value = true
  errorMessage.value = ''
  startSpinner()

  try {
    const rendered = await renderPdfPagesToImages(props.pdfUrl, {
      scale: viewportWidth.value < 768 ? 1.55 : 1.9,
      quality: 0.95,
    })

    if (token !== pdfAbortToken) {
      return
    }

    pageSize.value = {
      width: rendered.summary.width,
      height: rendered.summary.height,
    }
    pageTextures.value = rendered.pages.map((page, index) =>
      buildPageTexture(page, index, rendered.pages.length),
    )

    await initFlipbook()
  } catch (error) {
    if (token !== pdfAbortToken) {
      return
    }

    errorMessage.value =
      error instanceof Error && error.message
        ? error.message
        : 'The PDF file could not be rendered.'
  } finally {
    if (token === pdfAbortToken) {
      loading.value = false
      stopSpinner()
    }
  }
}

const flipNext = () => {
  if (!pageFlipInstance || !canGoNext.value || loading.value) {
    return
  }

  pageFlipInstance.flipNext('top')
}

const flipPrevious = () => {
  if (!pageFlipInstance || !canGoPrevious.value || loading.value) {
    return
  }

  pageFlipInstance.flipPrev('top')
}

const handleOverlayEnter = (element, done) => {
  gsap.fromTo(
    element,
    { opacity: 0 },
    {
      opacity: 1,
      duration: 0.3,
      ease: 'power2.out',
      onComplete: done,
    },
  )
}

const handleOverlayLeave = (element, done) => {
  const timeline = gsap.timeline({ onComplete: done })

  timeline.to(closeButton.value, {
    scale: 0.82,
    opacity: 0,
    duration: 0.18,
    ease: 'power2.in',
  })
  timeline.to(
    element,
    {
      opacity: 0,
      duration: 0.24,
      ease: 'power2.inOut',
    },
    '-=0.08',
  )
}

const handleKeydown = (event) => {
  if (!props.open) {
    return
  }

  if (event.key === 'Escape') {
    emitClose()
    return
  }

  if (event.key === 'ArrowRight') {
    flipNext()
    return
  }

  if (event.key === 'ArrowLeft') {
    flipPrevious()
  }
}

const handleResize = () => {
  viewportWidth.value = window.innerWidth
  pageFlipInstance?.update()
}

watch(
  () => props.open,
  async (isOpen) => {
    document.body.style.overflow = isOpen ? 'hidden' : ''

    if (!isOpen) {
      pdfAbortToken += 1
      stopSpinner()
      destroyFlipbook()
      resetReaderState()
      return
    }

    resetReaderState()
    await loadAndInit()
  },
)

watch(
  () => props.pdfUrl,
  async (nextUrl, previousUrl) => {
    if (!props.open || !nextUrl || nextUrl === previousUrl) {
      return
    }

    await loadAndInit()
  },
)

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('resize', handleResize)

  if (props.open) {
    loadAndInit()
  }
})

onBeforeUnmount(() => {
  pdfAbortToken += 1
  document.body.style.overflow = ''
  stopSpinner()
  destroyFlipbook()
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.pdf-book-frame {
  perspective: 2400px;
  transform-style: preserve-3d;
}

.pdf-book-stage {
  background:
    linear-gradient(180deg, rgba(255, 248, 242, 0.62), rgba(244, 232, 223, 0.4)),
    radial-gradient(circle at 50% 38%, rgba(255, 255, 255, 0.32), transparent 46%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.35),
    inset 0 -30px 50px rgba(69, 35, 22, 0.1),
    0 40px 90px rgba(17, 8, 5, 0.24);
}

.pdf-book-stage__lighting {
  background:
    radial-gradient(circle at top, rgba(255, 255, 255, 0.18), transparent 40%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.08), transparent 38%, rgba(67, 31, 18, 0.08));
  mix-blend-mode: screen;
}

.pdf-book-stage__spine {
  width: 8%;
  z-index: 5;
  pointer-events: none;
}

.pdf-book-stage__depth {
  z-index: 4;
  pointer-events: none;
}

.pdf-book-stage :deep(.stf__parent) {
  width: 100%;
  height: 100%;
}

.pdf-book-stage :deep(.sft__wrapper),
.pdf-book-stage :deep(.stf__block) {
  width: 100%;
  height: 100%;
}

.pdf-book-stage :deep(.stf__block) {
  perspective: 2600px;
}

.pdf-book-stage :deep(.stf__item) {
  padding: 0.8rem;
  box-sizing: border-box;
}

.pdf-book-stage :deep(.stf__item.--soft),
.pdf-book-stage :deep(.stf__item.--hard) {
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.pdf-book-stage :deep(.stf__outerShadow),
.pdf-book-stage :deep(.stf__innerShadow),
.pdf-book-stage :deep(.stf__hardShadow),
.pdf-book-stage :deep(.stf__hardInnerShadow) {
  filter: blur(1px);
}

.pdf-flip-page {
  width: 100%;
  height: 100%;
}

.pdf-flip-page__sheet {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: 18px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(247, 240, 233, 0.96));
  box-shadow:
    inset 0 0 0 1px rgba(41, 18, 10, 0.08),
    0 16px 28px rgba(36, 16, 10, 0.12);
}

.pdf-flip-page__surface {
  position: absolute;
  inset: 0;
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  transform: translateZ(0);
  will-change: transform;
}

.pdf-flip-page__grain {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(117, 73, 52, 0.08), transparent 14%, transparent 84%, rgba(117, 73, 52, 0.05)),
    radial-gradient(circle at 20% 18%, rgba(255, 255, 255, 0.16), transparent 24%);
  mix-blend-mode: multiply;
  opacity: 0.8;
  pointer-events: none;
}

.pdf-flip-page__spine-glow {
  position: absolute;
  inset: 0 auto 0 0;
  width: 14%;
  background: linear-gradient(90deg, rgba(65, 33, 23, 0.16), rgba(65, 33, 23, 0.05), transparent);
  pointer-events: none;
}

.pdf-flip-page__edge-shadow {
  position: absolute;
  inset: 0 0 0 auto;
  width: 10%;
  background: linear-gradient(270deg, rgba(33, 16, 11, 0.12), transparent);
  pointer-events: none;
}

.pdf-flip-page__specular {
  position: absolute;
  inset: 0;
  background: linear-gradient(115deg, rgba(255, 255, 255, 0.14), transparent 24%, transparent 72%, rgba(81, 39, 24, 0.05));
  mix-blend-mode: screen;
  pointer-events: none;
}

.pdf-flip-page__number {
  position: absolute;
  right: 14px;
  bottom: 14px;
  z-index: 2;
  border-radius: 9999px;
  background: rgba(15, 23, 42, 0.76);
  padding: 0.34rem 0.78rem;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.18em;
  color: rgba(255, 255, 255, 0.84);
}
</style>
