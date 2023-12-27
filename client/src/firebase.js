import axios from "axios"

const netlifyMode = process.env.netlifyMode != null
                  ? process.env.netlifyMode
                  :"prod"

console.log(`netlifyMode: ${netlifyMode}`);

const netlifyInfix = ".netlify/functions"
const netlifyUrl = netlifyMode === "dev" ? `http://localhost:8888/${netlifyInfix}`
                 : netlifyMode === "emulator" ? `http://10.0.2.2:8888/${netlifyInfix}`
                 : netlifyMode === "prev" ? `https://preview--${process.env.FUNCTIONS_URL}/${netlifyInfix}`
                 : netlifyMode === "prod" ? `https://${process.env.FUNCTIONS_URL}/${netlifyInfix}`
                 : null

export default {
  fetchAllReportOn(date) {
    return axios.get(`${netlifyUrl}/fetchAllReportOn`, {
      params:{
        date: date
      }
    })
    .then(response => {
      console.log(`Report successfully fetched.`)
      return response.data
    }, reason => {
      console.log(`Error: ${JSON.stringify(reason)}`);
      console.log(`作業日報の取得に失敗しました。\n${JSON.stringify(reason)}`)
    })
  },
  fetchWorkId(status) {
    return axios.get(`${netlifyUrl}/fetchWorkId`, {
      params:{
        status: status
      }
    })
    .then(response => {
      console.log("Work IDs fetched successfully.")
      return response.data
    }, reason => {
      console.log(`Error: ${JSON.stringify(reason)}`);
      console.log(`工事番号/ユニット番号の取得に失敗しました。\n${JSON.stringify(reason)}`)
    })
  },
  fetchTypeOptions() {
    return axios.get(`${netlifyUrl}/fetchTypeOptions`)
    .then(response => {
      console.log("Type Options fetched successfully.")
      return response.data
    }, reason => {
      console.log(`Error: ${JSON.stringify(reason)}`);
      console.log(`選択肢の取得に失敗しました。\n${JSON.stringify(reason)}`)
    })
  },
  registerInhouseReport(newReport) {
    return axios.post(`${netlifyUrl}/registerInhouseReport`, {newReport},{})
  },
  deleteInhouseReport(reportId) {
    return axios.get(`${netlifyUrl}/deleteInhouseReport`, {
      params:{
        reportId: reportId
      }
    })
    .then(response => {
      console.log(`ReportId '${reportId}' successfully deleted.`)
      return response.data
    }, reason => {
      console.log(`Error: ${JSON.stringify(reason)}`);
      console.log(`Deletion of reportId '${reportId}' failed.\n${JSON.stringify(reason)}`)
    })
  },
  fetchPipeStatus(key) {
    return axios.get(`${netlifyUrl}/fetchPipeStatus`, {
      params: {key}
    })
    .then(response => response.data)
    .catch(error => {
      console.log(`Error: ${JSON.stringify(error)}`)
      console.log(`fetchPipeStatus("${key}")) failed.`);
    })
  },
  updatePipeStatus(key, updates) {
    return axios.post(`${netlifyUrl}/updatePipeStatus`, {}, {
      params: {
        key: key,
        value: updates,
      }
    })
    .then(response => response.data)
    .catch(error => {
      console.log(`Error: ${JSON.stringify(error)}`)
      console.log(`updatePipeStatus("${key}", "${updates}") failed.`);
    })
  }
}