import { isFunction, isNullOrUndef } from "inferno-shared";
import { options } from "../../core/options";
import { EMPTY_OBJ, G } from "../utils";
import { IFiber } from "packages/inferno/src/core/fiber";
import { wrap } from "./processelements";

export function isCheckedType(type) {
  return type === "checkbox" || type === "radio";
}

const C = options.component;

function applyValue({ type, value, checked, multiple, defaultValue }, dom) {
  const hasValue = !isNullOrUndef(value);

  if (type && type !== dom.type) {
    dom.setAttribute("type", type);
  }
  if (multiple && multiple !== dom.multiple) {
    dom.multiple = multiple;
  }
  if (!isNullOrUndef(defaultValue) && !hasValue) {
    dom.defaultValue = defaultValue + "";
  }
  if (isCheckedType(type)) {
    if (hasValue) {
      dom.value = value;
    }
    if (!isNullOrUndef(checked)) {
      dom.checked = checked;
    }
  } else {
    if (hasValue && dom.value !== value) {
      dom.defaultValue = value;
      dom.value = value;
    } else if (!isNullOrUndef(checked)) {
      dom.checked = checked;
    }
  }
}

function onTextInputChange(e) {
  G.INFRender = true;
  let fiber = this.fiber;
  const props = fiber.input.props || EMPTY_OBJ;
  const dom = fiber.dom;
  const previousValue = props.value;

  if (props.onInput) {
    const event = props.onInput;

    if (event.event) {
      event.event(event.data, e);
    } else {
      event(e);
    }
  } else if (props.oninput) {
    props.oninput(e);
  }

  // the user may have updated the input from the above onInput events syncronously
  // so we need to get it from the context of `this` again
  fiber = this.fiber;
  const newProps = fiber.input.props || EMPTY_OBJ;

  // If render is going async there is no value change yet, it will come back to process input soon
  if (previousValue !== newProps.value) {
    // When this happens we need to store current cursor position and restore it, to avoid jumping

    applyValue(newProps, dom);
  }
  if (isFunction(C.flush)) {
    C.flush();
  }
  G.INFRender = false;
}

wrap(onTextInputChange);

function wrappedOnChange(e) {
  G.INFRender = true;
  const props = this.fiber.input.props || EMPTY_OBJ;
  const event = props.onChange;

  if (event.event) {
    event.event(event.data, e);
  } else {
    event(e);
  }
  if (isFunction(C.flush)) {
    C.flush();
  }
  G.INFRender = false;
}

wrap(wrappedOnChange);

function onCheckboxChange(e) {
  G.INFRender = true;
  e.stopPropagation(); // This click should not propagate its for internal use
  let fiber = this.fiber;
  const props = fiber.input.props || EMPTY_OBJ;
  const dom = fiber.dom;

  if (props.onClick) {
    const event = props.onClick;

    if (event.event) {
      event.event(event.data, e);
    } else {
      event(e);
    }
  } else if (props.onclick) {
    props.onclick(e);
  }

  // the user may have updated the input from the above onInput events syncronously
  // so we need to get it from the context of `this` again
  fiber = this.fiber;
  const newProps = fiber.input.props || EMPTY_OBJ;

  // If render is going async there is no value change yet, it will come back to process input soon
  applyValue(newProps, dom);
  if (isFunction(C.flush)) {
    C.flush();
  }
  G.INFRender = false;
}

wrap(onCheckboxChange);

export function processInput(
  fiber: IFiber,
  dom: HTMLInputElement,
  nextPropsOrEmpty,
  mounting: boolean,
  isControlled: boolean
): void {
  applyValue(nextPropsOrEmpty, dom);
  if (isControlled) {
    (dom as any).fiber = fiber;

    if (mounting) {
      if (isCheckedType(nextPropsOrEmpty.type)) {
        dom.onclick = onCheckboxChange;
      } else {
        dom.oninput = onTextInputChange;
      }
      if (nextPropsOrEmpty.onChange) {
        dom.onchange = wrappedOnChange;
      }
    }
  }
}
