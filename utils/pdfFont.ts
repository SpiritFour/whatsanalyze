import jsPDF from "jspdf";
import myFont from "~/assets/pdf-fonts/Helvetica.js";

// Both faces need their own name in the virtual file system: registering them
// under a single file name makes the bold data overwrite the regular one, and
// every line of body text comes out in the bold face.
const callAddFont = function (this: any) {
  this.addFileToVFS("myFont-normal.ttf", myFont.normal);
  this.addFont("myFont-normal.ttf", "myFont", "normal");

  this.addFileToVFS("myFont-bold.ttf", myFont.bold);
  this.addFont("myFont-bold.ttf", "myFont", "bold");
};

jsPDF.API.events.push(["addFonts", callAddFont]);
