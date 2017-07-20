/**
 * @module Inferno-Utils
 */ /** TypeDoc Comment */
const comparer = document.createElement("div");

export function sortAttributes(html: string): string {
  return html.replace(
    /<([a-z0-9-]+)((?:\s[a-z0-9:_.-]+=".*?")+)((?:\s*\/)?>)/gi,
    (s, pre, attrs, after) => {
      const attrName = (attribute: string): string => attribute.split("=")[0];
      const list: string[] = attrs
        .match(/\s[a-z0-9:_.-]+=".*?"/gi)
        .sort((a, b) => (attrName(a) > attrName(b) ? 1 : -1));
      if (~after.indexOf("/")) {
        after = "></" + pre + ">";
      }
      return "<" + pre + list.join("") + after;
    }
  );
}

export function innerHTML(HTML: string): string {
  comparer.innerHTML = HTML;
  return sortAttributes(comparer.innerHTML);
}

export function createStyler(CSS: string | undefined | null): string {
  if (typeof CSS === "undefined" || CSS === null) {
    return "";
  }
  comparer.style.cssText = CSS;
  return comparer.style.cssText;
}

export function style(CSS: string[] | string): string[] | string {
  if (CSS instanceof Array) {
    return CSS.map(createStyler);
  } else {
    return createStyler(CSS);
  }
}

export function createContainerWithHTML(html: string): HTMLDivElement {
  const container = document.createElement("div");

  container.innerHTML = html;
  return container;
}

export function waits(timer: number, done: () => void) {
  setTimeout(done, timer);
}

export function triggerEvent(name: string, element: any) {
  let eventType;

  if (
    name === "click" ||
    name === "dblclick" ||
    name === "mousedown" ||
    name === "mouseup"
  ) {
    eventType = "MouseEvents";
  } else if (
    name === "focus" ||
    name === "change" ||
    name === "blur" ||
    name === "select"
  ) {
    eventType = "HTMLEvents";
  } else {
    throw new Error('Unsupported `"' + name + '"`event');
  }
  const event = document.createEvent(eventType);
  event.initEvent(name, name !== "change", true);
  element.dispatchEvent(event, true);
}
