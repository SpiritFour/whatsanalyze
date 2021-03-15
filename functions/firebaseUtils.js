export class Firebase {
  static getToken(eMail, numberToken = 10) {
    let db = window.$nuxt.$fire.firestore;

    function addOneToken(eMail) {
      return db
        .collection("token")
        .add({ eMail: eMail })
        .then((messageRef) => {
          return messageRef.id;
        });
    }

    return Promise.all(
      Array(numberToken)
        .fill()
        .map(() => addOneToken(eMail))
    );
  }
}
