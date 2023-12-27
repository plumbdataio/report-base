<template>
<b-card>
  <b-card-body class="p-0">
    <b-row>
      <b-col cols="auto">
        <b-button :disabled="disabled" :class="{'button-plus': ! isCollapsed, 'button-minus': isCollapsed}" variant="outline-secondary" size="sm" @click="isCollapsed = ! isCollapsed"></b-button>
      </b-col>
      <b-col class="align-self-center">
        <h5 class="m-0">{{title}}</h5>
      </b-col>
    </b-row>
    <b-collapse v-if=" ! disabled" v-model="isCollapsed">
      <div class="mt-2">
        <slot></slot>
      </div>
    </b-collapse>
  </b-card-body>
</b-card>
</template>

<script>
export default {
  props: {
    title: {
      type: String,
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      isCollapsed: false
    }
  }
}
</script>