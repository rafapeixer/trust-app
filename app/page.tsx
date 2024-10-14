"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { useSearchParams } from "next/navigation" // Use useSearchParams para acessar os parâmetros da URL
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ClipboardIcon } from "lucide-react"
import { debounce } from "@/utils/utils"
import styles from './cotacao.module.css'

interface BinanceResponse {
  symbol: string
  price: string
}

export default function Quotation() {
  const [result, setResult] = useState<BinanceResponse | null>(null)
  const [calculatedValue, setCalculatedValue] = useState<number | undefined>()
  const [copied, setCopied] = useState(false)
  const [mounted, setMounted] = useState(false) // Adiciona um estado para verificar se o componente foi montado
  const spreadRef = useRef<HTMLInputElement>(null)
  const resultRef = useRef<BinanceResponse | null>(null)
  const searchParams = useSearchParams() // Hook para acessar os parâmetros da URL

  useEffect(() => {
    setMounted(true) // Marca o componente como montado
  }, [])

  // Captura o spread da URL somente se estiver disponível
  const spreadQuery = mounted && searchParams.get("spread") ? Number(searchParams.get("spread")) : 0

  const fetchCotacao = async () => {
    try {
      const response = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=USDTBRL")
      const data: BinanceResponse = await response.json()
      setResult(data)
      resultRef.current = data
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    fetchCotacao();
    const interval = setInterval(fetchCotacao, 3000);
    return () => clearInterval(interval);
  }, []);

  const onSpreadChange = debounce((event: React.ChangeEvent<HTMLInputElement>, actualValue?: number) => {
    const spread = Number(event?.target?.value || actualValue || 0)
    const currentPrice = resultRef.current ? parseFloat(resultRef.current.price) : 0

    if (!Number.isNaN(spread)) {
      setCalculatedValue(currentPrice * (1 + spread / 100))
    } else {
      setCalculatedValue(currentPrice)
    }
  }, 800);

  function roundToDecimalPlaces(number: number) {
    const factor = Math.pow(10, 4)
    return Math.round(number * factor) / factor
  }

  async function copyValueToClipBoard() {
    setCopied(true)
    const actualValue = roundToDecimalPlaces(Number(calculatedValue || (result ? parseFloat(result.price) : 0)))
    await navigator?.clipboard?.writeText(actualValue?.toString())

    setTimeout(() => {
      setCopied(false)
    }, 2000)
  }

  // Preenche o valor de spread baseado na query da URL após a montagem
  useEffect(() => {
    if (mounted && spreadRef?.current && spreadQuery) {
      spreadRef.current.value = spreadQuery.toString();
      onSpreadChange({ target: { value: spreadQuery.toString() } } as React.ChangeEvent<HTMLInputElement>, spreadQuery)
    }
  }, [mounted, spreadQuery, onSpreadChange]);

  const formatedPrice = result ? parseFloat(result.price) : 0

  return (
    <Card className={styles.card}>
      <CardContent className={styles.cardContent}>
        <div className={styles.flexCenter}>
          <>
            <Image src="/2.png" alt="Trust Intermediações" width={240} height={80} className={styles.image} />
            <h1 className={styles.title}>Cotação em tempo real</h1>
            <h2 className={styles.subtitle}>Usdt da maneira mais fácil.</h2>

            <div className={styles.inputWrapper}>
              <Label htmlFor="currency" className={styles.inputLabel}>Moeda</Label>
              <div className="relative">
                <Input id="currency" className={styles.inputField} value="Tether (USDT)" disabled />
              </div>
            </div>

            <div className={styles.inputWrapper}>
              <Label htmlFor="quotation" className={styles.inputLabel}>Cotação</Label>
              <div className="relative">
                <Input id="quotation" className={styles.inputField} value={formatedPrice.toFixed(4)} disabled />
              </div>
            </div>

            <div className={styles.inputWrapper}>
              <Label htmlFor="spread" className={styles.inputLabel}>Spread (%)</Label>
              <div className="relative">
                <Input
                  id="spread"
                  ref={spreadRef}
                  className={styles.inputField}
                  onChange={onSpreadChange}
                  placeholder="0.5"
                  defaultValue={spreadQuery.toString()} // Preenche com o valor da query
                />
              </div>
            </div>

            <Card className={styles.cardQuotation}>
              <CardContent className={styles.cardQuotationContent}>
                <div>
                  <Label className={styles.cardQuotationLabel}>USDT Price</Label>
                  <p className={styles.cardQuotationValue}>
                    R$ {(calculatedValue || formatedPrice).toFixed(4)}
                  </p>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button className={styles.copyButton} onClick={copyValueToClipBoard}>
                        <ClipboardIcon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{copied ? "Copiado!" : "Copiar"}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardContent>
            </Card>
          </>
        </div>
      </CardContent>
    </Card>
  )
}
