import React from 'react'
import classNames from 'classnames'

import containerStyles from './container.module.css'

export default function Container({
  children,
  className,
  ...elementProps
}: { children: React.ReactNode } & JSX.IntrinsicElements['section']) {
  return (
    <section className={classNames(containerStyles.container, className)} {...elementProps}>
      {children}
    </section>
  )
}
