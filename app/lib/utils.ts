export function formatDateToBR(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date)
}

export function getStartAndEndOfDayInMillis(dateString: string) {
  // dateString no formato YYYY-MM-DD
  const [year, month, day] = dateString.split("-").map(Number)

  const start = new Date(year, month - 1, day, 0, 0, 0, 0).getTime()
  const end = new Date(year, month - 1, day, 23, 59, 59, 999).getTime()

  return { start, end }
}

export function getTodayDateInputValue() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}