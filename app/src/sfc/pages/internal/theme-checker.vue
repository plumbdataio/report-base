<template>
<div>
  <hr>
  <div>BButton</div>
  <div class="d-flex justify-content-between">
    <b-button v-for="variant in variants" :key="`btn-${variant}`" :variant="variant" class="text-nowrap">ボタン</b-button>
  </div>

  <hr>
  <div>BCard</div>
  <div class="d-flex justify-content-between">
    <b-card v-for="variant in variants" :key="`card1-${variant}`" text-variant="white" :class="`text-nowrap card-${variant}`">カード</b-card>
  </div>
  <div class="mt-4 d-flex justify-content-between">
    <b-card v-for="variant in variants" :key="`card2-${variant}`" text-variant="black" :class="`text-nowrap card-${variant}`">カード</b-card>
  </div>

  <hr>
  <div>BRadioGroup & BRadio</div>
  <div class="d-flex">
    <b-radio-group v-model="radio">
      <b-radio :value="true">月別</b-radio>
      <b-radio :value="false">日別</b-radio>
    </b-radio-group>
    <b-radio-group size="lg" v-model="radio" class="ml-4">
      <b-radio :value="true">月別</b-radio>
      <b-radio :value="false">日別</b-radio>
    </b-radio-group>
  </div>

  <hr>
  <div>BFormCheckbox</div>
  <div class="d-flex">
    <b-form-checkbox switch size="lg" v-model="toggle">オンにする</b-form-checkbox>
    <b-form-checkbox size="lg" v-model="toggle" class="ml-4" style="--bs-focus-ring-color">オンにする</b-form-checkbox>
  </div>

  <hr>
  <div>BSpinner</div>
  <div class="d-flex justify-content-between">
    <b-spinner v-for="variant in variants" :key="`spinner-${variant}`" :variant="variant" class="text-nowrap"></b-spinner>
  </div>
  <div class="d-flex justify-content-between mt-3">
    <b-spinner v-for="variant in variants" :key="`spinner-${variant}`" :variant="variant" class="text-nowrap" type="grow"></b-spinner>
  </div>

  <hr>
  <div>BTableSimple</div>
  <b-table-simple bordered>
    <b-thead class="theme-thead-color1">
      <th>ID</th>
      <th>名前</th>
      <th>年齢</th>
    </b-thead>
    <b-tbody>
      <td>10001</td>
      <td>高畑</td>
      <td>37</td>
    </b-tbody>
  </b-table-simple>
  <b-table-simple bordered>
    <b-thead class="theme-thead-color2">
      <th>ID</th>
      <th>名前</th>
      <th>年齢</th>
    </b-thead>
    <b-tbody>
      <td>10001</td>
      <td>高畑</td>
      <td>37</td>
    </b-tbody>
  </b-table-simple>

  <div v-for="variant in ['light', 'dark']" :key="`tbl-${variant}`" class="d-flex justify-content-between">
    <b-table-simple bordered>
      <b-thead :head-variant="variant">
        <th>ID</th>
        <th>名前</th>
        <th>年齢</th>
      </b-thead>
      <b-tbody>
        <td>10001</td>
        <td>高畑</td>
        <td>37</td>
      </b-tbody>
    </b-table-simple>
  </div>


</div>
</template>

<script>
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
}
</script>