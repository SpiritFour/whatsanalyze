import logoBlack from "/assets/whatsanalyze-logo-black.png";
import myFont from "/assets/pdf-fonts/Helvetica.js";

import { getDateString } from "~/functions/utils";
import { getAttachment } from "~/functions/attachments";
import jsPDF from "jspdf";

var callAddFont = function () {
  this.addFileToVFS("myFont.ttf", myFont.normal);
  this.addFont("myFont.ttf", "myFont", "normal");

  this.addFileToVFS("myFont.ttf", myFont.bold);
  this.addFont("myFont.ttf", "myFont", "bold");
};
jsPDF.API.events.push(["addFonts", callAddFont]);

export async function render(chat, attachments, ego, isSample = false) {
  // Default export is a4 paper, portrait, using millimeters for units
  const doc = new jsPDF();
  // doc specifications
  const width = 210;
  const height = 297;
  const fontSize = 11;
  const marginTop = 32;
  const marginLeft = 20;
  const pageYSpace = 297 - marginTop;
  const messageMarginBottom = 5;
  const paddingMessage = 3;
  const authorHeight = 9;
  const timeHeight = 3;

  const backgroundGreenHex = "#21a68d";

  const lastDate = chat.chatObject.slice(-1)[0].date;
  const firstDate = chat.chatObject[0].date;
  const numDays = Math.round(
    Math.abs((firstDate - lastDate) / (24 * 60 * 60 * 1000))
  );

  //   Variable to track y-coordinate / used space on page
  let usedYSpace = 0;

  //    --- HELPER FUNCTIONS
  const getImgSizes = function (imgUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve([img.width, img.height]);
      };
      img.onerror = reject;
      img.src = imgUrl;
    });
  };

  const loadImage = async function (selector) {
    const imgUrl = document
      .querySelector(selector + ">*>canvas")
      .toDataURL("image/png");
    const sizes = await getImgSizes(imgUrl);
    return { img: imgUrl, width: sizes[0], height: sizes[1] };
  };

  const writeRightSideText = function (text) {
    const textWidth = doc.getTextWidth(text);
    doc.text(text, width - marginLeft - textWidth, usedYSpace);
  };

  const addPageIfNeeded = function (height, r = 23, g = 166, b = 141) {
    if (usedYSpace + height > pageYSpace) {
      addColoredPage(false, r, g, b);
    }
  };

  // calculates height for new message
  const calcMessageBodyHeight = function (
    numLines,
    attachmentHeight,
    isSystem
  ) {
    let messageY = marginTop + usedYSpace;
    const messageYSpace = numLines * lineHeight + authorHeight + timeHeight; // Height of Messages
    // Check if lines fit on page,
    if (
      usedYSpace + attachmentHeight + messageYSpace + marginTop / 2 >
      pageYSpace
    ) {
      // is first message
      addColoredPage(false);
      messageY = marginTop;
      usedYSpace = 0;
    }
    usedYSpace += isSystem
      ? messageMarginBottom + messageYSpace - authorHeight + timeHeight
      : messageMarginBottom + messageYSpace;
    return messageY;
  };
  const hexToRgb = function (hex) {
    if (hex.length != 7) {
      console.log(hex);
      throw "Only seven-digit hex colors are allowed.";
    }
    // remove #
    hex = hex.slice(1);

    var aRgbHex = hex.match(/.{1,2}/g);
    var aRgb = [
      parseInt(aRgbHex[0], 16),
      parseInt(aRgbHex[1], 16),
      parseInt(aRgbHex[2], 16),
    ];
    return aRgb;
  };
  const addBranding = function (addText = true, x = 130, y = 15) {
    // logo
    doc.addImage(logoBlack, "PNG", x + 50, y, 13, 13);
    // title
    if (addText) {
      doc.setFontSize(20);
      doc.setTextColor(0, 0, 0);
      doc.setFont("myFont", "bold");
      doc.text(x, y + 10, "WhatsAnalyze");
    }
  };
  const addHeading = function (text, x, y) {
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(50);
    doc.text(text, x, y);
    usedYSpace += 10;
  };
  const drawAuthorBubble = function (author, x, y) {
    doc.setFont("myFont", "bold");
    doc.setFontSize(20);

    let personHexColor = chat.personColorMap[author];
    // background color should not be used
    if (backgroundGreenHex === personHexColor) {
      personHexColor = "#20C5FF";
    }
    const personRgbColor = hexToRgb(personHexColor);
    doc.setFillColor(personRgbColor[0], personRgbColor[1], personRgbColor[2]);

    const author_width = doc.getTextWidth(author);

    doc.roundedRect(x - 3, y, author_width + 6, 10, 5, 5, "F");
    doc.text(author, x, y + 7);
  };
  const addColoredPage = function (showText = false, r = 23, g = 166, b = 141) {
    // Standard color is our blue-green
    doc.addPage("a4", "p");
    doc.setFillColor(r, g, b);
    doc.rect(0, 0, width, height, "F");
    addBranding(showText);
    usedYSpace = marginTop;
  };
  const writeDoubleSizeText = function (text1, text2) {
    doc.setFontSize(40);
    const text1Width = doc.getTextWidth(text1);
    doc.text(text1, marginLeft, usedYSpace);
    doc.setFontSize(20);
    doc.text(text2, marginLeft + text1Width, usedYSpace);
    usedYSpace += 16;
  };
  const getScale = function (width, height, desiredWidth) {
    const yScale = (0.5 * pageYSpace) / height;
    const xScale = desiredWidth / width;

    const scale = xScale <= yScale ? xScale : yScale;

    const rescaledHeight = height * scale;
    const rescaledWidth = width * scale;

    return [rescaledWidth, rescaledHeight];
  };
  const addGraphToPage = function (graph, name) {
    const [rescaledWidth, rescaledHeight] = getScale(
      graph.width,
      graph.height,
      width - 2 * marginLeft
    );

    if (usedYSpace + 10 + 50 > pageYSpace) {
      addColoredPage(false, 255, 255, 255);
      usedYSpace = 55;
    }

    addHeading(name, marginLeft, usedYSpace);

    doc.addImage(
      graph.img,
      "PNG",
      marginLeft,
      usedYSpace,
      rescaledWidth,
      rescaledHeight
    );
    usedYSpace += rescaledHeight + 25;
  };

  //   ----- FIRST PAGE
  doc.setFillColor(23, 166, 141);
  doc.rect(0, 0, width, height, "F");
  addBranding();

  //   Add Title
  usedYSpace += 55;
  addHeading(isSample ? "Your Sample" : "Your Chat", marginLeft, usedYSpace);
  usedYSpace += 10;

  writeDoubleSizeText(String(numDays), " days");
  writeDoubleSizeText(String(chat.chatObject.length), " messages");
  writeDoubleSizeText(String(chat.numPersonsInChat), " people");

  //    Add participants
  Object.keys(chat.personColorMap).forEach((key) => {
    if (key in chat.personColorMap) {
      if (usedYSpace + 13 > pageYSpace) {
        addColoredPage();
      }
      if (key in chat.personColorMap) {
        drawAuthorBubble(key, marginLeft, usedYSpace);
      }
      usedYSpace += 13;
    }
  });

  // IMAGES
  addColoredPage(false, 255, 255, 255);
  usedYSpace = 55;
  const chatTimeline = await loadImage("#chat-timeline");
  const messagesPerTimeOfDay = await loadImage("#messages-per-time-of-day");
  const messagesPerPerson = await loadImage("#messages-per-person");

  addGraphToPage(chatTimeline, "Chat Timeline");
  addGraphToPage(messagesPerTimeOfDay, "Time of Day");
  addGraphToPage(messagesPerPerson, "Messages per Person");

  addPageIfNeeded(47);

  doc.setFontSize(20);
  doc.text("First Message", marginLeft, usedYSpace);
  usedYSpace += 10;

  doc.setFontSize(30);
  doc.text(getDateString(firstDate), marginLeft, usedYSpace);
  usedYSpace += 20;

  doc.setFontSize(20);
  writeRightSideText("Last Message");
  usedYSpace += 10;

  doc.setFontSize(30);
  writeRightSideText(getDateString(lastDate), false);
  usedYSpace += 7;

  // FUN FACTS
  addColoredPage();
  usedYSpace = 55;
  addHeading("Fun Facts", marginLeft, usedYSpace);

  const funFacts = await chat.getFunFacts();
  const funFactHeight = 40;
  funFacts.forEach((fact) => {
    if (fact.name in chat.personColorMap) {
      if (usedYSpace + funFactHeight > pageYSpace) {
        addColoredPage();
      }

      drawAuthorBubble(fact.name, marginLeft, usedYSpace);
      doc.setFontSize(15);
      doc.setFont("myFont", "normal");

      let factStrings = [];
      factStrings.push("Number of Words: " + fact.numberOfWords);
      factStrings.push("Average Message Length: " + fact.averageMessageLength);
      factStrings.push("Unique words: " + fact.uniqueWords);
      factStrings.push("Characters in longest Message: " + fact.longestMessage);

      doc.text(factStrings, marginLeft, usedYSpace + 15);

      usedYSpace += funFactHeight;
    }
  });

  //   ----- Start of message pages
  addColoredPage();
  // reset Y space, messages have different mariginTop
  usedYSpace = 0;
  doc.setFont("myFont", "normal");
  const lineHeight = (fontSize * 1.5) / 3.64; // line + padding top and bottom

  //   Iterate all messages
  const messages = isSample ? chat.chatObject.slice(0, 100) : chat.chatObject;

  for (const idx in messages) {
    const data = messages[idx];
    let isSystem = "System" === data.author;
    const isEgo = ego === data.author;

    if (!isSystem && !(data.author in chat.personColorMap)) {
      isSystem = true;
    }
    const hasAttachment = !!data.attachment;

    let attachment = undefined;
    let attachmentSize = [0, 0];
    if (hasAttachment) {
      // load attachment
      attachment = await getAttachment(data.attachment.fileName, attachments);
      attachmentSize = await getImgSizes(attachment.src);
      attachmentSize = getScale(
        attachmentSize[0],
        attachmentSize[1],
        (width - 2 * marginLeft) * 0.7
      );
    }

    doc.setFontSize(fontSize);
    const splitMessage = doc.splitTextToSize(data.message, 120);
    const numLines = splitMessage.length;
    const messageHeight = lineHeight * numLines + attachmentSize[1];
    let messageY = calcMessageBodyHeight(numLines, attachmentSize[1], isSystem); // get start Y Coordinate of Message

    const singleLineTextWidth = doc.getTextWidth(data.message);
    let messageWidth = hasAttachment
      ? attachmentSize[0]
      : singleLineTextWidth > 120
      ? 120
      : singleLineTextWidth;
    // It might be needed to adjust to author width!
    doc.setFontSize(fontSize / 1.3);
    doc.setFont("myFont", "bold");
    const authorWidth = doc.getTextWidth(data.author);

    doc.setFontSize(fontSize / 1.8);
    const dateString = getDateString(data.date, true);
    const dateWidth = doc.getTextWidth(dateString);

    if (messageWidth < authorWidth) {
      messageWidth = authorWidth;
    }
    if (messageWidth < dateWidth) {
      messageWidth = dateWidth;
    }

    let messageX = isEgo
      ? width - marginLeft - messageWidth - 10
      : marginLeft + paddingMessage; // get start X Coordinate of Message

    // Draw bubble
    let offset = 0;
    if (isSystem) {
      messageX = 40;
      offset = (120 - messageWidth) / 2;
      doc.setFillColor(53, 53, 38);
    } else if (isEgo) {
      doc.setFillColor(13, 97, 98);
    } else {
      doc.setFillColor(38, 45, 49);
    }
    doc.roundedRect(
      messageX + offset,
      messageY - 1,
      messageWidth + 6,
      isSystem
        ? messageHeight + 2 * paddingMessage
        : messageHeight + authorHeight + timeHeight,
      2,
      2,
      "F"
    );

    // draw author
    if (!isSystem) {
      if (data.author in chat.personColorMap) {
        const personRgbColor = hexToRgb(chat.personColorMap[data.author]);
        doc.setTextColor(
          personRgbColor[0],
          personRgbColor[1],
          personRgbColor[2]
        );
      }

      doc.setFontSize(fontSize / 1.3);
      doc.setFont("myFont", "bold");
      doc.text(
        messageX + paddingMessage,
        messageY + paddingMessage,
        data.author
      );
    }

    if (hasAttachment) {
      if (attachment.mimeType.startsWith("image/")) {
        let filetype = attachment.mimeType.split("/").splice(-1)[0];

        doc.addImage(
          attachment.src,
          filetype,
          marginLeft + paddingMessage * 2,
          messageY + authorHeight,
          attachmentSize[0],
          attachmentSize[1]
        );
        usedYSpace += attachmentSize[1];
      }
    }

    // Draw message
    if (!hasAttachment) {
      if (isSystem) {
        doc.setTextColor(249, 217, 100);
      } else {
        doc.setTextColor(255, 255, 255);
      }
      doc.setFontSize(fontSize);
      doc.setFont("myFont", "normal");
      doc.text(
        isSystem ? messageX + 65 : messageX + paddingMessage,
        isSystem ? messageY + 2 * paddingMessage : messageY + authorHeight,
        splitMessage, //.map((m) => m.replace(asciRegex, "")),
        isSystem ? "center" : ""
      );
    }

    // draw time
    if (!isSystem) {
      doc.setFontSize(fontSize / 1.8);
      doc.setTextColor(200, 200, 200);

      doc.text(
        messageX + messageWidth - dateWidth + paddingMessage,
        messageY + authorHeight + messageHeight,
        dateString
      );
    }
  }

  // Las Page
  addColoredPage(true);
  usedYSpace += marginTop + 50;
  if (isSample) {
    addHeading("Get full pdf at", marginLeft, usedYSpace);
    usedYSpace += 10;
    doc.text("whatsanalyze.com", marginLeft, usedYSpace);
  } else {
    addHeading("Thanks!", marginLeft, usedYSpace);
    usedYSpace += 10;
    doc.setFontSize(20);
    doc.text("whatsanalyze.com", marginLeft, usedYSpace);
  }

  doc.save("WhatsAnalyze - " + ego);

  return 1;
}
