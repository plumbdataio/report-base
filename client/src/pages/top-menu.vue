<template>
  <div class="container">
    <b-container class="p-2 element-box">
      <b-row align-v="center" class="main overflow-hidden">
        <b-col sm>
          <b-card align="center" class="h-100" text-variant="danger" border-variant="danger" title="作業日報">
            <b-button variant="danger" @click="moveTo('/inhouse-report')">入力画面へ</b-button>
          </b-card>
        </b-col>
        <b-col sm>
          <b-card align="center" class="h-100" text-variant="info" border-variant="info" title="溶接出来高日報">
            <b-button variant="info" @click="moveTo('/welding-report')">入力画面へ</b-button>
          </b-card>
        </b-col>
        <b-col sm>
          <b-card align="center" class="h-100" text-variant="primary" border-variant="primary" title="資料室">
            <b-button variant="primary" @click="openInNewTab">新しいTabで開く</b-button>
          </b-card>
        </b-col>
      </b-row>
      <b-row class="footer">
        <b-col>
          <div class="text-center introduce-qr">QRコードでこのページをシェアする<br>▼</div>
        </b-col>
      </b-row>
      <b-row align-h="center" class="m-2">
        <b-col class="text-center">
          <b-img src="assets/qr.png"></b-img>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>

<style scoped>
.container::-webkit-scrollbar { 
  display: none;
}
.element-box {
  height: 100vh;
  height: 100dvh;
}
.main {
  height: 92vh;
  height: 92dvh;
}
.footer {
  height: 8vh;
  height: 8dvh;
}
.introduce-qr {
  color: #9c9c9c;
  font-size: 2vh;
  font-size: 2dvh;
}
</style>

<script>
export default {
  methods: {
    moveTo(destination) {
      this.$router.push(destination)
    },
    openInNewTab() {
      const url = "https://drive.google.com/drive/folders/1oJeHOWYV91yTKMkTH3eMoDCDkcY430Y4?usp=sharing"
      Object.assign(document.createElement('a'), {
        target: '_blank',
        rel: 'noopener noreferrer',
        href: url,
      }).click()
    }
  }
}
</script>