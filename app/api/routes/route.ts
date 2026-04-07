import { NextRequest, NextResponse } from "next/server"
import { normalizeCobliRoutes } from "../../lib/cobli"
import type { CobliApiResponse } from "../../types/route"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const startInMillis = searchParams.get("start_in_millis")
    const endInMillis = searchParams.get("end_in_millis")

    if (!startInMillis || !endInMillis) {
      return NextResponse.json(
        { message: "Parâmetros start_in_millis e end_in_millis são obrigatórios." },
        { status: 400 }
      )
    }

    const apiUrl = process.env.COBLI_API_URL
    const apiKey = process.env.COBLI_API_KEY

    if (!apiUrl || !apiKey) {
      return NextResponse.json(
        { message: "Variáveis de ambiente não configuradas." },
        { status: 500 }
      )
    }

    const url = new URL(apiUrl)
    url.searchParams.set("start_in_millis", startInMillis)
    url.searchParams.set("end_in_millis", endInMillis)

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "cobli-api-key": apiKey,
        Accept: "application/json",
      },
      cache: "no-store",
    })

    const text = await response.text()

    if (!response.ok) {
      return NextResponse.json(
        {
          message: "Erro ao consultar API da Cobli.",
          status: response.status,
          response: text,
        },
        { status: response.status }
      )
    }

    let json: CobliApiResponse

    try {
      json = JSON.parse(text)
    } catch {
      return NextResponse.json(
        {
          message: "Resposta da Cobli inválida.",
          response: text,
        },
        { status: 502 }
      )
    }

    const routes = normalizeCobliRoutes(json)

    return NextResponse.json(routes)
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { message: "Erro interno ao buscar rotas." },
      { status: 500 }
    )
  }
}