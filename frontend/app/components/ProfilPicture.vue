<script setup lang="ts">
interface Props {
  src?: string;
  alt?: string;
  online?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  src: '/avatar.svg',
  alt: 'Avatar',
  online: true,
});
</script>

<template>
  <div class="relative flex items-center justify-center" style="width: 57px; height: 62px">
    <div class="absolute inset-1 rounded-full overflow-hidden z-0">
      <img :src="props.src" :alt="props.alt" class="w-full h-full object-cover" loading="lazy" />
    </div>

    <!-- Frame SVG -->
    <svg
      width="57"
      height="62"
      viewBox="0 0 57 62"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      class="relative z-2 pointer-events-none select-none"
    >
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M18.1045 55.5883L27.5724 61.8716C27.5724 61.8716 28.1744 62.0048 28.532 61.9999C28.8897 61.995 29.4277 61.8716 29.4277 61.8716L50.4108 47.8303C50.4108 47.8303 56.1044 43.4063 57 35.0713V13.3361C57 13.3361 56.866 12.531 56.6162 12.1179C56.3663 11.7047 55.7205 11.2202 55.7205 11.2202L29.2357 0.192347C29.2357 0.192347 28.7804 0 28.4681 0C28.1558 0 27.6364 0.192347 27.6364 0.192347L1.53546 11.2202C1.53546 11.2202 0.892278 11.5941 0.575868 11.9896C0.215105 12.4407 0.000111677 13.3361 0.000111677 13.3361V35.1354C0.000111677 35.1354 -0.0553105 38.5977 2.30314 42.701C4.32993 46.2274 8.0607 49.0485 8.0607 49.0485L7.99673 59.4994C7.99673 59.4994 8.11634 60.5542 8.63646 60.8458C9.18157 61.1513 10.1078 60.8458 10.1078 60.8458L18.1045 55.5883ZM28.4041 7.3733L6.84522 16.4136V34.4301C6.84522 34.4301 7.17985 37.5077 8.50851 39.4311C9.83718 41.3546 11.2594 42.701 11.2594 42.701L28.4681 54.0495L45.3569 43.0216C45.3569 43.0216 47.4045 41.1655 48.3637 39.4311C49.2507 37.8271 50.0909 34.8789 50.0909 34.8789V16.4136L28.4041 7.3733Z"
        fill="#5A32A3"
      />
    </svg>

    <span
      v-if="props.online"
      class="absolute bottom-1 right-1 h-3 w-3 bg-green-500 dark:bg-green-600 border-2 border-white dark:border-slate-900 rounded-full z-20"
    />
  </div>
</template>
