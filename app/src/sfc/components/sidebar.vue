<template>
<div :class="{'h-100': $mq === 'md' || $mq === 'sm'}">
  <b-nav vertical justified align="center" class="theme-sidebar sidebar-nav h-100 flex-nowrap">
    <b-navbar-brand class="my-3 mx-2">
      <img class="theme-sidebar-logo logo" :src="logo">
    </b-navbar-brand>
    <div class="menu-container">
      <b-list-group ref="items">
        <b-list-group-item v-b-toggle.collapseReport class="collapse-parent px-3 theme-sidebar-item">
          <ListGroupItemPullDown :rotated="isCollapsed.collapseReport">日報</ListGroupItemPullDown>
        </b-list-group-item>
        <b-collapse id="collapseReport" class="collapse-child" v-model="isCollapsed.collapseReport">
          <template v-if="$route.path === '/'">
            <b-list-group-item class="theme-sidebar-item px-3" active-class="theme-sidebar-item-active" to="/">入力</b-list-group-item>
          </template>
          <template v-else>
            <b-list-group-item class="theme-sidebar-item px-3" active-class="theme-sidebar-item-active" to="/report-input">入力</b-list-group-item>
          </template>
          <b-list-group-item class="theme-sidebar-item px-3" active-class="theme-sidebar-item-active" to="/report-list">一覧</b-list-group-item>
          <b-list-group-item v-if="role === 'admin'" class="theme-sidebar-item px-3" active-class="theme-sidebar-item-active" to="/report-calc">集計</b-list-group-item>
        </b-collapse>
        <b-list-group-item v-if="role === 'admin'" v-b-toggle.collapseAdmin class="collapse-parent no-border-top px-3 theme-sidebar-item">
          <ListGroupItemPullDown :rotated="isCollapsed.collapseAdmin">管理</ListGroupItemPullDown>
        </b-list-group-item>
        <b-collapse v-if="role === 'admin'" id="collapseAdmin" class="collapse-child" v-model="isCollapsed.collapseAdmin">
          <b-list-group-item class="theme-sidebar-item no-border-top" active-class="theme-sidebar-item-active" to="/project-admin">工番管理</b-list-group-item>
          <b-list-group-item class="theme-sidebar-item" active-class="theme-sidebar-item-active" to="/staff-admin">人員管理</b-list-group-item>
        </b-collapse>
        <b-list-group-item to="/my-account" class="theme-sidebar-item no-border-top px-3" active-class="theme-sidebar-item-active">アカウント情報</b-list-group-item>
        <b-list-group-item to="/contact" class="theme-sidebar-item no-border-top px-3" active-class="theme-sidebar-item-active">お問い合わせ</b-list-group-item>
        <b-list-group-item class="theme-sidebar-item px-3" @click="logOut">ログアウト</b-list-group-item>
      </b-list-group>
    </div>
    <div class="theme-sidebar-footer footer">
      <div class="version">
        version: {{version}}
        <template v-if="mode === 'development'">
          <span style="font-weight: bold; color: var(--danger);"> / mode: DEV</span>
        </template>
      </div>
    </div>
  </b-nav>
</div>
</template>

<style scoped>
.logo {
  width: 100%;
  padding: 10px;
  box-sizing: border-box;
}
.menu-container {
  overflow-y: auto;
}
.menu-container::-webkit-scrollbar {
  display: none;
}
.list-group-item {
  user-select: none;
  border: 0px;
}
/* .not-collapsed >>> .b-icons { */
.collapse-parent:focus {
  outline: none;
}
.collapse-child a::before {
  content: "　"
}
.no-border-top {
  border-top-width: 0px !important;
}
.list-group {
  border-radius: 0px !important;
}
.footer {
  display: table-cell !important;
  vertical-align: bottom;
  flex-grow: 1;
  font-size: 0.7em;
  text-align: left;
  position: relative;
  min-height: 2.5em;
}
.version {
  position: absolute;
  font-size: 1em;
  bottom: 0.5em;
  left: 1.4em;
}
</style>

<script lang="ts">
import logo from "@/assets/logo.svg"
import ListGroupItemPullDown from "./list-group-item-pull-down.vue"

export default {
  components: {ListGroupItemPullDown},
  created() {
    this.version = process.env.VERSION ?? "x.y.z"
    this.mode = process.env.__MODE
    this.isAccountant = this.$tstore.auth.isAccountant
  },
  mounted() {
    const activeElement = document.getElementsByClassName("theme-sidebar-item-active")[0]
    const activeId : string|undefined = activeElement?.parentElement?.id
    if(activeElement == null || activeId == null || activeId === "") {
      return
    }

    this.isCollapsed[activeId] = true
  },
  data() {
    const isCollapsed = {
      "collapseReport": false,
      "collapseAdmin": false,
    } as const

    return {
      version: "",
      mode: "" as typeof process.env.__MODE,
      isAccountant: false,
      logo: logo,
      isCollapsed: isCollapsed as typeof isCollapsed & {[key:string]: boolean}
    }
  },
  methods: {
    async logOut() {
      if(await this.$bvModal.msgBoxConfirm("本当にログアウトしますか？")) {
        this.$firebase.auth.logOut()
      }
    },
  },
  computed: {
    role() {
      return this.$tstore.auth.role
    },
    currentPath() {
      console.log(`path: ${this.$router.currentRoute.path}`)
      return this.$router.currentRoute.path
    },
  },
}
</script>