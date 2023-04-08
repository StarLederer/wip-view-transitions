import type { AnimationOptionsWithOverrides, Easing, MotionKeyframesDefinition } from 'motion'
import { animate } from 'motion'

import type { Context, CreateTransition, Plugin } from '..'
import { createFramework } from '..'

const createPlaceholder = (original: HTMLElement) => {
  const style = window.getComputedStyle(original)
  const placeholder = document.createElement('div')
  placeholder.style.width = `${original.offsetWidth}px`
  placeholder.style.height = `${original.offsetHeight}px`
  placeholder.style.margin = style.margin
  return placeholder
}

export const createFrameworkWithShapeshift = (
  transitionContainer: HTMLElement,
  duration: number,
  easing: Easing,
): Context => {
  const method: Plugin = async (from, to, ctx) => {
    // Capture rects

    const { x: x1, y: y1, width: w1, height: h1 } = from.getBoundingClientRect()
    const { x: x2, y: y2, width: w2, height: h2 } = to.getBoundingClientRect()

    // Pop elements out

    const placeholder1 = createPlaceholder(from)
    const placeholder2 = createPlaceholder(to)

    from.after(placeholder1)
    to.after(placeholder2)

    from.style.position = 'fixed'
    to.style.position = 'fixed'
    ctx.container.append(from)
    ctx.container.append(to)

    // Animate

    const keyframes: MotionKeyframesDefinition = {
      left: [`${x1}px`, `${x2}px`],
      top: [`${y1}px`, `${y2}px`],
      width: [`${w1}px`, `${w2}px`],
      height: [`${h1}px`, `${h2}px`],
    }

    const options: AnimationOptionsWithOverrides = {
      duration,
      easing,
    }

    const optionsLin: AnimationOptionsWithOverrides = {
      ...options,
      easing: [0.5, 1.5, 0.25, 1],
    }

    await Promise.all([
      animate([from, to], {
        ...keyframes,
      }, options).finished,
      animate(from, {
        opacity: [1, 0],
      }, optionsLin).finished,
      animate(to, {
        opacity: [0, 1],
      }, optionsLin).finished,
    ])

    placeholder2.after(to)
    placeholder2.remove()
    to.style.removeProperty('position')
    to.style.removeProperty('top')
    to.style.removeProperty('left')
    to.style.removeProperty('width')
    to.style.removeProperty('height')
    from.remove()
  }

  const createTransition: CreateTransition = (element) => {
    const { x, y, width, height } = element.getBoundingClientRect()

    // Only create transitions for things visible on the screen.
    // Complex transitions look chaotic otherwise.
    if (
      x + width <= 0
      || y + height <= 0
      || x >= window.innerWidth
      || y >= window.innerHeight
    )
      return

    // No additional preparations required.
    // Originally we set up a clone of the target here.

    return {
      target: element,
      method,
    }
  }

  return createFramework({
    transitionContainer,
    createTransition,
  })
}
