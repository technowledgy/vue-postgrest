import Schema from '@/Schema'

function usePostgrest (...args) {
  return new Schema(...args)
}

export default usePostgrest
