/**
 * Pure helpers for converting between GREEN-API chatIds and phone/group numbers.
 * Kept out of ChatContext so the context file only exports React components/hooks
 * (satisfies react/only-export-components / fast-refresh).
 */

/** Extract the phone/group ID from a GREEN-API chatId (removes @c.us / @g.us). */
export function chatIdToPhone(chatId) {
  return chatId.replace(/@c\.us$/, '').replace(/@g\.us$/, '');
}

/** Build a GREEN-API chatId from a phone/group number. */
export function phoneToChatId(phoneNumber, isGroup = false) {
  return `${phoneNumber}@${isGroup ? 'g' : 'c'}.us`;
}
