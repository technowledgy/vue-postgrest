import Vue from 'vue'
import isObject from './isObject'

function sync (o1, o2) {
  for (let k1 in o1) {
    if (o2[k1] === undefined) {
      Vue.delete(o1, k1)
    }
  }
  for (let k2 in o2) {
    if (isObject(o2[k2]) && isObject(o1[k2])) {
      sync(o1[k2], o2[k2])
    } else {
      Vue.set(o1, k2, o2[k2])
    }
  }
}

export default sync
