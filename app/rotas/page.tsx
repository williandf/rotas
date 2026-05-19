"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import type { NormalizedRoute } from "../types/route"
import { getStartAndEndOfDayInMillis } from "../lib/utils"

function extractDigits(value?: string | null) {
  return (value || "").replace(/\D/g, "")
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function formatDateInput(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function formatDateLabel(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  }).format(date)
}

function getPreviousBusinessDay(today: Date) {
  const previous = addDays(today, -1)

  if (previous.getDay() === 0) return addDays(previous, -2)
  if (previous.getDay() === 6) return addDays(previous, -1)

  return previous
}

function getNextBusinessDay(today: Date) {
  const next = addDays(today, 1)

  if (next.getDay() === 6) return addDays(next, 2)
  if (next.getDay() === 0) return addDays(next, 1)

  return next
}

function getAllowedDateOptions() {
  const today = new Date()
  today.setHours(12, 0, 0, 0)

  const yesterday = getPreviousBusinessDay(today)
  const tomorrow = getNextBusinessDay(today)

  return [
    {
      label: "Ontem",
      shortLabel: formatDateLabel(yesterday),
      value: formatDateInput(yesterday),
    },
    {
      label: "Hoje",
      shortLabel: formatDateLabel(today),
      value: formatDateInput(today),
    },
    {
      label: "Amanhã",
      shortLabel: formatDateLabel(tomorrow),
      value: formatDateInput(tomorrow),
    },
  ]
}

function extractInvoiceFromText(text?: string | null) {
  if (!text) return null

  const normalizedText = text.trim()
  const nfPattern = /\b(?:NF[\s.:/-]*)?0*(\d{5,})\b/gi
  const matches = Array.from(normalizedText.matchAll(nfPattern))

  if (!matches.length) return null

  return matches.map((match) => match[1]).find(Boolean) || null
}

function findMatchedActivities(route: NormalizedRoute, nfFilter: string) {
  const normalizedNf = extractDigits(nfFilter)

  if (!normalizedNf) return []

  return (
    route.activities?.filter((activity) => {
      const rawText = [activity.name, activity.additional_info]
        .filter(Boolean)
        .join(" ")

      const normalizedText = extractDigits(rawText)

      return normalizedText.includes(normalizedNf)
    }) ?? []
  )
}

function getMatchedInvoice(
  activity: {
    name?: string | null
    additional_info?: string | null
  },
  nfFilter: string
) {
  const normalizedNf = extractDigits(nfFilter)

  const candidates = [
    extractInvoiceFromText(activity.name),
    extractInvoiceFromText(activity.additional_info),
  ].filter(Boolean) as string[]

  const exactMatch = candidates.find((invoice) =>
    extractDigits(invoice).includes(normalizedNf)
  )

  return exactMatch || normalizedNf
}

export default function RoutesPage() {
  const searchParams = useSearchParams()
  const initializedFromUrlRef = useRef(false)

  const allowedDateOptions = useMemo(() => getAllowedDateOptions(), [])
  const todayOption =
    allowedDateOptions.find((option) => option.label === "Hoje") ??
    allowedDateOptions[0]

  const [routes, setRoutes] = useState<NormalizedRoute[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState(todayOption.value)
  const [nfFilter, setNfFilter] = useState("")
  const [error, setError] = useState("")

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

  async function loadRoutes(dateValue: string, currentNfFilter = nfFilter) {
    setLoading(true)
    setError("")

    try {
      const normalizedNf = extractDigits(currentNfFilter)

      let requestUrl = ""

      if (normalizedNf) {
        requestUrl = `/api/routes/search-by-nf?nf=${encodeURIComponent(normalizedNf)}`
      } else {
        const { start, end } = getStartAndEndOfDayInMillis(dateValue)
        requestUrl = `/api/routes?start_in_millis=${start}&end_in_millis=${end}`
      }

      const response = await fetch(requestUrl, {
        cache: "no-store",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.message || "Erro ao carregar rotas")
      }

      setRoutes(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error(error)
      setRoutes([])
      setError("Não foi possível carregar as rotas.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (initializedFromUrlRef.current) return

    const dateFromUrl = searchParams.get("date")

    if (
      dateFromUrl &&
      allowedDateOptions.some((option) => option.value === dateFromUrl)
    ) {
      setSelectedDate(dateFromUrl)
    }

    initializedFromUrlRef.current = true
  }, [searchParams, allowedDateOptions])

  useEffect(() => {
    if (!extractDigits(nfFilter)) {
      loadRoutes(selectedDate, "")
    }
  }, [selectedDate])

  const filteredRoutes = useMemo(() => {
    const normalizedNf = extractDigits(nfFilter)

    return routes.filter((route) => {
      if (!normalizedNf) return true
      return findMatchedActivities(route, normalizedNf).length > 0
    })
  }, [routes, nfFilter])

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
        </div>
      </header>

      <section className="bg-linear-to-r from-purple-700 via-red-600 to-orange-500 px-4 py-10 text-white">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold">Rotas de Entrega</h2>
          <p className="mt-2 text-sm md:text-base">
            Consulte as rotas por ontem, hoje, amanhã ou pesquise uma NF sem limitar pela data
          </p>

          <div className="mt-6 rounded-2xl bg-white p-4 text-neutral-800 shadow-md">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                loadRoutes(selectedDate, nfFilter)
              }}
              className="grid gap-4 md:grid-cols-[1.4fr_1fr_auto] md:items-end"
            >
              <div>
                <label className="mb-2 block text-sm font-semibold text-neutral-700">
                  Data
                </label>

                <div className="grid grid-cols-3 gap-2">
                  {allowedDateOptions.map((option) => {
                    const isActive = selectedDate === option.value

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setSelectedDate(option.value)}
                        className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                          isActive
                            ? "bg-linear-to-r from-purple-700 via-red-600 to-orange-500 text-white shadow-sm"
                            : "border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50"
                        }`}
                      >
                        <div>{option.label}</div>
                        <div
                          className={`text-xs ${
                            isActive ? "text-white/90" : "text-neutral-500"
                          }`}
                        >
                          {option.shortLabel}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label
                  htmlFor="nf"
                  className="mb-2 block text-sm font-semibold text-neutral-700"
                >
                  Número da NF
                </label>
                <input
                  id="nf"
                  type="text"
                  inputMode="numeric"
                  value={nfFilter}
                  onChange={(e) => setNfFilter(e.target.value)}
                  placeholder="Ex: 280112"
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-purple-600"
                />
              </div>

              <button
                type="submit"
                className="rounded-xl bg-linear-to-r from-purple-700 via-red-600 to-orange-500 px-6 py-3 font-semibold text-white shadow-sm transition hover:opacity-95"
              >
                Pesquisar rota
              </button>
            </form>

            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <span className="font-semibold">Obs:</span> Lembrando que esse horário
              pode ser alterado durante o roteiro com eventos que não temos controle
              como (Trânsito, atrasos em clientes, agendamentos) então em caso da
              necessidade de uma previsão mais assertiva, solicito que entre em
              contato com a logística.
              {extractDigits(nfFilter) && (
                <span className="mt-2 block font-medium">
                  Busca por NF ativa: a pesquisa não usa a data selecionada.
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {loading && (
          <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
            <p className="text-neutral-600">Carregando rotas...</p>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {!loading && !error && filteredRoutes.length === 0 && (
          <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
            <p className="font-medium text-neutral-700">
              Nenhuma rota encontrada para os filtros selecionados.
            </p>

            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <span className="font-semibold">Obs:</span> Lembrando que esse horário
              pode ser alterado durante o roteiro com eventos que não temos controle
              como (Trânsito, atrasos em clientes, agendamentos) então em caso da
              necessidade de uma previsão mais assertiva, solicito que entre em
              contato com a logística.
            </div>
          </div>
        )}

        {!loading && !error && filteredRoutes.length > 0 && (
          <div className="grid gap-4">
            {filteredRoutes.map((route) => {
              const matchedActivities = findMatchedActivities(route, nfFilter)
              const firstMatchedInvoice =
                matchedActivities.length > 0
                  ? getMatchedInvoice(matchedActivities[0], nfFilter)
                  : ""

              return (
                <article
                  key={route.id}
                  className="rounded-2xl bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-neutral-800">
                        {route.name}
                      </h3>

                      <div className="mt-2 flex flex-wrap gap-2 text-sm text-neutral-600">
                        <span className="rounded-full bg-neutral-100 px-3 py-1">
                          Horário: {route.startTimeLabel} - {route.endTimeLabel}
                        </span>
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusBadgeClass(
                            route.status
                          )}`}
                        >
                          {route.status}
                        </span>

                        {!!nfFilter && matchedActivities.length > 0 && (
                          <span className="inline-flex rounded-full border border-amber-200 bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                            NF {firstMatchedInvoice}
                          </span>
                        )}
                      </div>

                      {!!nfFilter && matchedActivities.length > 0 && (
                        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                          <p className="text-sm font-semibold text-emerald-800">
                            NF encontrada nesta rota
                          </p>

                          <div className="mt-2 space-y-2">
                            {matchedActivities.slice(0, 3).map((activity) => {
                              const matchedInvoice = getMatchedInvoice(
                                activity,
                                nfFilter
                              )

                              return (
                                <div
                                  key={activity.id}
                                  className="rounded-lg bg-white px-3 py-2 text-sm text-neutral-700"
                                >
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="inline-flex rounded-full border border-amber-200 bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                                      NF {matchedInvoice}
                                    </span>
                                  </div>

                                  <p className="mt-2">
                                    <span className="font-semibold">Parada:</span>{" "}
                                    {activity.name || "Sem identificação"}
                                  </p>

                                  {activity.additional_info && (
                                    <p className="mt-1 text-neutral-600">
                                      <span className="font-semibold">Info:</span>{" "}
                                      {activity.additional_info}
                                    </p>
                                  )}
                                </div>
                              )
                            })}

                            {matchedActivities.length > 3 && (
                              <p className="text-xs text-emerald-700">
                                + {matchedActivities.length - 3} ocorrência(s)
                                encontrada(s)
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <Link
                      href={`/rotas/${route.id}?date=${route.routeDate || selectedDate}&originDate=${selectedDate}`}
                      className="inline-flex items-center justify-center rounded-xl bg-linear-to-r from-purple-700 via-red-600 to-orange-500 px-5 py-3 text-sm font-bold text-white"
                    >
                      Ver rota
                    </Link>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}