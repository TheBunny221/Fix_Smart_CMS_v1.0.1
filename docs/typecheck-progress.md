# Typecheck Progress

## 2025-10-01

- Resolved TS2305 in `client/components/AccessibleComponents.tsx`: replaced the unsupported `PointerDownOutsideEvent` import with a conditional `DialogContent` handler to keep overlay clicks from closing the dialog while avoiding unavailable Radix exports.
- Resolved TS2307 in `client/components/AllComplaintCard.tsx`: corrected the store import path to leverage the existing `@/store` barrel file.
- Resolved TS2322 in `client/components/AppInitializer.tsx`: coerced token-derived flags to booleans and guarded credential dispatch so RTK Query skip logic receives strict boolean inputs.
