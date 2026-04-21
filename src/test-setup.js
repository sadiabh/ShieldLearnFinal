import '@testing-library/jest-dom'

// jsdom does not implement scrollIntoView — mock it so AskAL's
// auto-scroll useEffect doesn't crash during tests.
window.HTMLElement.prototype.scrollIntoView = function () {}
