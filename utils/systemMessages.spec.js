import { isSystemMessage, markSystemMessages } from "./systemMessages";

describe("isSystemMessage", () => {
  it.each([
    [
      "en",
      "Messages and calls are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them.",
    ],
    [
      "de",
      "‎Nachrichten und Anrufe sind Ende-zu-Ende-verschlüsselt. Niemand außerhalb dieses Chats kann sie lesen oder anhören, nicht einmal WhatsApp.",
    ],
    ["es", "Los mensajes y las llamadas están cifrados de extremo a extremo."],
    ["fr", "Les messages et les appels sont chiffrés de bout en bout."],
    ["pt-BR", "As mensagens e chamadas são criptografadas de ponta a ponta."],
    ["pt-PT", "As mensagens e as chamadas são encriptadas ponta a ponta."],
    ["it", "I messaggi e le chiamate sono crittografati end-to-end."],
  ])("detects the %s encryption notice", (_locale, message) => {
    expect(isSystemMessage(message)).toBe(true);
  });

  it("leaves normal messages alone", () => {
    expect(isSystemMessage("Hallo, wie geht es dir?")).toBe(false);
    expect(isSystemMessage("")).toBe(false);
    expect(isSystemMessage(undefined)).toBe(false);
  });
});

describe("markSystemMessages", () => {
  it("relabels the notice iOS attributes to the chat partner", () => {
    const messages = [
      {
        author: "Sebastian Fellner",
        message:
          "‎Nachrichten und Anrufe sind Ende-zu-Ende-verschlüsselt. Niemand außerhalb dieses Chats kann sie lesen oder anhören, nicht einmal WhatsApp.",
      },
      { author: "Sebastian Fellner", message: "Hallo" },
    ];

    markSystemMessages(messages);

    expect(messages.map((m) => m.author)).toEqual([
      "System",
      "Sebastian Fellner",
    ]);
  });
});
