import Vue from 'vue'

import { BButton } from 'bootstrap-vue/esm/components/button'
Vue.component("b-button", BButton)

import { BButtonToolbar } from 'bootstrap-vue/esm/components/button-toolbar'
Vue.component("b-button-toolbar", BButtonToolbar)

import { BCard, BCardBody } from 'bootstrap-vue/esm/components/card'
Vue.component("b-card", BCard)
Vue.component("b-card-body", BCardBody)

import { BContainer, BRow, BCol } from 'bootstrap-vue/esm/components/layout'
Vue.component("b-container", BContainer)
Vue.component("b-row", BRow)
Vue.component("b-col", BCol)

import { BCollapse } from 'bootstrap-vue/esm/components/collapse'
Vue.component("b-collapse", BCollapse)

import { BFormDatepicker } from 'bootstrap-vue/esm/components/form-datepicker'
Vue.component("b-datepicker", BFormDatepicker)

import { BFormCheckbox, BFormCheckboxGroup } from 'bootstrap-vue/esm/components/form-checkbox'
Vue.component("b-checkbox", BFormCheckbox)
Vue.component("b-form-checkbox", BFormCheckbox)
Vue.component("b-checkbox-group", BFormCheckboxGroup)
Vue.component("b-form-checkbox-group", BFormCheckboxGroup)

import { BFormGroup } from 'bootstrap-vue/esm/components/form-group'
Vue.component("b-form-group", BFormGroup)

import { BFormSelect, BFormSelectOption, BFormSelectOptionGroup } from 'bootstrap-vue/esm/components/form-select'
Vue.component("b-select", BFormSelect)
Vue.component("b-form-select", BFormSelect)
Vue.component("b-select-option", BFormSelectOption)
Vue.component("b-form-select-option", BFormSelectOption)
Vue.component("b-select-option-group", BFormSelectOptionGroup)
Vue.component("b-form-select-option-group", BFormSelectOptionGroup)

import { BFormInput } from 'bootstrap-vue/esm/components/form-input'
Vue.component("b-input", BFormInput)
Vue.component("b-form-input", BFormInput)

import { BFormRadio, BFormRadioGroup } from 'bootstrap-vue/esm/components/form-radio'
Vue.component("b-radio", BFormRadio)
Vue.component("b-form-radio", BFormRadio)
Vue.component("b-radio-group", BFormRadioGroup)
Vue.component("b-form-radio-group", BFormRadioGroup)

import { BFormTimepicker } from 'bootstrap-vue/esm/components/form-timepicker'
Vue.component("b-timepicker", BFormTimepicker)

import { BFormTextarea } from 'bootstrap-vue/esm/components/form-textarea'
Vue.component("b-textarea", BFormTextarea)

import { BListGroup, BListGroupItem } from 'bootstrap-vue/esm/components/list-group'
Vue.component("b-list-group", BListGroup)
Vue.component("b-list-group-item", BListGroupItem)

import { ModalPlugin } from 'bootstrap-vue/esm/components/modal'
Vue.use(ModalPlugin, {
  "BModal": {
    centered: true,
  }
})

import { BNav } from 'bootstrap-vue/esm/components/nav'
Vue.component("b-nav", BNav)

import { BNavbar, BNavbarBrand } from 'bootstrap-vue/esm/components/navbar'
Vue.component("b-navbar", BNavbar)
Vue.component("b-navbar-brand", BNavbarBrand)

import { BOverlay } from 'bootstrap-vue/esm/components/overlay'
Vue.component("b-overlay", BOverlay)

import { BSpinner } from 'bootstrap-vue/esm/components/spinner'
Vue.component("b-spinner", BSpinner)

import { BSidebar } from 'bootstrap-vue/esm/components/sidebar'
Vue.component("b-sidebar", BSidebar)

import { BTableSimple, BThead, BTbody, BTr, BTh, BTd } from 'bootstrap-vue/esm/components/table'
Vue.component("b-table-simple", BTableSimple)
Vue.component("b-tbody", BTbody)
Vue.component("b-thead", BThead)
Vue.component("b-tr", BTr)
Vue.component("b-th", BTh)
Vue.component("b-td", BTd)

import { BTab, BTabs } from 'bootstrap-vue/esm/components/tabs'
Vue.component("b-tab", BTab)
Vue.component("b-tabs", BTabs)

import { BTooltip } from 'bootstrap-vue/esm/components/tooltip'
Vue.component("b-tooltip", BTooltip)

import { VBToggle } from 'bootstrap-vue/esm/directives/toggle'
Vue.directive("b-toggle", VBToggle)