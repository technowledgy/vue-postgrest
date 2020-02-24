<template>
  <postgrest
    ref="pg"
    api-root="/api/"
    route="clients"
    :query="{}"
    :create="{}">
      <template v-slot:default="{ get, items, range, newItem, resetNewItem }">
        <div v-if="!get.isPending">
          ITEMS
          <div
            v-for="item of items"
            :key="item.id">
            {{ item.data.id }}
            <input
              v-model="item.data.name"
              @change="item.patch.call()"
              type="text">
          </div>
          NEW ITEM
          <div>
            <input
              type="number"
              v-model="newItem.data.id"/>
            <input
              type="text"
              v-model="newItem.data.name"/>
            <button @click="resetNewItem">
              Reset new item.
            </button>
            <button @click="newItem.post.call">Post new item.</button>
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
