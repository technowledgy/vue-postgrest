// split strings of the format key1=value1,key2=value2,... into object
function splitToObject (str, fieldDelimiter = ',', kvDelimiter = '=') {
  return str.split(fieldDelimiter).reduce((acc, field) => {
    const parts = field.split(kvDelimiter)
    acc[parts[0].trim()] = parts[1] ? parts[1].replace(/^["\s]+|["\s]+$/g, '') : undefined
    return acc
  }, {})
}

export { splitToObject }
