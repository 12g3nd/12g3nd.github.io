// Lets TypeScript import compiled .mdx files as React components. Each post's
// default export accepts an optional `components` prop (used to override how
// markdown elements like links render). The actual compilation is done by
// @mdx-js/rollup at bundle time; tsc only needs this shape.
declare module '*.mdx' {
  import type { FC } from 'react'
  import type { MDXProps } from 'mdx/types'
  const MDXComponent: FC<MDXProps>
  export default MDXComponent
}
