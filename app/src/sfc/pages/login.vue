<template>
  <div id="parent" class="theme-login vh-100 vw-100 d-flex flex-column align-items-center justify-content-center">
    <img id="logo" :src="logo">
      <transition name="spinner" @after-leave="isUiTransitionStarted = true">
        <b-spinner v-if=" ! isUiShown" variant="info" class="mt-4"></b-spinner>
      </transition>
      <transition name="ui">
        <div ref="firebaseui" class="container" v-show="isUiTransitionStarted"></div>
      </transition>
  </div>
</template>

<style scoped>
#parent {
  position: relative;
}
#logo {
  margin-bottom: 20px;
  width: 150px;
  border-color:blue;
}
#container {
  position: relative;
  top: 40%;
  left: 50%;
  transform: translateX(-50%) translateY(-40%);
  text-align: center;
  min-width: 300px;
}
@media screen and (max-width: 768px) {
  #container {
    min-width: 90%;
    max-width: 300px;
  }
}

.spinner-leave-active {
  transition: opacity .2s ease;
}
.spinner-leave-to {
  opacity: 0;
}
.ui-enter {
  opacity: 0;
}
.ui-enter-active {
  transition: opacity .3s ease;
}
.ui-enter-to {
  opacity: 1;
}
</style>

<script>
import logo from '@/assets/logo.svg'

export default {
  created() {
    console.log("### login.vue created.")
  },
  mounted() {
    if(this.$refs?.firebaseui) {
      //@ts-expect-error
      this.$firebase.auth.logIn(this.$refs.firebaseui, () => {
        this.isUiShown = true;
      })
    }
  },
  data() {
    return {
      logo: logo,
      isUiShown: false,
      isUiTransitionStarted: false,
    }
  }
}
</script>