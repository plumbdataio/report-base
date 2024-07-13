<template>
  <div>
    <MaintenanceWindow v-if="$tstore.pages.isMaintenanceWindow"></MaintenanceWindow>
    <Login v-else-if=" ! $tstore.auth.isLoggedIn"></Login>
    <div v-else class="d-inline-flex flex-nowrap justify-content-start w-100">
      <SideBar v-show="showSidebar" class="sidebar d-none d-md-inline"/>
      <div class="main-content" :class="{'on-sidebar-hidden': ! showSidebar, ' p-3': ! $tstore.session.isPrinting}">
        <template v-if="controls.currentVersion < controls.latestVersion">
          <div class="w-100 mb-2 d-flex justify-content-md-end justify-content-center">
            <button class="update-available" @click="reload()">
              システムのアップデートがあります
              <br v-if="/xs|sm/.test($mq)">
              <template v-else>：</template>
              ここをクリックして更新する
            </button>
          </div>
        </template>
        <template v-if="controls.MODE === 'development'">
          <div class="mb-2" style="color: var(--danger); background-color: var(--info); font-weight: bold;" >&nbsp;&nbsp;{{ controls.ADMIN_URL }} <br> &nbsp;&nbsp;{{ controls.DATABASE_URL }}</div>
        </template>
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
  min-width: var(--sidebar-width);
}
.main-content {
  max-width: calc(100% - var(--sidebar-width));
  min-width: calc(100% - var(--sidebar-width));
}

.on-sidebar-hidden {
  max-width: 100% !important;
  min-width: 100% !important;
}

.update-available {
  position: fixed;
  z-index: 1000;
  top: 10px;
  border-radius: 1em;
  border-width: 0;
  padding: 0.2em 1em;
  background-color: var(--warning);
  opacity: 0.9;
  font-size: 0.8em;
  color: aliceblue;
  font-weight: bold;
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

<script lang="ts">
import MaintenanceWindow from '@/sfc/pages/maintenance-window.vue'
import Login from "@/sfc/pages/login.vue"
import SideBar from "@/sfc/components/sidebar.vue"
import { FirebaseOptions } from 'firebase/app';
import { reload } from 'firebase/auth';

export default {
  created() {
    console.log(`### MODE: ${process.env.__MODE}`);
    console.log(`### version: ${process.env.VERSION}`);
    console.log(`### isLoggedIn: ${this.$tstore.auth.isLoggedIn}`);
    console.log(`### my role: ${this.$tstore.auth.role}`);
    console.log(`### Am I accountant?: ${this.$tstore.auth.isAccountant}`);
    try {
      const firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG) as FirebaseOptions
      this.controls.DATABASE_URL = firebaseConfig.databaseURL ?? "### failed to parse DATABASE_URL ###"
    } catch(e) {
      throw Error(`Error: Couldn't JSON.parse() 'process.env.FIREBASE_CONFIG': ${process.env.FIREBASE_CONFIG}`)
    }
    if(this.$tstore.pages.dbUser?.affiliation === "system-developer") {
      this.$tstore.bundles.setIsSystemDeveloper(true)
    }

    this.$firebase.db.setFetchLatestVersionOfThisAppCallback(value => {
      console.log(`### latest version updated: ${value}`);
      this.controls.latestVersion = value
    })
  },
  components: {
    MaintenanceWindow,
    Login,
    SideBar,
  },
  data() {
    return {
      controls: {
        MODE: process.env.__MODE,
        ADMIN_URL: process.env.ADMIN_URL,
        DATABASE_URL: "",
        currentVersion: process.env.VERSION!,
        latestVersion: process.env.VERSION!,
      },
    }
  },
  computed: {
    showSidebar() {
      return ! this.$tstore.session.isPrinting && this.$tstore.pages.showSidebar
    },
  },
  methods: {
    reload() {
      location.reload()
    },
  }
}
</script>