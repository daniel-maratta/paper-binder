(function () {
  const defaultToken = "paperbinder-test-challenge-pass";
  const widgets = new Map();
  let widgetCount = 0;

  function getNextToken() {
    const configuredToken =
      typeof window.__paperbinderTurnstileNextToken === "string" && window.__paperbinderTurnstileNextToken.length > 0
        ? window.__paperbinderTurnstileNextToken
        : defaultToken;

    window.__paperbinderTurnstileNextToken = null;
    return configuredToken;
  }

  function mountWidget(container, options, widgetId) {
    container.innerHTML = "";

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "Complete challenge";
    button.style.border = "1px solid #bcc8d0";
    button.style.background = "#f4f6f8";
    button.style.borderRadius = "6px";
    button.style.padding = "0.75rem 1rem";
    button.style.font = "inherit";
    button.style.cursor = "pointer";

    button.addEventListener("click", function () {
      const token = getNextToken();
      button.textContent = "Challenge complete";
      button.dataset.state = "complete";
      options.callback && options.callback(token);
    });

    container.appendChild(button);
    widgets.set(widgetId, { button: button, container: container, options: options });
  }

  window.turnstile = {
    render: function (container, options) {
      const widgetId = "mock-widget-" + ++widgetCount;
      mountWidget(container, options, widgetId);
      return widgetId;
    },
    reset: function (widgetId) {
      const widget = widgets.get(widgetId);
      if (!widget) {
        return;
      }

      mountWidget(widget.container, widget.options, widgetId);
    },
    remove: function (widgetId) {
      const widget = widgets.get(widgetId);
      if (!widget) {
        return;
      }

      widget.container.innerHTML = "";
      widgets.delete(widgetId);
    }
  };
})();
