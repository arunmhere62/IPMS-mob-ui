# ScreenLayout + ScreenHeader Usage Guide

## Goal

Keep the UI **user-friendly and consistent** by having **only one background owner**.

- `ScreenLayout` owns the screen background.
- `ScreenHeader` is **transparent by default** and inherits the screen background.

This prevents multiple stacked background colors (header background + content background + extra wrapper background).

---

## Recommended pattern (most screens)

Set the screen color in one place (`ScreenLayout`) and don’t pass `backgroundColor` to `ScreenHeader`.

```tsx
return (
  <ScreenLayout
    backgroundColor={Theme.colors.background.blue}
    contentBackgroundColor={Theme.colors.background.secondary}
  >
    <ScreenHeader
      title="Tenants"
      subtitle="..."
      showBackButton
      onBackPress={() => navigation.goBack()}
    />

    <View style={{ flex: 1 }}>
      {/* your screen content */}
    </View>
  </ScreenLayout>
);
```

### Rules

- Use `ScreenLayout backgroundColor` for the main screen background.
- Use `ScreenLayout contentBackgroundColor` if you want the content area to be a different surface color.
- Avoid wrapping the whole screen in another:
  - `View style={{ flex: 1, backgroundColor: ... }}`

---

## When to override ScreenHeader background

Only override `ScreenHeader backgroundColor` if the header must have its own distinct color (special cases).

```tsx
<ScreenHeader
  title="Special Screen"
  backgroundColor={Theme.colors.background.blueDark}
  syncMobileHeaderBg
/>
```

- If `backgroundColor` is not provided, header stays transparent.
- If `syncMobileHeaderBg` is `true` (Android), the status bar background will follow the effective background.

---

## Status bar behavior

`ScreenHeader` auto-detects `StatusBar` style based on the effective background it sees:

- If you pass `backgroundColor` to `ScreenHeader`, it uses that.
- Otherwise it uses the layout background color.

---

## Quick checklist (to avoid double backgrounds)

- `ScreenLayout` has the background colors.
- `ScreenHeader` has **no** `backgroundColor` unless needed.
- Inside the screen, prefer:

```tsx
<View style={{ flex: 1 }}>
  ...
</View>
```

Instead of:

```tsx
<View style={{ flex: 1, backgroundColor: '...' }}>
  ...
</View>
```
