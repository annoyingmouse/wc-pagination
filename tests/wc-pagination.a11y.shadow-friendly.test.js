/**
 * A11y-focused tests for <wc-pagination> that work with ShadowRoot in jsdom
 */
import { jest, test, expect, describe, beforeEach } from "@jest/globals";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";

// 🔧 Adjust this path to your component file
import "../wc-pagination.js";

/* ----------------------------- Helper utilities ----------------------------- */

/** Return text content for accessibility: ignores nodes with aria-hidden="true". */
function nodeText(node) {
  if (node.nodeType === Node.TEXT_NODE) return node.nodeValue;
  if (node.nodeType !== Node.ELEMENT_NODE) return "";
  const el = node;
  if (el.getAttribute && el.getAttribute("aria-hidden") === "true") return "";
  let txt = "";
  for (const child of el.childNodes) txt += nodeText(child);
  return txt;
}

/** Very small accessible name approximation for buttons. */
function getAccessibleName(el) {
  if (!(el instanceof HTMLElement)) return "";
  // aria-label wins
  const aria = el.getAttribute("aria-label");
  if (aria) return aria;
  // otherwise use title or concatenated text content (including sr-only spans)
  const title = el.getAttribute("title");
  if (title) return title;
  return (nodeText(el) || "").replace(/\s+/g, " ").trim();
}

/** Find a single button inside a root (ShadowRoot or Element) by accessible name (regex). */
function getButtonByName(root, nameRegex) {
  const buttons = Array.from(root.querySelectorAll("button"));
  const found = buttons.find((b) => nameRegex.test(getAccessibleName(b)));
  if (!found) {
    const names = buttons.map((b) => `"${getAccessibleName(b)}"`).join(", ");
    throw new Error(`Button not found by name ${nameRegex}. Seen: [${names}]`);
  }
  return found;
}

/** Query all buttons. */
function getAllButtons(root) {
  return Array.from(root.querySelectorAll("button"));
}

/* ----------------------------------- Tests ---------------------------------- */

describe("<wc-pagination>", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  // --- Basic lifecycle & rendering ---
  test("is defined as a custom element", () => {
    const el = document.createElement("wc-pagination");
    expect(el).toBeInstanceOf(HTMLElement);
  });

  test("renders with shadow DOM and non-empty content", () => {
    const el = document.createElement("wc-pagination");
    document.body.appendChild(el);
    expect(el.shadowRoot).toBeTruthy();
    expect(el.shadowRoot.innerHTML).toContain("<ol");
  });

  test("reflects attributes and computes totalPages", () => {
    const el = document.createElement("wc-pagination");
    el.setAttribute("total", "100");
    el.setAttribute("page-size", "15");
    el.setAttribute("current", "3");
    document.body.appendChild(el);

    expect(el.getAttribute("total")).toBe("100");
    expect(el.getAttribute("page-size")).toBe("15");
    expect(el.getAttribute("current")).toBe("3");
    expect(el.totalPages).toBe(7); // ceil(100 / 15) = 7
  });

  // --- Event dispatch: page number click ---
  test('dispatches "page-change" when a page number is clicked', () => {
    const el = document.createElement("wc-pagination");
    el.setAttribute("total", "50"); // 5 pages
    el.setAttribute("page-size", "10");
    document.body.appendChild(el);

    const page3 = getButtonByName(el.shadowRoot, /go to page 3/i);
    const onChange = jest.fn();
    el.addEventListener("page-change", onChange);

    page3.click();
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].detail).toEqual({ page: 3 });
  });

  // --- Event dispatch: arrow buttons (first/last) ---
  test('dispatches "page-change" when "first page" (←) button is clicked', () => {
    const el = document.createElement("wc-pagination");
    el.setAttribute("total", "50");
    el.setAttribute("page-size", "10");
    el.setAttribute("current", "3");
    document.body.appendChild(el);

    const firstBtn = getButtonByName(el.shadowRoot, /go to page 1/i);
    const onChange = jest.fn();
    el.addEventListener("page-change", onChange);

    firstBtn.click();
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].detail).toEqual({ page: 1 });
  });

  test('dispatches "page-change" when "last page" (→) button is clicked', () => {
    const el = document.createElement("wc-pagination");
    el.setAttribute("total", "50");
    el.setAttribute("page-size", "10");
    el.setAttribute("current", "2");
    document.body.appendChild(el);

    const lastBtn = getButtonByName(el.shadowRoot, /go to page 5/i);
    const onChange = jest.fn();
    el.addEventListener("page-change", onChange);

    lastBtn.click();
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].detail).toEqual({ page: 5 });
  });

  // --- Event dispatch: ellipsis buttons ---

  test("ellipsis buttons have accessible names and dispatch jumps", () => {
    const el = document.createElement("wc-pagination");
    el.setAttribute("total", "100"); // 10 pages
    el.setAttribute("page-size", "10");
    el.setAttribute("current", "5"); // middle page → both ellipses present
    document.body.appendChild(el);

    const onChange = jest.fn();
    el.addEventListener("page-change", onChange);

    // Forward first (avoids stale reference after DOM re-render)
    let fwd3 = getButtonByName(el.shadowRoot, /go to page 8/i);
    expect(fwd3).toBeTruthy();
    fwd3.click();
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ detail: { page: 8 } }),
    );

    // Reset to page 5 and test the back ellipsis
    el.setAttribute("current", "5");
    onChange.mockClear();

    let back3 = getButtonByName(el.shadowRoot, /go to page 2/i);
    expect(
      back3.querySelector('span[aria-hidden="true"]')?.textContent?.trim(),
    ).toBe("…");
    back3.click();
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ detail: { page: 2 } }),
    );
  });

  // --- Disabled arrows should NOT dispatch ---
  test("disabled first/last arrows are unfocusable and inert", () => {
    const el = document.createElement("wc-pagination");
    el.setAttribute("total", "50");
    el.setAttribute("page-size", "10");
    el.setAttribute("current", "1"); // first page → left arrow disabled
    document.body.appendChild(el);

    const prev = getButtonByName(el.shadowRoot, /already on page 1/i);
    expect(prev.disabled).toBe(true);

    const onChange = jest.fn();
    el.addEventListener("page-change", onChange);
    prev.click();
    expect(onChange).not.toHaveBeenCalled();

    // Move to last and check right arrow
    el.setAttribute("current", "5");
    const next = getButtonByName(el.shadowRoot, /already on page 5/i);
    expect(next.disabled).toBe(true);
    onChange.mockClear();
    next.click();
    expect(onChange).not.toHaveBeenCalled();
  });

  // --- Accessibility: current page semantics ---
  test("current page has aria-current='page' and is non-actionable", () => {
    const el = document.createElement("wc-pagination");
    el.setAttribute("total", "30");
    el.setAttribute("page-size", "10");
    el.setAttribute("current", "2");
    document.body.appendChild(el);

    const currentBtn = getButtonByName(el.shadowRoot, /current page, page 2/i);
    expect(currentBtn.getAttribute("aria-current")).toBe("page");
    expect(currentBtn.getAttribute("aria-disabled")).toBe("true");
    expect(currentBtn.hasAttribute("disabled")).toBe(false);

    const onChange = jest.fn();
    el.addEventListener("page-change", onChange);
    currentBtn.click();
    expect(onChange).not.toHaveBeenCalled();
  });

  // --- Landmark contract ---
  test("nav landmark present; ol has no landmark role", () => {
    const el = document.createElement("wc-pagination");
    el.setAttribute("total", "20");
    el.setAttribute("page-size", "10");
    document.body.appendChild(el);

    const nav = el.shadowRoot.querySelector("nav");
    const ol = el.shadowRoot.querySelector("nav > ol");
    expect(nav).toHaveAttribute("aria-label", "Pagination");
    expect(ol.hasAttribute("role")).toBe(false);
  });

  // --- Roving tabindex + keyboard behavior ---
  test("roving tabindex: only current page is tabbable, and updates when current changes", () => {
    const el = document.createElement("wc-pagination");
    el.setAttribute("total", "50");
    el.setAttribute("page-size", "10");
    el.setAttribute("current", "2");
    document.body.appendChild(el);

    const all1 = getAllButtons(el.shadowRoot);
    const tabbables1 = all1.filter((b) => b.getAttribute("tabindex") === "0");
    expect(tabbables1).toHaveLength(1);
    expect(getAccessibleName(tabbables1[0])).toMatch(/current page, page 2/i);

    el.setAttribute("current", "4");
    const all2 = getAllButtons(el.shadowRoot);
    const tabbables2 = all2.filter((b) => b.getAttribute("tabindex") === "0");
    expect(tabbables2).toHaveLength(1);
    expect(getAccessibleName(tabbables2[0])).toMatch(/current page, page 4/i);
  });

  test("Arrow keys/Home/End change page and do not trap Tab", async () => {
    const user = userEvent.setup();
    const el = document.createElement("wc-pagination");
    el.setAttribute("total", "50");
    el.setAttribute("page-size", "10");
    el.setAttribute("current", "3");
    document.body.appendChild(el);

    const onChange = jest.fn();
    el.addEventListener("page-change", onChange);

    const currentBtn = getButtonByName(el.shadowRoot, /current page, page 3/i);
    currentBtn.focus();

    await user.keyboard("{ArrowRight}"); // → 4
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ detail: { page: 4 } }),
    );

    await user.keyboard("{Home}"); // → 1
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ detail: { page: 1 } }),
    );

    await user.keyboard("{End}"); // → 5
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ detail: { page: 5 } }),
    );

    onChange.mockClear();
    await user.keyboard("{Tab}"); // should not dispatch
    expect(onChange).not.toHaveBeenCalled();
  });

  // --- Regression: no listener leaks across renders ---
  test("does not accumulate click listeners across attribute changes", () => {
    const el = document.createElement("wc-pagination");
    el.setAttribute("total", "50");
    el.setAttribute("page-size", "10");
    el.setAttribute("current", "1");
    document.body.appendChild(el);

    const onChange = jest.fn();
    el.addEventListener("page-change", onChange);

    el.setAttribute("current", "2");
    el.setAttribute("current", "3");
    el.setAttribute("current", "4");

    onChange.mockClear();

    const go5 = getButtonByName(el.shadowRoot, /go to page 5/i);
    go5.click();
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].detail).toEqual({ page: 5 });
  });
});
