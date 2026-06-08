export const DEFAULT_TABLE_PAGE_SIZE = 25

export const TABLE_PAGE_SIZE_OPTIONS = [25, 50, 100, 500] as const

export type TablePageSize = (typeof TABLE_PAGE_SIZE_OPTIONS)[number]

export function isTablePageSize(value: number): value is TablePageSize {
  return (TABLE_PAGE_SIZE_OPTIONS as readonly number[]).includes(value)
}
