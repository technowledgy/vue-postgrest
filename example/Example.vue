<template>
  <postgrest
    api-root="api/"
    route="users"
    :query="{}"
    :create="{}">
      <template v-slot:default="{ get, items, range, newItem }">
      </template>
  </postgrest>
</template>

<script>
export default {
  name: 'Example'
}
</script>
