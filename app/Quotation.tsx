"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { useSearchParams, useRouter } from "next/navigation" // Importar useSearchParams e useNavigate
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
import styles from './quotation.module.css'

interface CapitualResponse {
  data: {
    market: boolean;
    pair: string;
    fxRate: string;
  };
}

export default function Quotation() {
  const [result, setResult] = useState<CapitualResponse | null>(null)
  const [calculatedValue, setCalculatedValue] = useState<number | undefined>()
  const [copied, setCopied] = useState(false)
  const [mounted, setMounted] = useState(false)
  const spreadRef = useRef<HTMLInputElement>(null)
  const resultRef = useRef<CapitualResponse | null>(null)
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  const spreadQuery = mounted && searchParams ? Number(searchParams.get("spread")) || 0 : 0

  const fetchCotacao = async () => {
    try {
      const response = await fetch("https://trade.capitual.io/api/v1.0/market/price?pair=USDT_BRL")
      const data: CapitualResponse = await response.json()
      setResult(data)
      resultRef.current = data
    } catch (err) {
      console.error("Erro ao buscar cotação:", err);
    }
  }

  useEffect(() => {
    fetchCotacao();
    const interval = setInterval(fetchCotacao, 3000);
    return () => clearInterval(interval);
  }, []);

  const calculateValue = (spread: number, currentPrice: number) => {
    if (!Number.isNaN(spread)) {
      setCalculatedValue(currentPrice * (1 + spread / 100));
    } else {
      setCalculatedValue(currentPrice);
    }
  };

  const onSpreadChange = debounce((event: React.ChangeEvent<HTMLInputElement>) => {
    const spread = Number(event?.target?.value || 0);
    const currentPrice = resultRef.current ? parseFloat(resultRef.current.data.fxRate) : 0;

    if (router) {
      // Atualiza a URL com o novo valor de spread
      router.push(`/?spread=${spread}`); // Remover shallow
    }

    calculateValue(spread, currentPrice);
  }, 800);

  useEffect(() => {
    if (resultRef.current) {
      const currentPrice = parseFloat(resultRef.current.data.fxRate);
      calculateValue(spreadQuery, currentPrice);
    }
  }, [spreadQuery, result]);

  function roundToDecimalPlaces(number: number) {
    const factor = Math.pow(10, 4);
    return Math.round(number * factor) / factor;
  }

  async function copyValueToClipBoard() {
    setCopied(true);
    const actualValue = roundToDecimalPlaces(Number(calculatedValue || (result ? parseFloat(result.data.fxRate) : 0)));
    await navigator?.clipboard?.writeText(actualValue?.toString());

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  }

  useEffect(() => {
    if (mounted && spreadRef?.current && spreadQuery) {
      spreadRef.current.value = spreadQuery.toString();
      const currentPrice = resultRef.current ? parseFloat(resultRef.current.data.fxRate) : 0;
      calculateValue(spreadQuery, currentPrice);
    }
  }, [mounted, spreadQuery]);

  const formatedPrice = result ? parseFloat(result.data.fxRate) : 0;

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
                  defaultValue={spreadQuery.toString()}
                />
              </div>
            </div>

            <Card className={styles.cardQuotation}>
              <CardContent className={styles.cardQuotationContent}>
                <div>
                  <Label className={styles.cardQuotationLabel}>USDT Price</Label>
                  <p className={styles.cardQuotationValue}>
                    R$ {(calculatedValue || formatedPrice).toFixed(4)} {/* Aqui o valor é recalculado */}
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
  );
}
