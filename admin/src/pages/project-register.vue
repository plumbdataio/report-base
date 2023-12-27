<template>
  <b-container class="p-0 custom-width">
    <HeaderRow v-if=" ! /read/.test(mode)">
      <template v-if="/new/.test(mode)">工事登録</template>
      <template v-else-if="/update/.test(mode)">工事内容修正</template>
      <template v-else-if="/duplicate/.test(mode)">工事登録(複製)</template>
      <template v-else-if="/print/.test(mode)">工事内容</template>
    </HeaderRow>

    <b-card v-if=" ! /read|print/.test(mode)" class="my-3" style="background-color: whitesmoke;">
      <b-checkbox switch v-model="project.isForRemoteWork">リモートワーク用の登録</b-checkbox>
    </b-card>
    <b-form-row class="m-3">
      <b-form v-if="isProjectFetched" class="grid-form custom-width">
        <fieldset :disabled="/read/.test(mode)">
          <legend>工事</legend>
          <div :data-row-span="/update|duplicate|print/.test(mode) ? 7 : 6">
            <div v-if="/update|print/.test(mode)" data-field-span="1">
              <label class="auto-filled">工事ID</label>
              <div>{{projectId}}</div>
            </div>
            <div data-field-span="3">
              <label>現場名 ※</label>
              <b-form-group>
                <input type="text" v-model="project.siteName" :class="{'background-on-error': $v.project.siteName.$invalid}">
              </b-form-group>
              <messageRequired v-if=" ! $v.project.siteName.required"></messageRequired>
            </div>
            <div data-field-span="3">
              <label>工事名 ※</label>
              <b-form-group description="※各種書類に出力されます">
                <input type="text" v-model="project.projectName" :class="{'background-on-error': $v.project.projectName.$invalid}">
              </b-form-group>
              <messageRequired v-if=" ! $v.project.projectName.required"></messageRequired>
            </div>
          </div>
          <div data-row-span="10">
            <div data-field-span="9">
              <label>現場住所</label>
              <input type="text" v-model="project.siteAddress">
            </div>
          </div>
          <div data-row-span="10">
            <div v-if="! ['new', 'duplicate'].includes(mode)" data-field-span="3">
              <label>#プロジェクトID</label>
              <div>{{projectId}}</div>
            </div>
            <div data-field-span="7">
              <label>工事番号(※「収益管理」に現場工数を紐づける場合のみ入力)</label>
              <WorkIdSelector no-border v-model="project.workId"></WorkIdSelector>
            </div>
          </div>
          <br>
          <legend>元請</legend>
          <div data-row-span="6">
            <div v-if=" ! /read|print/.test(mode)" class="text-center" data-field-span="1">
              <b-button v-b-modal.choose-primeContractor-modal>参照</b-button>
              <b-modal id="choose-primeContractor-modal" title="元請検索" @ok="setPrimeContractor">
                <b-form-group description="※あいまい検索">
                  <label>会社名</label>
                  <input type="text" v-model="primeContractorNameSearch" @keydown.enter="searchPrimeContractor()">
                </b-form-group>
                <b-form-group>
                  <b-button @click="searchPrimeContractor()">検索</b-button>
                </b-form-group>
                <b-form>
                  <template v-for="(primeContractor, primeContractorId) in primeContractorSelected">
                    <b-form-tag :key="'tag-primeContractor-' + primeContractorId" variant="warning" @remove="removePrimeContractor(primeContractorId)">{{primeContractor.companyName}}</b-form-tag>
                  </template>
                </b-form>
                <br>
                <b-table-simple sticky-header>
                  <b-thead>
                    <b-th></b-th>
                    <b-th>ID</b-th>
                    <b-th>会社名</b-th>
                  </b-thead>
                  <b-tbody>
                    <b-tr v-if="isPrimeContractorFetched && (primeContractorListFetched == null || isEmpty(primeContractorListFetched))">
                      <b-td colspan="3" align="center">データがありません。</b-td>
                    </b-tr>
                    <template v-for="(primeContractor, primeContractorId) in primeContractorListFetched">
                      <b-tr :key="'searched-primeContractor-'+primeContractorId">
                        <b-td>
                          <b-button @click="selectPrimeContractor(primeContractor, primeContractorId)">選択</b-button>
                        </b-td>
                        <b-td>{{primeContractorId}}</b-td>
                        <b-td>{{primeContractor.companyName}}</b-td>
                      </b-tr>
                    </template>
                  </b-tbody>
                </b-table-simple>
              </b-modal>
            </div>
            <div data-field-span="2" class="auto-filled">
              <label>コ－ド</label>
              <div>{{project.primeContractorId === "" ? "　" : project.primeContractorId}}</div>
            </div>
            <div data-field-span="3" class="auto-filled">
              <label>会社名</label>
              <div>{{project.primeContractorName === "" ? "　" : project.primeContractorName}}</div>
            </div>
          </div>
          <div data-row-span="7">
            <div data-field-span="3">
              <label>担当者名</label>
              <input type="text" v-model="project.primeContractorContact">
            </div>
            <div data-field-span="3">
              <label>連絡先</label>
              <input type="text" v-model="project.primeContractorPhone">
            </div>
            <div data-field-span="1">
              <label>締日 ※</label>
              <b-select size="sm" v-model="project.deadlineWorkschedule">
                <b-select-option :value="0">末日</b-select-option>
                <template v-for="n in 28">
                  <b-select-option :key="`deadline-${n}`" :value="n">{{n}}</b-select-option>
                </template>
              </b-select>
              <messageRequired v-if=" ! $v.project.deadlineWorkschedule.required"></messageRequired>
            </div>
          </div>
          <br>
          <legend>期間</legend>
          <div data-row-span="2">
            <div data-field-span="1">
              <label>開始 ※</label>
              <DatePicker class="datepicker-default" :class="{'background-on-error': $v.project.dateStart.$invalid}" v-model="project.dateStart"></DatePicker>
              <messageRequired v-if=" ! $v.project.dateStart.required"></messageRequired>
            </div>
            <div data-field-span="1">
              <label>終了 ※</label>
              <div>
                <DatePicker :disabled="isNotDetermined" class="datepicker-default" :class="{'disabled-cb': isNotDetermined, 'background-on-error': $v.project.dateEnd.$invalid}" v-model="project.dateEnd"></DatePicker>
                <b-checkbox v-model="isNotDetermined">終了日未定</b-checkbox>
                <messageRequired v-if=" ! $v.project.dateEnd.hasValueOrCheckboxChecked"></messageRequired>
                <messageBeforeDateStart v-if=" ! $v.project.dateEnd.isAfterDateStart"></messageBeforeDateStart>
              </div>
            </div>
          </div>
          <br>
          <legend>移動日</legend>
          <div data-row-span="2">
            <div data-field-span="1">
              <label>行き</label>
              <DatePicker class="datepicker-default" v-model="project.dateDepart"></DatePicker>
            </div>
            <div data-field-span="1">
              <label>帰り</label>
              <DatePicker class="datepicker-default" v-model="project.dateReturn"></DatePicker>
            </div>
          </div>
          <br>
          <legend>宿泊先</legend>
          <div data-row-span="3">
            <div data-field-span="1">
              <label>郵便番号</label>
              <input type="text" v-model="project.accomPostalcode">
            </div>
            <div data-field-span="2">
              <label>宿情報</label>
              <input type="text" v-model="project.accomInfo">
            </div>
          </div>
          <div data-row-span="2">
            <div data-field-span="2">
              <label>住所</label>
              <input type="text" v-model="project.accomAddress">
            </div>
          </div>
          <div data-row-span="2">
            <div data-field-span="2">
              <label>備考</label>
              <textarea :rows="rowHeight(project.accomRemarks)" v-model="project.accomRemarks"></textarea>
            </div>
          </div>
        </fieldset>
        <br>
        <fieldset v-if="$store.getters.isAccountant === true && ! /print/.test(mode) && isConfidentialFetched" :disabled="/read/.test(mode)">
          <legend>請求単価 <span class="tips">※経理担当社にのみ表示されます</span></legend>
          <div data-row-span="3">
            <div data-field-span="1">
              <label>工数単価(円/工数)</label>
              <input type="number" v-model="projectConfidential.billingManhour">
            </div>
            <div data-field-span="1">
              <label>残業単価(円/H)</label>
              <input type="number" v-model="projectConfidential.billingOvertime">
            </div>
            <div data-field-span="1">
              <label>深夜残業単価(円/H)</label>
              <input type="number" v-model="projectConfidential.billingLatenight">
            </div>
          </div>
          <div data-row-span="2">
            <div data-field-span="1">
              <label>勤務時間(H/工数)</label>
              <input type="text" v-model="project.manhourBasehour">
              <messageNotDecimal v-if="$v.project.manhourBasehour.$invalid"></messageNotDecimal>
            </div>
            <div data-field-span="1">
              <label>時間入力の最小単位(H)</label>
              <input type="text" v-model="project.interval" :class="{'background-on-error': $v.project.interval.$invalid}">
              <messageNotFloatLessThanOne v-if=" ! $v.project.interval.isLessThanOne"></messageNotFloatLessThanOne>
            </div>
          </div>
          <div data-row-span="3">
            <div data-field-span="1">
              <label>{{project.isBento ? "弁当(円/個)" : "昼食"}}</label>
              <input type="number" v-model="projectConfidential.billingBento">
              <b-checkbox v-model="project.isBento">弁当あり</b-checkbox>
            </div>
            <div data-field-span="1">
              <label>朝食(円/日)</label>
              <input type="number" v-model="projectConfidential.billingBreakfast">
            </div>
            <div data-field-span="1">
              <label>夕食(円/日)</label>
              <input type="number" v-model="projectConfidential.billingDinner">
            </div>
          </div>
          <br>
        </fieldset>        
        <fieldset v-if="$store.getters.isAccountant === true && ! /print/.test(mode) && isConfidentialFetched" :disabled="/read/.test(mode)">
          <legend>標準支払い単価 <span class="tips">※経理担当社にのみ表示されます</span></legend>
          <div data-row-span="3">
            <div data-field-span="1">
              <label>工数単価(円/工数)</label>
              <input type="number" v-model="projectConfidential.expenseManhour">
            </div>
            <div data-field-span="1">
              <label>残業単価(円/H)</label>
              <input type="number" v-model="projectConfidential.expenseOvertime">
            </div>
            <div data-field-span="1">
              <label>深夜残業単価(円/H)</label>
              <input type="number" v-model="projectConfidential.expenseLatenight">
            </div>
          </div>
          <div data-row-span="3">
            <div data-field-span="1">
              <label>{{project.isBento ? "弁当(円/個)" : "昼食"}}</label>
              <input type="number" v-model="projectConfidential.expenseBento">
            </div>
            <div data-field-span="1">
              <label>朝食(円/日)</label>
              <input type="number" v-model="projectConfidential.expenseBreakfast">
            </div>
            <div data-field-span="1">
              <label>夕食(円/日)</label>
              <input type="number" v-model="projectConfidential.expenseDinner">
            </div>
          </div>
          <br>
        </fieldset>
        <fieldset :disabled="/read/.test(mode)">
          <legend>その他</legend>
          <div data-row-span="1">
            <div data-field-span="1">
              <label>持参物</label>
              <textarea :rows="rowHeight(project.bring)" class="resize-none" v-model="project.bring"></textarea>
            </div>
          </div>
          <div data-row-span="1">
            <div data-field-span="1">
              <label>備考</label>
              <textarea :rows="rowHeight(project.projectRemarks)" class="resize-none" v-model="project.projectRemarks"></textarea>
            </div>
          </div>
        </fieldset>
        <br>
        <fieldset :disabled="/read/.test(mode)">
          <legend>
            乗入車&nbsp;&nbsp;&nbsp;&nbsp;
            <b-button v-if=" ! /read|print/.test(mode)" size="sm" @click="addCarRow">追加</b-button>
          </legend>
          <template v-for="(car, index) in project.assignedCar">
            <div data-row-span="8" :key="`car-${index}`">
              <div data-field-span="1">
                <b-button size="sm" v-if=" ! /read|print/.test(mode)" @click="removeCarRow(index)">削除</b-button>
              </div>
              <div data-field-span="2">
                <label>車種</label>
                <input type="text" v-model="car.name">
              </div>
              <div data-field-span="2">
                <label>ナンバー</label>
                <input type="text" v-model="car.number">
              </div>
              <div data-field-span="3">
                <label>備考</label>
                <textarea :rows="rowHeight(car.carRemarks)" v-model="car.remarks" class="resize-none"></textarea>
              </div>
            </div>
          </template>
        </fieldset>
        <br>
        <fieldset :disabled="/read/.test(mode)">
          <legend>
            人員&nbsp;&nbsp;合計:{{project.assignedStaff != null ? Object.keys(project.assignedStaff).length : 0}}人&nbsp;&nbsp;&nbsp;&nbsp;
            <b-button v-if=" ! /read|print/.test(mode)" size="sm" @click="showStaffModal">追加・削除</b-button>
            <b-modal id="add-staff-modal" title="人員検索" @ok="addToAssignedStaff">
              <b-form-group>
                <label>所属</label>
                <select v-model="affiliation">
                  <option value=""></option>
                  <option value="in-house">自社</option>
                  <option value="subcontractor">外注先</option>
                </select>
              </b-form-group>
              <b-form-group description="※あいまい検索">
                <label>氏名</label>
                <input type="text" v-model="staffName" @keydown.enter="searchStaff()">
              </b-form-group>
              <b-form-group>
                <b-button @click="searchStaff()">検索</b-button>
              </b-form-group>
              <b-form>
                <template v-for="(staff, staffId) in staffListSelected">
                  <b-form-tag :key="'tag-staff-' + staffId" :variant="chooseVariant(staff.affiliation)" @remove="removeStaff(staffId)">{{staff.staffName}}</b-form-tag>
                </template>
              </b-form>
              <br>
              <b-table-simple sticky-header>
                <b-thead>
                  <b-tr>
                    <b-th></b-th>
                    <b-th>所属</b-th>
                    <b-th>氏名</b-th>
                  </b-tr>
                </b-thead>
                <b-tbody>
                  <b-tr v-if="isStaffFetched && (staffListFetched == null || isEmpty(staffListFetched))">
                    <b-td colspan="3" align="center">データがありません。</b-td>
                  </b-tr>
                  <template v-for="(staff, staffId) in staffListFetched">
                    <b-tr :key="'searched-staff-'+staffId">
                      <b-td>
                        <b-button @click="addToStaffListSelected(staff, staffId)">選択</b-button>
                      </b-td>
                      <b-td>{{staff.companyName}}</b-td>
                      <b-td>{{staff.staffName}}</b-td>
                    </b-tr>
                  </template>
                </b-tbody>
              </b-table-simple>
            </b-modal>
          </legend>
          <template v-for="(staff, staffId, index) in project.assignedStaff">
            <div data-row-span="9" :key="'staff-'+staffId+'-a'">
              <legend v-if="index != 0"></legend>
              <div data-field-span="3" class="auto-filled">
                <label>氏名</label>
                <div>{{staff.staffName}}</div>
              </div>
              <div data-field-span="3" class="auto-filled">
                <label>所属</label>
                <div>{{staff.companyName}}</div>
              </div>
              <div data-field-span="1">
                <label>責任者</label>
                <b-form-radio v-model="project.uidDirector" name="director" :value="staffId" @click.native="reverseDirector"></b-form-radio>
              </div>
              <div data-field-span="1">
                <label>日報管理</label>
                <b-form-radio v-model="staff.isReporter" :name="`reporter-${staffId}`" :value="true" @click.native="reverseReporter(staffId, $event)"></b-form-radio>
              </div>
              <div data-field-span="1">
                <label>経費管理</label>
                <b-form-radio v-model="project.uidExpense" name="expenseAdmin" :value="staffId" @click.native="reverseExpenseAdmin"></b-form-radio>
              </div>
            </div>
            <div data-row-span="12" :key="'staff-'+staffId+'-b'">
              <div data-field-span="4">
                <b-form-group description="※これ以前の日付は日報の入力不可">
                  <label>移動日/行き</label>
                  <DatePicker class="datepicker-default" v-model="project.assignedStaff[staffId].dateIn"></DatePicker>
                </b-form-group>
              </div>
              <div data-field-span="8">
                <label>備考/行き</label>
                <textarea :rows="rowHeight(project.assignedStaff[staffId].remarkDepart)" class="resize-none" v-model="project.assignedStaff[staffId].remarkDepart"></textarea>
              </div>
            </div>
            <div data-row-span="12" :key="'staff-'+staffId+'-c'">
              <div data-field-span="4">
                <b-form-group description="※これ以降の日付は日報の入力不可">
                  <label>移動日/帰り</label>
                  <DatePicker class="datepicker-default" v-model="project.assignedStaff[staffId].dateOut"></DatePicker>
                </b-form-group>
              </div>
              <div data-field-span="8">
                <label>備考/帰り</label>
                <textarea :rows="rowHeight(project.assignedStaff[staffId].remarkReturn)" class="resize-none" v-model="project.assignedStaff[staffId].remarkReturn"></textarea>
              </div>
            </div>
            <div data-row-span="8" :key="'staff-'+staffId+'-d'" v-if="$store.getters.role === 'admin' && ! /print/.test(mode) && isConfidentialFetched">
              <div data-field-span="2">
                <label>工数単価(円/H)</label>
                <input type="number" v-model="projectConfidential.assignedStaff[staffId].expenseManhour">
              </div>
              <div data-field-span="2">
                <label>残業単価(円/H)</label>
                <input type="number" v-model="projectConfidential.assignedStaff[staffId].expenseOvertime">
              </div>
              <div data-field-span="2">
                <label>深夜残業(円/H)</label>
                <input type="number" v-model="projectConfidential.assignedStaff[staffId].expenseLatenight">
              </div>
              <div data-field-span="2">
                <label>弁当単価(円/個)</label>
                <input type="number" v-model="projectConfidential.assignedStaff[staffId].expenseBento">
              </div>
            </div>
          </template>
        </fieldset>
        <br>
        <b-row align-h="end">
          <b-spinner v-if="isRegistering"></b-spinner>
          <b-button v-if="/update/.test(mode)" class="mr-1" @click="$router.back()">キャンセル</b-button>
          <b-button v-if="/new|duplicate/.test(mode)" :disabled="isRegistering || this.$v.$invalid" @click="register">登録</b-button>
          <b-button v-if="/update/.test(mode)" :disabled="isRegistering || this.$v.$invalid" @click="update">上書き保存</b-button>
        </b-row>
      </b-form>
    </b-form-row>
  </b-container>
</template>

<style scoped>
.background-on-error {
  background: rgb(255, 231, 236) !important;
}
.auto-filled {
  background: #F5F5F5 !important;
}
.tips {
  font-size: 0.6em;
}
.resize-none {
  resize: none;
}
.message-required {
  font-size: 0.8em;
  color: red;
}
.datepicker-disabled {
  background-color: lightgray !important;
}
.datepicker-default {
  border-width: 0px !important;
}
.custom-width {
  width: 100%;
  max-width: 900px;
}
@media screen and (max-width: 768px) {
  .custom-width {
    width: 100% !important;
    min-width: 100% !important;
  }
}
</style>

<script>
import WorkIdSelector from '@/components/work-id-selector.vue'

import isEmpty from 'lodash/isEmpty'
import cloneDeep from 'lodash/cloneDeep'

import { required, integer, decimal, between, or } from 'vuelidate/lib/validators'
const emptyString = (value) => value === ""

export default {
  created() {
    if(! /new/.test(this.mode)) {
      this.projectId = Object.keys(this.$store.getters.project)[0]
      this.$firebase.db.fetchProject(this.projectId).then(data => {
        console.log(data);
        this.project = data
        this.isProjectFetched = true
      })
      if(this.$store.getters.isAccountant === true) {
        this.$firebase.db.fetchProjectConfidential(this.projectId)
                .then(projectConfidential => {
                  this.projectConfidential = projectConfidential
                  this.isConfidentialFetched = true
                }, error => {
                  alert(`請求情報の取得に失敗しました。\n${JSON.stringify(error)}`)
                })
      }
    } else {
      //No need to fetch confidential but need to show elements
      this.isConfidentialFetched = true
      this.isProjectFetched = true
    }
  },
  mounted() {
    if(/print/.test(this.mode)) {
      // Make sure to set showSidebar: true again when leave this page
      this.$store.commit('showSidebar', false)
      // Print after showSidebar: false has been reflected and rendered
      const vm = this
      this.$nextTick(() => {
        setTimeout(() => {
          print()
          this.$router.back()
        }, 500);
      })
    }
  },
  beforeRouteLeave(to, from, next){
    this.$store.commit('showSidebar', true)
    next()
  },
  components:{
    WorkIdSelector,
    messageRequired: {
      render: (h) => h('div', {class: "message-required"}, "※必須項目です")
    },
    messageBeforeDateStart: {
      render: (h) => h('div', {class: "message-required"}, "※開始日より前の日付です")
    },
    messageNotFloatLessThanOne: {
      render: (h) => h('div', {class: "message-required"}, "※0～1の間の数字を入力して下さい")
    },
    messageNotDecimal: {
      render: (h) => h('div', {class: "message-required"}, "※0～12の間の数字を入力して下さい")
    }
  },
  props: {
    mode: String,
    validator: (val) => ['new', 'update', 'duplicate', 'print', 'read'].includes(val)
  },
  data() {
    return {
      // For display only
      staffListFetched: {},
      staffListSelected: {},
      affiliation: "",
      staffName: "",
      primeContractorListFetched: {},
      primeContractorSelected: {},
      primeContractorNameSearch: "",
      isProjectFetched: false,
      isConfidentialFetched: false,
      isRegistering: false,
      isPrimeContractorFetched: false,
      isStaffFetched: false,
      isNotDetermined: false,
      deletionConfirmation: "入力済みのデータがありますが、削除しますか？",
      // To be assembled to create objcet "project"
      projectId: "",
      project: {
        projectName: "",
        primeContractorId: "",
        primeContractorName: "",
        primeContractorContact: "",
        primeContractorPhone: "",
        deadlineWorkschedule: "",
        siteName: "",
        siteAddress: "",
        dateStart: "",
        dateEnd: "",
        dateDepart: "",
        dateReturn: "",
        accomPostalcode: "",
        accomAddress: "",
        accomInfo: "",
        accomRemarks: "",
        isBento: false,
        manhourBasehour: "",
        interval: 0.5,
        uidDirector: "",
        uidExpense: "",
        bring: "",
        projectRemarks: "",
        assignedStaff: {},
        assignedCar: {},
        isForRemoteWork: false,
        workId: "",
      },
      projectConfidential: {
        billingManhour: "",
        billingOvertime: "",
        billingLatenight: "",
        billingBreakfast: "",
        billingLunch: "",
        billingDinner: "",
        expenseManhour: "",
        expenseOvertime: "",
        expenseLatenight: "",
        expenseBreakfast: "",
        expenseLunch: "",
        expenseDinner: "",
        assignedStaff: {}
      },
    }
  },
  validations: {
    project: {
      projectName: {required},
      primeContractorId: {},
      primeContractorName: {},
      primeContractorContact: {},
      primeContractorPhone: {},
      deadlineWorkschedule: {required},
      siteName: {required},
      siteAddress: {},
      dateStart: {required},
      dateEnd: {
        hasValueOrCheckboxChecked: function(value) {
          return this.isNotDetermined || (value != null && value !== "")
        },
        isAfterDateStart: function(value) {
          return this.isNotDetermined || this.project.dateStart <= value
        }
      },
      dateDepart: {},
      dateReturn: {},
      accomPostalcode: {},
      accomAddress: {},
      accomInfo: {},
      accomRemarks: {},
      isBento: {},
      interval: {isLessThanOne: function(value) {
        return 0 < Number.parseFloat(value) && Number.parseFloat(value) <= 1
      }},
      manhourBasehour: {
        decimal,
        between: between(0, 12),
      },
      uidDirector: {},
      uidExpense: {},
      bring: {},
      projectRemarks: {},
      assignedStaff: {},
      assignedCar: {}
    },
    projectConfidential: {
      billingManhour: {integerOrEmptyString: or(integer, emptyString)},
      billingOvertime: {integerOrEmptyString: or(integer, emptyString)},
      billingLatenight: {integerOrEmptyString: or(integer, emptyString)},
      billingBreakfast: {integerOrEmptyString: or(integer, emptyString)},
      billingLunch: {integerOrEmptyString: or(integer, emptyString)},
      billingDinner: {integerOrEmptyString: or(integer, emptyString)},
      expenseManhour: {integerOrEmptyString: or(integer, emptyString)},
      expenseOvertime: {integerOrEmptyString: or(integer, emptyString)},
      expenseLatenight: {integerOrEmptyString: or(integer, emptyString)},
      expenseBreakfast: {integerOrEmptyString: or(integer, emptyString)},
      expenseLunch: {integerOrEmptyString: or(integer, emptyString)},
      expenseDinner: {integerOrEmptyString: or(integer, emptyString)},
      assignedStaff: {
        $each: {
          expenseManhour: {integerOrEmptyString: or(integer, emptyString)},
          expenseOvertime: {integerOrEmptyString: or(integer, emptyString)},
          expenseLatenight: {integerOrEmptyString: or(integer, emptyString)},
          expenseBento: {integerOrEmptyString: or(integer, emptyString)}
        }
      }
    },
  },
  computed: {
    rowHeight() {
      return (text) => {
        if(text == null || text === "")
          return 1
        return text.split('\n').length
      }
    }
  },
  methods: {
    isEmpty,
    searchPrimeContractor(){
      this.$firebase.db.fetchContractor("prime", this.primeContractorNameSearch)
              .then(value => {
                this.$set(this.$data, "primeContractorListFetched", value)
                this.isPrimeContractorFetched = true
              })
    },
    selectPrimeContractor(primeContractor, primeContractorId) {
      this.$delete(this.primeContractorSelected, Object.keys(this.primeContractorSelected)[0])
      this.$set(this.primeContractorSelected, primeContractorId, primeContractor)
    },
    setPrimeContractor() {
      // console.log(`Set: ${JSON.stringify(this.primeContractorSelected)}`);
      const primeContractorId = Object.keys(this.primeContractorSelected)[0]
      this.$set(this.project, "primeContractorId", primeContractorId)
      this.$set(this.project, "primeContractorName", this.primeContractorSelected[primeContractorId].companyName)
      if(this.project.deadlineWorkschedule == null)
        this.$set(this.project, "deadlineWorkschedule", this.primeContractorSelected[primeContractorId].deadlineWorkschedule)
    },
    removePrimeContractor(primeContractorId) {
      this.$delete(this.primeContractorSelected, primeContractorId)
    },
    searchStaff(){
      this.$firebase.db.fetchStaff(this.affiliation, this.staffName)
              .then(staffList => {
                Object.keys(staffList).forEach(uid => {
                  Object.assign(staffList[uid], {
                    dateIn: "",
                    dateOut: "",
                    remarkDepart: "",
                    remarkReturn: "",
                    isReporter: false
                  })
                  // console.log(`staffList[uid]: ${JSON.stringify(staffList[uid])}`);
                })
                this.$set(this.$data, "staffListFetched", cloneDeep(staffList))
                this.isStaffFetched = true
              })
    },
    showStaffModal() {
      this.$set(this.$data, 'staffListSelected', this.project.assignedStaff != null ? cloneDeep(this.project.assignedStaff) : {})
      this.$bvModal.show("add-staff-modal")
    },
    addToStaffListSelected(staff, staffId) {
      this.$set(this.staffListSelected, staffId, staff)
    },
    addToAssignedStaff() {
      this.$set(this.project, "assignedStaff", cloneDeep(this.staffListSelected))

      // Add confidentials of newly assigned staff
      Object.keys(this.project.assignedStaff).forEach(staffId => {
        if(this.projectConfidential.assignedStaff == null ) {
          this.projectConfidential.assignedStaff = {}
        }
        if( ! this.projectConfidential.assignedStaff[staffId]) {
          this.$set(this.projectConfidential.assignedStaff, staffId, {
            expenseManhour: "",
            expenseOvertime: "",
            expenseLatenight: "",
            expenseBento: ""
          })
        }
      })

      // Remove confidentials of unassigned staff
      Object.keys(this.projectConfidential.assignedStaff).forEach(staffId => {
        if( this.project.assignedStaff?.[staffId] == null) {
          this.$delete(this.projectConfidential.assignedStaff, staffId)
        }
      })
    },
    removeStaff(staffId) {
      const targetStaff = this.project.assignedStaff[staffId]
      const targetStaffConfidential = this.projectConfidential.assignedStaff[staffId]
      console.log(`targetStaff: ${JSON.stringify(targetStaff)}`)
      console.log(`targetStaffConfidential: ${JSON.stringify(targetStaffConfidential)}`)
      if ( targetStaff.dateIn
           || targetStaff.dateOut
           || targetStaff.remarkDepart
           || targetStaff.remarkReturn
           || targetStaffConfidential.expenseManhour
           || targetStaffConfidential.expenseOvertime
           || targetStaffConfidential.expenseLatenight
           || targetStaffConfidential.expenseBento
           || this.project.assignedStaff[staffId].isReporter === true
           || staffId === this.project.uidDirector ) {
        if( ! confirm(this.deletionConfirmation)) {
          return
        }
      }

      if(this.project.uidDirector === staffId)
        this.project.uidDirector = ""

      this.$delete(this.staffListSelected, staffId)
    },
    addCarRow() {
      const carList = this.project.assignedCar
      let index
      if(carList === undefined){
        index = 0
        this.$set(this.project, "assignedCar", {})
      } else {
        index = Object.keys(carList).length
      }
      this.$set(this.project.assignedCar, index, {
        name: "",
        number: "",
        remarks: ""
      })
    },
    removeCarRow(index) {
      console.log(`assignedCar BEFORE: ${JSON.stringify(this.project.assignedCar)}`);
      const targetCar = this.project.assignedCar[index]
      if(targetCar.name !== ""
        || targetCar.number !== ""
        || targetCar.remarks !== "") {
        if( ! confirm(this.deletionConfirmation)) return
      }
      const keys = Object.keys(this.project.assignedCar)
      const values = Object.values(this.project.assignedCar)
      keys.splice(index, 1)
      values.splice(index, 1)
      let i = 0
      this.$set(this.project, "assignedCar", {})
      keys.forEach(key => {
        this.$set(this.project.assignedCar, i , values[i])
        ++i
      })
      console.log(`assignedCar AFTER: ${JSON.stringify(this.project.assignedCar)}`);
    },
    chooseVariant(affiliation) {
      switch (affiliation) {
        case "in-house":
          return "primary"
          break
        case "subcontractor":
          return "success"
          break      
        default:
          return "secondary"
          break
      }
    },
    async register() {
      this.isRegistering = true
      await this.$firebase.db.fetchLargestProjectId()
      .then(data => {
        this.projectId = Number.parseInt(data)+1
        this.project.dateEnd = this.isNotDetermined ? "9999-12-31" : this.project.dateEnd
        this.$firebase.db.updateProject('new', this.projectId, this.project, this.projectConfidential)
                .then(val => {
                  alert('登録が完了しました。')
                })
      }).catch(error => {
        alert(`登録に失敗しました。\nエラー: ${JSON.stringify(error)}`)
      })
      this.isRegistering = false
    },
    async update() {
      this.isRegistering = true
      this.project.dateEnd = this.isNotDetermined ? "9999-12-31" : this.project.dateEnd
      console.log(`this.projectId: ${this.projectId}, this.project: ${JSON.stringify(this.project)}, this.projectConfidential: ${JSON.stringify(this.projectConfidential)}`)
      await this.$firebase.db.updateProject('update', this.projectId, this.project, this.projectConfidential)
                    .then(val => {
                      alert('登録が完了しました。')
                    })
      this.isRegistering = false
    },
    reverseDirector(event) {
      if(event.srcElement.checked) {
        this.project.uidDirector = ""
      }
    },
    reverseReporter(staffId, event) {
      if(event.srcElement.checked)
        this.project.assignedStaff[staffId].isReporter = false
    },
    reverseExpenseAdmin(event) {
      if(event.srcElement.checked) {
        this.project.uidExpense = ""
      }
    }
  }
}
</script>