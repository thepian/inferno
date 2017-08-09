import { isNull, isUndefined } from "inferno-shared";
import { IVNode } from "../core/vnode";

export class Pools {
  public nonKeyed: IVNode[] = [];
  public keyed: Map<string | number, IVNode[]> = new Map();
}

export const componentPools = new Map<Function | null, Pools>();
export const elementPools = new Map<string | null, Pools>();

// function recycle(tagPools: Map<any, Pools>, vNode): IVNode|undefined {
// 	const pools = tagPools.get(vNode.type);
//
// 	if (!isUndefined(pools)) {
// 		const key = vNode.key;
// 		const pool = key === null ? pools.nonKeyed : pools.keyed.get(key);
//
// 		if (!isUndefined(pool)) {
// 			return pool.pop();
// 		}
// 	}
// 	return void 0;
// }

export function recycleElement(
  vNode: IVNode,
  lifecycle,
  context: Object,
  isSVG: boolean
) {
  // const recycledVNode = recycle(elementPools, vNode);
  // if (recycledVNode !== void 0) {
  // 	patchElement(recycledVNode, vNode, null, lifecycle, context, isSVG, true);
  // 	return vNode.dom;
  // }

  return null;
}

export function recycleComponent(
  vNode: IVNode,
  lifecycle,
  context: Object,
  isSVG: boolean
) {
  // const recycledVNode = recycle(componentPools, vNode);
  // if (recycledVNode !== void 0) {
  // 	const flags = vNode.flags;
  // 	const failed = patchComponent(
  // 		recycledVNode,
  // 		vNode,
  // 		null,
  // 		lifecycle,
  // 		context,
  // 		isSVG,
  // 		(flags & VNodeFlags.ComponentClass) > 0,
  // 		true
  // 	);
  //
  // 	if (!failed) {
  // 		return vNode.dom;
  // 	}
  // }
  //
  return null;
}

export function pool(vNode: IVNode, tagPools: Map<any, Pools>) {
  const tag = vNode.type;
  const key = vNode.key;
  let pools = tagPools.get(tag);

  if (isUndefined(pools)) {
    pools = new Pools();
    tagPools.set(tag, pools);
  }
  if (isNull(key)) {
    pools.nonKeyed.push(vNode);
  } else {
    let keyedPool = pools.keyed.get(key);

    if (isUndefined(keyedPool)) {
      keyedPool = [];
      pools.keyed.set(key, keyedPool);
    }
    keyedPool.push(vNode);
  }
}
