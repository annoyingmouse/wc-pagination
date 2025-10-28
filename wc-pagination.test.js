import { jest, test, expect, describe } from "@jest/globals";

describe("wc-pagination", () => {
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

  test("reflects attributes to properties", () => {
    const el = document.createElement("wc-pagination");
    el.setAttribute("total", "100");
    el.setAttribute("current", "3");
    el.setAttribute("page-size", "10");
    document.body.appendChild(el);

    expect(el.getAttribute("total")).toBe("100");
    expect(el.getAttribute("current")).toBe("3");
    expect(el.getAttribute("page-size")).toBe("10");
  });

  test("computes totalPages correctly", () => {
    const el = document.createElement("wc-pagination");
    el.setAttribute("total", "100");
    el.setAttribute("page-size", "15");
    expect(el.totalPages).toBe(7); // ceil(100 / 15) = 7
  });

  // --- Helper: query buttons by visible text ---
  function getButtonByText(shadowRoot, text) {
    return Array.from(shadowRoot.querySelectorAll("button.content")).find(
      (btn) => btn.textContent.trim() === text,
    );
  }

  // --- Event dispatch: page number click ---
  test('dispatches "page-change" when a page number button is clicked', () => {
    const el = document.createElement("wc-pagination");
    el.setAttribute("total", "50");
    el.setAttribute("page-size", "10"); // → 5 pages
    document.body.appendChild(el);

    const page3Button = getButtonByText(el.shadowRoot, "3");
    expect(page3Button).toBeTruthy();

    const handlePageChange = jest.fn();
    el.addEventListener("page-change", handlePageChange);
    page3Button.click();

    expect(handlePageChange).toHaveBeenCalledTimes(1);
    expect(handlePageChange.mock.calls[0][0].detail).toEqual({ page: 3 });
  });

  // --- Event dispatch: arrow & ellipsis buttons ---
  test('dispatches "page-change" when "first page" (←) button is clicked', () => {
    const el = document.createElement("wc-pagination");
    el.setAttribute("total", "50");
    el.setAttribute("page-size", "10");
    el.setAttribute("current", "3");
    document.body.appendChild(el);

    const firstButton = getButtonByText(el.shadowRoot, "←");
    expect(firstButton).toBeTruthy();

    const handlePageChange = jest.fn();
    el.addEventListener("page-change", handlePageChange);
    firstButton.click();

    expect(handlePageChange).toHaveBeenCalledTimes(1);
    expect(handlePageChange.mock.calls[0][0].detail).toEqual({ page: 1 });
  });

  test('dispatches "page-change" when "last page" (→) button is clicked', () => {
    const el = document.createElement("wc-pagination");
    el.setAttribute("total", "50");
    el.setAttribute("page-size", "10");
    el.setAttribute("current", "2");
    document.body.appendChild(el);

    const lastButton = getButtonByText(el.shadowRoot, "→");
    expect(lastButton).toBeTruthy();

    const handlePageChange = jest.fn();
    el.addEventListener("page-change", handlePageChange);
    lastButton.click();

    expect(handlePageChange).toHaveBeenCalledTimes(1);
    expect(handlePageChange.mock.calls[0][0].detail).toEqual({ page: 5 });
  });

  test('dispatches "page-change" when ellipsis (…) button is clicked', () => {
    const el = document.createElement("wc-pagination");
    el.setAttribute("total", "100"); // 10 pages
    el.setAttribute("page-size", "10");
    el.setAttribute("current", "5"); // middle page → ellipsis should appear
    document.body.appendChild(el);

    const ellipsisButton = getButtonByText(el.shadowRoot, "…");
    expect(ellipsisButton).toBeTruthy();

    const handlePageChange = jest.fn();
    el.addEventListener("page-change", handlePageChange);
    ellipsisButton.click();

    expect(handlePageChange).toHaveBeenCalledTimes(1);
    // Should jump to page 2 (5 - 3 = 2)
    expect(handlePageChange.mock.calls[0][0].detail.page).toBe(2);
  });

  // --- Edge case: disabled buttons should NOT dispatch events ---
  test('does NOT dispatch "page-change" when clicking disabled first-page button', () => {
    const el = document.createElement("wc-pagination");
    el.setAttribute("total", "50");
    el.setAttribute("page-size", "10");
    el.setAttribute("current", "1");
    document.body.appendChild(el);

    const firstButton = getButtonByText(el.shadowRoot, "←");
    expect(firstButton.disabled).toBe(true);

    const handlePageChange = jest.fn();
    el.addEventListener("page-change", handlePageChange);
    firstButton.click();

    expect(handlePageChange).not.toHaveBeenCalled();
  });

  test('does NOT dispatch "page-change" when clicking disabled last-page button', () => {
    const el = document.createElement("wc-pagination");
    el.setAttribute("total", "50");
    el.setAttribute("page-size", "10");
    el.setAttribute("current", "5");
    document.body.appendChild(el);

    const lastButton = getButtonByText(el.shadowRoot, "→");
    expect(lastButton.disabled).toBe(true);

    const handlePageChange = jest.fn();
    el.addEventListener("page-change", handlePageChange);
    lastButton.click();

    expect(handlePageChange).not.toHaveBeenCalled();
  });

  // --- Accessibility (a11y) ---
  test("sets correct aria attributes for current page", () => {
    const el = document.createElement("wc-pagination");
    el.setAttribute("total", "30");
    el.setAttribute("page-size", "10");
    el.setAttribute("current", "2");
    document.body.appendChild(el);

    const currentPageButton = Array.from(
      el.shadowRoot.querySelectorAll("button.content"),
    ).find((btn) => btn.closest("li").getAttribute("aria-current") === "true");
    expect(currentPageButton).toBeTruthy();
    expect(currentPageButton.closest("li").getAttribute("aria-label")).toBe(
      "Current page, page 2",
    );

    // Ensure other buttons lack aria-current
    const otherButtons = Array.from(
      el.shadowRoot.querySelectorAll("button.content"),
    ).filter((btn) => btn !== currentPageButton);
    for (const btn of otherButtons) {
      expect(btn.closest("li").hasAttribute("aria-current")).toBe(false);
    }
  });

  test("sets descriptive aria-labels on navigation buttons", () => {
    const el = document.createElement("wc-pagination");
    el.setAttribute("total", "50");
    el.setAttribute("page-size", "10");
    el.setAttribute("current", "1");
    document.body.appendChild(el);

    const firstLi = getButtonByText(el.shadowRoot, "←").closest("li");
    const lastLi = getButtonByText(el.shadowRoot, "→").closest("li");

    expect(firstLi.getAttribute("aria-label")).toBe(
      "Already page 1",
    );
    expect(lastLi.getAttribute("aria-label")).toBe("Goto page 5");
  });

  test("has proper role and label on root <ol>", () => {
    const el = document.createElement("wc-pagination");
    el.setAttribute("total", "20");
    el.setAttribute("page-size", "10");
    document.body.appendChild(el);

    const ol = el.shadowRoot.querySelector("ol");
    expect(ol).toBeTruthy();
    expect(ol.getAttribute("aria-label")).toBe("Pagination Navigation");
    expect(ol.getAttribute("role")).toBe("navigation");
  });

  test("page number buttons are native <button> elements", () => {
    const el = document.createElement("wc-pagination");
    el.setAttribute("total", "30");
    el.setAttribute("page-size", "10");
    document.body.appendChild(el);

    const buttons = Array.from(
      el.shadowRoot.querySelectorAll("button.content"),
    );
    const first = buttons[0]; // ←
    const last = buttons[buttons.length - 1]; // →

    // Middle buttons should be page numbers (1, 2, 3)
    const pageButtons = buttons.slice(1, -1);
    expect(pageButtons.length).toBe(3);
    pageButtons.forEach((btn, i) => {
      expect(btn.textContent.trim()).toBe(String(i + 1));
      expect(btn.type).toBe("button");
      expect(btn.disabled).toBe(false);
    });

    // Arrows should also be buttons
    expect(first.type).toBe("button");
    expect(last.type).toBe("button");
  });

  test("first-page button is disabled when on page 1", () => {
    const el = document.createElement("wc-pagination");
    el.setAttribute("total", "30");
    el.setAttribute("page-size", "10");
    el.setAttribute("current", "1");
    document.body.appendChild(el);

    const firstBtn = getButtonByText(el.shadowRoot, "←");
    expect(firstBtn.disabled).toBe(true);
  });
});
