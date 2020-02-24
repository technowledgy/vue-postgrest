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
            {{ item.data.id }}
            <input
              v-model="item.data.name"
              @change="item.patch.call()"
              type="text">
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
