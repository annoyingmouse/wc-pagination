(() => {
  const increment = document.getElementById("increment");
  const first2last = document.getElementById("first2last");
  const customEventListener = document.getElementById("custom-event-listener");
  customEventListenerValue = document.getElementById(
    "custom-event-listener-value",
  );
  customEventListener.addEventListener(
    "page-change",
    function (e) {
      customEventListenerValue.innerText = e.detail.page;
    },
    false,
  );
  let incrementCurrent = Number(increment.getAttribute("current")) || 1;
  let first2lastCurrent = Number(increment.getAttribute("current")) || 1;
  setInterval(() => {
    incrementCurrent += 1;
    if (incrementCurrent === 100) {
      incrementCurrent = 1;
    }
    if (first2lastCurrent === 1) {
      first2lastCurrent = 100;
    } else {
      first2lastCurrent = 1;
    }
    increment.setAttribute("current", incrementCurrent.toString());
    first2last.setAttribute("current", first2lastCurrent.toString());
  }, 1000);
})();
