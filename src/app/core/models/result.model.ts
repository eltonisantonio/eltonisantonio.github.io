// results[period][groupKey][indicatorId] = value
// period:   'YYYY-MM'
// groupKey: 'SECTOR||SHIFT' or 'SECTOR||SHIFT||ROLE'
// indicatorId: stored as string key in JSON (coerce to number when needed)
export type Results = Record<string, Record<string, Record<string, number>>>;
