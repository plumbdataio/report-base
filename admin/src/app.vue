<template>
  <div>
    <MaintenanceWindow v-if="$store.getters.isMaintenanceWindow"></MaintenanceWindow>
    <Login v-else-if=" ! $store.getters.isLoggedIn"></Login>
    <div v-else class="d-inline-flex flex-nowrap justify-content-start w-100">
      <SideBar v-show="showSidebar" class="sidebar d-none d-md-inline"/>
      <div class="main-content" :class="{'on-sidebar-hidden': ! showSidebar, ' p-3': ! $store.getters.isPrinting}">
        <router-view :key="$route.fullPath"></router-view>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sidebar {
  position: sticky;
  z-index: 10;
  top: 0px;
  left: 0px;
  height: 100vh;
}
.main-content {
  max-width: calc(100%-180px);
  min-width: calc(100%-180px);
}

.on-sidebar-hidden {
  max-width: 100% !important;
  min-width: 100% !important;
}

@media screen and (max-width: 768px) {
  .main-content {
    max-width: 100%;
    min-width: 100%;
    margin-right: 0;
    margin-left: 0;
  }
}
</style>

<script>
console.log("### app.vue")
import MaintenanceWindow from '@/pages/maintenance-window.vue'
import Login from "@/pages/login.vue"
import SideBar from "@/components/sidebar.vue"

export default {
  components: {
    MaintenanceWindow,
    Login,
    SideBar,
  },
  computed: {
    showSidebar() {
      return ! this.$store.getters.isPrinting && this.$store.getters.showSidebar
    },
  },
}
</script>