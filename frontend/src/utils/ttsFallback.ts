const SERVER_TTS_NOT_CONFIGURED = "Text-to-speech is not configured on the server.";

export function isServerTtsNotConfigured(message: string): boolean {
  return message.toLowerCase().includes(SERVER_TTS_NOT_CONFIGURED.toLowerCase());
}

export async function speakWithBrowserTts(text: string, language: string): Promise<void> {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    throw new Error("Browser text-to-speech is not available on this device.");
  }

  await new Promise<void>((resolve, reject) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language || "en";
    utterance.rate = 1;
    utterance.pitch = 1;

    utterance.onend = () => resolve();
    utterance.onerror = () => reject(new Error("Browser text-to-speech failed."));

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  });
}
