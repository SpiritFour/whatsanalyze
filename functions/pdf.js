import logoBlack from "/assets/whatsanalyze-logo-black.png";
import logoWhite from "/assets/whatsanalyze-logo-white.png";

import { getDateString } from "~/functions/utils";
import jsPDF from "jspdf";

export async function render(chat, ego, isSample = false) {
  // Default export is a4 paper, portrait, using millimeters for units
  const doc = new jsPDF();
  // doc specifications
  const width = 210;
  const height = 297;
  const fontSize = 11;
  const marginTop = 32;
  const marginLeft = 20;
  const pageYSpace = 297 - marginTop * 2;
  const messageMarginBottom = 5;
  const paddingMessage = 3;
  const authorHeight = 9;
  const timeHeight = 3;

  //   Variable to track y-coordinate / used space on page
  let usedYSpace = 0;

  //    --- HELPER FUNCTIONS
  // calculates height for new message
  const calcMessageBodyHeight = function (numLines) {
    let messageY = marginTop + usedYSpace;
    const messageYSpace = numLines * lineHeight + authorHeight + timeHeight; // Height of Messages
    // Check if lines fit on page,
    if (usedYSpace + messageYSpace > pageYSpace) {
      // is first message
      addPage();
      messageY = marginTop;
      usedYSpace = 0;
    }
    usedYSpace += messageMarginBottom + messageYSpace;
    return messageY;
  };
  const hexToRgb = function (hex) {
    if (hex.length != 6) {
      throw "Only six-digit hex colors are allowed.";
    }

    var aRgbHex = hex.match(/.{1,2}/g);
    var aRgb = [
      parseInt(aRgbHex[0], 16),
      parseInt(aRgbHex[1], 16),
      parseInt(aRgbHex[2], 16),
    ];
    return aRgb;
  };
  const addBranding = function (
    _logo = logoBlack,
    addText = true,
    x = 130,
    y = 15
  ) {
    // logo
    doc.addImage(_logo, "PNG", x + 50, y, 13, 13);
    // title50
    if (addText) {
      doc.setFontSize(20);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.text(x, y + 10, "WhatsAnalyze");
    }
  };
  // adds new page with standard background
  const addPage = function () {
    doc.addPage("a4", "p");
    // page design
    doc.setFillColor(13, 20, 24);
    doc.rect(0, 0, width, height, "F");
    addBranding(logoWhite, false);
    usedYSpace = 0;
  };
  const addHeading = function (text, x, y) {
    doc.setFontSize(50);
    doc.text(text, x, y);
    doc.setLineWidth(0.5);
    doc.setDrawColor(0, 0, 0); // draw red lines
    doc.line(x, y + 5, x + 100, y + 5); // horizontal line
  };
  const drawAuthorBubble = function (author, x, y) {
    const rgbAuthorColor = hexToRgb(chat.personColorMap[author].slice(1));
    doc.setFillColor(rgbAuthorColor[0], rgbAuthorColor[1], rgbAuthorColor[2]);
    // const author_width = doc.getTextWidth(author);

    doc.roundedRect(x - 3, y, width / 2, 10, 5, 5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text(author, x, y + 7);
  };

  //   ----- FIRST PAGE
  doc.setFillColor(23, 166, 141);
  doc.rect(0, 0, width, height, "F");
  addBranding();

  //   Add Title
  usedYSpace += 55;
  addHeading(isSample ? "Your Sample" : "Your Chat", marginLeft, usedYSpace);

  //    Add participants
  usedYSpace += 10;
  Object.keys(chat.personColorMap).forEach((key, idx) => {
    if (key in chat.personColorMap) {
      usedYSpace += idx * 13;
      drawAuthorBubble(key, marginLeft, usedYSpace);
    }
  });

  //   new page
  usedYSpace = 55;
  doc.addPage();
  doc.setFillColor(23, 166, 141);
  doc.rect(0, 0, width, height, "F");
  addBranding(logoBlack, false);

  //   Add fun Facts
  addHeading("Fun Facts", marginLeft, usedYSpace);
  usedYSpace += 10;

  const funFacts = await chat.getFunFacts();

  funFacts.forEach((fact, idx) => {
    usedYSpace += idx * 50;
    drawAuthorBubble(fact.name, marginLeft, usedYSpace);
    doc.setFontSize(15);
    doc.setFont("helvetica", "normal");

    let factStrings = [];
    factStrings.push("Number of Words:" + fact.numberOfWords);
    factStrings.push("Average Message Length:" + fact.averageMessageLength);
    factStrings.push("Unique words:" + fact.uniqueWords);
    factStrings.push("Characters in longest Message:" + fact.longestMessage);

    doc.text(factStrings, marginLeft, usedYSpace + 15);
  });

  console.log(funFacts);
  // // subtitle
  // doc.setFontSize(16);
  // doc.text(15, 30, "Your Chat in your hands.");
  //   ----- Start of message pages
  addPage();
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(fontSize);
  doc.setFont("helvetica", "normal");
  const lineHeight = (fontSize * 1.5) / 3.64; // line + padding top and bottom

  //   Iterate all messages
  const messages = isSample ? chat.chatObject.slice(0, 100) : chat.chatObject;

  messages.forEach((data) => {
    const isSystem = "System" === data.author;
    const isEgo = ego === data.author;

    const splitMessage = doc.splitTextToSize(data.message, isSystem ? 120 : 60);
    const numLines = splitMessage.length;
    const messageHeight = lineHeight * numLines;

    let messageY = calcMessageBodyHeight(numLines); // get start Y Coordinate of Message
    let messageX = isEgo ? 58 : marginLeft + paddingMessage; // get start X Coordinate of Message

    // Draw bubble
    if (isSystem) {
      messageX = 40;
      doc.setFillColor(53, 53, 38);
    } else if (isEgo) {
      doc.setFillColor(13, 97, 98);
    } else {
      doc.setFillColor(38, 45, 49);
    }
    doc.roundedRect(
      messageX,
      messageY - 1,
      130,
      messageHeight + authorHeight + timeHeight,
      2,
      2,
      "F"
    );

    // draw author
    if (!isSystem) {
      doc.setFontSize(fontSize / 1.3);

      if (data.author in chat.personColorMap) {
        const rgbAuthorColor = hexToRgb(
          chat.personColorMap[data.author].slice(1)
        );
        doc.setTextColor(
          rgbAuthorColor[0],
          rgbAuthorColor[1],
          rgbAuthorColor[2]
        );
      }

      doc.setFont("helvetica", "bold");
      doc.text(
        messageX + paddingMessage,
        messageY + paddingMessage,
        data.author
      );
    }

    // Draw message
    if (isSystem) {
      doc.setTextColor(249, 217, 100);
    } else {
      doc.setTextColor(255, 255, 255);
    }
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", "normal");
    doc.text(
      isSystem ? messageX + 65 : messageX + paddingMessage,
      messageY + authorHeight,
      splitMessage,
      isSystem ? "center" : ""
    );

    // draw time
    if (!isSystem) {
      doc.setFontSize(fontSize / 1.8);
      doc.setTextColor(200, 200, 200);
      doc.text(
        messageX + 104,
        messageY + authorHeight + messageHeight - 1,
        getDateString(data.date)
      );
    }
  });

  doc.save("WhatsAnalyze - " + ego);
}
