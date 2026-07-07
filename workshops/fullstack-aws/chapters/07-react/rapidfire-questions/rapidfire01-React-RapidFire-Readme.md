# React & Web Development Rapid Fire

This file contains 50 rapid-fire questions about React and modern web development, followed by answers.

## Questions

1. What is JSX?
2. What is the difference between a functional component and a class component?
3. What is a React hook?
4. What does `useState` do?
5. What does `useEffect` do?
6. When should you use `useMemo`?
7. What is `useRef` used for?
8. What is component state?
9. What are props?
10. How do you pass data from parent to child?
11. How do you pass data from child to parent?
12. What is the React Context API?
13. What is component lifecycle?
14. What are the main lifecycle methods in class components?
15. What is virtual DOM?
16. How does React update the DOM?
17. What is reconciliation?
18. What is key in lists and why is it important?
19. What is a controlled component?
20. What is an uncontrolled component?
21. What is a higher-order component (HOC)?
22. What is a render prop?
23. What is lifting state up?
24. What is React Router?
25. What is the difference between `BrowserRouter` and `HashRouter`?
26. What is lazy loading in React?
27. What is code splitting?
28. What is the difference between `useEffect` and `useLayoutEffect`?
29. What is `React.memo`?
30. What is a pure component?
31. How do you manage form input in React?
32. How do you prevent default form submit behavior in React?
33. What is a callback function in React events?
34. What is synthetic event system in React?
35. What is a fragment (`<>...</>`)?
36. What is strict mode in React?
37. What is hydration in React?
38. What is server-side rendering (SSR)?
39. What is static site generation (SSG)?
40. What is client-side rendering (CSR)?
41. What is CORS and why does it matter?
42. What HTTP methods are standard for CRUD?
43. What is REST API?
44. What is GraphQL?
45. What are promises in JavaScript?
46. What is async/await?
47. What is event delegation in the DOM?
48. What is the difference between `var`, `let`, and `const`?
49. What is `npm` vs `yarn`?
50. What is progressive web app (PWA)?

---

## Answers

1. JSX is a syntax extension for JavaScript that allows writing HTML-like markup in React code.
2. Functional components are functions returning JSX; class components are ES6 classes with lifecycle methods and `this.state`.
3. A hook is a special function (e.g., `useState`, `useEffect`) that lets you use React features in functional components.
4. `useState` adds local state to a component and returns a value/setter pair.
5. `useEffect` runs side effects after render, such as data fetching or subscriptions.
6. `useMemo` memoizes expensive computations and avoids recomputing on each render unless dependencies change.
7. `useRef` stores a mutable value that persists across renders, often for DOM refs or mutable variables.
8. Component state is data local to a component that influences rendering and updates when changed.
9. Props are read-only inputs passed into components from their parents.
10. Parent passes props to child by using JSX attributes: `<Child prop={value} />`.
11. Child passes to parent via callback prop: `<Child onChange={handler}/>` and inside child `props.onChange(value)`.
12. Context provides global-ish data to deeply nested components without prop drilling.
13. Lifecycle refers to mount, update, and unmount phases of a component.
14. `componentDidMount`, `componentDidUpdate`, `componentWillUnmount`, etc.
15. Virtual DOM is React’s in-memory representation of the UI used to compute minimal DOM updates.
16. React diff the virtual DOM and apply minimal operations to the real DOM.
17. Reconciliation is React’s algorithm to compare tree versions and reconcile differences.
18. Keys identify list items, helping React match elements between renders; they should be stable and unique.
19. Controlled component input value is managed by React state and updated on input events.
20. Uncontrolled component keeps its own internal DOM state and is accessed via refs.
21. HOC is a function that takes a component and returns an enhanced component.
22. A render prop component accepts a function prop caries render logic.
23. Lifting state up means moving shared state to the nearest common ancestor.
24. React Router handles in-app navigation and URL-based routing in SPA.
25. `BrowserRouter` uses HTML5 history API, `HashRouter` uses URL hash; the latter works without server-side route support.
26. Lazy loading defers component loading until it's needed, e.g., `React.lazy`.
27. Code splitting breaks bundle into smaller chunks loaded on demand.
28. `useEffect` runs after paint; `useLayoutEffect` runs before painting but after DOM updates.
29. `React.memo` memoizes functional component render output to avoid unnecessary re-renders.
30. A pure component renders dependably given same props/state; in React class it implements shallow prop/state compare.
31. Manage form input with state updates in `onChange` handlers and `value` binding.
32. Use `event.preventDefault()` in submit handler.
33. Callback in events is a function passed to event prop, e.g., `onClick={() => doSomething()}`.
34. Synthetic events are React wrappers around browser events to provide cross-browser compatibility.
35. Fragment groups child elements without extra DOM node.
36. Strict mode enables extra checks and warnings in development.
37. Hydration attaches React to server-rendered HTML on client side.
38. SSR renders React on server and sends HTML to client.
39. SSG pre-renders pages at build time.
40. CSR renders entirely in browser after JS loads.
41. CORS is cross-origin resource sharing; browser security to restrict cross-domain requests.
42. CRUD methods: POST create, GET read, PUT/PATCH update, DELETE delete.
43. REST is an architectural style for APIs using stateless resources and standard HTTP verbs.
44. GraphQL is a query language allowing clients to request specific data shapes from APIs.
45. Promise is an object representing asynchronous operation completion/failure.
46. `async/await` is syntax for working with promises more readably.
47. Event delegation attaches listener to common parent and uses event bubbling to capture child events.
48. `var` function-scoped and hoisted; `let`/`const` block-scoped; `const` cannot reassign.
49. `npm` and `yarn` are JavaScript package managers; yarn generally has faster installs and lockfile differences.
50. PWA is web app with offline support, installability, and app-like behavior.
