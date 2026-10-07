// Alert.alert for the browser. react-native-web's Alert is an empty function,
// so every confirm in the app (logout, delete, block, report...) silently did
// nothing on web. This renders a native-looking dialog in <body> and calls
// the chosen button's onPress, with the same semantics as iOS/Android:
//   - no buttons -> a single "OK"
//   - up to 2 buttons side by side, 3+ stacked
//   - style "cancel" is bold, "destructive" is red
//   - Escape presses the cancel button; backdrop click dismisses only when
//     options.cancelable is true (calls options.onDismiss)
// Alerts raised while one is open are queued.

export type AlertButton = {
  text?: string;
  onPress?: (value?: string) => void | Promise<void>;
  style?: "default" | "cancel" | "destructive";
  isPreferred?: boolean;
};

export type AlertOptions = {
  cancelable?: boolean;
  onDismiss?: () => void;
  userInterfaceStyle?: "unspecified" | "light" | "dark";
};

type Pending = { title: string; message?: string; buttons: AlertButton[]; options?: AlertOptions };

const queue: Pending[] = [];
let open = false;

const CSS = `
.rn-alert-backdrop{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(10,8,20,.45);animation:rn-alert-fade .15s ease-out}
.rn-alert{width:100%;max-width:320px;border-radius:16px;overflow:hidden;background:#fff;color:#111;box-shadow:0 20px 50px rgba(0,0,0,.25);font-family:Montserrat,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;animation:rn-alert-pop .18s ease-out}
.rn-alert-body{padding:20px 20px 16px;text-align:center}
.rn-alert-title{margin:0;font-size:17px;font-weight:700;line-height:1.3}
.rn-alert-message{margin:6px 0 0;font-size:14px;line-height:1.45;color:#555;white-space:pre-wrap}
.rn-alert-buttons{display:flex;border-top:1px solid rgba(0,0,0,.1)}
.rn-alert-buttons.is-stacked{flex-direction:column}
.rn-alert-btn{flex:1;min-height:46px;padding:10px 12px;border:0;background:transparent;font:inherit;font-size:16px;color:#6C3EF4;cursor:pointer}
.rn-alert-btn+.rn-alert-btn{border-left:1px solid rgba(0,0,0,.1)}
.rn-alert-buttons.is-stacked .rn-alert-btn+.rn-alert-btn{border-left:0;border-top:1px solid rgba(0,0,0,.1)}
.rn-alert-btn:hover{background:rgba(108,62,244,.06)}
.rn-alert-btn:focus-visible{outline:2px solid #6C3EF4;outline-offset:-2px}
.rn-alert-btn.is-cancel{font-weight:700}
.rn-alert-btn.is-destructive{color:#FE2C55}
html.dark .rn-alert{background:#1f1f27;color:#f2f2f5}
html.dark .rn-alert-message{color:#a8a8b3}
html.dark .rn-alert-buttons,html.dark .rn-alert-btn+.rn-alert-btn,html.dark .rn-alert-buttons.is-stacked .rn-alert-btn+.rn-alert-btn{border-color:rgba(255,255,255,.1)}
@keyframes rn-alert-fade{from{opacity:0}}
@keyframes rn-alert-pop{from{opacity:0;transform:scale(1.06)}}
`;

function ensureStyles() {
  if (document.getElementById("rn-alert-styles")) return;
  const style = document.createElement("style");
  style.id = "rn-alert-styles";
  style.textContent = CSS;
  document.head.appendChild(style);
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string) {
  const node = document.createElement(tag);
  node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function show({ title, message, buttons, options }: Pending) {
  open = true;
  ensureStyles();
  const previouslyFocused = document.activeElement as HTMLElement | null;

  const backdrop = el("div", "rn-alert-backdrop");
  const dialog = el("div", "rn-alert");
  dialog.setAttribute("role", "alertdialog");
  dialog.setAttribute("aria-modal", "true");

  const body = el("div", "rn-alert-body");
  const titleId = `rn-alert-title-${Date.now()}`;
  if (title) {
    const h = el("h2", "rn-alert-title", title);
    h.id = titleId;
    body.appendChild(h);
    dialog.setAttribute("aria-labelledby", titleId);
  }
  if (message) body.appendChild(el("p", "rn-alert-message", message));
  dialog.appendChild(body);

  const list = buttons.length ? buttons : [{ text: "OK" }];
  const row = el("div", "rn-alert-buttons" + (list.length > 2 ? " is-stacked" : ""));

  const close = (after?: () => void) => {
    document.removeEventListener("keydown", onKey, true);
    backdrop.remove();
    open = false;
    previouslyFocused?.focus?.();
    try {
      after?.();
    } finally {
      const next = queue.shift();
      if (next) show(next);
    }
  };

  const cancelButton = list.find((b) => b.style === "cancel");
  const buttonEls = list.map((b) => {
    const btn = el(
      "button",
      "rn-alert-btn" + (b.style === "cancel" ? " is-cancel" : b.style === "destructive" ? " is-destructive" : ""),
      b.text ?? "OK"
    );
    btn.type = "button";
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      close(() => void b.onPress?.());
    });
    row.appendChild(btn);
    return btn;
  });
  dialog.appendChild(row);
  backdrop.appendChild(dialog);

  backdrop.addEventListener("click", (e) => {
    if (e.target !== backdrop || !options?.cancelable) return;
    close(options.onDismiss);
  });

  function onKey(e: KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      if (cancelButton) close(() => void cancelButton.onPress?.());
      else if (options?.cancelable || list.length === 1) close(options?.onDismiss ?? list[0].onPress);
    } else if (e.key === "Tab") {
      // Keep focus inside the dialog.
      const i = buttonEls.indexOf(document.activeElement as HTMLButtonElement);
      const nextIndex = (i + (e.shiftKey ? -1 : 1) + buttonEls.length) % buttonEls.length;
      e.preventDefault();
      buttonEls[nextIndex].focus();
    }
  }
  document.addEventListener("keydown", onKey, true);

  document.body.appendChild(backdrop);
  const preferred = list.findIndex((b) => b.isPreferred);
  const firstAction = list.findIndex((b) => b.style !== "cancel");
  buttonEls[preferred >= 0 ? preferred : firstAction >= 0 ? firstAction : 0].focus();
}

export const Alert = {
  alert(title: string, message?: string, buttons?: AlertButton[], options?: AlertOptions) {
    if (typeof document === "undefined") return;
    const pending = { title: title ?? "", message, buttons: buttons ?? [], options };
    if (open) queue.push(pending);
    else show(pending);
  },
  prompt(title: string, message?: string, callbackOrButtons?: ((text: string) => void) | AlertButton[]) {
    if (typeof window === "undefined") return;
    const text = window.prompt([title, message].filter(Boolean).join("\n\n"));
    if (text == null) return;
    if (typeof callbackOrButtons === "function") callbackOrButtons(text);
    else callbackOrButtons?.find((b) => b.style !== "cancel")?.onPress?.(text);
  },
};

export default Alert;
