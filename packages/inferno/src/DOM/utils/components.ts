/**
 * @module Inferno
 */ /** TypeDoc Comment */

import {
  IV,
  options,
  Props
} from "../../core/implementation";
import {
  combineFrom,
  isFunction,
  isNullOrUndef
} from "inferno-shared";
import { EMPTY_OBJ } from "./common";
import {Component} from "../rendering";

export function createClassComponentInstance(
  iv: IV,
  C,
  props: Props,
  context: Object,
  lifecycle: Function[],
  parentElement: Element
) {
  const instance = new C(props, context) as Component<any, any>;
  iv.i = instance;
  instance.$PE = parentElement;
  instance.$IV = iv;
  instance.$BS = false;
  instance.context = context;
  if (instance.props === EMPTY_OBJ) {
    instance.props = props;
  }
  // setState callbacks must fire after render is done when called from componentWillReceiveProps or componentWillMount
  instance._lifecycle = lifecycle;

  instance.$UN = false;
  if (isFunction(instance.componentWillMount)) {
    instance.$BR = true;
    instance.componentWillMount();

    if (instance.$PSS) {
      const state = instance.state;
      const pending = instance.$PS;

      if (state === null) {
        instance.state = pending;
      } else {
        for (const key in pending) {
          state[key] = pending[key];
        }
      }
      instance.$PSS = false;
      instance.$PS = null;
    }

    instance.$BR = false;
  }

  let childContext;
  if (isFunction(instance.getChildContext)) {
    childContext = instance.getChildContext();
  }

  if (isNullOrUndef(childContext)) {
    instance.$CX = context;
  } else {
    instance.$CX = combineFrom(context, childContext);
  }

  if (isFunction(options.beforeRender)) {
    options.beforeRender(instance);
  }

  return instance;
}
