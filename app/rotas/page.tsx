"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import type { RouteItem } from "../types/route"
import {
  getStartAndEndOfDayInMillis,
  getTodayDateInputValue,
} from "../lib/utils"

export default function RoutesPage() {
  const [routes, setRoutes] = useState<RouteItem[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState(getTodayDateInputValue())
  const [error, setError] = useState("")

  async function loadRoutes(dateValue: string) {
    setLoading(true)
    setError("")

    try {
      const { start, end } = getStartAndEndOfDayInMillis(dateValue)

      const response = await fetch(
        `/api/routes?start_in_millis=${start}&end_in_millis=${end}`,
        {
          cache: "no-store",
        }
      )

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
    loadRoutes(selectedDate)
  }, [selectedDate])

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
              className="h-auto w-[140px] md:w-[170px]"
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
            Consulte as rotas por data
          </p>

          <div className="mt-6 rounded-2xl bg-white p-4 text-neutral-800 shadow-md">
            <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
              <div>
                <label
                  htmlFor="date"
                  className="mb-2 block text-sm font-semibold text-neutral-700"
                >
                  Data
                </label>
                <input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-purple-600"
                />
              </div>

              <button
                type="button"
                onClick={() => loadRoutes(selectedDate)}
                className="rounded-xl bg-linear-to-r from-purple-700 via-red-600 to-orange-500 px-6 py-3 font-semibold text-white shadow-sm transition hover:opacity-95"
              >
                Pesquisar rota
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <span className="font-semibold">Obs:</span> Lembrando que esse horário
              pode ser alterado durante o roteiro com eventos que não temos controle
              como (Trânsito, atrasos em clientes, agendamentos) então em caso da
              necessidade de uma previsão mais assertiva, solicito que entre em
              contato com a logística.
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

        {!loading && !error && routes.length === 0 && (
          <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
            <p className="font-medium text-neutral-700">
              Nenhuma rota encontrada para a data selecionada.
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

        {!loading && !error && routes.length > 0 && (
          <div className="grid gap-4">
            {routes.map((route) => (
              <article
                key={route.id}
                className="rounded-2xl bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-neutral-800">
                      {route.name}
                    </h3>

                    <div className="mt-2 flex flex-wrap gap-2 text-sm text-neutral-600">
                      <span className="rounded-full bg-neutral-100 px-3 py-1">
                        Horário: {route.startTimeLabel} - {route.endTimeLabel}
                      </span>
                      <span className="rounded-full bg-neutral-100 px-3 py-1">
                        Status: {route.status}
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/rotas/${route.id}?date=${selectedDate}`}
                    className="inline-flex items-center justify-center rounded-xl bg-linear-to-r from-purple-700 via-red-600 to-orange-500 px-5 py-3 text-sm font-bold text-white"
                  >
                    Ver rota
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
