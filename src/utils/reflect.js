function reflectHelper (keys, ret, target, property, ...args) {
  if (keys.includes(property)) return ret
  return Reflect[this](target, property, ...args)
}

export { reflectHelper }
