<template>
<div class="d-flex align-items-center theme-sidebar-item">
  <div>
    <slot></slot>
  </div>
  <BIconCaretDownFill class="ml-auto b-icons" :style="rotated ? 'transform: rotate(180deg)' : ''"></BIconCaretDownFill>
</div>
</template>

<script>
import { BIconCaretDownFill } from 'bootstrap-vue'

export default {
  components: {BIconCaretDownFill},
  props: {
    rotated: {
      required: true,
      default: true,
    }
  },
}
</script>