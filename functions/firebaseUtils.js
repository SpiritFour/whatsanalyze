export class Firebase {
  static getToken(eMail, numberToken = 10) {
    const messageRef = window.$nuxt.$fire.firestore
      .collection("token")
      .doc(eMail);
    let token = Array(numberToken)
      .fill()
      .map(() => Math.random().toString(36).substring(7));
    let firebaseUpdate = {
      tokens: window.$nuxt.$fireModule.firestore.FieldValue.arrayUnion(
        ...token
      ),
    };
    return messageRef
      .get()
      .then((a) => {
        if (!a.exists) {
          return messageRef.set(firebaseUpdate);
        } else {
          return messageRef.update(firebaseUpdate);
        }
      })
      .then(() => token);
  }
}
