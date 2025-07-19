# Lix HTML Diff Integration Specification

## Overview

This specification describes the integration of lix HTML diff library with the lix-plugin-md diff component. The integration transforms the current side-by-side text diff approach into a semantic HTML-based list diff that provides better readability and interactivity.

## Architecture

### Core Processing Flow

```
MD-AST Entities → HTML Rendering → Lix HTML Diff → Interactive List Display
      ↓               ↓                  ↓                    ↓
  mdast_id     data-diff-key      CSS Classes         User Interface
```

### Dependencies

- `@lix-js/html-diff`: Core HTML diff library
- `mdast-util-to-hast`: Convert markdown AST to HTML AST
- `hast-util-to-html`: Convert HTML AST to HTML string

## HTML Rendering Pipeline

### 1. Entity to HTML Conversion

Each markdown entity (node) is converted to HTML using the following process:

```javascript
function convertEntityToHtml(entity) {
  // Create temporary AST with single entity
  const tempAst = {
    type: "root",
    children: [entity]
  };

  // Convert to HTML AST
  const hast = toHast(tempAst);

  // Convert to HTML string
  const html = toHtml(hast);

  // Add data-diff-key attribute using mdast_id
  return addDataDiffKey(html, entity.mdast_id);
}
```

### 2. Data Diff Key Assignment

The `mdast_id` property from each entity is used as the `data-diff-key` attribute:

```html
<!-- Before -->
<p>Hello world</p>

<!-- After -->
<p data-diff-key="para-123">Hello world</p>
```

### 3. Lix HTML Diff Processing

The HTML entities are processed through lix HTML diff to generate semantic differences:

```javascript
function generateHtmlDiff(beforeEntities, afterEntities) {
  const beforeHtml = beforeEntities.map(convertEntityToHtml).join('');
  const afterHtml = afterEntities.map(convertEntityToHtml).join('');

  return htmlDiff(beforeHtml, afterHtml);
}
```

## List-Based Rendering

### Entity Ordering

Entities are rendered as a vertical list ordered by the order array from the root schema:

1. **Order Source**: `orderDiff.snapshot_content_after.order`
2. **Sorting**: Entities sorted by position in order array
3. **Fallback**: Entity ID comparison if order not available
4. **Display**: Order numbers are not shown, only used for sorting

### List Structure

```html
<div class="diff-container">
  <div class="entity-list">
    <div class="entity-item" data-entity-id="heading-1">
      <h1 class="diff-updated" data-diff-key="heading-1">Updated Title</h1>
    </div>
    <div class="entity-item" data-entity-id="para-1">
      <p class="diff-created" data-diff-key="para-1">New paragraph</p>
    </div>
    <div class="entity-item" data-entity-id="para-2">
      <p class="diff-deleted" data-diff-key="para-2">Deleted paragraph</p>
    </div>
  </div>
</div>
```

## Styling Integration

### Default Lix HTML Diff Classes

The component uses standard lix HTML diff CSS classes:

```css
.diff-created {
  color: #080;
  background: #efe;
}

.diff-updated {
  color: #f60;
  background: #ffc;
}

.diff-deleted {
  color: #b00;
  background: #fee;
}
```

### Custom Styling

Additional styling for the list layout:

```css
.diff-container {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  overflow: hidden;
}

.entity-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
}

.entity-item {
  border: 1px solid transparent;
  border-radius: 4px;
  padding: 8px;
  transition: border-color 0.2s;
}

.entity-item:hover {
  border-color: var(--color-border);
}
```

## Interactivity Features

### Hover Effects

Interactive hover cards showing before/after states:

```javascript
function addHoverInteractivity() {
  const diffElements = document.querySelectorAll('[class*="diff-"]');
  
  diffElements.forEach(element => {
    element.addEventListener('mouseenter', showHoverCard);
    element.addEventListener('mouseleave', hideHoverCard);
  });
}

function showHoverCard(event) {
  const element = event.target;
  const diffKey = element.getAttribute('data-diff-key');
  
  // Show before/after comparison
  const card = createHoverCard(diffKey);
  document.body.appendChild(card);
}
```

### Click Interactions

Click to expand detailed diff view:

```javascript
function addClickInteractivity() {
  const diffElements = document.querySelectorAll('[class*="diff-"]');
  
  diffElements.forEach(element => {
    element.addEventListener('click', toggleDetailedView);
  });
}
```

## Component API

### DiffComponent Interface

```typescript
interface DiffComponentProps {
  diffs: UiDiffComponentProps["diffs"];
  showInteractivity?: boolean;
  customStyles?: CSSStyleSheet;
}

interface EntityDiffData {
  entityId: string;
  htmlBefore: string;
  htmlAfter: string;
  diffType: 'created' | 'updated' | 'deleted';
}
```

### Core Methods

```typescript
class DiffComponent extends LitElement {
  // Convert entity to HTML
  private convertEntityToHtml(entity: any): string;
  
  // Generate diff HTML
  private generateDiffHtml(beforeEntities: any[], afterEntities: any[]): string;
  
  // Add interactivity
  private addInteractivity(): void;
  
  // Render entity list
  private renderEntityList(diffHtml: string): TemplateResult;
}
```

## Migration Strategy

### Phase 1: Dependency Installation
- Add required npm packages
- Update package.json with new dependencies

### Phase 2: Core Refactoring
- Replace `diffLines()` with lix HTML diff
- Implement entity-to-HTML conversion
- Update rendering from side-by-side to list

### Phase 3: Styling Updates
- Remove old diff styling
- Integrate lix HTML diff CSS classes
- Add new list-based layout styles

### Phase 4: Interactivity Enhancement
- Add hover effects
- Implement click interactions
- Add detailed diff views

## Testing Strategy

### Unit Tests

```javascript
describe('HTML Diff Integration', () => {
  test('converts markdown entity to HTML', () => {
    const entity = {
      type: 'paragraph',
      children: [{ type: 'text', value: 'Hello world' }],
      mdast_id: 'para-123'
    };
    
    const html = convertEntityToHtml(entity);
    expect(html).toContain('data-diff-key="para-123"');
    expect(html).toContain('<p>Hello world</p>');
  });
  
  test('generates ordered entity list', () => {
    const diffs = [/* mock diff data */];
    const component = new DiffComponent();
    component.diffs = diffs;
    
    const result = component.render();
    // Assert correct ordering and structure
  });
});
```

### Integration Tests

```javascript
describe('Lix HTML Diff Integration', () => {
  test('applies diff classes correctly', () => {
    const beforeEntities = [/* mock before data */];
    const afterEntities = [/* mock after data */];
    
    const diffHtml = generateHtmlDiff(beforeEntities, afterEntities);
    
    expect(diffHtml).toContain('class="diff-created"');
    expect(diffHtml).toContain('class="diff-updated"');
    expect(diffHtml).toContain('class="diff-deleted"');
  });
});
```

## Performance Considerations

1. **HTML Generation**: Cache converted HTML for unchanged entities
2. **DOM Updates**: Use efficient DOM manipulation for large diffs
3. **Memory Management**: Clean up event listeners on component destroy
4. **Lazy Loading**: Load interactivity features only when needed

## Accessibility

1. **ARIA Labels**: Add appropriate ARIA labels for diff states
2. **Keyboard Navigation**: Support keyboard navigation between entities
3. **Screen Reader Support**: Provide meaningful diff descriptions
4. **Focus Management**: Proper focus handling for interactive elements

## Future Enhancements

1. **Diff Modes**: Support different diff visualization modes
2. **Export Options**: Export diff results to various formats
3. **Collaborative Features**: Real-time diff updates for collaborative editing
4. **Custom Renderers**: Pluggable entity renderers for different markdown types
5. **Performance Optimization**: Virtual scrolling for large diff sets

## Implementation Notes

1. **Backward Compatibility**: Maintain existing API while adding new features
2. **Error Handling**: Graceful fallback to text diff if HTML conversion fails
3. **Configuration**: Allow users to toggle between HTML and text diff modes
4. **Customization**: Support custom CSS and interaction handlers