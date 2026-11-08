import { describe, expect, it } from 'vitest';
import { splitOpeningMapDialogue } from './openingMapDialogue';

describe('opening map NPC dialogue', () => {
  it('keeps short dialogue on one page', () => {
    expect(splitOpeningMapDialogue('Chào con.')).toEqual(['Chào con.']);
  });

  it('splits long dialogue at sentence boundaries and keeps every sentence', () => {
    const dialogue = 'Đường làng đang bị quân tuần tra canh giữ rất nghiêm ngặt. Hãy men theo bờ sông rồi tìm chiếc thuyền nhỏ phía sau rặng tre.';
    const pages = splitOpeningMapDialogue(dialogue, 68);
    expect(pages).toEqual([
      'Đường làng đang bị quân tuần tra canh giữ rất nghiêm ngặt.',
      'Hãy men theo bờ sông rồi tìm chiếc thuyền nhỏ phía sau rặng tre.',
    ]);
    expect(pages.join(' ')).toBe(dialogue);
  });

  it('wraps a long sentence at word boundaries without losing text', () => {
    const dialogue = 'Mang theo chiếc bản đồ tuần tra cẩn thận để tránh ánh mắt của lính gác trên cây cầu gỗ.';
    const pages = splitOpeningMapDialogue(dialogue, 32);
    expect(pages.every(page => page.length <= 32)).toBe(true);
    expect(pages.join(' ')).toBe(dialogue);
  });
});
