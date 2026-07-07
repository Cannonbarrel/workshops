# React & Web Development Rapid Fire - Set 2

This file contains a second set of 50 rapid-fire questions focused on conceptual React topics and modern web development patterns.

## Questions

1. Why does React recommend one-way data flow?
2. What does it mean for React to be declarative?
3. What is the difference between declarative and imperative UI code?
4. Why do hooks require the same call order on every render?
5. What is the role of the React fiber architecture?
6. What is a custom hook and why would you create one?
7. How does `useReducer` differ conceptually from `useState`?
8. What is an error boundary and when should you use one?
9. What is Suspense and how does it affect rendering?
10. What is a suspense boundary?
11. What is the meaning of an asynchronous render?
12. What is a render bailout and why is it useful?
13. What is memoization in relation to React component rendering?
14. What is the purpose of the `key` prop beyond list identity?
15. Why is immutable state important in React?
16. What is the difference between local state and shared state?
17. What does the term "stale closure" refer to in hooks?
18. What is the render phase versus the commit phase in React?
19. What is context drift and how can it affect components?
20. Why should React state updates be considered asynchronous?
21. What is the main benefit of splitting code into smaller chunks?
22. What does tree-shaking do in a React build?
23. What is hot module replacement and how does it help development?
24. What is the conceptual difference between a library and a framework in web development?
25. Why is it important to avoid mutating props?
26. What does a pure component mean in functional UI design?
27. What is a batched update and why does React batch renders?
28. What is the significance of `useTransition` in concurrent rendering?
29. What is an optimistic update and when would you use it?
30. What is the purpose of a fallback UI during lazy loading?
31. What is the difference between a server-rendered page and a statically generated page?
32. Why is React strict mode useful during development?
33. What is the concept of progressive enhancement for React apps?
34. What is the purpose of accessibility attributes like `aria-*` in React?
35. What is code splitting versus lazy loading?
36. What is the concept of an effect cleanup in hooks?
37. What is the difference between `useLayoutEffect` and passive effects?
38. What is a stale prop and why is it a problem?
39. What is the purpose of React DevTools profiler?
40. What is the difference between server-side rendering and client-side hydration?
41. What is the general idea behind function components being pure functions?
42. What is a render prop pattern used for conceptually?
43. What is the value of using prop type validation or type checking?
44. What is a higher-order component in terms of composition?
45. What role does browser event bubbling play with React event handlers?
46. Why are references (`refs`) considered an escape hatch in React?
47. What is the effect of having a large dependency array in `useEffect`?
48. What is the concept behind external state stores like Redux or Zustand?
49. What is a progressive web app and how does it relate to React?
50. What is the benefit of keeping your React components small and focused?

---

## Answers

1. One-way data flow means parent components pass props down and children cannot directly mutate parent state, which makes data flow predictable.
2. Declarative means describing the UI state you want, letting React handle how to update the DOM.
3. Declarative code describes what the UI should be; imperative code describes how to change the UI step by step.
4. Hooks need the same call order so React can associate hook state with the correct hook call on every render.
5. Fiber is React’s reconciliation engine that enables incremental rendering and prioritization of updates.
6. A custom hook is a reusable hook function that encapsulates component logic so multiple components can share it.
7. `useReducer` manages complex state transitions with a reducer function, while `useState` is for simple state updates.
8. An error boundary catches render-time errors in child components and displays a fallback UI instead of crashing the whole app.
9. Suspense lets React wait for async dependencies like code or data before showing the wrapped component.
10. A suspense boundary is the component wrapper that shows fallback content while child resources are still loading.
11. Asynchronous render means React can start, pause, and resume rendering work without blocking the browser.
12. A render bailout skips work when React determines the output would not change, improving performance.
13. Memoization caches computed values or component output so React can reuse them instead of recalculating.
14. Aside from identity, `key` helps React preserve component state and minimize DOM operations across list changes.
15. Immutable state ensures React can compare old and new state quickly and avoid accidental mutations.
16. Local state belongs to a specific component; shared state is used by multiple components or application-wide logic.
17. A stale closure occurs when a hook callback captures outdated values from a previous render.
18. Render phase builds the virtual tree and determines changes; commit phase applies those changes to the DOM.
19. Context drift happens when consumers read stale context values because updates were not delivered as expected.
20. State updates are batched and applied later, so reading state immediately after setting it may still return the old value.
21. Smaller chunks reduce initial load time by loading only the code needed for the current screen.
22. Tree-shaking removes unused code from bundles so only imported modules remain in the final build.
23. Hot module replacement updates modules in-place during development without full page refresh.
24. A library offers reusable tools; a framework defines overall structure and controls app flow.
25. Mutating props breaks React’s expectation of immutable inputs and can lead to bugs and unpredictable updates.
26. In functional UI, a pure component is one whose output is determined only by its inputs, with no side effects.
27. Batched updates group multiple state changes into a single render so React can update more efficiently.
28. `useTransition` marks updates as non-urgent so React can keep the UI responsive while rendering lower-priority updates.
29. An optimistic update updates the UI before the server confirms a change, improving perceived speed.
30. A fallback UI gives users a temporary loading state while lazy-loaded components are prepared.
31. Server-rendered pages are generated on demand on the server; statically generated pages are built once at compile time.
32. Strict mode highlights unsafe lifecycle methods, deprecated APIs, and other potential issues during development.
33. Progressive enhancement means building the app so it still works in basic form even if advanced JavaScript features are unavailable.
34. `aria-*` attributes make UI elements accessible by providing semantic information to assistive technologies.
35. Code splitting divides bundles at build time; lazy loading defers loading of those chunks until needed.
36. Effect cleanup removes subscriptions, timers, or other resources when the component unmounts or dependencies change.
37. `useLayoutEffect` blocks paint until it runs, while passive effects run after paint and do not block rendering.
38. A stale prop is a prop value that no longer reflects current state, which can cause outdated renders or wrong behavior.
39. The profiler helps identify which components render most often and where time is spent during updates.
40. Server-side rendering creates HTML on the server; hydration attaches React behavior to that HTML on the client.
41. Function components as pure functions means they return the same UI for the same inputs, making them easier to reason about.
42. The render prop pattern lets a component delegate part of its rendering to a function passed in by its parent.
43. Prop type validation or type checking catches incorrect prop shapes early and improves code reliability.
44. A higher-order component composes behavior by wrapping a component and returning a new enhanced component.
45. Event bubbling lets React handle events at a higher level and manage handlers efficiently through delegation.
46. Refs are an escape hatch because they let you interact with DOM nodes or persist mutable values outside of normal state.
47. A large dependency array can cause frequent effect re-runs or make dependencies hard to reason about if it contains many changing values.
48. External state stores centralize app state outside React components, making it easier to share and persist data across the app.
49. A PWA is a web app with offline capability, installability, and reliable behavior; React can be used to build PWAs with the same app shell.
50. Small focused components are easier to test, reuse, and understand, and they keep rendering logic simpler.
