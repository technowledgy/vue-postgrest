function mapAliasesFromSelect (select = [], data) {
  const kvPairs =
    Array.isArray(select)
      ? select.map(k => [k, true])
      : typeof select === 'string'
        ? select.split(',').map(k => [k, true])
        : Object.entries(select)
  const alias2column = new Map(kvPairs
    .map(([k, v]) => {
      if (!v) return false
      const [alias, column] = k.split(':')
      return [alias, column ?? alias]
    })
    .filter(Boolean)
  )
  return Object.fromEntries(Object.entries(data).map(([alias, value]) => [alias2column.get(alias) ?? alias, value]))
}

export { mapAliasesFromSelect }
