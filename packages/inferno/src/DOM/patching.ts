/**
 * @module Inferno
 */
/** TypeDoc Comment */

import {
  combineFrom,
  isArray,
  isFunction,
  isInvalid,
  isNull,
  isNullOrUndef,
  isStringOrNumber,
  isUndefined,
  NO_OP,
  throwError
} from "inferno-shared";
import VNodeFlags from "inferno-vnode-flags";
import {isVNode, options, VNode, IV, createIV, Refs, IVTypes} from "../core/implementation";
import {
  mount,
  mountArrayChildren,
  mountComponent,
  mountElement,
  mountRef,
  mountText
} from "./mounting";
import { unmount } from "./unmounting";
import {
  componentToDOMNodeMap,
  EMPTY_OBJ,
  insertOrAppend,
  removeChild,
  replaceChild,
  setTextContent,
  updateTextContent,
} from "./utils/common";
import {
  isControlledFormElement,
  processElement
} from "./wrappers/processElement";
import { patchProp, removeProp } from "./props";
import IVFlags from "../../../inferno-iv-flags/src/index";
import {Component} from "packages/inferno/src/DOM/rendering";

function replaceDOM(iv: IV, parentDOM: Element, dom: Element|null) {
  unmount(iv, null);

  if (!isNull(dom)) {
    replaceChild(parentDOM, dom, iv.d as Element);
  } else {
    removeChild(parentDOM, iv.d as Element);
  }
  iv.d = dom;
}

function replaceOneByMany(iv: IV, nextInput: any[], parentDOM, lifecycle: Function[], context, isSVG: boolean) {
  const oldNode = iv.d;
  unmount(iv, null);

  mountArrayChildren(iv, nextInput, parentDOM, oldNode, lifecycle, context, isSVG, false, true);

  parentDOM.removeChild(oldNode);
}

function replaceManyByOne(parentIV: IV, nextInput: VNode, parentDOM, lifecycle: Function[], context, isSVG: boolean) {
  const oldNode = parentIV.t === IVTypes.IsVirtualArray ? parentIV.d : (parentIV.c as IV[])[0].d;
  const childIVs: IV[] = parentIV.c as IV[];

  for (let i = 0, len = childIVs.length; i < len; i++) {
    unmount(childIVs[i], i === 0 ? null : parentDOM);
  }

  const newNode = mount(parentIV, nextInput, parentDOM, oldNode, lifecycle, context, isSVG, false);
  if (parentIV.t === IVTypes.IsVirtualArray) {
    parentIV.d =  newNode;
  }

  parentDOM.replaceChild(newNode, oldNode);
}

export function removeAllChildren(parentIV: IV, dom: Element, children: IV[]) {
  for (let i = 0, len = children.length; i < len; i++) {
    unmount(children[i], dom);
  }
  parentIV.c = null;
  parentIV.f = IVFlags.HasInvalidChildren;
}

function replaceWithNewNode(
  iv: IV,
  nextInput: VNode | string | number,
  parentDom,
  lifecycle,
  context,
  isSVG: boolean
) {
  const oldNode = iv.d as Element;

  unmount(iv, null);

  const newDom = mount(iv, nextInput, parentDom, null, lifecycle, context, isSVG, false);

  if (isNull(newDom)) {
    removeChild(parentDom, oldNode as Element);
  } else {
    replaceChild(parentDom, newDom, oldNode);
  }

  iv.d = newDom;
}

export function patch(
  iv: IV,
  nextInput: VNode | string | number,
  parentDOM: Element,
  nextNode: Element | null,
  lifecycle: Function[],
  context: Object,
  isSVG: boolean
) {
  const lastInput = iv.v;

  if (lastInput !== nextInput) {
    if (isStringOrNumber(nextInput)) {
      if (isStringOrNumber(lastInput)) {
        (iv.d as any).nodeValue = nextInput;
        // updateTextContent(parentDOM, nextInput);
      } else if (isVNode(lastInput)) {
        replaceDOM(iv, parentDOM, mountText(iv, nextInput, null, null,false));
      } else {
        replaceOneByMany(iv, nextInput as any, parentDOM, lifecycle, context, isSVG);
      }
    } else if (isStringOrNumber(lastInput)) {
      if (isVNode(nextInput)) {
        replaceDOM(iv, parentDOM, mount(iv, nextInput, parentDOM, null, lifecycle, context, isSVG, false));
      } else {
        replaceOneByMany(iv, nextInput as any, parentDOM, lifecycle, context, isSVG);
      }
    } else if (isVNode(lastInput)) {
      if (isVNode(nextInput)) {
        const lastFlags = lastInput.flags;
        const nextFlags = nextInput.flags;

        if (lastFlags & VNodeFlags.Portal) {
          if (nextFlags & VNodeFlags.Portal) {
            patchPortal(iv, lastInput, nextInput, lifecycle, context);
          } else {
            replaceDOM(
              iv,
              parentDOM,
              mount(iv, nextInput, parentDOM, null, lifecycle, context, isSVG, false)
            );
          }
        } else if (nextFlags & VNodeFlags.Component) {
          const isClass = (nextFlags & VNodeFlags.ComponentClass) > 0;

          if (lastFlags & VNodeFlags.Component) {
            patchComponent(
              iv,
              nextInput,
              parentDOM,
              lifecycle,
              context,
              isSVG,
              isClass
            );
          } else {
            replaceDOM(
              iv,
              parentDOM,
              mountComponent(iv, nextInput, parentDOM, null, lifecycle, context, isSVG, isClass, false)
            );
          }
        } else if (nextFlags & VNodeFlags.Element) {
          if (lastFlags & VNodeFlags.Element) {
            patchElement(
              iv,
              lastInput,
              nextInput,
              parentDOM,
              nextNode,
              lifecycle,
              context,
              isSVG
            );
          } else {
            replaceDOM(
              iv,
              parentDOM,
              mountElement(iv, nextInput, parentDOM, null, lifecycle, context, isSVG, false)
            );
          }
        } else if (nextFlags & VNodeFlags.Portal) {
          replaceDOM(
            iv,
            parentDOM,
            mount(iv, nextInput, parentDOM, null, lifecycle, context, isSVG, false)
          );
        } else {
          // Error case: mount new one replacing old one
          replaceDOM(
            iv,
            parentDOM,
            mount(iv, nextInput, parentDOM, null, lifecycle, context, isSVG, false)
          );
        }
      } else {
        replaceOneByMany(iv, nextInput, parentDOM, lifecycle, context, isSVG);
      }
    } else if (isVNode(nextInput)) {
      replaceManyByOne(iv, nextInput, parentDOM, lifecycle, context, isSVG);
    } else {
      // Many to Many
      patchChildren(iv, nextInput, parentDOM, nextNode, lifecycle, context, false, true);
    }
  }

  iv.v = nextInput;
}

function patchPortal(iv: IV, lastVNode: VNode, nextVNode: VNode, lifecycle, context) {
  const lastContainer = lastVNode.type as Element;
  const nextContainer = nextVNode.type as Element;
  const nextChildren = nextVNode.children as VNode;

  // TODO:
  // patchChildren(
  //   iv,
  //   0,
  //   0,
  //   lastVNode.children as VNode,
  //   nextChildren,
  //   lastContainer as Element,
  //   lifecycle,
  //   context,
  //   false
  // );

  if (lastContainer !== nextContainer && !isInvalid(nextChildren)) {
    const node = iv.d as Element;

    lastContainer.removeChild(node);
    nextContainer.appendChild(node);
  }
}

export function patchElement(
  iv: IV,
  lastVNode: VNode,
  nextVNode: VNode,
  parentDOM: Element | null,
  nextNode: Element | null,
  lifecycle: Function[],
  context: Object,
  isSVG: boolean
) {
  const nextTag = nextVNode.type;
  const lastTag = lastVNode.type;

  if (lastTag !== nextTag) {
    replaceWithNewNode(
      iv,
      nextVNode,
      parentDOM,
      lifecycle,
      context,
      isSVG
    );
  } else {
    const dom = iv.d as Element;
    const lastProps = lastVNode.props;
    const nextProps = nextVNode.props;
    const lastChildren = lastVNode.children;
    const nextChildren = nextVNode.children;
    const nextFlags = nextVNode.flags;
    const nextRef = nextVNode.ref;
    const lastClassName = lastVNode.className;
    const nextClassName = nextVNode.className;

    isSVG = isSVG || (nextFlags & VNodeFlags.SvgElement) > 0;
    if (lastChildren !== nextChildren) {
      const childrenIsSVG = isSVG === true && nextVNode.type !== "foreignObject";

      patchChildren(
        iv,
        nextChildren,
        dom,
        null,
        lifecycle,
        context,
        childrenIsSVG,
        false
      );
    }

    // inlined patchProps  -- starts --
    if (lastProps !== nextProps) {
      const lastPropsOrEmpty = lastProps || EMPTY_OBJ;
      const nextPropsOrEmpty = nextProps || (EMPTY_OBJ as any);
      let hasControlledValue = false;

      if (nextPropsOrEmpty !== EMPTY_OBJ) {
        const isFormElement = (nextFlags & VNodeFlags.FormElement) > 0;
        if (isFormElement) {
          hasControlledValue = isControlledFormElement(nextPropsOrEmpty);
        }

        for (const prop in nextPropsOrEmpty) {
          // do not add a hasOwnProperty check here, it affects performance
          const nextValue = nextPropsOrEmpty[prop];
          const lastValue = lastPropsOrEmpty[prop];

          patchProp(prop, lastValue, nextValue, dom, isSVG, hasControlledValue);
        }

        if (isFormElement) {
          processElement(
            nextFlags,
            iv,
            dom,
            nextPropsOrEmpty,
            false,
            hasControlledValue
          );
        }
      }
      if (lastPropsOrEmpty !== EMPTY_OBJ) {
        for (const prop in lastPropsOrEmpty) {
          // do not add a hasOwnProperty check here, it affects performance
          if (
            isNullOrUndef(nextPropsOrEmpty[prop]) &&
            !isNullOrUndef(lastPropsOrEmpty[prop])
          ) {
            removeProp(prop, lastPropsOrEmpty[prop], dom, nextFlags);
          }
        }
      }
    }
    // inlined patchProps  -- ends --
    if (lastClassName !== nextClassName) {
      if (isNullOrUndef(nextClassName)) {
        dom.removeAttribute("class");
      } else {
        if (isSVG) {
          dom.setAttribute("class", nextClassName);
        } else {
          dom.className = nextClassName;
        }
      }
    }
    if (nextRef) {
      if (lastVNode.ref !== nextRef) {
        mountRef(dom as Element, nextRef, lifecycle);
      }
    }
  }
}

function patchChildren(
  parentIV: IV,
  nextInput,
  parentDOM: Element,
  nextNode: Element | null,
  lifecycle: Function[],
  context,
  childrenIsSVG: boolean,
  isVirtual: boolean
) {
  const childFlags = parentIV.f;
  let childIVs = parentIV.c as any;

  if ((childFlags & IVFlags.HasTextChildren) > 0) {
    if (isInvalid(nextInput)) {
      removeChild(parentDOM, parentDOM.firstChild as Element);
      parentIV.f = IVFlags.HasInvalidChildren;
    } else if (isStringOrNumber(nextInput)) {
      updateTextContent(parentDOM, nextInput);
    } else if (isVNode(nextInput)) {
      childIVs = createIV(nextInput, 0) as IV;
      const newDOM = mount(
        childIVs,
        nextInput,
        parentDOM,
        nextNode,
        lifecycle,
        context,
        childrenIsSVG,
        false
      );
      replaceChild(parentDOM, newDOM, parentDOM.firstChild as Element);
      childIVs.d = newDOM;
      parentIV.c = childIVs;
      parentIV.f = IVFlags.HasBasicChildren;
    } else {
      parentDOM.removeChild(parentDOM.firstChild as Element);
      mountArrayChildren(
        parentIV,
        nextInput,
        parentDOM,
        nextNode,
        lifecycle,
        context,
        childrenIsSVG,
        false,
        isVirtual
      );
    }
  } else if ((childFlags & IVFlags.HasInvalidChildren) > 0) {
    if (!isInvalid(nextInput)) {
      if (isStringOrNumber(nextInput)) {
        setTextContent(parentDOM, nextInput);
        parentIV.f = IVFlags.HasTextChildren;
      } else if (isVNode(nextInput)) {
        childIVs = createIV(nextInput, 0) as IV;
        mount(childIVs, nextInput, parentDOM, nextNode, lifecycle, context, childrenIsSVG, true);
        parentIV.c = childIVs;
        parentIV.f = IVFlags.HasBasicChildren;
      } else {
        mountArrayChildren(
          parentIV,
          nextInput,
          parentDOM,
          nextNode,
          lifecycle,
          context,
          childrenIsSVG,
          false,
          isVirtual
        );
      }
    }
  } else if ((childFlags & IVFlags.HasBasicChildren) > 0) {
    if (isInvalid(nextInput)) {
      unmount(childIVs, parentDOM);
      parentIV.c = null;
      parentIV.f = IVFlags.HasInvalidChildren;
    } else if (isVNode(nextInput)) {
      patch(childIVs, nextInput, parentDOM, nextNode, lifecycle, context, childrenIsSVG);
    } else if (isStringOrNumber(nextInput)) {
      replaceWithNewNode(
        childIVs,
        nextInput,
        parentDOM,
        lifecycle,
        context,
        childrenIsSVG
      );
    } else {
      unmount(childIVs, parentDOM);
      mountArrayChildren(
        parentIV,
        nextInput,
        parentDOM,
        nextNode,
        lifecycle,
        context,
        childrenIsSVG,
        false,
        isVirtual
      );
    }
  } else {
    // Multiple children
    if (isInvalid(nextInput)) {
      removeAllChildren(parentIV, parentDOM, childIVs);
    } else if (isArray(nextInput)) {
      const lastLength = childIVs === null ? 0 : childIVs.length;
      const nextLength = (nextInput as VNode[]).length;

      if (lastLength === 0) {
        if (nextLength > 0) {
          mountArrayChildren(
            parentIV,
            nextInput,
            parentDOM,
            nextNode,
            lifecycle,
            context,
            childrenIsSVG,
            false,
            isVirtual
          );
        }
      } else if (nextLength === 0) {
        removeAllChildren(parentIV, parentDOM, childIVs);
      } else if (
        (childFlags & IVFlags.HasKeyedChildren) > 0 &&
        (nextInput.length > 0 &&
          !isNullOrUndef(nextInput[0]) &&
          !isNullOrUndef(nextInput[0].key))
      ) {
        patchKeyedChildren(
          parentIV,
          childIVs as IV[],
          nextInput as VNode[],
          parentDOM,
          nextNode,
          lifecycle,
          context,
          childrenIsSVG,
          lastLength,
          nextLength
        );
      } else {
        patchNonKeyedChildren(
          childIVs as IV[],
          nextInput as VNode[],
          parentDOM,
          nextNode,
          lifecycle,
          context,
          childrenIsSVG,
          lastLength,
          nextLength
        );
      }
    } else if (isStringOrNumber(nextInput)) {
      removeAllChildren(parentIV, parentDOM, childIVs);
      setTextContent(parentDOM, nextInput);
      parentIV.f = IVFlags.HasTextChildren;
    } else {
      // vNode
      replaceManyByOne(parentIV, nextInput, parentDOM, lifecycle, context, childrenIsSVG);
    }
  }

  if (parentIV.t === IVTypes.IsVirtualArray) {
    parentIV.d = isNull(parentIV.c) ? null : parentIV.c[0].d;
  }
}

export function updateClassComponent(
  instance: Component<any, any>,
  nextState,
  iv: IV,
  nextProps,
  parentDOM,
  lifecycle: Function[],
  context,
  force: boolean,
  fromSetState: boolean
) {
  const hasComponentDidUpdate = isFunction(instance.componentDidUpdate);
  // When component has componentDidUpdate hook, we need to clone lastState or will be modified by reference during update
  const lastState = instance.state;
  const lastProps = instance.props;
  instance.$PE = parentDOM;

  let renderOutput;

  if (instance.$UN) {
    if (process.env.NODE_ENV !== "production") {
      throwError(
        "Inferno Error: Can only update a mounted or mounting component. This usually means you called setState() or forceUpdate() on an unmounted component. This is a no-op."
      );
    }
    return;
  }
  if (lastProps !== nextProps || nextProps === EMPTY_OBJ) {
    if (!fromSetState && isFunction(instance.componentWillReceiveProps)) {
      instance.$BR = true;
      instance.componentWillReceiveProps(nextProps, context);
      // If instance component was removed during its own update do nothing...
      if (instance.$UN) {
        return;
      }
      instance.$BR = false;
    }
    if (instance.$PSS) {
      nextState = combineFrom(nextState, instance.$PS) as any;
      instance.$PSS = false;
      instance.$PS = null;
    }
  }

  /* Update if scu is not defined, or it returns truthy value or force */
  const hasSCU = isFunction(instance.shouldComponentUpdate);

  if (
    force ||
    !hasSCU ||
    (hasSCU &&
      (instance.shouldComponentUpdate as Function)(
        nextProps,
        nextState,
        context
      ))
  ) {
    if (isFunction(instance.componentWillUpdate)) {
      instance.$BS = true;
      instance.componentWillUpdate(nextProps, nextState, context);
      instance.$BS = false;
    }

    instance.props = nextProps;
    instance.state = nextState;
    instance.context = context;

    if (isFunction(options.beforeRender)) {
      options.beforeRender(instance);
    }
    renderOutput = instance.render(nextProps, nextState, context);

    if (isFunction(options.afterRender)) {
      options.afterRender(instance);
    }

    const didUpdate = renderOutput !== NO_OP;
    // Update component before getting child context
    let childContext;
    if (isFunction(instance.getChildContext)) {
      childContext = instance.getChildContext();
    }
    if (isNullOrUndef(childContext)) {
      childContext = context;
    } else {
      childContext = combineFrom(context, childContext);
    }
    instance.$CX = childContext;

    if (didUpdate) {
      patchChildren(
        iv,
        renderOutput,
        parentDOM,
        null,
        lifecycle,
        childContext,
        false,
        true
      );
      // Fix with arrays
      const dom = iv.c === null ? null : (iv.c as IV).d;

      iv.d = dom;

      if (fromSetState) {
        let parent = iv.b;

        while (!isNull(parent)) {
          parent.d = dom;
          parent = parent.b;
        }
      }
      if (hasComponentDidUpdate) {
        (instance.componentDidUpdate as Function)(lastProps, lastState);
      }
      if (isFunction(options.afterUpdate)) {
        options.afterUpdate(iv.v);
      }
      if (options.findDOMNodeEnabled) {
        componentToDOMNodeMap.set(instance, iv.d);
      }
    }
  } else {
    instance.props = nextProps;
    instance.state = nextState;
    instance.context = context;
  }
}

export function patchComponent(
  iv: IV,
  nextVNode: VNode,
  parentDOM: Element,
  lifecycle: Function[],
  context,
  isSVG: boolean,
  isClass: boolean
): void {
  const lastVNode = iv.v as VNode;
  const lastType = lastVNode.type;
  const nextType = nextVNode.type;
  const lastKey = lastVNode.key;
  const nextKey = nextVNode.key;

  if (lastType !== nextType || lastKey !== nextKey) {
    replaceWithNewNode(
      iv,
      nextVNode,
      parentDOM,
      lifecycle,
      context,
      isSVG
    );
  } else {
    const nextProps = nextVNode.props || EMPTY_OBJ;

    if (isClass) {
      const instance = iv.i as Component<any, any>;
      instance.$UPD = true;

      updateClassComponent(
        instance,
        instance.state,
        iv,
        nextProps,
        parentDOM,
        lifecycle,
        context,
        false,
        false
      );
      instance.$IV = iv;
      instance.$UPD = false;
    } else {
      let shouldUpdate = true;
      const lastProps = lastVNode.props;
      const nextHooks = nextVNode.ref as Refs;
      const nextHooksDefined = !isNullOrUndef(nextHooks);

      // TODO: Optimize lifecycle events below for size
      if (nextHooksDefined && isFunction(nextHooks.onComponentShouldUpdate)) {
        shouldUpdate = nextHooks.onComponentShouldUpdate(
          lastProps,
          nextProps
        );
      }
      if (shouldUpdate !== false) {
        if (nextHooksDefined && isFunction(nextHooks.onComponentWillUpdate)) {
          nextHooks.onComponentWillUpdate(lastProps, nextProps);
        }
        const nextInput = nextType(nextProps, context);

        if (nextInput !== NO_OP) {
          patchChildren(
            iv,
            nextInput,
            parentDOM,
            null,
            lifecycle,
            context,
            false,
            true
          );

          // Fix with arrays
          iv.d = iv.c === null ? null : (iv.c as IV).d;

          if (nextHooksDefined && isFunction(nextHooks.onComponentDidUpdate)) {
            nextHooks.onComponentDidUpdate(lastProps, nextProps);
          }
        }
      }
    }
  }
}

export function patchNonKeyedChildren(
  childIVs: IV[],
  nextChildren: Array<VNode | null | string | false | undefined | true | number>,
  parentDOM: Element,
  outerRef: Element | null,
  lifecycle: Function[],
  context,
  isSVG: boolean,
  lastIVsLength: number,
  nextChildrenLength: number
) {
  let nextChild;
  let iteratedIV = childIVs[0];
  let pos = iteratedIV.p;
  let nextNode = 1 < lastIVsLength ? childIVs[1].d : outerRef;
  let newChildIVs;
  let updatedIVs = 0;
  let addedIVs = 0;

  for (let j = 0; j < nextChildrenLength; j++) {
    nextChild = nextChildren[j];

    if (pos === j) {
      if (isInvalid(nextChild)) {
        if (iteratedIV.f !== IVFlags.HasInvalidChildren) {
          unmount(iteratedIV, parentDOM);
        }
        lastIVsLength--;
        childIVs.splice(addedIVs + updatedIVs, 1);
      } else {
        patch(iteratedIV, nextChild, parentDOM, nextNode, lifecycle, context, isSVG);
        updatedIVs++;
      }
      if (updatedIVs < lastIVsLength) {
        iteratedIV = childIVs[addedIVs + updatedIVs];
        pos = iteratedIV.p;
        nextNode = pos + 1 < lastIVsLength ? childIVs[pos + 1].d : outerRef
      } else {
        nextNode = outerRef;
      }
    } else if (!isInvalid(nextChild)) {
      newChildIVs = createIV(nextChild, j);

      mount(newChildIVs, nextChild, parentDOM, j < pos ? iteratedIV.d : outerRef, lifecycle, context, isSVG, true);

      childIVs.splice(j, 0, newChildIVs);
      addedIVs++;
    }
  }
  if (updatedIVs < lastIVsLength) {
    const firstIndex = updatedIVs;

    do {
      unmount(childIVs[addedIVs + updatedIVs++], parentDOM);
    } while (updatedIVs < lastIVsLength);

    childIVs.splice(firstIndex, lastIVsLength - firstIndex); // Remove dead IVs
  }
}

export function patchKeyedChildren(
  parentIV: IV,
  a: IV[],
  b: VNode[],
  parentDOM: Element,
  outerRef: Element | null,
  lifecycle,
  context: Function[],
  isSVG: boolean,
  aLength: number,
  bLength: number
) {
  let aEnd = aLength - 1;
  let bEnd = bLength - 1;
  let aStart: number = 0;
  let bStart: number = 0;
  let i: number = -1;
  let j: number;
  let aNode: IV;
  let bNode: VNode;
  let nextNode: Element | null = outerRef;
  let nextPos: number = 0;
  let node: VNode;
  let aStartNode = a[aStart];
  let bStartNode = b[bStart];
  let aEndNode = a[aEnd];
  let bEndNode = b[bEnd];
  const newChildIVs = new Array(bLength);

  // Step 1
  // tslint:disable-next-line
  outer: {
    // Sync nodes with the same key at the beginning.
    while (aStartNode.k === bStartNode.key) {
      patch(aStartNode, bStartNode, parentDOM, outerRef, lifecycle, context, isSVG);
      newChildIVs[bStart] = aStartNode;
      aStart++;
      bStart++;
      if (aStart > aEnd || bStart > bEnd) {
        break outer;
      }
      aStartNode = a[aStart];
      bStartNode = b[bStart];
    }

    // Sync nodes with the same key at the end.
    while (aEndNode.k === bEndNode.key) {
      patch(aEndNode, bEndNode, parentDOM, outerRef, lifecycle, context, isSVG);
      newChildIVs[bEnd] = aEndNode;
      aEnd--;
      bEnd--;
      if (aStart > aEnd || bStart > bEnd) {
        break outer;
      }
      nextNode = aEndNode.d;
      nextPos = aEnd;
      aEndNode = a[aEnd];
      bEndNode = b[bEnd];
    }
  }

  if (aStart > aEnd) {
    if (bStart <= bEnd) {
      nextPos = bEnd + 1;
      nextNode = nextPos < bLength ? newChildIVs[nextPos].d : outerRef;

      while (bStart <= bEnd) {
        node = b[bStart];
        const childIV = createIV(node, bStart);

        mount(childIV, node, parentDOM, nextNode, lifecycle, context, isSVG, true);

        newChildIVs[bStart] = childIV;
        bStart++;
      }
    }
  } else if (bStart > bEnd) {
    for (i = aStart; i <= aEnd; i++) {
      unmount(a[i], parentDOM);
    }
  } else {
    const sources = new Array(bEnd - bStart + 1).fill(-1);
    const keyIndex = new Map();

    // Mark all nodes as inserted.
    for (i = bStart; i <= bEnd; i++) {
      keyIndex.set(b[i].key, i);
    }

    let moved = false;
    let pos = 0;
    let bUpdated = 0;
    nextPos = 0;
    // Try to patch same keys and remove old
    for (i = aStart; i <= aEnd; i++) {
      aNode = a[i];
      j = keyIndex.get(aNode.k);

      if (isUndefined(j)) {
        unmount(aNode, parentDOM);
      } else {
        bNode = b[j];
        sources[j - bStart] = i;
        if (pos > j) {
          moved = true;
        } else {
          pos = j;
        }
        patch(aNode, bNode, parentDOM, outerRef, lifecycle, context, isSVG);
        newChildIVs[j] = aNode;
        bUpdated++;
      }
    }
    if (moved) {
      const seq = LIS(sources);

      j = seq.length - 1;
      for (i = bEnd - bStart; i >= 0; i--) {
        if (sources[i] === -1) {
          pos = i + bStart;
          node = b[pos];
          nextPos = pos + 1;
          nextNode = nextPos < bLength ? newChildIVs[nextPos].d : outerRef;

          const childIV = createIV(node, bStart);

          mount(childIV, node, parentDOM, nextNode, lifecycle, context, isSVG, true);

          newChildIVs[pos] = childIV;
        } else {
          if (j < 0 || i !== seq[j]) {
            pos = i + bStart;
            nextPos = pos + 1;
            nextNode = nextPos < bLength ? newChildIVs[nextPos].d : outerRef;

            insertOrAppend(
              parentDOM,
              newChildIVs[pos].d as Element,
              nextNode
            );
          } else {
            j--;
          }
        }
      }
    } else {
      for (i = bEnd; i >= bStart && bUpdated !== bLength; i--) {
        bNode = b[i];

        if (isUndefined(newChildIVs[i])) {
          const iv = createIV(bNode, i);

          mount(iv, bNode, parentDOM, nextNode, lifecycle, context, isSVG, true);

          newChildIVs[i] = iv;
          bUpdated++;
        }

        nextNode = newChildIVs[i].d;
      }
    }
  }
  parentIV.c = newChildIVs;
}

// Longest Increasing Subsequence algorithm
// https://en.wikipedia.org/wiki/Longest_increasing_subsequence
function LIS(arr: number[]): number[] {
  const p = arr.slice(0);
  const result: number[] = [0];
  let i;
  let j;
  let u;
  let v;
  let c;
  const len = arr.length;

  for (i = 0; i < len; i++) {
    const arrI = arr[i];

    if (arrI !== -1) {
      j = result[result.length - 1];
      if (arr[j] < arrI) {
        p[i] = j;
        result.push(i);
        continue;
      }

      u = 0;
      v = result.length - 1;

      while (u < v) {
        c = ((u + v) / 2) | 0;
        if (arr[result[c]] < arrI) {
          u = c + 1;
        } else {
          v = c;
        }
      }

      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1];
        }
        result[u] = i;
      }
    }
  }

  u = result.length;
  v = result[u - 1];

  while (u-- > 0) {
    result[u] = v;
    v = p[v];
  }

  return result;
}
