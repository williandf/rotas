import { NextRequest, NextResponse } from "next/server"
import { normalizeCobliRoutes } from "../../../lib/cobli"

function extractDigits(value?: string | null) {
  return (value || "").replace(/\D/g, "")
}

export async function GET(request: NextRequest) {
  try {
    const nf = request.nextUrl.searchParams.get("nf")
    const normalizedNf = extractDigits(nf)

    if (!normalizedNf) {
      return NextResponse.json(
        { message: "Parâmetro nf é obrigatório." },
        { status: 400 }
      )
    }

    const apiUrl = process.env.COBLI_API_URL
    const apiKey = process.env.COBLI_API_KEY

    if (!apiUrl || !apiKey) {
      return NextResponse.json(
        { message: "Variáveis de ambiente da Cobli não configuradas." },
        { status: 500 }
      )
    }

    const url = new URL(apiUrl)
    url.searchParams.set("text_filter", normalizedNf)

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "cobli-api-key": apiKey,
        Accept: "application/json",
      },
      cache: "no-store",
    })

    const json = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { message: json?.message || "Erro ao buscar NF na Cobli." },
        { status: response.status }
      )
    }

    const normalizedRoutes = normalizeCobliRoutes(json)

    return NextResponse.json(normalizedRoutes)
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { message: "Erro ao pesquisar NF." },
      { status: 500 }
    )
  }
}