import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { headers } from "next/headers"
import { normalizeCobliRoutes } from "@/app/lib/cobli"
import { CobliActivity } from "@/app/types/route"

type RouteActivity = {
  id: string
  type: string
  status: string
  visit_status: string | null
  completion_status: string | null
  position: number
  name: string | null
  phone_number: string | null
  additional_info: string | null
  time_windows: { earliest: number; latest: number }[] | null
  start_time: number | null
  end_time: number | null
  arrival_time: number | null
  executed_end_time: number | null
  driver_name: string | null
  destination: {
    city?: string
    state?: string
    neighborhood?: string | null
    street_address?: string
    street_number?: string
    postal_code?: string
    country?: string
  } | null
}

type RouteItem = {
  id: string
  name: string
  status: string
  startTimeLabel: string
  endTimeLabel: string
  driverName: string
  activities: RouteActivity[]
  points: { latitude: number; longitude: number }[]
}

function formatDateTime(value?: number | null) {
  if (!value) return "-"
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value))
}

function formatTime(value?: number | null) {
  if (!value) return "-"
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value))
}

function formatTimeWindows(
  windows?: { earliest: number; latest: number }[] | null
) {
  if (!windows?.length) return "-"

  return windows
    .map((window) => `${formatTime(window.earliest)} às ${formatTime(window.latest)}`)
    .join(" | ")
}

async function getBaseUrl() {
  const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL
  if (appUrl) return appUrl

  const headersList = await headers()
  const host = headersList.get("host")
  const proto = headersList.get("x-forwarded-proto") || "http"

  return `${proto}://${host}`
}

async function getRouteById(id: string, date?: string): Promise<RouteItem | null> {
  const baseUrl = await getBaseUrl()

  const baseDate = date ? new Date(`${date}T00:00:00`) : new Date()

  const start = new Date(baseDate)
  start.setHours(0, 0, 0, 0)

  const end = new Date(baseDate)
  end.setHours(23, 59, 59, 999)

  const response = await fetch(
    `${baseUrl}/api/routes?start_in_millis=${start.getTime()}&end_in_millis=${end.getTime()}`,
    {
      cache: "no-store",
    }
  )

  if (!response.ok) {
    throw new Error("Erro ao buscar rotas.")
  }

  const data = await response.json()
  const routes: RouteItem[] = Array.isArray(data) ? data : normalizeCobliRoutes(data)

  return routes.find((route) => route.id === id) ?? null
}

function buildAddress(activity: CobliActivity) {
  if (!activity.destination) return "-"

  return [
    activity.destination.street_address,
    activity.destination.street_number,
    activity.destination.neighborhood,
    activity.destination.city,
    activity.destination.state,
    activity.destination.postal_code,
  ]
    .filter(Boolean)
    .join(", ")
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "Concluído":
    case "Executada":
    case "Visitado":
      return "bg-green-100 text-green-700 border border-green-200"

    case "Pendente":
    case "Planejada":
      return "bg-yellow-100 text-yellow-800 border border-yellow-200"

    case "No local":
    case "Em andamento":
      return "bg-blue-100 text-blue-700 border border-blue-200"

    case "Cancelada":
    case "Cancelado":
    case "Falhou":
      return "bg-red-100 text-red-700 border border-red-200"

    default:
      return "bg-neutral-100 text-neutral-700 border border-neutral-200"
  }
}

function getTypeIcon(type: string) {
  if (["Início", "START"].includes(type)) {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 21s6-5.33 6-11a6 6 0 1 0-12 0c0 5.67 6 11 6 11Z" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>
    )
  }

  if (["Fim", "END"].includes(type)) {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 21V4" />
        <path d="M5 4h9l-1.5 3L14 10H5" />
      </svg>
    )
  }

  if (["Parada", "STOP"].includes(type)) {
    return "📍"
  }

  return "•"
}

export default async function RouteDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ date?: string; originDate?: string }>
}) {
  const { id } = await params
  const { date, originDate } = await searchParams

  const route = await getRouteById(id, date)

  if (!route) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-neutral-100">
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Image
              src="/logo.svg"
              alt="Logo"
              width={160}
              height={48}
              priority
              className="h-auto w-35 md:w-42.5"
            />
            <div>
              <p className="text-sm font-medium text-neutral-500">Portal de Rotas</p>
              <h1 className="text-lg font-bold text-neutral-800">Entregas</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href={
                originDate
                  ? `/rotas?date=${originDate}`
                  : date
                  ? `/rotas?date=${date}`
                  : "/rotas"
              }
              className="text-sm font-semibold text-neutral-700"
            >
              ← Voltar
            </Link>

            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(
                route.status
              )}`}
            >
              {route.status}
            </span>
          </div>
        </div>
      </header>

      <section className="bg-linear-to-r from-purple-700 via-red-600 to-orange-500 px-4 py-10 text-white">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-2xl font-bold md:text-4xl">{route.name}</h1>
          <p className="mt-2 text-sm opacity-90">
            Motorista: {route.driverName || "-"}
          </p>

          <div className="mt-5 flex flex-wrap gap-3 text-sm">
            <span className="rounded-full bg-white/15 px-4 py-2">
              Saída: {route.startTimeLabel}
            </span>
            <span className="rounded-full bg-white/15 px-4 py-2">
              Fim: {route.endTimeLabel}
            </span>
            <span className="rounded-full bg-white/15 px-4 py-2">
              Paradas: {
                route.activities.filter(
                  (item) => !["START", "END", "Início", "Fim"].includes(item.type)
                ).length
              }
            </span>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-4">
          {route.activities.map((activity: CobliActivity, index: number) => {
            const isStart = ["START", "Início"].includes(activity.type)
            const isEnd = ["END", "Fim"].includes(activity.type)
            const isStop = !isStart && !isEnd

            const title = isStart
              ? "Início da rota"
              : isEnd
              ? "Fim da rota"
              : activity.name || "Parada"

            const headerLabel = isStart
              ? `#${index + 1} - Início`
              : isEnd
              ? `#${index + 1} - Fim`
              : `#${index + 1} - Parada`

            return (
              <article key={activity.id} className="rounded-2xl bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-purple-700 px-2 text-sm font-bold text-white">
                        {isStart || isEnd ? getTypeIcon(activity.type) : activity.position}
                      </span>

                      <h3 className="flex items-center gap-2 font-medium">
                        {isStop && <span className="text-lg">{getTypeIcon(activity.type)}</span>}
                        <span>{headerLabel}</span>
                      </h3>

                      {isStop && (
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusBadgeClass(
                            activity.status
                          )}`}
                        >
                          {activity.status}
                        </span>
                      )}
                    </div>

                    <h2 className="text-lg font-bold text-neutral-800">
                      {title}
                    </h2>

                    <p className="mt-2 text-sm text-neutral-600">
                      <span className="font-semibold text-neutral-700">Endereço:</span>{" "}
                      {buildAddress(activity)}
                    </p>

                    {isStop && activity.phone_number && (
                      <p className="mt-1 text-sm text-neutral-600">
                        <span className="font-semibold text-neutral-700">Telefone:</span>{" "}
                        {activity.phone_number}
                      </p>
                    )}

                    {isStop && activity.additional_info && (
                      <p className="mt-1 text-sm text-neutral-600">
                        <span className="font-semibold text-neutral-700">Observações:</span>{" "}
                        {activity.additional_info}
                      </p>
                    )}

                    {isStop && activity.time_windows && (
                      <p className="mt-1 text-sm text-neutral-600">
                        <span className="font-semibold text-neutral-700">
                          Janela de atendimento:
                        </span>{" "}
                        {formatTimeWindows(activity.time_windows)}
                      </p>
                    )}

                    {isStop && activity.driver_name && (
                      <p className="mt-1 text-sm text-neutral-600">
                        <span className="font-semibold text-neutral-700">Motorista:</span>{" "}
                        {activity.driver_name}
                      </p>
                    )}
                  </div>

                  <div className="rounded-xl bg-neutral-50 p-4 text-sm text-neutral-700 md:min-w-72">
                    <p>
                      <span className="font-semibold">Previsto início:</span>{" "}
                      {formatDateTime(activity.start_time)}
                    </p>

                    {isStop && (
                      <>
                        <p className="mt-1">
                          <span className="font-semibold">Previsto fim:</span>{" "}
                          {formatDateTime(activity.end_time)}
                        </p>
                        <p className="mt-1">
                          <span className="font-semibold">Chegada:</span>{" "}
                          {formatDateTime(activity.arrival_time)}
                        </p>
                        <p className="mt-1">
                          <span className="font-semibold">Conclusão:</span>{" "}
                          {formatDateTime(activity.executed_end_time)}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </main>
    </div>
  )
}