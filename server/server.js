'use strict'

const http = require('node:http')
const fs = require('node:fs')
const path = require('node:path')

const {
  ROLES_VALIDAS,
  buildSystemInstruction
} = require('./support-knowledge.js')

// ---------------------------------------------------------------------------
// Configuração
// ---------------------------------------------------------------------------

const GEMINI_BASE_URL =
  'https://generativelanguage.googleapis.com/v1beta/models'

const MODELO_PADRAO = 'gemini-3.5-flash-lite'

const LIMITE_CORPO_BYTES = 64 * 1024
const MAX_MENSAGENS_HISTORICO = 20
const MAX_CHARS_USUARIO = 1000
const MAX_CHARS_ASSISTENTE = 4000
const TIMEOUT_GEMINI_MS = 30000
const MAX_TOKENS_RESPOSTA = 2048

const RATE_LIMIT_JANELA_MS = 60 * 1000
const RATE_LIMIT_MAX = 15

const CORS_ORIGIN = process.env.CORS_ORIGIN || '*'

// ---------------------------------------------------------------------------
// Carregamento simples de .env para desenvolvimento local
// No Render, as variáveis vêm das Environment Variables.
// ---------------------------------------------------------------------------

function carregarEnv(arquivo) {
  let texto

  try {
    texto = fs.readFileSync(arquivo, 'utf8')
  } catch (erro) {
    if (erro.code !== 'ENOENT') {
      console.warn(
        '[EMAII] Não foi possível ler o .env:',
        erro.message
      )
    }

    return
  }

  for (const linha of texto.split(/\r?\n/)) {
    const m = linha.match(
      /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/
    )

    if (!m) continue

    let valor = m[2]

    const aspas = valor[0]

    if (
      (aspas === '"' || aspas === "'") &&
      valor.length >= 2 &&
      valor.endsWith(aspas)
    ) {
      valor = valor.slice(1, -1)
    }

    if (process.env[m[1]] === undefined) {
      process.env[m[1]] = valor
    }
  }
}

// ---------------------------------------------------------------------------
// Cabeçalhos de segurança
// ---------------------------------------------------------------------------

const CABECALHOS_SEGURANCA = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Frame-Options': 'DENY'
}

// ---------------------------------------------------------------------------
// Respostas
// ---------------------------------------------------------------------------

function responderJson(res, status, corpo, extras = {}) {
  const dados = JSON.stringify(corpo)

  res.writeHead(status, {
    ...CABECALHOS_SEGURANCA,
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Length': Buffer.byteLength(dados),
    ...extras
  })

  res.end(dados)
}

function responderTexto(res, status, texto) {
  res.writeHead(status, {
    ...CABECALHOS_SEGURANCA,
    'Content-Type': 'text/plain; charset=utf-8'
  })

  res.end(texto)
}

// ---------------------------------------------------------------------------
// Leitura do corpo da requisição
// ---------------------------------------------------------------------------

function lerCorpo(req, limite) {
  return new Promise((resolve, reject) => {
    const partes = []
    let total = 0
    let estourou = false

    req.on('data', (pedaco) => {
      if (estourou) return

      total += pedaco.length

      if (total > limite) {
        estourou = true
        partes.length = 0

        reject(
          Object.assign(
            new Error('Corpo grande demais'),
            { status: 413 }
          )
        )

        return
      }

      partes.push(pedaco)
    })

    req.on('end', () => {
      if (!estourou) {
        resolve(
          Buffer.concat(partes).toString('utf8')
        )
      }
    })

    req.on('error', reject)
  })
}

// ---------------------------------------------------------------------------
// Rate limit
// ---------------------------------------------------------------------------

const acessosPorIp = new Map()

function excedeuLimite(ip) {
  const agora = Date.now()

  const recentes = (
    acessosPorIp.get(ip) || []
  ).filter(
    (t) => agora - t < RATE_LIMIT_JANELA_MS
  )

  recentes.push(agora)

  acessosPorIp.set(ip, recentes)

  return recentes.length > RATE_LIMIT_MAX
}

setInterval(() => {
  const agora = Date.now()

  for (const [ip, tempos] of acessosPorIp) {
    if (
      tempos.every(
        (t) => agora - t >= RATE_LIMIT_JANELA_MS
      )
    ) {
      acessosPorIp.delete(ip)
    }
  }
}, RATE_LIMIT_JANELA_MS).unref()

// ---------------------------------------------------------------------------
// Validação das mensagens
// ---------------------------------------------------------------------------

function validarMensagens(bruto) {
  if (!Array.isArray(bruto) || bruto.length === 0) {
    return null
  }

  const contents = []

  for (
    const item of bruto.slice(-MAX_MENSAGENS_HISTORICO)
  ) {
    if (
      !item ||
      typeof item.texto !== 'string'
    ) {
      return null
    }

    const role =
      item.papel === 'user'
        ? 'user'
        : item.papel === 'assistant'
          ? 'model'
          : null

    if (!role) return null

    const limite =
      role === 'user'
        ? MAX_CHARS_USUARIO
        : MAX_CHARS_ASSISTENTE

    const texto = item.texto
      .trim()
      .slice(0, limite)

    if (!texto) continue

    const ultima =
      contents[contents.length - 1]

    if (
      ultima &&
      ultima.role === role
    ) {
      ultima.parts[0].text +=
        '\n' + texto
    } else {
      contents.push({
        role,
        parts: [
          {
            text: texto
          }
        ]
      })
    }
  }

  while (
    contents.length &&
    contents[0].role !== 'user'
  ) {
    contents.shift()
  }

  if (
    !contents.length ||
    contents[contents.length - 1].role !== 'user'
  ) {
    return null
  }

  return contents
}

// ---------------------------------------------------------------------------
// Validação do modelo
// ---------------------------------------------------------------------------

function nomeDeModeloSeguro(nome) {
  const limpo = String(nome || '')
    .trim()
    .replace(/^models\//, '')

  return /^[A-Za-z0-9._-]+$/.test(limpo)
    ? limpo
    : null
}

// ---------------------------------------------------------------------------
// Erro específico do suporte
// ---------------------------------------------------------------------------

class ErroSuporte extends Error {
  constructor(
    status,
    mensagemUsuario,
    codigo
  ) {
    super(mensagemUsuario)

    this.status = status
    this.codigo = codigo
  }
}

// ---------------------------------------------------------------------------
// Chamada para Gemini
// ---------------------------------------------------------------------------

async function chamarGemini({
  apiKey,
  modelo,
  instrucao,
  contents
}) {
  const url =
    `${GEMINI_BASE_URL}/` +
    `${encodeURIComponent(modelo)}` +
    `:generateContent`

  const controlador =
    new AbortController()

  const timer = setTimeout(
    () => controlador.abort(),
    TIMEOUT_GEMINI_MS
  )

  let resposta

  try {
    resposta = await fetch(url, {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },

      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text: instrucao
            }
          ]
        },

        contents,

        generationConfig: {
          maxOutputTokens:
            MAX_TOKENS_RESPOSTA
        }
      }),

      signal: controlador.signal
    })
  } catch (erro) {
    if (erro.name === 'AbortError') {
      throw new ErroSuporte(
        504,
        'O suporte demorou demais para responder. Tente novamente.',
        'timeout'
      )
    }

    console.error(
      '[EMAII] Falha de rede ao chamar o Gemini:',
      erro.message
    )

    throw new ErroSuporte(
      502,
      'Não foi possível falar com o serviço de IA agora. Tente novamente em instantes.',
      'rede'
    )
  } finally {
    clearTimeout(timer)
  }

  const dados =
    await resposta.json().catch(() => null)

  if (!resposta.ok) {
    const detalhe =
      dados?.error?.message ||
      `HTTP ${resposta.status}`

    console.error(
      `[EMAII] Gemini respondeu ${resposta.status}: ${detalhe}`
    )

    if (resposta.status === 429) {
      throw new ErroSuporte(
        429,
        'O suporte recebeu muitas solicitações no momento. Aguarde um pouco e tente de novo.',
        'cota'
      )
    }

    if (
      resposta.status === 400 ||
      resposta.status === 401 ||
      resposta.status === 403
    ) {
      console.error(
        '[EMAII] Verifique se a GEMINI_API_KEY está correta e ativa.'
      )
    }

    if (resposta.status === 404) {
      console.error(
        `[EMAII] Modelo "${modelo}" não encontrado. Confira GEMINI_MODEL no Render.`
      )
    }

    throw new ErroSuporte(
      502,
      'O suporte está indisponível no momento. Tente novamente mais tarde.',
      'gemini'
    )
  }

  if (
    dados?.promptFeedback?.blockReason
  ) {
    throw new ErroSuporte(
      422,
      'Não consegui processar essa mensagem. Reformule sua dúvida sobre o EMAII e tente de novo.',
      'bloqueado'
    )
  }

  const candidato =
    dados?.candidates?.[0]

  const texto =
    (candidato?.content?.parts || [])
      .filter(
        (p) =>
          typeof p.text === 'string' &&
          !p.thought
      )
      .map((p) => p.text)
      .join('')
      .trim()

  if (!texto) {
    console.error(
      '[EMAII] Gemini retornou sem texto. finishReason =',
      candidato?.finishReason
    )

    if (
      candidato?.finishReason === 'SAFETY'
    ) {
      throw new ErroSuporte(
        422,
        'Não consegui responder a essa mensagem. Reformule sua dúvida sobre o EMAII.',
        'bloqueado'
      )
    }

    throw new ErroSuporte(
      502,
      'Não consegui gerar uma resposta agora. Tente reformular a pergunta.',
      'vazio'
    )
  }

  return texto
}

// ---------------------------------------------------------------------------
// API /api/chat
// ---------------------------------------------------------------------------

async function tratarChat(req, res) {
  // CORS
  res.setHeader(
    'Access-Control-Allow-Origin',
    CORS_ORIGIN
  )

  res.setHeader(
    'Access-Control-Allow-Methods',
    'POST, OPTIONS'
  )

  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type'
  )

  // Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    return res.end()
  }

  // Somente POST
  if (req.method !== 'POST') {
    return responderJson(
      res,
      405,
      {
        erro: 'Método não permitido.'
      },
      {
        Allow: 'POST'
      }
    )
  }

  // Content-Type
  if (
    !String(
      req.headers['content-type'] || ''
    )
      .toLowerCase()
      .startsWith('application/json')
  ) {
    return responderJson(
      res,
      415,
      {
        erro: 'Envie os dados em JSON.'
      }
    )
  }

  // Rate limit
  const ip =
    req.socket.remoteAddress ||
    'desconhecido'

  if (excedeuLimite(ip)) {
    return responderJson(
      res,
      429,
      {
        erro:
          'Muitas mensagens em pouco tempo. Aguarde um minuto e tente de novo.'
      },
      {
        'Retry-After': '60'
      }
    )
  }

  // Corpo
  let corpo

  try {
    corpo = JSON.parse(
      await lerCorpo(
        req,
        LIMITE_CORPO_BYTES
      )
    )
  } catch (erro) {
    if (erro.status === 413) {
      res.setHeader(
        'Connection',
        'close'
      )

      return responderJson(
        res,
        413,
        {
          erro: 'Mensagem grande demais.'
        }
      )
    }

    return responderJson(
      res,
      400,
      {
        erro: 'Requisição inválida.'
      }
    )
  }

  // Mensagens
  const contents =
    validarMensagens(
      corpo?.mensagens
    )

  if (!contents) {
    return responderJson(
      res,
      400,
      {
        erro: 'Mensagem inválida.'
      }
    )
  }

  // Perfil
  const perfil =
    ROLES_VALIDAS.includes(
      corpo?.perfil
    )
      ? corpo.perfil
      : null

  // API Key
  const apiKey =
    (
      process.env.GEMINI_API_KEY ||
      ''
    ).trim()

  if (!apiKey) {
    console.error(
      '[EMAII] GEMINI_API_KEY não configurada.'
    )

    return responderJson(
      res,
      503,
      {
        erro:
          'O suporte ainda não foi configurado. Avise o administrador do sistema.',
        codigo: 'nao_configurado'
      }
    )
  }

  // Modelo
  const modelo =
    nomeDeModeloSeguro(
      process.env.GEMINI_MODEL ||
      MODELO_PADRAO
    )

  if (!modelo) {
    console.error(
      '[EMAII] GEMINI_MODEL inválido.'
    )

    return responderJson(
      res,
      503,
      {
        erro:
          'O suporte está mal configurado. Avise o administrador do sistema.',
        codigo: 'nao_configurado'
      }
    )
  }

  // Gemini
  try {
    const resposta =
      await chamarGemini({
        apiKey,
        modelo,
        instrucao:
          buildSystemInstruction(
            perfil
          ),
        contents
      })

    return responderJson(
      res,
      200,
      {
        resposta
      }
    )
  } catch (erro) {
    if (
      erro instanceof ErroSuporte
    ) {
      return responderJson(
        res,
        erro.status,
        {
          erro: erro.message,
          codigo: erro.codigo
        }
      )
    }

    console.error(
      '[EMAII] Erro inesperado no chat:',
      erro
    )

    return responderJson(
      res,
      500,
      {
        erro:
          'Erro interno no suporte. Tente novamente.'
      }
    )
  }
}

// ---------------------------------------------------------------------------
// Servidor
// ---------------------------------------------------------------------------

function criarServidor() {
  return http.createServer(
    async (req, res) => {
      try {
        const { pathname } =
          new URL(
            req.url,
            'http://localhost'
          )

        // API do chat
        if (
          pathname === '/api/chat'
        ) {
          return await tratarChat(
            req,
            res
          )
        }

        // Rota simples para testar se o Render está funcionando
        if (
          pathname === '/health'
        ) {
          return responderJson(
            res,
            200,
            {
              ok: true,
              servico: 'EMAII'
            }
          )
        }

        // Qualquer outra rota
        return responderJson(
          res,
          404,
          {
            erro:
              'Rota não encontrada.'
          }
        )
      } catch (erro) {
        console.error(
          '[EMAII] Erro no servidor:',
          erro
        )

        if (!res.headersSent) {
          responderJson(
            res,
            500,
            {
              erro:
                'Erro interno.'
            }
          )
        } else {
          res.end()
        }
      }
    }
  )
}

// ---------------------------------------------------------------------------
// Inicialização
// ---------------------------------------------------------------------------

function iniciar() {
  // .env apenas para desenvolvimento local
  carregarEnv(
    path.join(
      __dirname,
      '.env'
    )
  )

  const porta =
    Number(process.env.PORT) ||
    3000

  const host =
    process.env.HOST ||
    '0.0.0.0'

  const servidor =
    criarServidor()

  servidor.listen(
    porta,
    host,
    () => {
      console.log(
        `EMAII rodando em http://${host === '0.0.0.0' ? 'localhost' : host}:${porta}`
      )

      if (
        !(process.env.GEMINI_API_KEY || '').trim()
      ) {
        console.warn(
          '[EMAII] Atenção: GEMINI_API_KEY não encontrada.'
        )
      } else {
        console.log(
          `[EMAII] Suporte com IA ativo (modelo: ${process.env.GEMINI_MODEL || MODELO_PADRAO}).`
        )
      }
    }
  )
}

if (
  require.main === module
) {
  iniciar()
}

module.exports = {
  criarServidor,
  validarMensagens,
  carregarEnv
}