function cloneDeep (source) {
  if (Array.isArray(source)) {
    return source.map(cloneDeep)
  } else if (typeof source === 'object' && source) {
    return Object.entries(source).reduce((acc, [k, v]) => {
      acc[k] = cloneDeep(v)
      return acc
    }, {})
  } else {
    return source
  }
}

// split strings of the format key1=value1,key2=value2,... into object
export default function splitToObject (str, fieldDelimiter = ',', kvDelimiter = '=') {
  return str.split(fieldDelimiter).reduce((acc, field) => {
    const parts = field.split(kvDelimiter)
    acc[parts[0].trim()] = parts[1] ? parts[1].replace(/^["\s]+|["\s]+$/g, '') : undefined
    return acc
  }, {})
}

export {
  cloneDeep,
  splitToObject
}
