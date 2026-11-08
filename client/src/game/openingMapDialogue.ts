const DIALOGUE_PAGE_LENGTH = 145;

export function splitOpeningMapDialogue(dialogue: string, pageLength = DIALOGUE_PAGE_LENGTH): string[] {
  const text = dialogue.trim();
  if (!text) return [''];

  const sentences = text.match(/[^.!?…]+(?:[.!?…]+["'”’)]*|$)/g) ?? [text];
  const pages: string[] = [];
  let page = '';

  const addSentence = (sentence: string) => {
    const words = sentence.trim().split(/\s+/);
    let part = '';
    for (const word of words) {
      if (part && part.length + word.length + 1 > pageLength) {
        if (page) pages.push(page);
        page = part;
        part = word;
        continue;
      }
      part = part ? `${part} ${word}` : word;
    }

    if (!part) return;
    if (page && page.length + part.length + 1 > pageLength) {
      pages.push(page);
      page = part;
    } else {
      page = page ? `${page} ${part}` : part;
    }
  };

  for (const sentence of sentences) addSentence(sentence);
  if (page) pages.push(page);
  return pages;
}
