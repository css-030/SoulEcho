# SoulEcho Chat Page Override

> Applies after `design-system/soulecho/MASTER.md` and `docs/design-system-override.md`.

## Scene

- Use `body[data-scene="chat"]`.
- Preserve the warm pink companion mood from `docs/design-system-override.md`; do not switch the chat page to the dark audio palette from the generated master file.
- Keep the first screen as the working chat interface, not a marketing page.

## Layout

- The main shell should stay centered and app-like.
- Message rows should leave clear horizontal breathing room between momo and user bubbles on desktop.
- On mobile, message rows may expand wider so text remains readable.
- The message list is allowed to be the primary scroll region.

## Chat Bubbles

- Both sides must show avatars.
- The momo side uses `/avatars/momo-default.png`.
- The user side uses `/avatars/user-default.png`.
- Bubbles use scene CSS variables for background, border, shadow, and text colors.

## Interaction Quality

- Keyboard focus must be visible on the input and send button.
- Hover movement should be subtle and disabled when the user prefers reduced motion.
- Typing indicators should respect `prefers-reduced-motion`.
- Scrollbars should be quiet and match the chat scene.

## Final Phase 1 Chat Style

- Use Neumorphism as the active chat interface style.
- Keep the theme in `src/styles/chat-neumorphism.css`.
- Do not keep temporary style preview switchers in the production chat page.
