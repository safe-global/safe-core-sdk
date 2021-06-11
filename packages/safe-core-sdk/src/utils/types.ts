type Json = string | number | boolean | null | JsonObject | Json[]

type JsonObject = { [property: string]: Json }

export type Abi = JsonObject[]
