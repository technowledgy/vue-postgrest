export default function (obj) {
  const type = typeof obj
  return (type === 'object' && !!obj)
}