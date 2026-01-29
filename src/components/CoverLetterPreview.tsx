import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CoverLetterData, CoverLetterModel } from "@/types/cover-letter";
import { ArrowLeft, Copy, Check, FileText, Target, Wrench, Sparkles, Save, Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { PdfTextBlock, usePdfExport } from "@/hooks/usePdfExport";
import { useIsMobile } from "@/hooks/use-mobile";

interface CoverLetterPreviewProps {
  data: CoverLetterData;
  onBack: () => void;
  onSave?: () => void;
}

const modelIcons = {
  completa: FileText,
  objetiva: Target,
  tecnica: Wrench,
};

const modelLabels = {
  completa: "Completa",
  objetiva: "Objetiva",
  tecnica: "Técnica",
};

type ModelType = 'completa' | 'objetiva' | 'tecnica';

export function CoverLetterPreview({ data, onBack, onSave }: CoverLetterPreviewProps) {
  const { toast } = useToast();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<ModelType>(data.modelos[0]?.tipo || "completa");
  const letterRef = useRef<HTMLDivElement>(null);
  const { exportTextPdf, isExporting } = usePdfExport({ filename: `carta-apresentacao-${data.formData.nome.toLowerCase().replace(/\s+/g, '-')}.pdf` });
  const isMobile = useIsMobile();

  const handleExportPdf = () => {
    const model = data.modelos.find((m) => m.tipo === activeTab);
    if (!model) return;

    const filename = `carta-apresentacao-${activeTab}.pdf`;
    const blocks: PdfTextBlock[] = [
      { type: "title", text: model.titulo },
      { type: "spacer", size: 4 },
    ];

    // Split content into paragraphs for better formatting
    const paragraphs = model.conteudo.split('\n\n').filter(p => p.trim());
    for (const p of paragraphs) {
      blocks.push({ type: "paragraph", text: p });
      blocks.push({ type: "spacer", size: 2 });
    }

    blocks.push({ type: "spacer", size: 4 });
    blocks.push({ type: "subtitle", text: model.cta });

    exportTextPdf({ filename, blocks });
  };

  const handleCopy = async (model: CoverLetterModel, index: number) => {
    try {
      await navigator.clipboard.writeText(model.conteudo);
      setCopiedIndex(index);
      toast({
        title: "Copiado! ✓",
        description: `Modelo "${model.titulo}" copiado para a área de transferência.`,
      });
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Tente selecionar e copiar manualmente.",
        variant: "destructive",
      });
    }
  };

  const currentModel = data.modelos.find((m) => m.tipo === activeTab);
  const currentIndex = data.modelos.findIndex((m) => m.tipo === activeTab);

  // Mobile Layout - Fluid and Premium
  if (isMobile) {
    return (
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between py-4 px-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 text-sm h-10">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <span className="text-sm text-muted-foreground font-medium">Cartas Geradas</span>
          <div className="w-20" />
        </div>

        {/* Content */}
        <div className="flex-1 px-4 pb-6 flex flex-col">
          {/* Model Selector - Pill Style */}
          <div className="flex gap-2 mb-5 overflow-x-auto pb-2">
            {data.modelos.map((model) => {
              const Icon = modelIcons[model.tipo];
              const isActive = activeTab === model.tipo;
              return (
                <button
                  key={model.tipo}
                  onClick={() => setActiveTab(model.tipo)}
                  className={`
                    flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all
                    ${isActive 
                      ? 'bg-primary text-primary-foreground shadow-lg' 
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted'}
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {modelLabels[model.tipo]}
                </button>
              );
            })}
          </div>

          {/* Current Model Card - Fluid Content */}
          {currentModel && (
            <motion.div
              key={currentModel.tipo}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 flex flex-col"
            >
              {/* Model Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  {(() => {
                    const Icon = modelIcons[currentModel.tipo];
                    return <Icon className="w-5 h-5 text-primary" />;
                  })()}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-base">{currentModel.titulo}</h3>
                  <p className="text-xs text-muted-foreground">{currentModel.descricao}</p>
                </div>
              </div>

              {/* Content - Fluid, Open, No Heavy Container */}
              <div className="flex-1 mb-5">
                <div className="prose prose-sm prose-invert max-w-none">
                  <div className="whitespace-pre-wrap text-foreground/90 leading-relaxed text-[15px]">
                    {currentModel.conteudo}
                  </div>
                </div>

                {/* CTA Badge */}
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm">
                  <span className="text-muted-foreground">CTA:</span>
                  <span className="font-medium text-primary">{currentModel.cta}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3 mt-auto">
                {/* Copy - Primary Action */}
                <Button
                  variant="glow"
                  onClick={() => handleCopy(currentModel, currentIndex)}
                  className="w-full h-14 gap-3 rounded-2xl text-base font-semibold shadow-lg"
                >
                  {copiedIndex === currentIndex ? (
                    <>
                      <Check className="w-5 h-5" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" />
                      Copiar Carta
                    </>
                  )}
                </Button>

                {/* Secondary Actions */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={handleExportPdf}
                    disabled={isExporting}
                    className="h-12 gap-2 rounded-xl bg-card/50 border-border/40 hover:bg-card"
                  >
                    {isExporting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    {isExporting ? "..." : "PDF"}
                  </Button>
                  {onSave && (
                    <Button
                      variant="outline"
                      onClick={onSave}
                      className="h-12 gap-2 rounded-xl bg-card/50 border-border/40 hover:bg-card"
                    >
                      <Save className="w-4 h-4" />
                      Salvar
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  // Desktop Layout - Original
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
        <div className="flex items-center gap-3">
          <Button 
            variant="glow" 
            size="sm" 
            onClick={handleExportPdf} 
            disabled={isExporting}
            className="gap-2"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {isExporting ? "Exportando..." : "Exportar PDF"}
          </Button>
          {onSave && (
            <Button variant="outline" size="sm" onClick={onSave} className="gap-2">
              <Save className="w-4 h-4" />
              Salvar Carta
            </Button>
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="w-4 h-4 text-primary" />
            3 modelos gerados
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-display font-bold mb-2">
          Suas <span className="text-gradient">Cartas de Apresentação</span>
        </h2>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto">
          Escolha o modelo que melhor representa você e copie para usar nas suas candidaturas.
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ModelType)} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          {data.modelos.map((model) => {
            const Icon = modelIcons[model.tipo];
            return (
              <TabsTrigger
                key={model.tipo}
                value={model.tipo}
                className="flex items-center gap-2 data-[state=active]:bg-primary/10"
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{modelLabels[model.tipo]}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {data.modelos.map((model, index) => {
          const Icon = modelIcons[model.tipo];
          return (
            <TabsContent key={model.tipo} value={model.tipo}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="p-6 md:p-8 bg-gradient-card border-border/50">
                  {/* Model Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-display font-semibold text-lg">
                          {model.titulo}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {model.descricao}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(model, index)}
                      className="gap-2"
                    >
                      {copiedIndex === index ? (
                        <>
                          <Check className="w-4 h-4 text-green-500" />
                          Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copiar
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Content */}
                  <div ref={letterRef} className="bg-background/50 rounded-lg p-6 border border-border/30">
                    <div className="prose prose-sm prose-invert max-w-none">
                      <div className="whitespace-pre-wrap text-foreground/90 leading-relaxed">
                        {model.conteudo}
                      </div>
                    </div>
                  </div>

                  {/* CTA Badge */}
                  <div className="mt-4 flex justify-end">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm">
                      <span className="text-muted-foreground">CTA:</span>
                      <span className="font-medium text-primary">{model.cta}</span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Tips */}
      <Card className="p-4 bg-secondary/30 border-border/30">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h4 className="font-medium text-sm mb-1">Dica de uso</h4>
            <p className="text-xs text-muted-foreground">
              Personalize a carta escolhida com detalhes específicos da vaga antes de enviar. 
              Mencione o nome da empresa e por que você quer trabalhar lá.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
