/**
 * @module Inferno
 */ /** TypeDoc Comment */

import { isNullOrUndef } from "inferno-shared";
import { EMPTY_OBJ } from "../utils";
import { wrap } from "./processelements";
import { IFiber } from "packages/inferno/src/core/fiber";

function wrappedOnChange(e) {
  const props = this.fiber.input.props || EMPTY_OBJ;
  const event = props.onChange;

  if (event.event) {
    event.event(event.data, e);
  } else {
    event(e);
  }
}

wrap(wrappedOnChange);

function applyValue(nextPropsOrEmpty, dom, mounting: boolean) {
  const value = nextPropsOrEmpty.value;
  const domValue = dom.value;

  if (isNullOrUndef(value)) {
    if (mounting) {
      const defaultValue = nextPropsOrEmpty.defaultValue;

      if (!isNullOrUndef(defaultValue)) {
        if (defaultValue !== domValue) {
          dom.defaultValue = defaultValue;
          dom.value = defaultValue;
        }
      } else if (domValue !== "") {
        dom.defaultValue = "";
        dom.value = "";
      }
    }
  } else {
    /* There is value so keep it controlled */
    if (domValue !== value) {
      dom.defaultValue = value;
      dom.value = value;
    }
  }
}

function onTextareaInputChange(e) {
  let fiber = this.fiber;
  const props = fiber.input.props || EMPTY_OBJ;
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

    applyValue(fiber, fiber.dom, false);
  }
}

wrap(onTextareaInputChange);

export function processTextarea(
  fiber: IFiber,
  dom: HTMLTextAreaElement,
  nextPropsOrEmpty,
  mounting: boolean,
  isControlled: boolean
) {
  applyValue(nextPropsOrEmpty, dom, mounting);

  if (isControlled) {
    (dom as any).fiber = fiber;

    if (mounting) {
      dom.oninput = onTextareaInputChange;
      if (nextPropsOrEmpty.onChange) {
        dom.onchange = wrappedOnChange;
      }
    }
  }
}
