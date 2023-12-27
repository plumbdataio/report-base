<template>
  <b-container class="p-0">
    <HeaderRow>人員管理</HeaderRow>
    <b-row class="pt-4 pl-3" align-v="center">
      <b-button :class="{'button-plus': ! isCollapsed, 'button-minus': isCollapsed}" variant="outline-secondary" size="sm" @click="toggle"></b-button>
      <div class="ml-3">新規ユーザー作成</div>
    </b-row>
    <b-collapse id="collapse" v-model="isCollapsed">
      <b-row>
        <b-col sm="3">
          <b-form-group>
            <label>所属</label>
            <b-form-select v-model="rtdbData.affiliation" class="mt-2">
              <b-form-select-option value="in-house">{{ myCompanyName }}</b-form-select-option>
              <b-form-select-option value="subcontractor">外注先</b-form-select-option>
            </b-form-select>
          </b-form-group>
        </b-col>
        <b-col sm="5">
          <b-form-group>
            <label>外注先社名
              <b-button class="mb-1" size="sm" variant="outline-secondary" :disabled="rtdbData.affiliation !== 'subcontractor'" @click="isSetSubcontractorModalShown = true">参照</b-button>
              <SubcontractorChooser v-if="isSetSubcontractorModalShown" v-model="rtdbData" @hide="isSetSubcontractorModalShown = false"></SubcontractorChooser>
            </label>
            <b-form-input disabled v-model="rtdbData.companyName"></b-form-input>
          </b-form-group>
        </b-col>
      </b-row>
      <b-row>
        <b-col sm="3">
          <b-form-group>
            <label>氏名</label>
            <b-form-input v-model="authData.displayName"></b-form-input>
          </b-form-group>
        </b-col>
        <b-col sm="5">
          <b-form-group>
            <label>電話番号</label>
            <b-form-input v-model="rtdbData.tel"></b-form-input>
          </b-form-group>
        </b-col>
      </b-row>
      <b-row align-v="start">
        <b-col sm="3">
          <b-form-group>
            <label>ログイン要否</label>
            <b-form-radio-group v-model="authData.disabled">
              <b-form-radio name="needLogin" :value="true">不要</b-form-radio>
              <b-form-radio name="needLogin" :value="false">要</b-form-radio>
            </b-form-radio-group>
          </b-form-group>
        </b-col>
        <b-col sm="5">
          <b-form-group description="※ ＝ログインID">
            <label>メールアドレス</label>
            <b-form-input v-model="authData.email" :disabled="authData.disabled"></b-form-input>
          </b-form-group>
        </b-col>
        <b-col sm="4">
          <b-form-group description="">
            <label>パスワード</label>
            <b-form-input v-model="authData.password" :disabled="authData.disabled"></b-form-input>
          </b-form-group>
        </b-col>
      </b-row>
      <b-row>
        <b-col sm="3">
          <b-form-group>
            <label>権限</label>
            <b-form-select v-model="customClaims.role">
              <b-form-select-option value="admin" :disabled="authData.disabled">社員/特権</b-form-select-option>
              <b-form-select-option value="in-house">社員/一般</b-form-select-option>
              <b-form-select-option value="subcontractor">外注先</b-form-select-option>
            </b-form-select>
          </b-form-group>
        </b-col>
      </b-row>
      <b-form-row>
        <b-col>
          <b-table-simple bordered small stacked="sm" class="permission-chart">
            <b-thead head-variant="dark">
              <b-tr>
                <b-th>権限</b-th>
                <b-th>閲覧</b-th>
                <b-th>書き込み</b-th>
              </b-tr>
            </b-thead>
            <b-tbody>
              <b-tr>
                <b-td stacked-heading="権限">社員/特権</b-td>
                <b-td stacked-heading="閲覧">全データ可</b-td>
                <b-td stacked-heading="書き込み">全データ可</b-td>
              </b-tr>
              <b-tr>
                <b-td stacked-heading="権限">社員/一般</b-td>
                <b-td stacked-heading="閲覧">工事一覧のみ<br>(ただし社内の全工事を閲覧可)</b-td>
                <b-td stacked-heading="書き込み">日報更新可<br>(工事の責任者/日報管理者の場合のみ)</b-td>
              </b-tr>
              <b-tr>
                <b-td stacked-heading="権限">外注先</b-td>
                <b-td stacked-heading="閲覧">工事一覧の内、自分がアサインされた工事のみ<br>(関わりのない工事は表示されない)</b-td>
                <b-td stacked-heading="書き込み">日報更新可<br>(工事の責任者/日報管理者の場合のみ)</b-td>
              </b-tr>
            </b-tbody>
          </b-table-simple>
        </b-col>
      </b-form-row>
      <b-form-row>
        <b-button variant="danger" @click="register" :disabled="isRegistering">登録</b-button>
        <b-spinner v-if="isRegistering" class="ml-2"></b-spinner>
      </b-form-row>
    </b-collapse>
    <br>
    <hr>
    <b-row class="pt-3">
      <b-col sm>
        <b-form-group>
          <label>所属</label>
          <b-form-select v-model="searchAffiliation">
            <option value=""></option>
            <option value="in-house">自社</option>
            <option value="subcontractor">外注先</option>
          </b-form-select>
        </b-form-group>
      </b-col>
      <b-col sm>
        <b-form-group description="※あいまい検索">
          <label>名前</label>
          <b-form-input type="text" v-model="searchStaffName" @keypress.enter="searchStaff()"></b-form-input>
        </b-form-group>
      </b-col>
      <b-col align-self="center" sm>
        <b-form-group>
          <b-button variant="primary" @click="searchStaff()">検索</b-button>
        </b-form-group>
      </b-col>
    </b-row>
    <b-row>
      <b-col>
        <b-table-simple sticky-header stacked="sm" bordered>
          <b-thead head-variant="dark">
            <b-tr>
              <b-th>所属</b-th>
              <b-th>名前</b-th>
              <!-- <b-th>UID</b-th> -->
              <b-th></b-th>
              <!-- <b-th></b-th>
              <b-th></b-th> -->
            </b-tr>
          </b-thead>
          <b-tbody>
            <b-tr v-if="isStaffFetched && (staffListFetched == null || isEmpty(staffListFetched))">
              <b-td colspan="4" align="center">データがありません。</b-td>
            </b-tr>
            <template v-for="(staff, staffId) in staffListFetched">
              <b-tr :key="'searched-staff-'+staffId">
                <b-td stacked-heading="所属">{{staff.companyName}}</b-td>
                <b-td stacked-heading="名前">{{staff.staffName}}</b-td>
                <!-- <b-td stacked-heading="UID">{{staffId}}</b-td> -->
                <b-td>
                  <b-button size="sm" variant="outline-info" @click="showStaffDetail(staff, staffId)">詳細</b-button>
                  <b-button size="sm" variant="outline-warning" @click="editStaffDetail(staff, staffId)">編集</b-button>
                  <b-button size="sm" @click="deleteStaff(staffId)">削除</b-button>
                </b-td>
              </b-tr>
            </template>
            <b-modal id="show-staff-detail" ok-only hide-header>
              <b-table-simple stacked="sm">
                <b-tbody>
                  <b-tr>
                    <b-th>所属</b-th>
                    <b-td>{{staffDetail.companyName}}</b-td>
                  </b-tr>
                  <b-tr>
                    <b-th>名前</b-th>
                    <b-td>{{staffDetail.staffName}}</b-td>
                  </b-tr>
                  <b-tr>
                    <b-th>電話番号</b-th>
                    <b-td>{{staffDetail.tel}}</b-td>
                  </b-tr>
                  <b-tr>
                    <b-th>ログイン可</b-th>
                    <b-td>{{staffDetail.disabled ? "No" : "Yes"}}</b-td>
                  </b-tr>
                  <b-tr>
                    <b-th>メールアドレス</b-th>
                    <b-td>{{staffDetail.email}}</b-td>
                  </b-tr>
                  <b-tr>
                    <b-th>メール確認済み</b-th>
                    <b-td>{{staffDetail.emailVerified ? "Yes" : "No"}}</b-td>
                  </b-tr>
                  <b-tr>
                    <b-th>権限</b-th>
                    <b-td>{{getRole}}</b-td>
                  </b-tr>
                  <b-tr>
                    <b-th>ユーザー作成日時</b-th>
                    <b-td>{{staffDetail.creationTime}}</b-td>
                  </b-tr>
                  <b-tr>
                    <b-th>最終ログイン日時</b-th>
                    <b-td>{{staffDetail.lastSignInTime}}</b-td>
                  </b-tr>
                  <b-tr>
                    <b-th>UID</b-th>
                    <b-td>{{staffDetail.staffId}}</b-td>
                  </b-tr>
                </b-tbody>
              </b-table-simple>
            </b-modal>
            <b-modal id="edit-staff-detail" hide-header>
              <b-container>
                <b-row align-v="center">
                  <b-col sm>
                    <label>所属</label>
                  </b-col>
                  <b-col sm>
                    <b-form-select disabled v-model="updatesNew.rtdbData.affiliation">
                      <b-form-select-option value="in-house">{{ myCompanyName }}</b-form-select-option>
                      <b-form-select-option value="subcontractor">外注先</b-form-select-option>
                    </b-form-select>
                  </b-col>
                </b-row>
                <br>
                <b-row>
                  <b-col sm>
                    <label>外注先社名</label>
                  </b-col>
                  <b-col sm>
                    <!-- <b-form-input :disabled=" ! isSubContractor('update')" v-model="updatesNew.rtdbData.companyName" :state="$v.updatesNew.rtdbData.companyName.$invalid ? false : null"></b-form-input> -->
                    <b-form-input disabled v-model="updatesNew.rtdbData.companyName"></b-form-input>
                    <div class="error-message" v-if=" ! $v.updatesNew.rtdbData.companyName.required">※必須項目です</div>
                  </b-col>
                </b-row>
                <br>
                <b-row v-if="isSubContractor('update')">
                  <b-col sm>
                  </b-col>
                  <b-col sm>
                    <b-button size="sm" variant="warning" @click="isChangeCompanyModalShown = true">外注先社名を変更</b-button>
                    <SubcontractorChooser v-if="isChangeCompanyModalShown" v-model="updatesNew.rtdbData" @hide="isChangeCompanyModalShown = false"></SubcontractorChooser>
                  </b-col>
                </b-row>
                <br>
                <b-row align-v="center">
                  <b-col sm>
                    <label>氏名</label>
                  </b-col>
                  <b-col sm>
                    <b-input v-model="updatesNew.rtdbData.staffName" :state="$v.updatesNew.rtdbData.staffName.$invalid ? false : null"></b-input>
                    <div class="error-message" v-if=" ! $v.updatesNew.rtdbData.staffName.required">※必須項目です</div>
                  </b-col>
                </b-row>
                <br>
                <b-row align-v="center">
                  <b-col sm>
                    <label>電話番号</label>
                  </b-col>
                  <b-col sm>
                    <b-input v-model="updatesNew.rtdbData.tel"></b-input>
                  </b-col>
                </b-row>
                <br>
                <b-row align-v="center">
                  <b-col sm>
                    <label>ログイン</label>
                  </b-col>
                  <b-col sm>
                    <b-radio-group v-model="updatesNew.authData.disabled">
                      <b-radio :value="true">不可</b-radio>
                      <b-radio :value="false">可</b-radio>
                    </b-radio-group>
                  </b-col>
                </b-row>
                <br>
                <b-row align-v="center">
                  <b-col sm>
                    <label>権限</label>
                  </b-col>
                  <b-col sm>
                    <b-form-select v-model="updatesNew.customClaims.role">
                      <b-form-select-option value="admin" :disabled="updatesNew.authData.disabled">社員/特権</b-form-select-option>
                      <b-form-select-option value="in-house">社員/一般</b-form-select-option>
                      <b-form-select-option value="subcontractor">外注先</b-form-select-option>
                    </b-form-select>
                  </b-col>
                </b-row>
                <br>
                <b-row align-v="center">
                  <b-col sm>
                    <label>メールアドレス<br>(=ログインID)</label>
                  </b-col>
                  <b-col sm>
                    <b-input v-model="updatesNew.authData.email" :disabled="updatesNew.authData.disabled" :state="$v.updatesNew.authData.email.$invalid ? false : null"></b-input>
                    <div class="error-message" v-if=" ! $v.updatesNew.authData.email.required">※必須項目です</div>
                    <div class="error-message" v-if=" ! $v.updatesNew.authData.email.email">※有効なメールアドレスの形式ではありません</div>
                    <div class="error-message" v-if=" ! $v.updatesNew.authData.email.format">※デフォルトのメールアドレスから変更して下さい</div>
                  </b-col>
                </b-row>
                <br>
                <b-row align-v="center">
                  <b-col sm>
                    <label>パスワードを変更しますか？</label>
                  </b-col>
                  <b-col sm>
                    <b-radio-group v-model="updatesNew.isPasswordToBeChanged" :disabled="updatesNew.authData.disabled">
                      <b-radio :value="true">はい</b-radio>
                      <b-radio :value="false">いいえ</b-radio>
                    </b-radio-group>
                  </b-col>
                </b-row>
                <br>
                <b-row align-v="center">
                  <b-col sm>
                    <label>パスワード</label>
                  </b-col>
                  <b-col sm>
                    <b-input type="password" v-model="updatesNew.authData.password" :disabled="updatesNew.authData.disabled || ! updatesNew.isPasswordToBeChanged" :state="$v.updatesNew.authData.password.$invalid ? false : null"></b-input>
                    <div class="error-message" v-if=" ! $v.updatesNew.authData.password.required">※必須項目です</div>
                    <div class="error-message" v-if=" ! $v.updatesNew.authData.password.minLength">※8文字以上入力して下さい</div>
                    <div class="error-message" v-if=" ! $v.updatesNew.authData.password.maxLength">※最大15文字までです</div>
                  </b-col>
                </b-row>
                <br>
                <b-row align-v="center">
                  <b-col sm>
                    <label>パスワード(再入力)</label>
                  </b-col>
                  <b-col sm>
                    <b-input type="password" v-model="updatesNew.passwordRepeated" :disabled="! updatesNew.isPasswordToBeChanged"></b-input>
                    <div class="error-message" v-if="updatesNew.isPasswordToBeChanged && ! $v.updatesNew.passwordRepeated.sameAsPassword">※パスワードが一致しません</div>
                  </b-col>
                </b-row>
              </b-container>
              <template #modal-footer>
                <b-button @click="update" :disabled="isUpdating || $v.$invalid">保存</b-button>
                <b-button @click="cancel">キャンセル</b-button>
              </template>
            </b-modal>
          </b-tbody>
        </b-table-simple>
      </b-col>
    </b-row>
  </b-container>
</template>

<style scoped>
.permission-chart {
  font-size:0.8em;
}
</style>

<script>
import SubcontractorChooser from '@/components/subcontractor-chooser.vue'

import isEmpty from 'lodash/isEmpty'
import isEqual from 'lodash/isEqual'
import cloneDeep from 'lodash/cloneDeep'
import { required, requiredIf, email, minLength, maxLength, sameAs } from 'vuelidate/lib/validators'

export default {
  components: {
    SubcontractorChooser
  },
  data() {
    return {
      myCompanyName: process.env.COMPANY_NAME,
      isRegistering: false,
      disabledEmailPrefix: "disableduser-",
      searchAffiliation: "",
      searchStaffName: "",
      isStaffFetched: false,
      isCollapsed: false,
      isSetSubcontractorModalShown: false,
      isChangeCompanyModalShown: false,
      staffListFetched: {},
      staffDetail: {},
      authData: {
        email: "",
        password: null,
        displayName: "",
        emailVerified: false,
        disabled: true
      },
      customClaims: {
        role: "subcontractor"
      },
      rtdbData: {
        staffName: "",
        tel: "",
        affiliation: "subcontractor",
        companyName: "",
        companyNameAbbreviated: ""
      },
      isUpdating: false,
      updatesOrig: {},
      updatesNew: {
        staffId: "",  // Must be deleted on persist
        passwordRepeated: "",  // Must be deleted on persist
        isPasswordToBeChanged: false,  // Must be deleted on persist
        authData: {
          uid: null,
          email: "",
          password: "",
          // displayName: "",
          // emailVerified: false,
          disabled: true,
        },
        customClaims: {
          role: null
        },
        rtdbData: {
          staffName: "",
          tel: "",
          affiliation: "",
          companyName: "",
        }
      }
    }
  },
  validations: {
    updatesNew: {
      staffId: {required},
      passwordRepeated: {
        required: requiredIf(function() {
          return this.updatesNew.isPasswordToBeChanged
        }),
        sameAsPassword: sameAs(function() {
          return this.updatesNew.authData.password
        })
      },
      // isPasswordToBeChanged: false,  // Must be deleted on persist
      authData: {
        email: {
          required,
          email,
          format: function(value) {
            return this.updatesNew.authData.disabled || ! value.includes(this.disabledEmailPrefix)
          }
        },
        password: {
          required: requiredIf(function() {
            return this.updatesNew.isPasswordToBeChanged
          }),
          minLength: minLength(8),
          maxLength: maxLength(15)
        },
        // displayName: "",
        // emailVerified: false,
        // disabled: true,
      },
      // customClaims: {
      //   role: "subcontractor"
      // },
      rtdbData: {
        staffName: {required},
        // affiliation: "",
        companyName: {
          required: requiredIf(function(updatesNew) {
            return this.isSubContractor("update")
          })
        }
      }
    }
  },
  computed: {
    isSubContractor: function() {
      return mode => {
        var affiliation
        if(mode === "new")
          affiliation = this.rtdbData.affiliation
        else if(mode === "update")
          affiliation = this.updatesNew.rtdbData.affiliation
        return affiliation === 'subcontractor'
      }
    },
    getRole: function() {
      switch (this.staffDetail.role) {
        case "admin":
          return "自社/管理者"
          break;
        case "in-house":
          return "自社/一般"
          break;
        case "subcontractor":
          return "外注先"
          break;
        default:
          return null
          break;
      }
    }
  },
  methods: {
    isEmpty,
    toggle() {
      if(this.isCollapsed) {
        this.isCollapsed = false
      } else {
        this.isCollapsed = true
      }
    },
    async registerWrapper() {
      this.isRegistering = true
      try {
        await register()
      } catch(e) {
        alert(`予期せぬエラーが発生しました。\n内容：${JSON.stringify(e)}`)
      }
      this.isRegistering = false
    },
    async register() {
      this.rtdbData.staffName = this.authData.displayName
      if(this.rtdbData.affiliation === "in-house") {
        this.rtdbData.companyName = process.env.COMPANY_NAME
        this.rtdbData.companyId = "1000"
      }

      let couldGetUid = true
      await this.$firebase.db.fetchLargestUserId(this.rtdbData.affiliation)
              .then(data => {
                console.log(`snapShot.val(): ${JSON.stringify(data)}`);
                this.authData.uid = (Number.parseInt(data) + 1).toString()
              }).catch(error => {
                console.log(`error: ${JSON.stringify(error)}`);
                couldGetUid = false
                alert(`UIDの最大値を取得できませんでした。`)
              })
      console.log(`this.authData.uid: ${this.authData.uid}`)
      if( ! couldGetUid)
        return

      //Set values for disabled (loginless) user
      if(this.authData.disabled) {

        if(this.customClaims.role === "admin")
          return alert(`ログイン不要の場合、「権限」は「管理者」以外を選択してください。`)
        this.authData.email = `${this.disabledEmailPrefix}${this.authData.uid}@${process.env.EMAIL_DOMAIN}`
        function generatePassword() {
          var length = 12,
              charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
              retVal = "";
          for (var i = 0, n = charset.length; i < length; ++i) {
              retVal += charset.charAt(Math.floor(Math.random() * n));
          }
          return retVal;
        }
        this.authData.password = generatePassword()
      }

      console.log(`this.rtdbData.affiliation: ${this.rtdbData.affiliation}, email: ${this.authData.email}, password: ${this.authData.password}`);

      await this.$firebase.db.registerUser({
        authData: this.authData,
        customClaims: this.customClaims,
        rtdbData: this.rtdbData
      })
    },
    searchStaff(){
      this.$set(this.$data, "staffListFetched", {})
      this.$firebase.db.fetchStaff(this.searchAffiliation, this.searchStaffName)
              .then(staffList => {
                this.$set(this.$data, "staffListFetched", staffList)
                this.isStaffFetched = true
              })
    },
    async showStaffDetail(staff, staffId) {
      this.staffDetail = await this.$firebase.db.fetchAuthInfo(staffId)
      this.staffDetail.companyName = staff.companyName
      this.staffDetail.staffName = staff.staffName
      this.staffDetail.tel = staff.tel
      this.$bvModal.show("show-staff-detail")
    },
    async deleteStaff(staffId) {
      if( ! confirm("該当のユーザーを削除します。\n(日報などの情報は削除されません。)\n本当によろしいですか？")) return
      this.$firebase.db.deleteUser(staffId)
              .then(val => {
                this.searchStaff()
              })
    },
    async editStaffDetail(staff, staffId){
      this.staffDetail = await this.$firebase.db.fetchAuthInfo(staffId)
      this.updatesNew.isPasswordToBeChanged = false
      this.updatesNew.passwordRepeated = ""
      this.updatesNew.staffId = staffId
      this.updatesNew.authData = {
        email: this.staffDetail.email,
        displayName: this.staffDetail.displayName,
        emailVerified: this.emailVerified,
        disabled: this.staffDetail.disabled,
        password: ""
      }
      this.updatesNew.customClaims = {
        role: this.staffDetail.role
      }
      this.updatesNew.rtdbData = {
        staffName: staff.staffName,
        tel: staff.tel,
        affiliation: staff.affiliation,
        companyName: staff.companyName,
      }
      this.updatesOrig = cloneDeep(this.updatesNew)

      console.log(`this.updatesNew: ${JSON.stringify(this.updatesNew)}`);
      this.$bvModal.show("edit-staff-detail")
    },
    update() {
      this.isUpdating = true
      const copiedOrig = cloneDeep(this.updatesOrig)
      const copiedNew = cloneDeep(this.updatesNew)

      if( ! copiedNew.isPasswordToBeChanged) {
        delete copiedOrig.authData.password
        delete copiedNew.authData.password
      }

      //Delete unnecessary data before compare orig and new
      delete copiedOrig.isPasswordToBeChanged
      delete copiedOrig.passwordRepeated
      delete copiedNew.isPasswordToBeChanged
      delete copiedNew.passwordRepeated

      if(isEqual(copiedOrig, copiedNew)) {
        this.isUpdating = false
        return alert('変更点がありません。')
      }
      
      if(copiedNew.rtdbData.staffName !== copiedOrig.rtdbData.staffName) {
        copiedNew.authData.displayName = copiedNew.rtdbData.staffName
      }

      console.log(`copiedNew: ${JSON.stringify(copiedNew)}`);
      this.$firebase.db.updateUser(copiedNew)
              .then(val => {
                this.isUpdating = false
                this.$bvModal.hide("edit-staff-detail")
                this.searchStaff()
              }).catch(error => {
                this.isUpdating = false
              })
    },
    cancel() {
      this.$bvModal.hide("edit-staff-detail")
    }
  }
}
</script>