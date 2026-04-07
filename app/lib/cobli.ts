import type { CobliApiResponse, CobliRouteRaw, RouteItem, NormalizedRoute } from "../types/route"

function formatTime(value?: number | null) {
  if (!value) return "--:--"

  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value))
}

export function normalizeCobliRoutes(apiResponse: any): NormalizedRoute[] {
  return (apiResponse.content ?? []).map((route: any) => {
    const activities = route.activities ?? []

    const firstActivity = activities.find((a: any) => a.type === "START")
    const lastActivity = [...activities].reverse().find((a: any) => a.type === "END")
    const firstDriver =
      activities.find((a: any) => a.driver_name && a.driver_name.trim())?.driver_name ?? ""

    return {
      id: route.id,
      name: route.name ?? "Rota sem nome",
      status: route.status ?? "Sem status",
      startTimeLabel: formatTime(firstActivity?.start_time),
      endTimeLabel: formatTime(lastActivity?.end_time),
      driverName: firstDriver,
      activities: activities.map((activity: any) => ({
        id: activity.id,
        type: activity.type,
        status: activity.status,
        visit_status: activity.visit_status,
        completion_status: activity.completion_status,
        position: activity.position,
        name: activity.name,
        phone_number: activity.phone_number,
        additional_info: activity.additional_info,
        time_windows: activity.time_windows,
        start_time: activity.start_time,
        end_time: activity.end_time,
        arrival_time: activity.arrival_time,
        executed_end_time: activity.executed_end_time,
        driver_name: activity.driver_name,
        destination: activity.destination
          ? {
              city: activity.destination.city,
              state: activity.destination.state,
              neighborhood: activity.destination.neighborhood,
              street_address: activity.destination.street_address,
              street_number: activity.destination.street_number,
              postal_code: activity.destination.postal_code,
              country: activity.destination.country,
            }
          : null,
      })),
      points: route.points ?? [],
    }
  })
}