import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Copy,
  Check,
  User,
  Briefcase,
  Trophy,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

export interface SlideContent {
  slideNumber: number;
  type: 'intro' | 'experience' | 'closing';
  headline: string;
  bulletPoints: string[];
  howDetails: string;
  result: string;
}

interface PresentationBuilderProps {
  slides: SlideContent[];
  onUpdateSlide: (slideNumber: number, updates: Partial<SlideContent>) => void;
  userName: string;
  onUserNameChange: (name: string) => void;
}

const CANVA_TEMPLATE_URL = "https://www.canva.com/design/DAGwntg9Gqo/aSlyTmQIhVLEeUehTLn7hQ/edit";

export const PresentationBuilder = ({
  slides,
  onUpdateSlide,
  userName,
  onUserNameChange
}: PresentationBuilderProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [copiedSlide, setCopiedSlide] = useState<number | null>(null);
  const { toast } = useToast();

  const copySlideContent = (slideIndex: number) => {
    const slide = slides[slideIndex];
    let content = '';

    if (slide.type === 'intro') {
      content = `${slide.headline}\n\n${userName}`;
    } else if (slide.type === 'experience') {
      content = `${slide.headline}\n\n`;
      if (slide.bulletPoints.length > 0) {
        content += slide.bulletPoints.map(bp => `• ${bp}`).join('\n');
      }
      if (slide.howDetails) {
        content += `\n\nCOMO: ${slide.howDetails}`;
      }
      if (slide.result) {
        content += `\n\nRESULTADO: ${slide.result}`;
      }
    } else {
      content = `${slide.headline}\n\n`;
      content += slide.bulletPoints.map(bp => `• ${bp}`).join('\n');
    }

    navigator.clipboard.writeText(content);
    setCopiedSlide(slideIndex);
    setTimeout(() => setCopiedSlide(null), 2000);

    toast({
      title: "Conteúdo copiado!",
      description: "Cole no Canva para personalizar seu slide.",
    });
  };

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  const slide = slides[currentSlide];

  const getSlideIcon = (type: string) => {
    switch (type) {
      case 'intro': return User;
      case 'experience': return Briefcase;
      case 'closing': return Trophy;
      default: return User;
    }
  };

  const getSlideLabel = (type: string, index: number) => {
    switch (type) {
      case 'intro': return 'Slide de Abertura';
      case 'experience': return `Experiência ${index}`;
      case 'closing': return 'Slide de Fechamento';
      default: return `Slide ${index + 1}`;
    }
  };

  const Icon = getSlideIcon(slide.type);

  return (
    <div className="space-y-6">
      {/* Slide Navigation Dots */}
      <div className="flex items-center justify-center gap-2">
        {slides.map((s, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            className={`w-3 h-3 rounded-full transition-all ${
              idx === currentSlide
                ? 'bg-primary scale-125'
                : 'bg-muted hover:bg-primary/50'
            }`}
          />
        ))}
      </div>

      {/* Current Slide Preview */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="p-6 bg-gradient-to-br from-background to-secondary/20 border-primary/20">
            {/* Slide Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Slide {currentSlide + 1} de {slides.length}</p>
                  <h3 className="font-display font-semibold">
                    {getSlideLabel(slide.type, slides.filter((s, i) => i < currentSlide && s.type === 'experience').length + 1)}
                  </h3>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copySlideContent(currentSlide)}
                className="gap-2"
              >
                {copiedSlide === currentSlide ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copiar
                  </>
                )}
              </Button>
            </div>

            {/* Slide Content Editor */}
            <div className="space-y-4">
              {/* Headline */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  {slide.type === 'intro' ? 'Frase de Impacto' : 'Título do Slide'}
                </label>
                <Input
                  value={slide.headline}
                  onChange={(e) => onUpdateSlide(currentSlide, { headline: e.target.value })}
                  placeholder={slide.type === 'intro'
                    ? "Ex: Transformo processos em resultados mensuráveis"
                    : "Ex: Gerente de Projetos na Empresa X"
                  }
                  className="text-lg font-medium h-12"
                />
              </div>

              {/* User Name (only for intro) */}
              {slide.type === 'intro' && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Seu Nome</label>
                  <Input
                    value={userName}
                    onChange={(e) => onUserNameChange(e.target.value)}
                    placeholder="Seu nome completo"
                    className="h-12"
                  />
                </div>
              )}

              {/* HOW Details (only for experience) */}
              {slide.type === 'experience' && (
                <>
                  <div>
                    <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-primary" />
                      COMO você fez (detalhes técnicos)
                    </label>
                    <Textarea
                      value={slide.howDetails}
                      onChange={(e) => onUpdateSlide(currentSlide, { howDetails: e.target.value })}
                      placeholder="Ex: Implementei metodologia Scrum com sprints de 2 semanas, utilizando Jira para gestão e Power BI para dashboards de acompanhamento..."
                      className="min-h-[100px]"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Resultado Obtido</label>
                    <Input
                      value={slide.result}
                      onChange={(e) => onUpdateSlide(currentSlide, { result: e.target.value })}
                      placeholder="Ex: Redução de 40% no tempo de entrega"
                    />
                  </div>
                </>
              )}

              {/* Bullet Points */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  {slide.type === 'closing' ? 'Proposta de Valor' : 'Pontos-chave'}
                </label>
                <Textarea
                  value={slide.bulletPoints.join('\n')}
                  onChange={(e) => onUpdateSlide(currentSlide, {
                    bulletPoints: e.target.value.split('\n').filter(bp => bp.trim())
                  })}
                  placeholder={slide.type === 'closing'
                    ? "O que você oferece...\nSeu diferencial...\nPor que você é a escolha certa..."
                    : "Ponto 1\nPonto 2\nPonto 3"
                  }
                  className="min-h-[80px]"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Uma linha por ponto
                </p>
              </div>
            </div>

            {/* Visual Preview */}
            <div className="mt-6 p-4 bg-secondary/50 rounded-xl border border-border">
              <p className="text-xs text-muted-foreground mb-2">Preview do Slide:</p>
              <div className="aspect-video bg-gradient-to-br from-primary/10 via-background to-accent/10 rounded-lg p-6 flex flex-col justify-center items-center text-center border border-primary/10">
                <h4 className="font-display text-lg font-bold text-primary mb-2">
                  {slide.headline || '[Título]'}
                </h4>
                {slide.type === 'intro' && (
                  <p className="text-sm text-muted-foreground">{userName || '[Seu Nome]'}</p>
                )}
                {slide.type === 'experience' && slide.howDetails && (
                  <p className="text-xs text-muted-foreground mt-2 max-w-xs">
                    {slide.howDetails.slice(0, 80)}...
                  </p>
                )}
                {slide.bulletPoints.length > 0 && (
                  <div className="mt-3 text-xs text-left">
                    {slide.bulletPoints.slice(0, 2).map((bp, i) => (
                      <p key={i} className="text-muted-foreground">• {bp.slice(0, 40)}...</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={prevSlide}
          disabled={currentSlide === 0}
          className="gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Anterior
        </Button>

        <Button
          variant="outline"
          onClick={nextSlide}
          disabled={currentSlide === slides.length - 1}
          className="gap-2"
        >
          Próximo
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Canva Template Link */}
      <Card className="p-6 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/30">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-display font-semibold mb-1">Template Pronto no Canva</h4>
            <p className="text-sm text-muted-foreground">
              Abra o template, duplique e cole seu conteúdo
            </p>
          </div>
          <Button
            onClick={() => window.open(CANVA_TEMPLATE_URL, '_blank')}
            className="gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Abrir no Canva
          </Button>
        </div>
      </Card>
    </div>
  );
};
