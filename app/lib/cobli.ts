import type { CobliApiResponse, NormalizedRoute } from "../types/route"

function formatTime(value?: number | null) {
  if (!value) return "--:--"

  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value))
}

function formatRouteDate(value?: number | null) {
  if (!value) return ""

  const date = new Date(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

const activityTypeMap: Record<string, string> = {
  START: "Início",
  STOP: "Parada",
  END: "Fim",
}

const statusMap: Record<string, string> = {
  COMPLETED: "Concluído",
  PENDING: "Pendente",
  ON_SITE: "No local",
  EXECUTED: "Executada",
  IN_PROGRESS: "Em andamento",
  CANCELED: "Cancelada",
  CANCELLED: "Cancelada",
  PLANNED: "Planejada",
}

const visitStatusMap: Record<string, string> = {
  VISITED: "Visitado",
  PENDING: "Pendente",
  ON_SITE: "No local",
  NOT_VISITED: "Não visitado",
  SKIPPED: "Ignorado",
}

const completionStatusMap: Record<string, string> = {
  COMPLETED: "Concluído",
  PENDING: "Pendente",
  CANCELED: "Cancelado",
  CANCELLED: "Cancelado",
  FAILED: "Falhou",
}

function translate(
  value?: string | null,
  map?: Record<string, string>,
  fallback = ""
): string {
  if (!value) return fallback
  if (!map) return value
  return map[value] ?? value
}

export function normalizeCobliRoutes(
  apiResponse: CobliApiResponse
): NormalizedRoute[] {
  return (apiResponse.content ?? []).map((route) => {
    const activities = route.activities ?? []

    const firstActivity = activities.find((a) => a.type === "START")
    const lastActivity = [...activities].reverse().find((a) => a.type === "END")

    const firstDriver =
      activities.find((a) => a.driver_name && a.driver_name.trim())?.driver_name ??
      route.driver_name ??
      ""

    return {
      id: route.id ?? "",
      name: route.name ?? "Rota sem nome",
      status: translate(route.status, statusMap, "Sem status"),
      startTimeLabel: formatTime(firstActivity?.start_time ?? route.start_time),
      endTimeLabel: formatTime(lastActivity?.end_time ?? route.end_time),
      driverName: firstDriver,
      routeDate: formatRouteDate(route.start_time),
      activities: activities.map((activity) => ({
        id: activity.id ?? "",
        type: translate(activity.type, activityTypeMap, "Não informado"),
        status: translate(activity.status, statusMap, "Sem status"),
        visit_status: translate(activity.visit_status, visitStatusMap, ""),
        completion_status: translate(
          activity.completion_status,
          completionStatusMap,
          ""
        ),
        position: activity.position ?? 0,
        name: activity.name ?? null,
        phone_number: activity.phone_number ?? null,
        additional_info: activity.additional_info ?? null,
        time_windows: activity.time_windows ?? null,
        start_time: activity.start_time ?? null,
        end_time: activity.end_time ?? null,
        arrival_time: activity.arrival_time ?? null,
        executed_end_time: activity.executed_end_time ?? null,
        driver_name: activity.driver_name ?? null,
        destination: activity.destination ?? null,
      })),
      points: route.points ?? [],
    }
  })
}