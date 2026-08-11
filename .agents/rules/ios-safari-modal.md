---
trigger: always_on
description: "Guidelines for creating and modifying modals (pop-ups) to ensure they render correctly on iOS Safari."
---

# iOS Safari Modal Guidelines

When creating or modifying Modals (pop-ups) in this project, you **MUST** follow these structural guidelines to prevent the modal from being cut off by the dynamic Safari bottom toolbar on iOS.

## The Problem
Using `100vh`, `100dvh`, or `100%` with `items-center` on a fixed overlay often causes the bottom of the modal to be pushed underneath the Safari bottom toolbar because Safari calculates the Layout Viewport differently from the Visual Viewport when the toolbar is expanded.

## The Solution
Always use `100svh` (Small Viewport Height) combined with `items-start` on mobile to ensure the modal respects the safe visual area.

### 1. Overlay Container
- **Class Requirements:** Use `fixed inset-0`, `items-start md:items-center`, and `p-4` (or similar padding).
- **Explanation:** `items-start` ensures the modal hangs from the top on mobile, preventing it from overflowing the bottom edge. On desktop (`md:`), `items-center` can safely be used.

### 2. Modal Panel
- **Class Requirements:** Use `max-h-[calc(100svh-2rem)] min-h-0` on mobile, and `md:max-h-[85dvh]` on desktop.
- **Explanation:** `100svh` ensures the maximum height uses the smallest possible viewport (when the Safari toolbar is fully expanded). `min-h-0` is required for flex children to allow inner scrolling.

### 3. Inner Scrollable Content
- **Class Requirements:** Use `flex-1 min-h-0 overflow-y-auto`.
- **Explanation:** `flex-1 min-h-0` correctly sizes the scrolling content within the flex modal panel without pushing the footer off-screen.

### Example Template
```jsx
<div className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
  {/* Modal Panel */}
  <div className="bg-white w-full max-w-lg rounded-2xl flex flex-col overflow-hidden max-h-[calc(100svh-2rem)] md:max-h-[85dvh] min-h-0">
    
    {/* Header (Fixed) */}
    <div className="p-4 border-b shrink-0">
      <h2>Modal Title</h2>
    </div>

    {/* Content (Scrollable) */}
    <div className="p-4 flex-1 min-h-0 overflow-y-auto custom-scrollbar">
      <p>Scrollable content goes here...</p>
    </div>

    {/* Footer (Fixed) */}
    <div className="p-4 border-t shrink-0">
      <button>Action</button>
    </div>

  </div>
</div>
```

**Do NOT use `pb-24` or bottom padding hacks** inside the modal content to bypass Safari toolbar issues. Always fix the structural wrapper as shown above.
