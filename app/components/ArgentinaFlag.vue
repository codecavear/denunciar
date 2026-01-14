<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 800 500"
    class="w-5 h-3 rounded-sm shadow-sm"
  >
    <!-- Light blue stripe top -->
    <rect width="800" height="167" fill="#74ACDF" />
    <!-- White stripe middle -->
    <rect y="167" width="800" height="166" fill="#FFFFFF" />
    <!-- Light blue stripe bottom -->
    <rect y="333" width="800" height="167" fill="#74ACDF" />
    <!-- Sun of May -->
    <g transform="translate(400, 250)">
      <circle r="35" fill="#F6B40E" />
      <g fill="#F6B40E">
        <g v-for="i in 16" :key="i" :transform="`rotate(${i * 22.5})`">
          <path
            v-if="i % 2 === 1"
            d="M0,-45 L4,-70 L0,-90 L-4,-70 Z"
          />
          <path
            v-else
            d="M0,-45 Q10,-65 0,-85 Q-10,-65 0,-45"
          />
        </g>
      </g>
      <circle r="25" fill="#F6B40E" />
      <circle r="18" fill="#843511" opacity="0.3" />
    </g>
  </svg>
</template>
