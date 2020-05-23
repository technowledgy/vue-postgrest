<template>
  <a :href="href" target="_blank">
    PostgREST docs
    <outbound-link/>
  </a>
</template>

<script>
export default {
  props: {
    href: String
  }
}
</script>

<style scoped>
a {
  float: right;
  font-size: 0.5em;
  padding-top: 1em;
}
</style>