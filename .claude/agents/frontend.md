# Frontend Agent

Specialized agent for building UI components and pages using Nuxt UI 4.

## When to Use
- Creating new pages or components
- Implementing UI designs
- Working with forms, tables, dashboards
- Styling and theming

## Tools
Always use the Nuxt UI MCP tools to get accurate component documentation:
- `mcp__nuxt-ui-remote__get-component` - Get detailed docs for a specific component
- `mcp__nuxt-ui-remote__get-component-metadata` - Get props, slots, events
- `mcp__nuxt-ui-remote__list-components` - Browse available components

## Component Categories

### Layout
- `UApp` - Root wrapper with global config
- `UContainer` - Centered content container
- `UMain` - Main content area
- `UHeader` / `UFooter` - Page header/footer

### Dashboard
- `UDashboardGroup` - Dashboard layout wrapper
- `UDashboardSidebar` - Collapsible sidebar
- `UDashboardPanel` - Resizable panel
- `UDashboardNavbar` / `UDashboardToolbar`

### Forms
- `UForm` / `UFormField` - Form with validation
- `UInput` / `UTextarea` - Text inputs
- `USelect` / `USelectMenu` - Dropdowns
- `UCheckbox` / `URadioGroup` / `USwitch` - Toggles
- `UInputDate` / `UInputNumber` / `UInputTags`

### Elements
- `UButton` - Buttons and links
- `UCard` - Content cards
- `UBadge` / `UChip` - Status indicators
- `UAvatar` / `UAvatarGroup` - User images
- `UIcon` - Iconify icons
- `UAlert` / `UBanner` - Notifications

### Data Display
- `UTable` - Data tables
- `UAccordion` - Collapsible panels
- `UCarousel` - Image/content slider
- `UTimeline` - Event sequences
- `UTree` - Hierarchical data

### Navigation
- `UNavigationMenu` - Nav links
- `UBreadcrumb` - Hierarchy trail
- `UTabs` - Tab panels
- `UPagination` - Page navigation
- `UStepper` - Multi-step progress

### Overlays
- `UModal` - Dialog windows
- `UDrawer` - Slide-in panels
- `USlideover` - Side panels
- `UDropdownMenu` / `UContextMenu` - Menus
- `UTooltip` / `UPopover` - Hover info
- `UToast` - Notifications (use `useToast()`)

### Page Building
- `UPage` / `UPageHeader` / `UPageBody`
- `UPageHero` / `UPageSection` / `UPageCTA`
- `UPageFeature` / `UPageCard`
- `UPricingPlans` / `UPricingTable`

## Guidelines

### Icons
Use Lucide icons with `i-lucide-{name}` prefix:
```vue
<UButton icon="i-lucide-plus" />
<UIcon name="i-lucide-search" />
```

### Colors
Use semantic colors: `primary`, `secondary`, `success`, `warning`, `error`, `info`
```vue
<UButton color="primary" />
<UBadge color="success" />
```

### Variants
Components support variants: `solid`, `outline`, `soft`, `subtle`, `ghost`, `link`
```vue
<UButton variant="outline" />
```

### Sizes
Standard sizes: `xs`, `sm`, `md`, `lg`, `xl`
```vue
<UButton size="lg" />
```

### Form Validation
Use Zod schemas with UForm:
```vue
<script setup>
import { z } from 'zod'
const schema = z.object({ email: z.string().email() })
const state = reactive({ email: '' })
</script>

<template>
  <UForm :schema="schema" :state="state" @submit="onSubmit">
    <UFormField label="Email" name="email">
      <UInput v-model="state.email" />
    </UFormField>
    <UButton type="submit">Submit</UButton>
  </UForm>
</template>
```

### Toasts
```ts
const toast = useToast()
toast.add({ title: 'Success', description: 'Saved!', color: 'success' })
```

### Modals
```vue
<script setup>
const modal = useModal()
</script>

<template>
  <UButton @click="modal.open(MyComponent, { props })">Open</UButton>
</template>
```

## Best Practices
1. Always check MCP docs before implementing a component
2. Use semantic color tokens, not raw colors
3. Leverage built-in component slots for customization
4. Use `UFormField` for consistent form layouts
5. Prefer `USelectMenu` over `USelect` for searchable lists
