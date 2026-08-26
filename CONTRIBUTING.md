# Contributing to Punch

Thank you for your interest in contributing! This project is designed to be a self-hosted, white-label solution for small businesses.

Please read `project-docs/ARCHITECTURE.md` before writing any code. It explains the strict separation of concerns that keeps this project maintainable.

## Adding a New Language

Adding a new language is the easiest way to contribute. The app uses `i18next` for localization.

1. **Create a JSON file**: Copy `src/locales/en.json` to `src/locales/<language_code>.json` (e.g., `es.json` for Spanish, `fr.json` for French).
2. **Translate all strings**: Translate the values in your new JSON file. Do not change the keys.
3. **Register the language**:
   Open `src/lib/i18n.ts` and import your file, then add it to the `resources` object:
   ```typescript
   import es from './locales/es.json';
   
   const resources = {
     en: { translation: en },
     ro: { translation: ro },
     es: { translation: es }, // Add this line
   };
   ```
4. **Update the picker**:
   Open `src/api/profiles.ts` and add your language to the `getAvailableLocales()` function so users can select it in their Profile settings:
   ```typescript
   export function getAvailableLocales(): Array<{ code: string; label: string }> {
     return [
       { code: 'en', label: 'English' },
       { code: 'ro', label: 'Română' },
       { code: 'es', label: 'Español' }, // Add this line
     ];
   }
   ```
5. That's it! No UI code needs to be modified.

## Adding a New Feature

If you are adding a new feature, please follow the established patterns:

1. **Database Changes**: Add a new `.sql` file to `supabase/migrations/`. Name it sequentially (e.g., `20260728100000_my_feature.sql`). It must include its own Row Level Security (RLS) policies.
2. **API Layer**: All Supabase interactions **must** go in `src/api/`. Do not import `supabase` directly in any React component (`.tsx` file).
3. **Business Logic**: Pure calculations (like pay or time tracking math) go in `src/utils/` and should have Jest unit tests.
4. **UI Components**: Place reusable UI pieces in `src/components/ui/`.
5. **Screens**: Add new screens to `app/(admin)/` or `app/(employee)/`. Ensure you implement Loading, Empty, and Error states for every screen.
6. **Translations**: Never hardcode user-facing strings. Always use the `t()` function from `react-i18next` and add the keys to all existing locale files.
7. **Styling**: Use Tailwind CSS classes via NativeWind. Do not use hardcoded hex colors; use the semantic theme colors provided by `theme.ts` (e.g., `theme.primary`, `theme.surfaceContainerLowest`).

## Code Conventions

- **TypeScript**: The project is entirely TypeScript. Use strict typing for API responses.
- **Agent Rules**: If you use an AI coding assistant (like GitHub Copilot or Cursor), please have it read `project-docs/AGENT_RULES.md` first. It contains critical instructions to prevent architectural drift.
- **Audit Logging**: Any action that modifies business data must call `writeAuditEntry` from `src/api/auditLog.ts`.

## Submitting a Pull Request

1. Fork the repository.
2. Create a feature branch.
3. Run `npx tsc --noEmit` to ensure there are no TypeScript errors.
4. Submit your PR with a clear description of what changed and screenshots if the UI was modified.
