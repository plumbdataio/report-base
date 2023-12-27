import axios from 'axios'

const URLRegisterReport = "https://script.google.com/macros/s/AKfycbypAOKfI1WlkVBhWy0Sja76Wxrereev22h8BujDwvhXzlwsCUd_pkTyCzCfJNbxIuJT/exec"
const URLFetchSpoolnums = "https://script.google.com/macros/s/AKfycby7aaRuvaMwgmkQS9DydMmrzbNdTFv8DxD1CYzSESN7OOjGwxM1HJfzzg/exec"
export default {
  fetchSpoolnums() {
    var spoolNums = []
    return axios.get(URLFetchSpoolnums)
  },
  async registerReport(works) {
    const data = new FormData()
    data.append("data", JSON.stringify(works))
    
    let returnCode = "unknown"
    await axios.post(URLRegisterReport, data, {
      timeout: 20000
    })
    .then(response => {
      returnCode = response.data
    }, error => {
      if(error.message.startsWith("timeout"))
        returnCode = "timeout"
      console.log(`POST error! : ${JSON.stringify(error)}`);
    })

    return returnCode
  }
}