<template>
  <div class="grand-container">
    <p class="text-center title">
        メンテナンス中です
    </p>
    <div class="text-center">
        申し訳ございません。只今メンテナンス中です。<br>
    </div>
    <br>
    <div class="text-center colored-bg">
        【メンテナンス予定日時】<br>
        {{ $tstore.pages.maintenanceDuration }}
    </div>
  </div>
</template>

<style scoped>
.grand-container {
  text-align: center;
  width: 100vw;
  height: 90vh;
  display: table-cell;
  vertical-align: middle;
}
.text-center {
  text-align:center;
}
.title {
  font-size:24px;
  font-weight: bold;
  color:#3498db;
}
.colored-bg {
  padding:1em;
  background-color: rgb(185, 62, 62);
  color: white;
  font-weight: bold;
  width: 60%;
  margin: auto auto;
}
</style>