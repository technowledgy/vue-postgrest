# vue-postgrest
Vue.js Component providing PostgREST integration

## Installation

### With module loader

`npm install vue-postgrest`

or

`yarn add vue-postgrest`

in main.js:
```
import VuePostgrest from 'vue-postgrest'

Vue.use(VuePostgrest, pluginOptions)
```

available pluginOptions are:

|option |default |type  |description |
|-------|--------|------|------------|
|apiRoot|''      |String|api base URI|

### With script tag
Include `<script src="https://unpkg.com/vue-postgrest"></script>`
