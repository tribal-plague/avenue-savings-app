import useStore from '../store/useStore'
import { fmt, fmtDec } from '../utils/formatters'

export function useCurrency() {
  const currentUserId = useStore((s) => s.currentUserId)
  const users = useStore((s) => s.users)
  const symbol = users[currentUserId]?.currencySymbol || '$'

  return {
    symbol,
    fmt: (amount) => fmt(amount, symbol),
    fmtDec: (amount) => fmtDec(amount, symbol),
  }
}
