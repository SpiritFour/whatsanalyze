import type { Firestore } from "firebase/firestore";
import { addDoc, collection, Timestamp } from "firebase/firestore";
import { nextFreeUploadAt } from "~/stores/wrapped/uploadAccessStore";

/**
 * Queues one email for when the free daily analysis is back. The
 * sendWrappedReminders function mails it and deletes the document, so the
 * address is not kept past that one email.
 */
export async function requestFreeUploadReminder(
  email: string,
  locale: string,
): Promise<void> {
  const firestore = useNuxtApp().$firestore as Firestore;
  await addDoc(collection(firestore, "wrappedReminders"), {
    email,
    locale,
    notifyAt: Timestamp.fromDate(nextFreeUploadAt()),
  });
}
