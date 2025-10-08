# Match Deletion Implementation Plan

## Overview
Add match deletion functionality to the admin/clients tab matches section, similar to what exists in the MatchManagementPage.

## Current State Analysis

### Existing Implementation (MatchManagementPage)
- Has a `delete_match` RPC function that deletes matches and notifications
- Includes a delete button in the match details modal
- Shows a confirmation dialog before deletion
- Returns count of deleted notifications

### Database Schema
- `matches` table with primary key `id`
- `match_interactions` table with foreign key to `matches` (ON DELETE CASCADE)
- `notifications` table with `related_entity_id` and `related_entity_type` fields

## Implementation Steps

### 1. Update delete_match Function
**File**: `supabase/migrations/20251008120000_update_delete_match_function.sql`

```sql
-- Update delete_match function to also handle match_interactions
CREATE OR REPLACE FUNCTION delete_match(p_match_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count integer := 0;
  v_notifications_deleted integer := 0;
  v_interactions_deleted integer := 0;
BEGIN
  -- Check if match exists
  IF NOT EXISTS (SELECT 1 FROM matches WHERE id = p_match_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Match not found'
    );
  END IF;

  -- Delete related match interactions first
  DELETE FROM match_interactions
  WHERE match_id = p_match_id;
  
  GET DIAGNOSTICS v_interactions_deleted = ROW_COUNT;

  -- Delete related notifications
  DELETE FROM notifications
  WHERE related_entity_id = p_match_id
    AND related_entity_type = 'match';

  GET DIAGNOSTICS v_notifications_deleted = ROW_COUNT;

  -- Delete the match
  DELETE FROM matches WHERE id = p_match_id;

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  IF v_deleted_count > 0 THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Match deleted successfully',
      'notifications_deleted', v_notifications_deleted,
      'interactions_deleted', v_interactions_deleted
    );
  ELSE
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Failed to delete match'
    );
  END IF;
END;
$$;
```

### 2. Add Delete Button to Match Cards
**File**: `src/pages/admin/ClientsPage.tsx`

**Location**: Around line 1675-1695 (Active Matches) and 1775-1795 (Match Suggestions)

Add a delete button in the match card component:

```tsx
<Button
  variant="ghost"
  size="sm"
  className="text-destructive hover:text-destructive hover:bg-destructive/10"
  onClick={(event) => {
    event.stopPropagation();
    confirmDeleteMatch(match.match_id);
  }}
>
  <Trash2 className="h-4 w-4" />
</Button>
```

### 3. Add State Variables for Delete Dialog
**File**: `src/pages/admin/ClientsPage.tsx`

Add these state variables around line 252-254:

```tsx
const [deleteMatchDialogOpen, setDeleteMatchDialogOpen] = useState(false);
const [deletingMatchId, setDeletingMatchId] = useState<string | null>(null);
```

### 4. Implement Delete Handler Function
**File**: `src/pages/admin/ClientsPage.tsx`

Add this function around line 784 (after other handler functions):

```tsx
const handleDeleteMatch = async () => {
  if (!deletingMatchId) return;

  try {
    const { data, error } = await supabase.rpc('delete_match', {
      p_match_id: deletingMatchId
    });

    if (error) throw error;

    const result = data as { success: boolean; message?: string; notifications_deleted?: number; interactions_deleted?: number };

    if (result?.success) {
      toast({
        title: "Match deleted",
        description: `Match and ${result.notifications_deleted || 0} notification(s) have been removed`,
      });

      // Refresh matches
      if (selectedProfile) {
        await loadMatches(selectedProfile.id);
        await loadMatchSuggestions(selectedProfile.id, questionnaireAnswers);
      }

      // Close dialogs
      setDeleteMatchDialogOpen(false);
      setDeletingMatchId(null);
    } else {
      throw new Error(result?.message || 'Failed to delete match');
    }
  } catch (error: any) {
    toast({
      title: "Error",
      description: error.message || "Failed to delete match",
      variant: "destructive"
    });
  }
};

const confirmDeleteMatch = (matchId: string) => {
  setDeletingMatchId(matchId);
  setDeleteMatchDialogOpen(true);
};
```

### 5. Add Delete Confirmation Dialog
**File**: `src/pages/admin/ClientsPage.tsx`

Add this dialog at the end of the component, around line 1923 (after the existing dialogs):

```tsx
<AlertDialog open={deleteMatchDialogOpen} onOpenChange={setDeleteMatchDialogOpen}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete Match?</AlertDialogTitle>
      <AlertDialogDescription>
        This will permanently delete this match suggestion and all related notifications and interactions.
        This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel onClick={() => setDeletingMatchId(null)}>
        Cancel
      </AlertDialogCancel>
      <AlertDialogAction
        onClick={handleDeleteMatch}
        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
      >
        Delete Match
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### 6. Update Match Card Layout
**File**: `src/pages/admin/ClientsPage.tsx`

Update the match card layout to accommodate the delete button:

For Active Matches (around line 1673):
```tsx
<div className="flex items-start gap-3">
  <Avatar className="h-10 w-10">
    <AvatarFallback>{initials}</AvatarFallback>
  </Avatar>
  <div className="flex-1 space-y-1">
    <div className="flex flex-wrap items-center gap-2">
      <p className="text-sm font-semibold">{fullName}</p>
      <Badge variant={statusMeta.variant} className="text-xs">
        {statusMeta.label}
      </Badge>
    </div>
    {location && (
      <p className="text-xs text-muted-foreground">{location}</p>
    )}
    {other?.profession && (
      <p className="text-xs text-muted-foreground">{other.profession}</p>
    )}
  </div>
  <Button
    variant="ghost"
    size="sm"
    className="text-destructive hover:text-destructive hover:bg-destructive/10"
    onClick={(event) => {
      event.stopPropagation();
      confirmDeleteMatch(match.match_id);
    }}
  >
    <Trash2 className="h-4 w-4" />
  </Button>
</div>
```

For Match Suggestions (around line 1783):
```tsx
<div className="flex items-start gap-3 mb-3">
  <Avatar className="h-10 w-10">
    <AvatarFallback>{initials}</AvatarFallback>
  </Avatar>
  <div className="flex-1 space-y-1">
    <p className="text-sm font-semibold">{fullName}</p>
    {location && (
      <p className="text-xs text-muted-foreground">{location}</p>
    )}
    {other?.profession && (
      <p className="text-xs text-muted-foreground">{other.profession}</p>
    )}
  </div>
  <Button
    variant="ghost"
    size="sm"
    className="text-destructive hover:text-destructive hover:bg-destructive/10"
    onClick={(event) => {
      event.stopPropagation();
      confirmDeleteMatch(suggestion.match_id);
    }}
  >
    <Trash2 className="h-4 w-4" />
  </Button>
</div>
```

## Testing Plan

1. **Unit Tests**
   - Test the updated delete_match function with mock data
   - Verify match_interactions are properly deleted
   - Verify notifications are properly deleted

2. **Integration Tests**
   - Test the delete button appears on match cards
   - Test the confirmation dialog opens correctly
   - Test successful deletion and UI refresh
   - Test error handling

3. **Manual Testing**
   - Navigate to admin/clients tab
   - Select a client with matches
   - Click delete button on a match
   - Confirm deletion in dialog
   - Verify match is removed from list
   - Check database to ensure all related data is cleaned up

## Security Considerations

- The delete_match function already has SECURITY DEFINER and RLS policies
- Only admin users should be able to delete matches
- Ensure proper error messages are shown without exposing sensitive data

## Performance Impact

- Deleting matches will also clean up related data
- This is a manual admin action, so performance impact is minimal
- Consider adding batch deletion for future enhancements