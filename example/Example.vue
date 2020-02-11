<template>
  <postgrest
    route="clients"
    :query="{}"
    :create="{}">
      <template v-slot:default="{ get, items, pagination, newItem }">
      </template>
  </postgrest>
</template>

<script>
export default {
  name: 'Example'
}
</script>
