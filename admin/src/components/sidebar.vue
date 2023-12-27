<template>
<div :class="{'h-100': $mq === 'md' || $mq === 'sm'}">
  <b-nav vertical justified align="center" class="theme-sidebar sidebar-nav h-100 flex-nowrap">
    <b-navbar-brand class="my-3 mx-2">
      <img class="theme-sidebar-logo logo" :src="logo">
    </b-navbar-brand>
    <div class="menu-container">
      <b-list-group ref="items">
        <b-list-group-item class="theme-sidebar-item px-3" active-class="theme-sidebar-item-active" to="/project-list">現場工事</b-list-group-item>
        <b-list-group-item v-if="role === 'admin'" v-b-toggle.collapseFactory class="collapse-parent px-3 theme-sidebar-item">
          <ListGroupItemPullDown :rotated="isCollapsed.collapseFactory">工場</ListGroupItemPullDown>
        </b-list-group-item>
        <b-collapse v-if="role === 'admin'" id="collapseFactory" class="collapse-child" v-model="isCollapsed.collapseFactory">
          <b-list-group-item v-if="role !== 'subcontractor'" to="/factory-schedule" class="no-border-top theme-sidebar-item" active-class="theme-sidebar-item-active">スケジュール</b-list-group-item>
          <b-list-group-item v-if="role === 'admin'" to="/inhouse-report-admin" class="no-border-top theme-sidebar-item" active-class="theme-sidebar-item-active">作業日報</b-list-group-item>
          <b-list-group-item v-if="role === 'admin'" to="/work-and-unit-admin" class="no-border-top theme-sidebar-item" active-class="theme-sidebar-item-active">工事番号管理</b-list-group-item>
        </b-collapse>
        <b-list-group-item v-if="role === 'admin'" v-b-toggle.collapseAnalysis class="no-border-top collapse-parent px-3 theme-sidebar-item">
          <ListGroupItemPullDown :rotated="isCollapsed.collapseAnalysis">予実管理</ListGroupItemPullDown>
        </b-list-group-item>
        <b-collapse v-if="role === 'admin'" id="collapseAnalysis" class="collapse-child" v-model="isCollapsed.collapseAnalysis">
          <b-list-group-item v-if="role === 'admin'" to="/analysis/profit-analysis" class="no-border-top theme-sidebar-item" active-class="theme-sidebar-item-active">収益分析</b-list-group-item>
          <b-list-group-item v-if="role === 'admin'" to="/analysis/sales-and-expenses" class="no-border-top theme-sidebar-item" active-class="theme-sidebar-item-active">売上/経費</b-list-group-item>
        </b-collapse>
        <b-list-group-item v-if="role === 'admin' && isAccountant" v-b-toggle.collapseAccounting class="no-border-top collapse-parent px-3 theme-sidebar-item">
          <ListGroupItemPullDown :rotated="isCollapsed.collapseAccounting">経理処理</ListGroupItemPullDown>
        </b-list-group-item>
        <b-collapse v-if="role === 'admin'" id="collapseAccounting" class="collapse-child" v-model="isCollapsed.collapseAccounting">
          <b-list-group-item v-if="role === 'admin'" to="/accounting/timesheet-converter" class="no-border-top theme-sidebar-item" active-class="theme-sidebar-item-active">出勤簿</b-list-group-item>
          <b-list-group-item v-if="role === 'admin'" disabled class="theme-sidebar-item">支払い</b-list-group-item>
        </b-collapse>
        <b-list-group-item v-if="role === 'admin'" v-b-toggle.collapseAdmin class="collapse-parent no-border-top px-3 theme-sidebar-item">
          <ListGroupItemPullDown :rotated="isCollapsed.collapseAdmin">管理</ListGroupItemPullDown>
        </b-list-group-item>
        <b-collapse v-if="role === 'admin'" id="collapseAdmin" class="collapse-child" v-model="isCollapsed.collapseAdmin">
          <b-list-group-item v-if="role === 'admin'" class="theme-sidebar-item no-border-top" active-class="theme-sidebar-item-active" to="/project-register/new">工事登録</b-list-group-item>
          <b-list-group-item v-if="role === 'admin'" class="theme-sidebar-item" active-class="theme-sidebar-item-active" to="/staff-admin">人員管理</b-list-group-item>
          <b-list-group-item v-if="role === 'admin'" class="theme-sidebar-item" active-class="theme-sidebar-item-active" to="/contractor-admin">元請/外注先</b-list-group-item>
          <b-list-group-item v-if="role === 'admin'" class="theme-sidebar-item" active-class="theme-sidebar-item-active" disabled>自社情報</b-list-group-item>
          <b-list-group-item v-if="role === 'admin'" class="theme-sidebar-item" active-class="theme-sidebar-item-active" disabled>消費税率</b-list-group-item>
        </b-collapse>
        <b-list-group-item to="/my-account" class="theme-sidebar-item no-border-top px-3" active-class="theme-sidebar-item-active">アカウント情報</b-list-group-item>
        <b-list-group-item class="theme-sidebar-item px-3" @click="logOut">ログアウト</b-list-group-item>
      </b-list-group>
    </div>
    <div class="theme-sidebar-footer footer">
      <div class="version">version: {{version}}</div>
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

<script>
console.log("### sidebar.vue")
import logo from "@/assets/logo.png"
import { BListGroupItem, BIconCaretDownFill } from 'bootstrap-vue'
import ListGroupItemPullDown from "./list-group-item-pull-down.vue"

export default {
  components: {ListGroupItemPullDown},
  created() {
    console.log(`process.env.VERSION: ${process.env.VERSION}`);
    this.version = process.env.VERSION
    this.isAccountant = this.$store.getters.isAccountant
    console.log(`### Am I accountant?: ${this.isAccountant}`);
  },
  mounted() {
    const activeElement = document.getElementsByClassName("theme-sidebar-item-active")[0]
    const activeId = activeElement?.parentElement.id
    if(activeElement == null || activeId == null || activeId === "") {
      return
    }

    this.isCollapsed[activeId] = true
  },
  data() {
    return {
      version: "",
      isAccountant: false,
      logo: logo,
      isCollapsed: {
        "collapseFactory": false,
        "collapseAnalysis": false,
        "collapseAccounting": false,
        "collapseAdmin": false,
      }
    }
  },
  methods: {
    async logOut() {
      await this.$bvModal.msgBoxConfirm(
        "本当にログアウトしますか？",
        {
          centered: true,
        }
      ) ? this.$firebase.auth.logOut() : ""
    },
  },
  computed: {
    role() {
      return this.$store.getters.role
    },
    currentPath() {
      console.log(`path: ${this.$router.currentRoute.path}`)
      return this.$router.currentRoute.path
    },
  },
}
</script>