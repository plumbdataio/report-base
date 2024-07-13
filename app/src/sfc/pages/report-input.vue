<template>
<div class="card-wrapper d-flex flex-column">
  <HeaderRow>日報入力</HeaderRow>
  <b-tabs fill class="mt-3" nav-class="tabs" nav-wrapper-class="active-tab-title" content-class="p-0 pt-4">
    <b-tab title="自分の日報">
      <ReportInputMine :projects="options.projects"></ReportInputMine>
    </b-tab>
    <b-tab title="外注先の日報 ※近日公開予定" disabled>
      <ReportInputExternals :projects="options.projects"></ReportInputExternals>
    </b-tab>
  </b-tabs>
</div>
</template>

<style scoped>
.tab-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding-top: 20px;
}
* >>> .nav-tabs {
  gap: 5px;
}
* >>> .nav-item:has(a.active) {
  border-bottom: 6px solid var(--secondary);
  &>a {
    color: var(--sumi--black);
  }
}
* >>> .nav-item:not(:has(a.active)) {
  /* background-color: var(--light-gray); */
  & > * {
    color: var(--dark-gray);
  }
}

* >>> .card-body {
  background-color: #f8f9fa;
}
</style>

<script lang="ts">
import ReportInputMine from '@/sfc/components/report-input-mine.vue'
import ReportInputExternals from '@/sfc/components/report-input-externals.vue'
import { Project } from '@/schema/Project';

export default {
  async created() {
    this.options.projects = await this.$firebase.db.fetchProjectsWithStatusFilter(["pre-order", "running"]) ?? []
  },
  components: {
    ReportInputMine,
    ReportInputExternals,
  },
  data() {
    return {
      controls: {
        reportReviced: null as Report|null
      },
      options: {
        projects: [] as Project[]
      }
    }
  }
}
</script>