export interface Toppings {
  peppers: boolean
  pineapple: boolean
  bbqSauce: boolean
  cheeseType: string
}

export async function orderPizza (toppings: Toppings): Promise<{ message: string}> {
  let message = 'you ordered a pizza with:\n'
  if (toppings.peppers) message += '  - peppers\n'
  if (toppings.pineapple) message += '  - pineapple\n'
  if (toppings.bbqSauce) message += '  - bbq\n'
  message += `  - ${toppings.cheeseType} cheese`
  return {
    message
  }
}
