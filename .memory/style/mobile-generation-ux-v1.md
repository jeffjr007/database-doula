# Mobile Generation UX Patterns v2

## Form Layout Pattern
All CV and Cover Letter forms on mobile follow a unified 2-step guided flow:
- **Step 1**: Personal data (dados pessoais) - stacked single-column fields
- **Step 2**: Professional content (curriculum/experience/job description)

### Design Principles
- No gray containers or heavy cards around form content
- Open, breathable layout with generous spacing
- Input fields use `h-12` height with `rounded-xl` for easy touch targets
- `bg-muted/20 border-transparent` for subtle, non-intrusive styling
- Locked fields (auto-filled from profile) use `opacity-70` indicator

### Step Navigation
- Top header shows "Etapa X de 2" with "Anterior" button for back navigation
- "Continuar" button at bottom advances to next step
- `scrollToTop()` is called on every step transition for better UX continuity

## Preview Pattern (CVs)
- Premium modal-style container with `max-h-[55vh]`
- Internal scroll for document content (`overflow-y-auto overscroll-contain`)
- Bottom fade gradient to indicate more content below
- Action buttons positioned **outside** the preview for clear hierarchy

## Cover Letter Preview Pattern (Fluid)
- No modal container - content flows openly on page
- Pill-based model selector (Completa, Objetiva, Técnica)
- Primary action (Copy) prominent, secondary actions (PDF, Save) in grid below

## Portal Cards Pattern
- Cards without borders (`border-border/50` removed)
- Lighter visual treatment for a more harmonized, less boxy appearance

## Scroll Behavior
- Automatic scroll to top when:
  - Selecting a document type (CV/Cover Letter)
  - Advancing between form steps
  - Transitioning to preview
