export type Plugin = (target: HTMLElement, destination: HTMLElement, ctx: Context) => Promise<void>

export interface Transition {
  target: HTMLElement
  method: Plugin
}

export type Transitions<T extends Transition = Transition> = Map<string, T>

export type CreateTransition = (element: HTMLElement) => Transition | undefined

export interface Context<T extends Transition = Transition> {
  container: HTMLElement
  transitions: Transitions<T>
  enqueueTransition: (key: string, element: HTMLElement) => void
  dequeueTransitions: () => void
  runTransitions: (destinations: Map<string, HTMLElement>) => Promise<void>
}

export const createFramework = (
  options: {
    transitionContainer: HTMLElement
    createTransition: CreateTransition
  },
): Context => {
  return {
    container: options.transitionContainer,
    transitions: new Map(),
    dequeueTransitions() {
      this.transitions = new Map()
    },
    enqueueTransition(key: string, element: HTMLElement) {
      const transition = options.createTransition(element)
      if (transition)
        this.transitions.set(key, transition)
    },
    async runTransitions(destinations: Map<string, HTMLElement>) {
      type Sequence = () => Promise<void>
      const sequences: Sequence[] = []

      destinations.forEach((destination, key) => {
        const transition = this.transitions.get(key)
        if (!transition)
          return

        sequences.push(async () => {
          await transition.method(transition.target, destination, this)
        })
      })

      // Dequeue trnasitions after we set everything up to run them
      this.dequeueTransitions()

      await Promise.all(sequences.map(sequence => sequence()))
    },
  }
}
