<template>
<div class="card-wrapper d-flex flex-column">
  <HeaderRow>工番管理</HeaderRow>
  <CardWithCollapse title="新規工番" class="mt-4">
    <ProjectEditor @input="fetchProjectsWithStatusFilter"></ProjectEditor>
  </CardWithCollapse>
  <hr class="w-100 mb-4">
  <b-card body-class="p-2 d-flex align-items-center gap-20">
    <b-checkbox-group v-model="controls.selectedStatusList" :options="$tstore.bundles.options.projectStatus"></b-checkbox-group>
    <b-button variant="info" @click="fetchProjectsWithStatusFilter">検索</b-button>
  </b-card>
  <b-table-simple bordered sticky-header stacked="sm" class="mt-2">
    <b-thead head-variant="light">
      <b-tr>
        <b-th>工番</b-th>
        <b-th style="width: 40%;">工事名</b-th>
        <b-th>ステータス</b-th>
        <b-th style="width: max-content;"></b-th>
      </b-tr>
    </b-thead>
    <b-tbody>
      <template v-if="controls.isProjectListFetched">
        <template v-for="project in info.projectList">
          <b-tr :key="`project-${project.projectId}`">
            <b-td>{{ project.projectId }}</b-td>
            <b-td>{{ project.projectTitle }}</b-td>
            <b-td>{{ $optionValueTo("projectStatus", project.status) }}</b-td>
            <b-td>
              <b-button class="text-nowrap" @click="editProject(project.projectId)">編集</b-button>
              <b-button variant="outline-primary" class="text-nowrap" :class="{'ml-3': ! ['xs', 'sm'].includes($mq)}" @click="deleteProject(project.projectId)">削除</b-button>
            </b-td>
          </b-tr>
        </template>
      </template>
      <template v-else>
        <b-tr class="text-center">
          <b-td colspan="3">
            <b-spinner variant="info"></b-spinner>
          </b-td>
        </b-tr>
      </template>
    </b-tbody>
  </b-table-simple>
  <b-modal id="editor" centered hide-footer size="lg" body-class="p-4">
    <ProjectEditor mode="edit" :value="info.projectList[controls.modifiedProjectIndex]" @input="fetchProjectsWithStatusFilter"></ProjectEditor>
  </b-modal>
</div>

</template>

<style scoped>
</style>

<script lang="ts">
import ProjectEditor from '@/sfc/components/project-editor.vue'
import { Project } from '@/schema/Project'
import { ProjectStatusValueLiterals } from '@/store/modules/bundle'
import CardWithCollapse from '../components/card-with-collapse.vue'

export default {
  components: {
    ProjectEditor,
    CardWithCollapse
},
  async created() {
    this.fetchProjectsWithStatusFilter()
  },
  data() {
    const projectList: Project[] = []

    return {
      controls: {
        isProjectListFetched: false,
        selectedStatusList: ["pre-order", "running"] as ProjectStatusValueLiterals[],
        modifiedProjectIndex: 0,
      },
      info: {
        projectList,
      },
    }
  },
  methods: {
    async fetchProjectsWithStatusFilter() {
      this.controls.isProjectListFetched = false
      let projectList = await this.$firebase.db.fetchProjectsWithStatusFilter(this.controls.selectedStatusList)
      this.info.projectList = projectList
      this.controls.isProjectListFetched = true
    },
    async deleteProject(projectId : number) {
      if( ! await this.$bvModal.msgBoxConfirm(this.newLiner("該当の工番を削除します。\nよろしいですか？\n\n※ここで工番を削除しても、該当の工番で入力された日報などは削除されず残ります。"))) {
        return;
      }
      this.$firebase.db.deleteProject(projectId)
      .then(() => {
        this.$bvModal.msgBoxOk("工番の削除が完了しました。")
        this.fetchProjectsWithStatusFilter()
      }).catch(error => {
        this.$bvModal.msgBoxOk(this.newLiner("エラー：何らかの問題が発生しました。：\n" + JSON.stringify(error)))
      })
    },
    editProject(projectId : number) {
      this.controls.modifiedProjectIndex = this.info.projectList.findIndex(p => p.projectId === projectId)
      this.$bvModal.show("editor")
    },
  }
}
</script>