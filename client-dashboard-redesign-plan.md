# Client Dashboard Redesign Plan

## Overview
Adapt the current ClientDashboard.tsx to match the new Google Stitch design while preserving all existing functionality.

## Key Changes Required

### 1. Color Scheme Updates
- Update CSS variables to match the new palette
- Maintain HSL format for consistency with existing system
- Add new color variables for the design

### 2. Typography Changes
- Add Playfair Display font for headings
- Add Plus Jakarta Sans font for body text
- Update font weights and sizes to match design

### 3. Header Redesign
- Replace current header with simplified greeting style
- Remove "Bloom" branding from header
- Add user profile image in top right
- Change greeting to "Hello, [FirstName]" with "Your Next Chapter" subtitle

### 4. Main Content Layout
- Add descriptive paragraph about curated connections
- Simplify the preferences card
- Remove complex categorization of matches
- Create horizontal list of introductions

### 5. Match Cards Redesign
- Simplify card design with rounded corners (rounded-2xl)
- Use horizontal layout with image on left, content in middle, arrow on right
- Remove compatibility badges and status indicators
- Simplify text to just name, age, and brief status

### 6. Bottom Navigation Update
- Change to pill-shaped container (rounded-full)
- Use Material Icons instead of Lucide icons
- Simplify to 3 items: Home, Favorites, Profile
- Add glassmorphism effect

## Implementation Steps

1. Update CSS variables and color scheme
2. Add new font imports and typography
3. Redesign header section
4. Update main content layout
5. Redesign match cards component
6. Update bottom navigation
7. Test responsive design
8. Verify all functionality preserved

## Files to Modify

1. `src/index.css` - Color scheme and typography updates
2. `src/pages/ClientDashboard.tsx` - Main layout and structure
3. `src/components/experience/MatchList.tsx` - Match card design
4. `src/components/BottomNavigation.tsx` - Navigation style
5. `src/components/ui/modern-mobile-menu.tsx` - Navigation component

## Functionality to Preserve

- User authentication state
- Profile data fetching
- Match loading and display
- Match interaction (opening match details)
- Navigation between pages
- Profile completion tracking
- All existing data flow and state management