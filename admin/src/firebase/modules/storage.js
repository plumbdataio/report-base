import {ref} from 'firebase/storage'
// import firebase from 'firebase/compat/app'
// import "firebase/compat/storage"

export default {
  uploadOrderDocument(workId, file) {
    const ref = firebase.storage().ref(`/orderDocuments/${workId}`).child(file.name)
    return ref.put(file).then(result => ref.getDownloadURL())
  },
  deleteOrderDocument(url) {
    return firebase.storage().refFromURL(url).delete()
  }
}