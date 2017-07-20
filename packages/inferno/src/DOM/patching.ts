import {
  isArray,
  isFunction,
  isInvalid,
  isNullOrUndef,
  isNumber,
  isString,
  isStringOrNumber,
  LifecycleClass,
  NO_OP,
  throwError
} from "inferno-shared";
import VNodeFlags from "inferno-vnode-flags";
import { IFiber, Fiber, FiberFlags } from "../core/fiber";
import { options } from "../core/options";
import { isVNode, IVNode, Refs } from "../core/vnode";
import {
  booleanProps,
  delegatedEvents,
  isUnitlessNumber,
  namespaces,
  skipProps,
  strictProps
} from "./constants";
import { handleEvent } from "./events/delegation";
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
  EMPTY_OBJ,
  G,
  insertOrAppend,
  isKeyed,
  removeAllChildren,
  replaceChild,
  replaceDOM,
  replaceWithNewNode,
  setTextContent,
  updateTextContent
} from "./utils";
import {
  isControlledFormElement,
  processElement
} from "./wrappers/processelements";

export function patch(
  fiber: IFiber,
  nextInput: IVNode | string | number,
  parentDom: Element,
  lifecycle: LifecycleClass,
  context,
  isSVG: boolean,
  isRecycling: boolean
) {
  // LastInput cannot be null or undef or invalid, because they have been filtered out
  const lastInput = fiber.input;
  // Next should never come here being invalid, filter outside

  if (lastInput !== nextInput) {
    if (isStringOrNumber(nextInput)) {
      if (isStringOrNumber(lastInput)) {
        patchText(fiber, nextInput);
      } else {
        replaceDOM(
          fiber,
          parentDom,
          mountText(fiber, nextInput, null, false),
          lifecycle,
          isRecycling
        );
      }
    } else if (isStringOrNumber(lastInput)) {
      replaceDOM(
        fiber,
        parentDom,
        mount(fiber, nextInput, parentDom, lifecycle, context, isSVG, false),
        lifecycle,
        isRecycling
      );
    } else {
      const lastFlags = lastInput.flags;
      const nextFlags = nextInput.flags;

      if (nextFlags & VNodeFlags.Element) {
        if (lastFlags & VNodeFlags.Element) {
          patchElement(
            fiber,
            lastInput,
            nextInput,
            parentDom,
            lifecycle,
            context,
            isSVG,
            isRecycling
          );
        } else {
          fiber.children = null;
          replaceDOM(
            fiber,
            parentDom,
            mountElement(
              fiber,
              nextInput,
              parentDom,
              lifecycle,
              context,
              isSVG,
              false
            ),
            lifecycle,
            isRecycling
          );
        }
      } else if (nextFlags & VNodeFlags.Component) {
        const isClass = (nextFlags & VNodeFlags.ComponentClass) > 0;

        if (lastFlags & VNodeFlags.Component) {
          patchComponent(
            fiber,
            lastInput,
            nextInput,
            parentDom,
            lifecycle,
            context,
            isSVG,
            isClass,
            isRecycling
          );
        } else {
          replaceDOM(
            fiber,
            parentDom,
            mountComponent(
              fiber,
              nextInput,
              parentDom,
              lifecycle,
              context,
              isSVG,
              isClass,
              false
            ),
            lifecycle,
            isRecycling
          );
        }
      }
    }
  }

  fiber.input = nextInput;
}

function unmountChildren(
  fiber: IFiber,
  children,
  dom: Element,
  lifecycle: LifecycleClass,
  isRecycling: boolean
) {
  // TODO: Check this, we could add Fiber flags to optimize this
  if (children === null) {
    dom.textContent = "";
  } else if (children.input && children.input.flags > 0) {
    unmount(children, dom, lifecycle, true, isRecycling);
  } else if (isArray(children)) {
    removeAllChildren(dom, children, lifecycle, isRecycling);
  }
  fiber.children = null;
}

export function patchElement(
  fiber: IFiber,
  lastVNode: IVNode,
  nextVNode: IVNode,
  parentDom: Element | null,
  lifecycle: LifecycleClass,
  context: Object,
  isSVG: boolean,
  isRecycling: boolean
) {
  const nextTag = nextVNode.type;
  const lastTag = lastVNode.type;

  if (lastTag !== nextTag) {
    replaceWithNewNode(
      fiber,
      nextVNode,
      parentDom,
      lifecycle,
      context,
      isSVG,
      isRecycling
    );
  } else {
    const dom = fiber.dom as Element;
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
      const childrenIsSVG =
        isSVG === true && nextVNode.type !== "foreignObject";
      patchChildren(
        fiber,
        nextFlags,
        fiber.children as IFiber[],
        nextChildren,
        dom,
        lifecycle,
        context,
        childrenIsSVG,
        isRecycling
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
          // When inferno is recycling form element, we need to process it like it would be mounting
          processElement(
            fiber,
            nextFlags,
            dom,
            nextPropsOrEmpty,
            isRecycling,
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
      if (lastVNode.ref !== nextRef || isRecycling) {
        mountRef(dom as Element, nextRef, lifecycle);
      }
    }
  }
}

function patchChildren(
  fiber: IFiber,
  nextFlags: VNodeFlags,
  lastChildFibers: IFiber[],
  nextChildren,
  dom: Element,
  lifecycle: LifecycleClass,
  context: Object,
  isSVG: boolean,
  isRecycling: boolean
) {
  let patchArray = false;
  let patchKeyed = false;

  if ((nextFlags & VNodeFlags.HasNonKeyedChildren) > 0) {
    patchArray = true;
  } else if (
    (fiber.childFlags & FiberFlags.HasKeyedChildren) > 0 &&
    (nextFlags & VNodeFlags.HasKeyedChildren) > 0
  ) {
    patchKeyed = true;
    patchArray = true;
  } else if (isInvalid(nextChildren)) {
    unmountChildren(fiber, lastChildFibers, dom, lifecycle, isRecycling);
  } else if (lastChildFibers === null) {
    // If there was nothing previously, then just mount
    if (isStringOrNumber(nextChildren)) {
      setTextContent(dom, nextChildren);
    } else {
      (fiber.dom as any).textContent = "";
      if (isArray(nextChildren)) {
        mountArrayChildren(
          fiber,
          nextChildren,
          dom,
          lifecycle,
          context,
          isSVG,
          "",
          false,
          0
        );
      } else {
        fiber.children = new Fiber(nextChildren, "0");
        mount(
          fiber.children as IFiber,
          nextChildren,
          dom,
          lifecycle,
          context,
          isSVG,
          true
        );
      }
    }
  } else if (isStringOrNumber(nextChildren)) {
    if (isStringOrNumber(lastChildFibers)) {
      updateTextContent(dom, nextChildren);
    } else {
      unmountChildren(fiber, lastChildFibers, dom, lifecycle, isRecycling);
      setTextContent(dom, nextChildren);
    }
  } else if (isArray(nextChildren)) {
    if (isArray(lastChildFibers)) {
      patchArray = true;

      if (
        (fiber.childFlags & FiberFlags.HasKeyedChildren) > 0 &&
        isKeyed(nextChildren)
      ) {
        patchKeyed = true;
      }
    } else {
      unmountChildren(fiber, lastChildFibers, dom, lifecycle, isRecycling);
      mountArrayChildren(
        fiber,
        nextChildren,
        dom,
        lifecycle,
        context,
        isSVG,
        "",
        false,
        0
      );
    }
  } else if (isArray(lastChildFibers)) {
    removeAllChildren(dom, lastChildFibers, lifecycle, isRecycling);
    fiber.children = new Fiber(nextChildren, "0");
    mount(
      fiber.children as IFiber,
      nextChildren,
      dom,
      lifecycle,
      context,
      isSVG,
      true
    );
  } else {
    // next is input, last is input
    patch(
      lastChildFibers,
      nextChildren,
      dom,
      lifecycle,
      context,
      isSVG,
      isRecycling
    );
  }
  if (patchArray) {
    // Common optimizations for arrays
    const lastLength =
      fiber.children !== null ? (fiber.children as any[]).length : 0;
    const nextLength = nextChildren.length;

    if (lastLength === 0) {
      if (nextLength > 0) {
        mountArrayChildren(
          fiber,
          nextChildren,
          dom,
          lifecycle,
          context,
          isSVG,
          "",
          false,
          0
        );
      }
      return;
    } else if (nextLength === 0) {
      removeAllChildren(dom, lastChildFibers, lifecycle, isRecycling);
      fiber.children = null; // TODO: Optimize with Fiber flags
      return;
    }

    if (patchKeyed) {
      patchKeyedChildren(
        fiber,
        lastChildFibers,
        nextChildren,
        dom,
        lifecycle,
        context,
        isSVG,
        isRecycling,
        lastLength,
        nextLength
      );
    } else {
      patchNonKeyedChildren(
        lastChildFibers,
        nextChildren,
        dom,
        lifecycle,
        context,
        isSVG,
        isRecycling,
        lastLength
      );
    }
  }
}

const C = options.component;

export function patchComponent(
  fiber,
  lastVNode: IVNode,
  nextVNode: IVNode,
  parentDom: Element,
  lifecycle: LifecycleClass,
  context,
  isSVG: boolean,
  isClass: boolean,
  isRecycling: boolean
) {
  const lastType = lastVNode.type as Function;
  const nextType = nextVNode.type as Function;
  const lastKey = lastVNode.key;
  const nextKey = nextVNode.key;

  if (lastType !== nextType || lastKey !== nextKey) {
    replaceWithNewNode(
      fiber,
      nextVNode,
      parentDom,
      lifecycle,
      context,
      isSVG,
      isRecycling
    );
    return false;
  } else {
    const nextProps = nextVNode.props || EMPTY_OBJ;

    if (isClass) {
      if (
        (C.patch as Function)(
          fiber,
          nextVNode,
          parentDom,
          lifecycle,
          context,
          isSVG,
          isRecycling
        )
      ) {
        // TODO: WHat is this?
        // if (isNull(parentDom)) {
        //   return true;
        // }
        const lastDOM = fiber.dom;
        replaceChild(
          parentDom,
          mountComponent(
            fiber,
            nextVNode,
            parentDom,
            lifecycle,
            context,
            isSVG,
            (nextVNode.flags & VNodeFlags.ComponentClass) > 0,
            false
          ),
          lastDOM
        );
      }
    } else {
      let shouldUpdate = true;
      const lastProps = lastVNode.props;
      const nextHooks = nextVNode.ref as Refs;
      const nextHooksDefined = !isNullOrUndef(nextHooks);
      // const lastInput = lastVNode.children;
      // let nextInput = lastInput;

      // nextVNode.children = lastInput;
      if (lastKey !== nextKey) {
        shouldUpdate = true;
      } else {
        if (
          nextHooksDefined &&
          !isNullOrUndef(nextHooks.onComponentShouldUpdate)
        ) {
          shouldUpdate = nextHooks.onComponentShouldUpdate(
            lastProps,
            nextProps
          );
        }
      }
      if (shouldUpdate !== false) {
        if (
          nextHooksDefined &&
          !isNullOrUndef(nextHooks.onComponentWillUpdate)
        ) {
          nextHooks.onComponentWillUpdate(lastProps, nextProps);
        }
        const nextInput = nextType(nextProps, context);

        // if (isInvalid(componentRootFiber.input)) {
        //
        // }
        // let nextInput;

        if (isArray(nextInput)) {
          if (process.env.NODE_ENV !== "production") {
            throwError(
              "a valid Inferno VNode (or null) must be returned from a component render. You may have returned an array or an invalid object."
            );
          }
          throwError();
        }
        if (!isInvalid(nextInput)) {
          if (nextInput !== NO_OP) {
            if (isInvalid(fiber.children.input)) {
              mount(
                fiber.children,
                nextInput,
                parentDom,
                lifecycle,
                context,
                isSVG,
                true
              );
            } else {
              patch(
                fiber.children,
                nextInput as any,
                parentDom,
                lifecycle,
                context,
                isSVG,
                isRecycling
              );
            }

            // fiber.children.input = nextInput;
            if (
              nextHooksDefined &&
              !isNullOrUndef(nextHooks.onComponentDidUpdate)
            ) {
              nextHooks.onComponentDidUpdate(lastProps, nextProps);
            }
          }
        }
      }
      // if (nextInput.flags & VNodeFlags.Component) {
      // 	nextInput.parentVNode = nextVNode;
      // } else if (lastInput.flags & VNodeFlags.Component) {
      // 	lastInput.parentVNode = nextVNode;
      // }
    }
  }
  return false;
}

export function patchText(fiber: IFiber, text: string | number) {
  (fiber.dom as any).nodeValue = text as string;
}

// TODO: Optimize this.
export function patchNonKeyedChildren(
  childFibers: IFiber[],
  nextChildren,
  dom,
  lifecycle: LifecycleClass,
  context: Object,
  isSVG: boolean,
  isRecycling: boolean,
  lastFibersLength: number
) {
  let fiberX = 0;
  let fiberY = 0;
  let prefix = "";
  let child = null;
  let fiberCnt = 0;
  let fiber;
  let previousX;
  let iteratedChildren = nextChildren;
  let previousChildren;
  let previousPrefix;
  let nextFiber;

  let tmp;
  let len = iteratedChildren.length;
  do {
    while (len > fiberX) {
      child = iteratedChildren[fiberX++];

      if (!isInvalid(child)) {
        if (isStringOrNumber(child) || isVNode(child)) {
          const fiberKey = prefix + fiberX;
          do {
            if (lastFibersLength <= fiberCnt) {
              // Always mount and add to end
              fiber = new Fiber(child, fiberKey);
              mount(fiber, child, dom, lifecycle, context, isSVG, true);
              childFibers.push(fiber);
            } else {
              fiber = childFibers[fiberCnt++];

              if (fiberKey === fiber.i) {
                patch(
                  fiber,
                  child,
                  dom,
                  lifecycle,
                  context,
                  isSVG,
                  isRecycling
                );
              } else if (fiberKey > fiber.i) {
                // this fiber is dead, remove it, and reduce counters
                unmount(fiber, dom, lifecycle, true, isRecycling);
                childFibers.splice(fiberCnt - 1, 1);
                lastFibersLength--;
                fiberCnt--;
              } else {
                fiber = new Fiber(child, fiberKey);
                mount(fiber, child, dom, lifecycle, context, isSVG, true);
                tmp = fiberCnt - 1;
                nextFiber = tmp < lastFibersLength ? childFibers[tmp] : null;

                insertOrAppend(dom, fiber.dom, nextFiber.dom);
                childFibers.splice(tmp, 0, fiber);
                lastFibersLength++;
                // fiberCnt++;
              }
            }
          } while (fiberKey > fiber.i);
        } else {
          // Nested arrays => no recursion, no new arrays
          previousPrefix = prefix;
          prefix += fiberX + ".";
          previousChildren = iteratedChildren;
          iteratedChildren = child;
          fiberY++;
          previousX = fiberX;
          fiberX = 0;
          len = iteratedChildren.length;
        }
      }
    }

    if (fiberY > 0 && len === fiberX) {
      iteratedChildren = previousChildren;
      fiberY--;
      fiberX = previousX;
      prefix = previousPrefix;
      len = iteratedChildren.length;
    }
  } while (fiberY !== 0 || len > fiberX);

  if (fiberCnt < lastFibersLength) {
    const firstIndex = fiberCnt;

    for (; fiberCnt < lastFibersLength; fiberCnt++) {
      unmount(childFibers[fiberCnt], dom, lifecycle, false, isRecycling);
    }

    childFibers.splice(firstIndex, lastFibersLength - firstIndex); // Remove dead Fibers
  }
}

export function patchKeyedChildren(
  parentFiber: IFiber,
  childFibers: IFiber[],
  nextChildren,
  dom,
  lifecycle: LifecycleClass,
  context: Object,
  isSVG: boolean,
  isRecycling: boolean,
  lastFibersLength: number,
  nextChildrenLength: number
) {
  const prevChildrenMap = parentFiber.childrenKeys;
  const referenceFiber = childFibers[0];
  let referenceKey: string | number | null = referenceFiber.i;
  let referenceNode = referenceFiber.dom;
  let patchCount = 0;
  const newChildren: IFiber[] = [];
  const newChildrenKeysMap: Map<string | number, number> = new Map();
  let iteratedFiber;
  let lastFiber;
  let requiresMoving = true;
  let processedFibers = 0;

  for (let newIndex = 0; newIndex < nextChildrenLength; newIndex++) {
    const nextChild = nextChildren[newIndex];
    const nextKey = nextChild.key;
    const oldIndex = prevChildrenMap.get(nextKey);
    if (oldIndex === void 0 || referenceKey === null) {
      iteratedFiber = new Fiber(nextChild, nextKey);
      const newDom = mount(
        iteratedFiber,
        nextChild,
        dom,
        lifecycle,
        context,
        isSVG,
        false
      );
      iteratedFiber.dom = newDom;
      insertOrAppend(dom, newDom, referenceNode);
    } else {
      iteratedFiber = childFibers[oldIndex];

      patch(
        iteratedFiber,
        nextChild,
        dom,
        lifecycle,
        context,
        isSVG,
        isRecycling
      );

      if (referenceKey === nextKey) {
        requiresMoving = false;
        processedFibers++;
        let found = false;
        // Continue iteration from previous position
        if (processedFibers < lastFibersLength) {
          for (; processedFibers < lastFibersLength; processedFibers++) {
            lastFiber = childFibers[processedFibers];

            if (!newChildrenKeysMap.has(lastFiber.i)) {
              referenceKey = lastFiber.i;
              referenceNode = lastFiber.dom;
              found = true;
              break;
            }
          }
        }

        if (!found) {
          referenceKey = null;
          referenceNode = null;
        }
      } else {
        requiresMoving = true;
      }
      if (requiresMoving) {
        dom.insertBefore(iteratedFiber.dom, referenceNode);
      }

      patchCount++;
    }

    newChildrenKeysMap.set(nextKey, newIndex);
    newChildren.push(iteratedFiber);
  }

  for (let i = 0; patchCount < lastFibersLength; i++) {
    const prevFiber = childFibers[i];

    if (!newChildrenKeysMap.has(prevFiber.i)) {
      patchCount++;
      unmount(prevFiber, dom, lifecycle, false, isRecycling);
    }
  }

  // parentFiber.flags = FiberFlags.HasKeyedChildren;
  parentFiber.childrenKeys = newChildrenKeysMap;
  parentFiber.children = newChildren;
}

// TODO: Should compare fibers by key
// export function patchKeyedChildren(a: IFiber[], b: IVNode[], parentDOM, lifecycle: LifecycleClass, context, isSVG: boolean, isRecycling: boolean, aLength: number, bLength: number) {
// 	let aEnd = aLength - 1;
// 	let bEnd = bLength - 1;
// 	let aStart = 0;
// 	let bStart = 0;
// 	let i;
// 	let j;
// 	let aNode;
// 	let bNode;
// 	let nextNode;
// 	let nextPos;
// 	let node;
// 	let aStartNode = a[aStart];
// 	let bStartNode = b[bStart];
// 	let aEndNode = a[aEnd];
// 	let bEndNode = b[bEnd];
//
// 	// Step 1
// 	/* eslint no-constant-condition: 0 */
// 	outer: while (true) {
// 		// Sync nodes with the same key at the beginning.
// 		while (aStartNode.i === bStartNode.key) {
// 			patch(aStartNode, bStartNode, parentDOM, lifecycle, context, isSVG, isRecycling);
// 			aStart++;
// 			bStart++;
// 			if (aStart > aEnd || bStart > bEnd) {
// 				break outer;
// 			}
// 			aStartNode = a[aStart];
// 			bStartNode = b[bStart];
// 		}
//
// 		// Sync nodes with the same key at the end.
// 		while (aEndNode.i === bEndNode.key) {
// 			patch(aEndNode, bEndNode, parentDOM, lifecycle, context, isSVG, isRecycling);
// 			aEnd--;
// 			bEnd--;
// 			if (aStart > aEnd || bStart > bEnd) {
// 				break outer;
// 			}
// 			aEndNode = a[aEnd];
// 			bEndNode = b[bEnd];
// 		}
//
// 		// Move and sync nodes from right to left.
// 		if (aEndNode.i === bStartNode.key) {
// 			patch(aEndNode, bStartNode, parentDOM, lifecycle, context, isSVG, isRecycling);
// 			insertOrAppend(parentDOM, aEndNode.dom, aStartNode.dom);
// 			aEnd--;
// 			bStart++;
// 			aEndNode = a[aEnd];
// 			bStartNode = b[bStart];
// 			continue;
// 		}
//
// 		// Move and sync nodes from left to right.
// 		if (aStartNode.i === bEndNode.key) {
// 			patch(aStartNode, bEndNode, parentDOM, lifecycle, context, isSVG, isRecycling);
// 			nextPos = bEnd + 1;
// 			nextNode = nextPos < bLength ? b[nextPos].dom : null;
// 			insertOrAppend(parentDOM, aStartNode.dom, nextNode);
// 			aStart++;
// 			bEnd--;
// 			aStartNode = a[aStart];
// 			bEndNode = b[bEnd];
// 			continue;
// 		}
// 		break;
// 	}
//
// 	if (aStart > aEnd) {
// 		if (bStart <= bEnd) {
// 			nextPos = bEnd + 1;
// 			nextNode = nextPos < bLength ? b[nextPos].dom : null;
// 			while (bStart <= bEnd) {
// 				node = b[bStart];
// 				bStart++;
// 				insertOrAppend(parentDOM, mount(node, null, lifecycle, context, isSVG), nextNode);
// 			}
// 		}
// 	} else if (bStart > bEnd) {
// 		while (aStart <= aEnd) {
// 			unmount(a[aStart++], parentDOM, lifecycle, false, isRecycling);
// 		}
// 	} else {
// 		aLength = aEnd - aStart + 1;
// 		bLength = bEnd - bStart + 1;
// 		const sources = new Array(bLength);
//
// 		// Mark all nodes as inserted.
// 		for (i = 0; i < bLength; i++) {
// 			sources[i] = -1;
// 		}
// 		let moved = false;
// 		let pos = 0;
// 		let patched = 0;
//
// 		// When sizes are small, just loop them through
// 		if ((bLength <= 4) || (aLength * bLength <= 16)) {
// 			for (i = aStart; i <= aEnd; i++) {
// 				aNode = a[i];
// 				if (patched < bLength) {
// 					for (j = bStart; j <= bEnd; j++) {
// 						bNode = b[j];
// 						if (aNode.key === bNode.key) {
// 							sources[j - bStart] = i;
//
// 							if (pos > j) {
// 								moved = true;
// 							} else {
// 								pos = j;
// 							}
// 							patch(aNode, bNode, parentDOM, lifecycle, context, isSVG, isRecycling);
// 							patched++;
// 							a[i] = null as any;
// 							break;
// 						}
// 					}
// 				}
// 			}
// 		} else {
// 			const keyIndex = new Map();
//
// 			// Map keys by their index in array
// 			for (i = bStart; i <= bEnd; i++) {
// 				keyIndex.set(b[i].key, i);
// 			}
//
// 			// Try to patch same keys
// 			for (i = aStart; i <= aEnd; i++) {
// 				aNode = a[i];
//
// 				if (patched < bLength) {
// 					j = keyIndex.get(aNode.key);
//
// 					if (j !== void 0) {
// 						bNode = b[j];
// 						sources[j - bStart] = i;
// 						if (pos > j) {
// 							moved = true;
// 						} else {
// 							pos = j;
// 						}
// 						patch(aNode, bNode, parentDOM, lifecycle, context, isSVG, isRecycling);
// 						patched++;
// 						a[i] = null as any;
// 					}
// 				}
// 			}
// 		}
// 		// fast-path: if nothing patched remove all old and add all new
// 		if (aLength === a.length && patched === 0) {
// 			removeAllChildren(parentDOM, a, lifecycle, isRecycling);
// 			while (bStart < bLength) {
// 				node = b[bStart];
// 				bStart++;
// 				insertOrAppend(parentDOM, mount(node, null, lifecycle, context, isSVG), null);
// 			}
// 		} else {
// 			i = aLength - patched;
// 			while (i > 0) {
// 				aNode = a[aStart++];
// 				if (!isNull(aNode)) {
// 					unmount(aNode, parentDOM, lifecycle, true, isRecycling);
// 					i--;
// 				}
// 			}
// 			if (moved) {
// 				const seq = lis_algorithm(sources);
// 				j = seq.length - 1;
// 				for (i = bLength - 1; i >= 0; i--) {
// 					if (sources[i] === -1) {
// 						pos = i + bStart;
// 						node = b[pos];
// 						nextPos = pos + 1;
// 						nextNode = nextPos < bLength ? b[nextPos].dom : null;
// 						insertOrAppend(parentDOM, mount(node, parentDOM, lifecycle, context, isSVG), nextNode);
// 					} else {
// 						if (j < 0 || i !== seq[j]) {
// 							pos = i + bStart;
// 							node = b[pos];
// 							nextPos = pos + 1;
// 							nextNode = nextPos < bLength ? b[nextPos].dom : null;
// 							insertOrAppend(parentDOM, node.dom, nextNode);
// 						} else {
// 							j--;
// 						}
// 					}
// 				}
// 			} else if (patched !== bLength) {
// 				// when patched count doesn't match b length we need to insert those new ones
// 				// loop backwards so we can use insertBefore
// 				for (i = bLength - 1; i >= 0; i--) {
// 					if (sources[i] === -1) {
// 						pos = i + bStart;
// 						node = b[pos];
// 						nextPos = pos + 1;
// 						nextNode = nextPos < bLength ? b[nextPos].dom : null;
// 						insertOrAppend(parentDOM, mount(node, null, lifecycle, context, isSVG), nextNode);
// 					}
// 				}
// 			}
// 		}
// 	}
// }
//
// // // // https://en.wikipedia.org/wiki/Longest_increasing_subsequence
// function lis_algorithm(arr: number[]): number[] {
// 	const p = arr.slice(0);
// 	const result: number[] = [0];
// 	let i;
// 	let j;
// 	let u;
// 	let v;
// 	let c;
// 	const len = arr.length;
//
// 	for (i = 0; i < len; i++) {
// 		const arrI = arr[i];
//
// 		if (arrI === -1) {
// 			continue;
// 		}
//
// 		j = result[result.length - 1];
// 		if (arr[j] < arrI) {
// 			p[i] = j;
// 			result.push(i);
// 			continue;
// 		}
//
// 		u = 0;
// 		v = result.length - 1;
//
// 		while (u < v) {
// 			c = ((u + v) / 2) | 0;
// 			if (arr[result[c]] < arrI) {
// 				u = c + 1;
// 			} else {
// 				v = c;
// 			}
// 		}
//
// 		if (arrI < arr[result[u]]) {
// 			if (u > 0) {
// 				p[i] = result[u - 1];
// 			}
// 			result[u] = i;
// 		}
// 	}
//
// 	u = result.length;
// 	v = result[u - 1];
//
// 	while (u-- > 0) {
// 		result[u] = v;
// 		v = p[v];
// 	}
//
// 	return result;
// }

export function isAttrAnEvent(attr: string): boolean {
  return attr[0] === "o" && attr[1] === "n";
}

export function patchProp(
  prop,
  lastValue,
  nextValue,
  dom: Element,
  isSVG: boolean,
  hasControlledValue: boolean
) {
  if (lastValue !== nextValue) {
    if (skipProps.has(prop) || (hasControlledValue && prop === "value")) {
      return;
    } else if (booleanProps.has(prop)) {
      prop = prop === "autoFocus" ? prop.toLowerCase() : prop;
      dom[prop] = !!nextValue;
    } else if (strictProps.has(prop)) {
      const value = isNullOrUndef(nextValue) ? "" : nextValue;

      if (dom[prop] !== value) {
        dom[prop] = value;
      }
    } else if (isAttrAnEvent(prop)) {
      patchEvent(prop, lastValue, nextValue, dom);
    } else if (isNullOrUndef(nextValue)) {
      dom.removeAttribute(prop);
    } else if (prop === "style") {
      patchStyle(lastValue, nextValue, dom);
    } else if (prop === "dangerouslySetInnerHTML") {
      const lastHtml = lastValue && lastValue.__html;
      const nextHtml = nextValue && nextValue.__html;

      if (lastHtml !== nextHtml) {
        if (!isNullOrUndef(nextHtml)) {
          dom.innerHTML = nextHtml;
        }
      }
    } else {
      // We optimize for NS being boolean. Its 99.9% time false
      if (isSVG && namespaces.has(prop)) {
        // If we end up in this path we can read property again
        dom.setAttributeNS(namespaces.get(prop) as string, prop, nextValue);
      } else {
        dom.setAttribute(prop, nextValue);
      }
    }
  }
}

export function patchEvent(name: string, lastValue, nextValue, dom) {
  if (lastValue !== nextValue) {
    if (delegatedEvents.has(name)) {
      handleEvent(name, lastValue, nextValue, dom);
    } else {
      const nameLowerCase = name.toLowerCase();
      const domEvent = dom[nameLowerCase];
      // if the function is wrapped, that means it's been controlled by a wrapper
      if (domEvent && domEvent.wrapped) {
        return;
      }
      if (!isFunction(nextValue) && !isNullOrUndef(nextValue)) {
        const linkEvent = nextValue.event;

        if (linkEvent && isFunction(linkEvent)) {
          dom[nameLowerCase] = function(e) {
            G.INFRender = true;
            linkEvent(nextValue.data, e);
            if (isFunction(C.flush)) {
              C.flush();
            }
            G.INFRender = false;
          };
        } else {
          if (process.env.NODE_ENV !== "production") {
            throwError(
              `an event on a VNode "${name}". was not a function or a valid linkEvent.`
            );
          }
          throwError();
        }
      } else {
        dom[nameLowerCase] = function(event) {
          G.INFRender = true;
          nextValue(event);
          if (isFunction(C.flush)) {
            C.flush();
          }
          G.INFRender = false;
        };
      }
    }
  }
}

// We are assuming here that we come from patchProp routine
// -nextAttrValue cannot be null or undefined
function patchStyle(lastAttrValue, nextAttrValue, dom) {
  const domStyle = dom.style;
  let style;
  let value;

  if (isString(nextAttrValue)) {
    domStyle.cssText = nextAttrValue;
    return;
  }

  if (!isNullOrUndef(lastAttrValue) && !isString(lastAttrValue)) {
    for (style in nextAttrValue) {
      // do not add a hasOwnProperty check here, it affects performance
      value = nextAttrValue[style];
      if (value !== lastAttrValue[style]) {
        domStyle[style] =
          !isNumber(value) || isUnitlessNumber.has(style)
            ? value
            : value + "px";
      }
    }

    for (style in lastAttrValue) {
      if (isNullOrUndef(nextAttrValue[style])) {
        domStyle[style] = "";
      }
    }
  } else {
    for (style in nextAttrValue) {
      value = nextAttrValue[style];
      domStyle[style] =
        !isNumber(value) || isUnitlessNumber.has(style) ? value : value + "px";
    }
  }
}

function removeProp(prop: string, lastValue, dom, nextFlags: number) {
  if (prop === "value") {
    // When removing value of select element, it needs to be set to null instead empty string, because empty string is valid value for option which makes that option selected
    // MS IE/Edge don't follow html spec for textArea and input elements and we need to set empty string to value in those cases to avoid "null" and "undefined" texts
    dom.value = nextFlags & VNodeFlags.SelectElement ? null : "";
  } else if (prop === "style") {
    dom.removeAttribute("style");
  } else if (isAttrAnEvent(prop)) {
    handleEvent(prop, lastValue, null, dom);
  } else {
    dom.removeAttribute(prop);
  }
}
