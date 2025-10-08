# Match Deletion Flow Diagram

## User Interaction Flow

```mermaid
flowchart TD
    A[Admin views client matches] --> B[Clicks delete button on match]
    B --> C[Confirmation dialog appears]
    C --> D{Admin confirms?}
    D -->|Yes| E[Call delete_match RPC function]
    D -->|No| F[Cancel, close dialog]
    E --> G[Delete match_interactions]
    G --> H[Delete notifications]
    H --> I[Delete match]
    I --> J[Return success result]
    J --> K[Show success toast]
    K --> L[Refresh matches list]
    L --> M[Update UI]
    F --> N[Return to matches view]
```

## Database Deletion Flow

```mermaid
flowchart LR
    A[delete_match function] --> B[Check match exists]
    B --> C[Delete match_interactions]
    C --> D[Delete notifications]
    D --> E[Delete match]
    E --> F[Return result with counts]
```

## Component Structure

```mermaid
graph TD
    A[ClientsPage] --> B[Matches Tab]
    B --> C[Active Matches Panel]
    B --> D[Match Suggestions Panel]
    C --> E[MatchCard Component]
    D --> E
    E --> F[Delete Button]
    F --> G[DeleteMatchDialog]
    G --> H[handleDeleteMatch]
    H --> I[delete_match RPC]
    I --> J[Update State]
    J --> K[Refresh Lists]
```

## Key Implementation Points

1. **MatchCard Component Enhancement**
   - Add delete button with proper event handling
   - Prevent click event bubbling to avoid opening match details

2. **State Management**
   - Add deleteMatchDialogOpen state
   - Add deletingMatchId state to track which match is being deleted

3. **API Integration**
   - Use existing delete_match RPC function
   - Handle success/error responses appropriately

4. **UI Updates**
   - Refresh both active matches and suggestions after deletion
   - Show appropriate toast notifications