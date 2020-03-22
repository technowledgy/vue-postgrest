// only supports strings as field values
// field delimiter: ","
// key/value delimiter: "="
export default function (str) {
  const obj = {}
  const arr = str.split(',')
  for (const field of arr) {
    const fieldArr = field.split('=')
    obj[fieldArr[0].trim()] = fieldArr[1].replace(/"/g, '')
  }
  return obj
}
