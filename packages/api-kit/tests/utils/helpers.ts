export const itif = (condition: boolean) => (condition ? it : it.skip)
export const describeif = (condition: boolean) => (condition ? describe : describe.skip)
