<template>
  <postgrest
    ref="pg"
    api-root="/api/"
    route="clients"
    :query="{}"
    :create="{}">
      <template v-slot:default="{ get, items, range, newItem }">
        <div v-if="!get.isPending">
          <div
            v-for="item of items"
            :key="item.id">
            {{ item.data }}
          </div>
        </div>
      </template>
  </postgrest>
</template>

<script>
export default {
  name: 'Example',
  mounted () {
    console.log(this.$refs.pg)
  }
}
</script>
