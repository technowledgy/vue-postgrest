<template>
  <postgrest
    route="clients"
    :query="{}"
    :create="{}">
      <template v-slot:default="{ get, items, newItem }">
      </template>
  </postgrest>
</template>

<script>
export default {
  name: 'Demo'
}
</script>
