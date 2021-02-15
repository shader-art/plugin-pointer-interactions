# `<shader-art>` PointerInteractionsPlugin

## Installation

Install via NPM:

```sh
npm i shader-art @shader-art/plugin-pointer-interactions
```

Or use directly via skypack:

```js
import { PointerInteractionsPlugin } from 'https://cdn.skypack.dev/@shader-art/plugin-pointer-interactions';
```

## Usage

```js
ShaderArt.register([() => new PointerInteractionsPlugin()]);
```

Inside your glsl shader code (which is placed inside a `<script type="vert|frag">` tag), you can access one pointer (currently this is single-touch) via
uniform variables:

```
uniform vec2 pointerStart;
uniform vec2 pointer;
uniform int dragging;
```
