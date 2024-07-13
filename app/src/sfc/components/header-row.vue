<template>
  <b-row class="m-0" align-v="center">
    <button v-if="$mq === 'md' || $mq === 'sm'" class="pt-1 mr-3 burger-button" v-b-toggle.sidebar-toggle>
      <b-icon-list scale="2"></b-icon-list>
    </button>
    <b-sidebar id="sidebar-toggle" class="sidebar-container" sidebar-class="theme-sidebar-header">
      <SideBar></SideBar>
    </b-sidebar>
    <h2 class="mb-0">
      <slot></slot>
    </h2>
  </b-row>
</template>

<style scoped>
.burger-button {
  background-color: transparent;
  border-color: transparent;
}
.sidebar-container {
  overflow-y: hidden;
}
</style>

<script>
import SideBar from '@/sfc/components/sidebar.vue'
import {BIconList} from 'bootstrap-vue/esm/icons'
export default {
  components: {
    SideBar,
    BIconList
  }
}
</script>