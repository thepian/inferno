/**
 * @module Inferno
 */ /** TypeDoc Comment */

import { isNullOrUndef } from "inferno-shared";
import {createWrappedFunction} from "./wrapper";
import {IV} from "../../core/implementation";

const onTextareaInputChange = createWrappedFunction('onInput', applyValue);

const wrappedOnChange = createWrappedFunction('onChange');

export function processTextarea(
  iv: IV,
  dom,
  nextPropsOrEmpty,
  mounting: boolean,
  isControlled: boolean
) {
  applyValue(nextPropsOrEmpty, dom, mounting);

  if (isControlled) {
    dom.iv = iv;

    if (mounting) {
      dom.oninput = onTextareaInputChange;
      if (nextPropsOrEmpty.onChange) {
        dom.onchange = wrappedOnChange;
      }
    }
  }
}

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
