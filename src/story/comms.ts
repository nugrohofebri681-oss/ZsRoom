import commsData from '../data/story/comms.json';

/**
 * COMMUNICATION CONTRACT (future chapters: Febri is always an NPC; during long-distance chapters he
 * appears only through chat, voice calls or video calls).
 *
 * This file defines the data/interface contract only. The current presenter shows a chat thread in the
 * dialogue panel. Voice and video calls will plug in a richer presenter (portrait, call UI, audio) without
 * changing story data. All content in src/data/story/comms.json is FICTIONAL PLACEHOLDER text: real
 * messages, photos or private story material must never be committed to this public repository.
 */
export type CommsChannel = 'chat' | 'voice' | 'video';

export interface CommsLine { from: string; text: string; delayMs?: number }
export interface CommsThread {
  id: string;
  channel: CommsChannel;
  /** Character id of the remote participant (e.g. "char_febri"); shown by name only, never as a sprite. */
  contact: string;
  contactName: string;
  lines: CommsLine[];
  placeholder: true;
}

/** Anything that can show a thread: today the dialogue panel; later a phone UI, call screen, etc. */
export interface CommsPresenter {
  supports(channel: CommsChannel): boolean;
  present(thread: CommsThread): void;
}

export const COMMS: ReadonlyMap<string, CommsThread> = new Map((commsData as { threads: CommsThread[] }).threads.map((t) => [t.id, t]));

/** Dialogue-panel fallback presenter: every channel becomes a readable thread ("Febri · chat"). */
export function threadAsDialogue(t: CommsThread): { speaker: string; lines: string[] } {
  const icon = t.channel === 'chat' ? 'chat' : t.channel === 'voice' ? 'voice call' : 'video call';
  return { speaker: `${t.contactName} · ${icon}`, lines: t.lines.map((l) => (l.from === 'zila' ? `You: ${l.text}` : l.text)) };
}
