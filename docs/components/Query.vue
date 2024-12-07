<template>
  <div class="wrapper" ref="wrapper">
    <slot class="slot" />
    <div class="language-none">
      <span class="lang">url</span>
      <pre><code><span class="line">{{ query }}</span></code></pre>
    </div>
  </div>
</template>

<script>
import Query from '../../src/Query'

export default {
  props: {
    content: String
  },
  data () {
    return {
      code: undefined
    }
  },
  computed: {
    query () {
      if (this.code) {
        const q = Function(`"use strict";let ${this.code};return query`)()
        return decodeURIComponent(new Query('/', '', q).search)
      }
    }
  },
  mounted () {
    this.code = this.$refs.wrapper.children[0].innerText
  }
}
</script>

<style scoped>
.wrapper > :first-child {
  margin-bottom: 0 !important;
  border-radius: 6px 6px 0 0;
}

.wrapper > :last-child {
  margin-top: 0 !important;
  border-radius: 0 0 6px 6px;
  border-top: solid 1px var(--vp-code-block-color);
}
</style>
