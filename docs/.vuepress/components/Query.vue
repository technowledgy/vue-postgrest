<template>
  <div>
    <div class="slot-wrapper" ref="wrap">
      <slot/>
    </div>
    <div class="language-none output-wrapper">
      <pre class="language-none">
        <code>
          <span>{{ query }}</span>
        </code>
      </pre>
    </div>
  </div>
</template>

<script>
import Query from '../../../src/Query'

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
        const q = Function(`"use strict";${this.code};return query`)()
        return decodeURIComponent(new Query('/', '', q).search)
      }
    }
  },
  mounted () {
    this.code = this.$refs.wrap.innerText
  }
}
</script>

<style scoped>
.output-wrapper::before {
  content: 'output';
}

.output-wrapper {
  border-radius: 0 0 6px 6px;
}

.output-wrapper > pre {
  white-space: normal;
  margin-top: 1px !important;
}

.slot-wrapper > div {
  border-radius: 6px 6px 0 0;
}

.slot-wrapper > div > pre {
  margin-bottom: 0 !important;
}
</style>