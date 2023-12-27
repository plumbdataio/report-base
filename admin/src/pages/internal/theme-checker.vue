<template>
<div>
  <hr>
  <div>BButton</div>
  <div class="d-flex justify-content-between">
    <BButton v-for="variant in variants" :key="`btn-${variant}`" :variant="variant" class="text-nowrap">ボタン</BButton>
  </div>

  <hr>
  <div>BCard</div>
  <div class="d-flex justify-content-between">
    <BCard v-for="variant in variants" :key="`card1-${variant}`" text-variant="white" :class="`text-nowrap card-${variant}`">カード</BCard>
  </div>
  <div class="mt-4 d-flex justify-content-between">
    <BCard v-for="variant in variants" :key="`card2-${variant}`" text-variant="black" :class="`text-nowrap card-${variant}`">カード</BCard>
  </div>

  <hr>
  <div>BRadioGroup & BRadio</div>
  <div class="d-flex">
    <BRadioGroup v-model="radio">
      <BRadio :value="true">月別</BRadio>
      <BRadio :value="false">日別</BRadio>
    </BRadioGroup>
    <BRadioGroup size="lg" v-model="radio" class="ml-4">
      <BRadio :value="true">月別</BRadio>
      <BRadio :value="false">日別</BRadio>
    </BRadioGroup>
  </div>

  <hr>
  <div>BFormCheckbox</div>
  <div class="d-flex">
    <BFormCheckbox switch size="lg" v-model="toggle">オンにする</BFormCheckbox>
    <BFormCheckbox size="lg" v-model="toggle" class="ml-4" style="--bs-focus-ring-color">オンにする</BFormCheckbox>
  </div>

  <hr>
  <div>BSpinner</div>
  <div class="d-flex justify-content-between">
    <BSpinner v-for="variant in variants" :key="`spinner-${variant}`" :variant="variant" class="text-nowrap"></BSpinner>
  </div>
  <div class="d-flex justify-content-between mt-3">
    <BSpinner v-for="variant in variants" :key="`spinner-${variant}`" :variant="variant" class="text-nowrap" type="grow"></BSpinner>
  </div>

  <hr>
  <div>BTableSimple</div>
  <b-table-simple bordered>
    <BThead class="theme-thead-color1">
      <th>ID</th>
      <th>名前</th>
      <th>年齢</th>
    </BThead>
    <BTbody>
      <td>10001</td>
      <td>高畑</td>
      <td>37</td>
    </BTbody>
  </b-table-simple>
  <b-table-simple bordered>
    <BThead class="theme-thead-color2">
      <th>ID</th>
      <th>名前</th>
      <th>年齢</th>
    </BThead>
    <BTbody>
      <td>10001</td>
      <td>高畑</td>
      <td>37</td>
    </BTbody>
  </b-table-simple>

  <div v-for="variant in ['light', 'dark']" :key="`tbl-${variant}`" class="d-flex justify-content-between">
    <b-table-simple bordered>
      <BThead :head-variant="variant">
        <th>ID</th>
        <th>名前</th>
        <th>年齢</th>
      </BThead>
      <BTbody>
        <td>10001</td>
        <td>高畑</td>
        <td>37</td>
      </BTbody>
    </b-table-simple>
  </div>


</div>
</template>

<script>
import { BFormCheckbox } from 'bootstrap-vue';

export default {
    data() {
        return {
            variants: [
                "light", "dark", "primary", "secondary", "info", "warning", "danger",
                "outline-light", "outline-dark", "outline-primary", "outline-secondary", "outline-info", "outline-warning", "outline-danger",
            ],
            radio: true,
            toggle: true,
        };
    },
    components: { BFormCheckbox }
}
</script>